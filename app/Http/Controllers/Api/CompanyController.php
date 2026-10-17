<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Resources\Api\CompanyResource;

class CompanyController extends Controller
{
    public function __construct(
        private readonly AuditLogger $auditLogger,
    ) {}

    /**
     * List active companies for pickers.
     * (unchanged — used by user create/edit dialogs, etc.)
     */
    public function index(): JsonResponse
    {
        $companies = Company::query()
            ->active()
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $companies]);
    }

    /**
     * List ALL companies (active + inactive) for the Companies admin page.
     * Super Admin only.
     */
    public function listAll(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        $companies = Company::query()
            ->withCount(['users', 'accounts', 'tillOperations'])
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => CompanyResource::collection($companies),
        ]);
    }

    /**
     * Show a single company with counts.
     * Super Admin only.
     */
    public function show(Request $request, Company $company): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        $company->loadCount(['users', 'accounts', 'tillOperations']);

        return response()->json([
            'data' => new CompanyResource($company),
        ]);
    }

    /**
     * Toggle a company's active flag.
     * Super Admin only.
     */
    public function toggleActive(Request $request, Company $company): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        $old = (bool) $company->is_active;
        $company->is_active = ! $old;
        $company->save();

        $company->loadCount(['users', 'accounts', 'tillOperations']);

        $this->auditLogger->log(
            action: 'company_toggle_active',
            module: 'companies',
            companyId: $company->id,
            userId: $request->user()->id,
            entityType: Company::class,
            entityId: $company->id,
            oldValues: ['is_active' => $old],
            newValues: ['is_active' => (bool) $company->is_active],
            request: $request,
        );

        return response()->json([
            'message' => $company->is_active ? 'Company activated.' : 'Company deactivated.',
            'data'    => new CompanyResource($company),
        ]);
    }

    private function authorizeSuperAdmin(Request $request): void
    {
        $user = $request->user();

        if (! $user || ! $user->isSuperAdmin()) {
            abort(403, 'Only Super Admin can manage companies.');
        }
    }
}
