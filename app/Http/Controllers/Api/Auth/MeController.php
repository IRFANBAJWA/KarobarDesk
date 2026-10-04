<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\CompanyResource;
use App\Http\Resources\Api\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        $user->load(['roles.permissions', 'company']);

        $isSuperAdmin = $user->isSuperAdmin();

        // Roles: name + label only
        $roles = $user->roles->map(fn($r) => [
            'name'           => $r->name,
            'label'          => $r->label,
            'is_super_admin' => (bool) $r->is_super_admin,
        ])->values();

        // Permissions: unique module + action pairs.
        // Super Admin gets every permission in the DB (they bypass checks anyway).
        if ($isSuperAdmin) {
            $permissions = \App\Models\Permission::query()
                ->select(['module', 'action'])
                ->orderBy('module')
                ->orderBy('action')
                ->get()
                ->map(fn($p) => ['module' => $p->module, 'action' => $p->action])
                ->unique(fn($p) => $p['module'] . '|' . $p['action'])
                ->values();
        } else {
            $permissions = $user->roles
                ->flatMap(fn($r) => $r->permissions)
                ->map(fn($p) => ['module' => $p->module, 'action' => $p->action])
                ->unique(fn($p) => $p['module'] . '|' . $p['action'])
                ->values();
        }

        $userPayload = (new UserResource($user))->toArray($request);
        $userPayload['is_super_admin'] = $isSuperAdmin;

        return response()->json([
            'user'           => $userPayload,
            'roles'          => $roles,
            'permissions'    => $permissions,
            'active_company' => $user->company
                ? new CompanyResource($user->company)
                : null,
        ]);
    }
}
