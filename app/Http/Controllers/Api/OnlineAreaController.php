<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OnlineAreaAssignment;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OnlineAreaController extends Controller
{
    public function __construct(private AuditLogger $auditLogger) {}

    // =====================================================
    // GET current online-area assignee for the active company
    // =====================================================
    public function show(Request $request): JsonResponse
    {
        $companyId = $this->resolveCompanyId($request);
        if (!$companyId) {
            return response()->json(['message' => 'No company selected.'], 422);
        }

        $assignment = OnlineAreaAssignment::where('company_id', $companyId)
            ->with('user:id,name,username')
            ->first();

        return response()->json([
            'data' => $assignment ? [
                'id'         => $assignment->id,
                'company_id' => $assignment->company_id,
                'user'       => [
                    'id'       => $assignment->user->id,
                    'name'     => $assignment->user->name,
                    'username' => $assignment->user->username,
                ],
                'updated_at' => $assignment->updated_at?->toIso8601String(),
            ] : null,
        ]);
    }

    // =====================================================
    // SET / CLEAR online-area assignee
    // =====================================================
    public function update(Request $request): JsonResponse
    {
        $companyId = $this->resolveCompanyId($request);
        if (!$companyId) {
            return response()->json(['message' => 'No company selected.'], 422);
        }
        if ($err = $this->authorizeManager($request)) return $err;

        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
        ]);

        $existing = OnlineAreaAssignment::where('company_id', $companyId)->first();
        $old = $existing?->toArray();

        // Clear
        if (empty($validated['user_id'])) {
            if ($existing) {
                $existing->delete();

                $this->auditLogger->log(
                    action: 'online_area_assigned',
                    module: 'stock_setup',
                    companyId: $companyId,
                    userId: $request->user()->id,
                    entityType: 'online_area_assignment',
                    entityId: $old['id'],
                    oldValues: $old,
                    newValues: null,
                    request: $request,
                );
            }

            return response()->json([
                'data'    => null,
                'message' => 'Online area assignment cleared.',
            ]);
        }

        // Validate target user is a salesperson with company access
        $target = User::find($validated['user_id']);

        if (!$target) {
            return response()->json(['message' => 'User not found.'], 422);
        }

        if (!$target->hasRole('sales_person')) {
            return response()->json([
                'message' => 'Only users with the Sales Person role can be assigned to the online area.',
            ], 422);
        }

        $hasAccess = (int) $target->company_id === $companyId
            || $target->companies()->where('companies.id', $companyId)->exists();

        if (!$hasAccess) {
            return response()->json([
                'message' => 'User does not have access to this company.',
            ], 422);
        }

        $assignment = DB::transaction(function () use ($companyId, $validated) {
            return OnlineAreaAssignment::updateOrCreate(
                ['company_id' => $companyId],
                ['user_id'    => $validated['user_id']],
            );
        });

        $this->auditLogger->log(
            action: 'online_area_assigned',
            module: 'stock_setup',
            companyId: $companyId,
            userId: $request->user()->id,
            entityType: 'online_area_assignment',
            entityId: $assignment->id,
            oldValues: $old,
            newValues: $assignment->fresh()->toArray(),
            request: $request,
        );

        return response()->json([
            'data' => [
                'id'         => $assignment->id,
                'company_id' => $assignment->company_id,
                'user'       => [
                    'id'       => $target->id,
                    'name'     => $target->name,
                    'username' => $target->username,
                ],
                'updated_at' => $assignment->updated_at?->toIso8601String(),
            ],
            'message' => 'Online area assigned.',
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

    private function authorizeManager(Request $request): ?JsonResponse
    {
        $user = $request->user();

        if ($user->isSuperAdmin() || $user->hasRole('admin') || $user->hasRole('manager')) {
            return null;
        }

        return response()->json(['message' => 'Forbidden.'], 403);
    }
}
