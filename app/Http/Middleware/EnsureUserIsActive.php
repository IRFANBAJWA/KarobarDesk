<?php

namespace App\Http\Middleware;

use App\Services\AuditLogger;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    public function __construct(private readonly AuditLogger $audit) {}

    /**
     * Reject requests from deactivated users.
     *
     * Runs on every authenticated API request. If the user's is_active flag
     * has been turned off since login:
     *   - all of their tokens are revoked (POS devices are locked out immediately)
     *   - the current request returns 403
     *   - an audit log entry is written
     *
     * SPA sessions are not invalidated; they expire naturally. The 403 blocks
     * all further actions until the user is reactivated.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        if (! $user->isActive()) {
            $user->tokens()->delete();

            $this->audit->log(
                action: 'access_denied_inactive',
                module: 'auth',
                companyId: $user->company_id,
                userId: $user->id,
                entityType: get_class($user),
                entityId: $user->id,
                newValues: ['reason' => 'inactive'],
            );

            return response()->json([
                'message' => 'Account is disabled.',
            ], 403);
        }

        return $next($request);
    }
}
