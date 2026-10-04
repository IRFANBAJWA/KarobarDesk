<?php

namespace App\Http\Middleware;

use App\Models\FieldPermission;
use App\Services\AuditLogger;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnforceFieldPermissions
{
    public function __construct(private readonly AuditLogger $audit) {}

    /**
     * Reject writes to fields the user's role(s) cannot edit.
     *
     * Usage:
     *   ->middleware('field.perms:sales_invoice')
     *
     * Rules (from field_permissions table):
     *   can_edit = false -> the field must not appear in the request body
     *   can_view = false -> response stripping is handled elsewhere
     *
     * Absence of a rule = full access.
     * Union across roles: if any role allows editing a field, the user can edit it.
     */
    public function handle(Request $request, Closure $next, string $form): Response
    {
        $user = $request->user();

        if (! $user || $user->isSuperAdmin()) {
            return $next($request);
        }

        $roleIds = $user->roles()->pluck('roles.id')->toArray();

        if (empty($roleIds)) {
            return $next($request);
        }

        $editable = FieldPermission::query()
            ->whereIn('role_id', $roleIds)
            ->where('form', $form)
            ->where('can_edit', true)
            ->pluck('field')
            ->unique()
            ->toArray();

        $forbidden = FieldPermission::query()
            ->whereIn('role_id', $roleIds)
            ->where('form', $form)
            ->where('can_edit', false)
            ->whereNotIn('field', $editable)
            ->pluck('field')
            ->unique()
            ->toArray();

        if (empty($forbidden)) {
            return $next($request);
        }

        foreach ($forbidden as $field) {
            if ($request->has($field)) {
                $this->audit->log(
                    action: 'access_denied_field_edit',
                    module: 'auth',
                    companyId: $user->company_id,
                    userId: $user->id,
                    entityType: get_class($user),
                    entityId: $user->id,
                    newValues: ['form' => $form, 'field' => $field],
                );

                return response()->json([
                    'message' => "You cannot edit the field: {$field}.",
                ], 403);
            }
        }

        return $next($request);
    }
}
