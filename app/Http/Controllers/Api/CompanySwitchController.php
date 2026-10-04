<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\CompanySwitchRequest;
use App\Http\Resources\Api\CompanyResource;
use App\Models\Company;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;

class CompanySwitchController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function switch(CompanySwitchRequest $request): JsonResponse
    {
        $user = $request->user();

        // Cashier and Sales Person are locked to their single company.
        // Managers, Admins, and Super Admins may switch.
        if (! $this->canSwitch($user)) {
            return response()->json([
                'message' => 'You are not allowed to switch companies.',
            ], 403);
        }

        $companyId = (int) $request->input('company_id');

        if (! $user->canAccessCompany($companyId)) {
            $this->audit->log(
                action: 'company_switch_denied',
                module: 'auth',
                companyId: $user->company_id,
                userId: $user->id,
                entityType: get_class($user),
                entityId: $user->id,
                newValues: ['requested_company_id' => $companyId],
            );

            return response()->json([
                'message' => 'You do not have access to this company.',
            ], 403);
        }

        $previousCompanyId = $user->company_id;

        $user->company_id = $companyId;
        $user->save();

        $company = Company::find($companyId);

        $this->audit->log(
            action: 'company_switch',
            module: 'auth',
            companyId: $companyId,
            userId: $user->id,
            entityType: get_class($user),
            entityId: $user->id,
            oldValues: ['company_id' => $previousCompanyId],
            newValues: ['company_id' => $companyId],
        );

        return response()->json([
            'message'        => 'Company switched.',
            'active_company' => new CompanyResource($company),
        ]);
    }

    private function canSwitch($user): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return $user->roles()
            ->whereIn('name', ['admin', 'manager'])
            ->exists();
    }
}
