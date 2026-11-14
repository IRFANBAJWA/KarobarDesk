<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompanyItemStatus;
use App\Models\Item;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyItemStatusController extends Controller
{
    public function __construct(private AuditLogger $auditLogger) {}

    // =====================================================
    // TOGGLE / SET display_status for one item
    // =====================================================
    public function toggle(Request $request, Item $item): JsonResponse
    {
        $companyId = $this->resolveCompanyId($request);
        if (!$companyId) {
            return response()->json(['message' => 'No company selected.'], 422);
        }
        if ($err = $this->authorizeDisplay($request)) return $err;

        $validated = $request->validate([
            'display_status' => 'required|in:in_store,displayed',
        ]);

        $existing = CompanyItemStatus::where('company_id', $companyId)
            ->where('item_id', $item->id)
            ->first();

        $old = $existing?->toArray();

        $status = CompanyItemStatus::updateOrCreate(
            ['company_id' => $companyId, 'item_id' => $item->id],
            [
                'display_status' => $validated['display_status'],
                'displayed_at'   => $validated['display_status'] === 'displayed' ? now() : null,
                'displayed_by'   => $validated['display_status'] === 'displayed' ? $request->user()->id : null,
            ]
        );

        $this->auditLogger->log(
            action: 'item_display_status_changed',
            module: 'stock_setup',
            companyId: $companyId,
            userId: $request->user()->id,
            entityType: 'company_item_status',
            entityId: $status->id,
            oldValues: $old,
            newValues: $status->fresh()->toArray(),
            request: $request,
        );

        return response()->json([
            'data' => [
                'company_id'     => $status->company_id,
                'item_id'        => $status->item_id,
                'display_status' => $status->display_status,
                'displayed_at'   => $status->displayed_at?->toIso8601String(),
                'displayed_by'   => $status->displayed_by,
            ],
            'message' => 'Display status updated.',
        ]);
    }

    // =====================================================
    // BULK READ — display_status for a set of items (or all)
    // =====================================================
    public function index(Request $request): JsonResponse
    {
        $companyId = $this->resolveCompanyId($request);
        if (!$companyId) {
            return response()->json(['message' => 'No company selected.'], 422);
        }

        $query = CompanyItemStatus::where('company_id', $companyId);

        if ($request->filled('item_ids')) {
            $ids = array_filter(array_map('intval', explode(',', $request->query('item_ids'))));
            if (!empty($ids)) {
                $query->whereIn('item_id', $ids);
            }
        }

        $rows = $query->get()->map(fn(CompanyItemStatus $s) => [
            'item_id'        => $s->item_id,
            'display_status' => $s->display_status,
            'displayed_at'   => $s->displayed_at?->toIso8601String(),
            'displayed_by'   => $s->displayed_by,
        ]);

        return response()->json(['data' => $rows]);
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

    /**
     * Display toggle requires the `stock.display` permission.
     * Manager / admin / SA pass; salesperson does not.
     * Super Admin bypasses (is_super_admin = true on the role).
     */
    private function authorizeDisplay(Request $request): ?JsonResponse
    {
        $user = $request->user();

        if ($user->isSuperAdmin() || $user->hasRole('admin') || $user->hasRole('manager')) {
            return null;
        }

        if (method_exists($user, 'hasPermission') && $user->hasPermission('stock', 'display')) {
            return null;
        }

        return response()->json(['message' => 'Forbidden.'], 403);
    }
}
