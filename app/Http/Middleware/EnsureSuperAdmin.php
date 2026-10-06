<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
{
    /**
     * Allow the request only when the authenticated user
     * has a role with is_super_admin = true.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(401, 'Unauthenticated.');
        }

        $isSuperAdmin = $user->roles()
            ->where('roles.is_super_admin', true)
            ->exists();

        if (! $isSuperAdmin) {
            abort(403, 'Super Admin access required.');
        }

        return $next($request);
    }
}
