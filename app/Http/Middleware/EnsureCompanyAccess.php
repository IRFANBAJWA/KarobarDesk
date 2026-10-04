<?php

namespace App\Http\Middleware;

use App\Services\AuditLogger;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCompanyAccess
{
    public function __construct(private readonly AuditLogger $audit) {}

    /**
     * Validate the authenticated user has access to the target company.
     *
     * Company resolution order:
     *   1. X-Company-Id header         (SPA after company switch)
     *   2. company_id in request body  (POS sends this)
     *   3. $user->company_id           (fallback — the active company)
     *   4. None of the above           -> pass through (no company context)
     *
     * Access rules (locked context Section 8):
     *   - Super Admin        -> all companies
     *   - Manager / Admin    -> companies via user_company_access OR own company_id
     *   - Cashier / Sales    -> only own company_id
     *
     * Applied per-route (not global). Routes without company context skip it.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        $companyId = $this->resolveCompanyId($request, $user);

        if ($companyId === null) {
            return $next($request);
        }

        if (! $user->canAccessCompany($companyId)) {
            $this->audit->log(
                action: 'access_denied_company',
                module: 'auth',
                companyId: $companyId,
                userId: $user->id,
                entityType: get_class($user),
                entityId: $user->id,
                newValues: ['requested_company_id' => $companyId],
            );

            return response()->json([
                'message' => 'You do not have access to this company.',
            ], 403);
        }

        return $next($request);
    }

    private function resolveCompanyId(Request $request, $user): ?int
    {
        $headerCompanyId = $request->header('X-Company-Id');
        if ($headerCompanyId !== null && $headerCompanyId !== '') {
            return (int) $headerCompanyId;
        }

        $bodyCompanyId = $request->input('company_id');
        if ($bodyCompanyId !== null && $bodyCompanyId !== '') {
            return (int) $bodyCompanyId;
        }

        if ($user->company_id !== null) {
            return (int) $user->company_id;
        }

        return null;
    }
}
