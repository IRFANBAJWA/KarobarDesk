<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockRow;
use App\Models\StockAuditCount;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StockRowController extends Controller
{
    public function __construct(private AuditLogger $auditLogger) {}

    // =====================================================
    // LIST
    // =====================================================
    public function index(Request $request): JsonResponse
    {
        $companyId = $this->resolveCompanyId($request);
        if (!$companyId) {
            return response()->json(['message' => 'No company selected.'], 422);
        }

        $rows = StockRow::where('company_id', $companyId)
            ->with(['assignedUser:id,name'])
            ->withCount('itemAssignments')
            ->orderBy('name')
            ->get()
            ->map(fn(StockRow $row) => $this->formatRow($row, $companyId));

        return response()->json(['data' => $rows]);
    }

    // =====================================================
    // CREATE
    // =====================================================
    public function store(Request $request): JsonResponse
    {
        $companyId = $this->resolveCompanyId($request);
        if (!$companyId) {
            return response()->json(['message' => 'No company selected.'], 422);
        }

        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'code'             => 'required|string|max:50',
            'assigned_user_id' => 'nullable|exists:users,id',
            'is_active'        => 'sometimes|boolean',
        ]);

        if (!empty($validated['assigned_user_id'])) {
            $err = $this->validateSalesperson($validated['assigned_user_id'], $companyId);
            if ($err) return $err;
        }

        $duplicate = StockRow::where('company_id', $companyId)
            ->where('code', $validated['code'])
            ->exists();

        if ($duplicate) {
            return response()->json([
                'message' => 'A row with this code already exists for this company.',
            ], 422);
        }

        $row = StockRow::create([
            'company_id'       => $companyId,
            'name'             => $validated['name'],
            'code'             => $validated['code'],
            'assigned_user_id' => $validated['assigned_user_id'] ?? null,
            'is_active'        => $validated['is_active'] ?? true,
        ]);

        $this->auditLogger->log(
            action: 'stock_row_created',
            module: 'stock_setup',
            companyId: $companyId,
            userId: $request->user()->id,
            entityType: 'stock_row',
            entityId: $row->id,
            newValues: $row->toArray(),
            request: $request,
        );

        return response()->json([
            'data'    => $this->formatRow($row->fresh(['assignedUser:id,name']), $companyId),
            'message' => 'Row created.',
        ], 201);
    }

    // =====================================================
    // SHOW
    // =====================================================
    public function show(Request $request, StockRow $row): JsonResponse
    {
        $companyId = $this->resolveCompanyId($request);

        if ((int) $row->company_id !== (int) $companyId) {
            return response()->json(['message' => 'Row not found in the active company.'], 404);
        }

        $row->load(['assignedUser:id,name'])->loadCount('itemAssignments');

        return response()->json(['data' => $this->formatRow($row, $companyId)]);
    }

    // =====================================================
    // UPDATE (name / code / is_active only)
    // =====================================================
    public function update(Request $request, StockRow $row): JsonResponse
    {
        $companyId = $this->resolveCompanyId($request);

        if ((int) $row->company_id !== (int) $companyId) {
            return response()->json(['message' => 'Row not found in the active company.'], 404);
        }

        $validated = $request->validate([
            'name'      => 'sometimes|required|string|max:255',
            'code'      => 'sometimes|required|string|max:50',
            'is_active' => 'sometimes|boolean',
        ]);

        if (isset($validated['code'])) {
            $duplicate = StockRow::where('company_id', $companyId)
                ->where('code', $validated['code'])
                ->where('id', '!=', $row->id)
                ->exists();

            if ($duplicate) {
                return response()->json([
                    'message' => 'A row with this code already exists for this company.',
                ], 422);
            }
        }

        $old = $row->toArray();
        $row->update($validated);

        $this->auditLogger->log(
            action: 'stock_row_updated',
            module: 'stock_setup',
            companyId: $companyId,
            userId: $request->user()->id,
            entityType: 'stock_row',
            entityId: $row->id,
            oldValues: $old,
            newValues: $row->fresh()->toArray(),
            request: $request,
        );

        return response()->json([
            'data'    => $this->formatRow($row->fresh(['assignedUser:id,name']), $companyId),
            'message' => 'Row updated.',
        ]);
    }

    // =====================================================
    // DELETE
    // =====================================================
    public function destroy(Request $request, StockRow $row): JsonResponse
    {
        $companyId = $this->resolveCompanyId($request);

        if ((int) $row->company_id !== (int) $companyId) {
            return response()->json(['message' => 'Row not found in the active company.'], 404);
        }

        if ($row->itemAssignments()->count() > 0) {
            return response()->json([
                'message' => 'Move or unassign items before deleting this row.',
            ], 422);
        }

        $old = $row->toArray();
        $row->delete();

        $this->auditLogger->log(
            action: 'stock_row_deleted',
            module: 'stock_setup',
            companyId: $companyId,
            userId: $request->user()->id,
            entityType: 'stock_row',
            entityId: $old['id'],
            oldValues: $old,
            request: $request,
        );

        return response()->json(['message' => 'Row deleted.']);
    }

    // =====================================================
    // ASSIGN OWNER (with lock check)
    // =====================================================
    public function assignOwner(Request $request, StockRow $row): JsonResponse
    {
        $companyId = $this->resolveCompanyId($request);

        if ((int) $row->company_id !== (int) $companyId) {
            return response()->json(['message' => 'Row not found in the active company.'], 404);
        }

        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
        ]);

        if (!empty($validated['user_id'])) {
            $err = $this->validateSalesperson($validated['user_id'], $companyId);
            if ($err) return $err;
        }

        if ($this->rowHasCountsToday($row, $companyId)) {
            return response()->json([
                'message' => "Row '{$row->name}' already has counts entered today. Ownership is locked.",
            ], 422);
        }

        $old = $row->toArray();
        $row->update(['assigned_user_id' => $validated['user_id'] ?? null]);

        $this->auditLogger->log(
            action: 'stock_row_owner_changed',
            module: 'stock_setup',
            companyId: $companyId,
            userId: $request->user()->id,
            entityType: 'stock_row',
            entityId: $row->id,
            oldValues: $old,
            newValues: $row->fresh()->toArray(),
            request: $request,
        );

        return response()->json([
            'data'    => $this->formatRow($row->fresh(['assignedUser:id,name']), $companyId),
            'message' => 'Row owner updated.',
        ]);
    }

    // =====================================================
    // HELPERS
    // =====================================================

    private function resolveCompanyId(Request $request): ?int
    {
        $user = $request->user();
        $companyId = $user->company_id;

        if (!$companyId || $user->hasRole('admin') || $user->isSuperAdmin()) {
            $companyId = $request->query('company_id')
                ?: $request->input('company_id')
                ?: $user->companies()->first()?->id;
        }

        return $companyId ? (int) $companyId : null;
    }

    private function validateSalesperson(int $userId, int $companyId): ?JsonResponse
    {
        $target = User::find($userId);

        if (!$target) {
            return response()->json(['message' => 'User not found.'], 422);
        }

        if (!$target->hasRole('sales_person')) {
            return response()->json([
                'message' => 'Only users with the Sales Person role can own a row.',
            ], 422);
        }

        $hasAccess = (int) $target->company_id === $companyId
            || $target->companies()->where('companies.id', $companyId)->exists();

        if (!$hasAccess) {
            return response()->json([
                'message' => 'User does not have access to this company.',
            ], 422);
        }

        return null;
    }

    private function rowHasCountsToday(StockRow $row, int $companyId): bool
    {
        $today = Carbon::now('Asia/Karachi')->toDateString();

        return StockAuditCount::query()
            ->whereHas('stockAuditItem', function ($q) use ($row, $companyId, $today) {
                $q->where('stock_row_id', $row->id)
                    ->whereHas('stockAudit', function ($sq) use ($companyId, $today) {
                        $sq->where('company_id', $companyId)
                            ->whereDate('audit_date', $today);
                    });
            })
            ->exists();
    }

    private function formatRow(StockRow $row, int $companyId): array
    {
        return [
            'id'               => $row->id,
            'company_id'       => $row->company_id,
            'name'             => $row->name,
            'code'             => $row->code,
            'assigned_user'    => $row->assignedUser ? [
                'id'   => $row->assignedUser->id,
                'name' => $row->assignedUser->name,
            ] : null,
            'item_count'       => $row->item_assignments_count
                ?? $row->itemAssignments()->count(),
            'is_active'        => (bool) $row->is_active,
            'has_counts_today' => $this->rowHasCountsToday($row, $companyId),
            'created_at'       => $row->created_at?->toIso8601String(),
            'updated_at'       => $row->updated_at?->toIso8601String(),
        ];
    }
}
