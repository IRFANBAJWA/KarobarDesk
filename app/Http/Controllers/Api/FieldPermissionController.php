<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FieldPermission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FieldPermissionController extends Controller
{
    /**
     * Return effective field-level rules for the authenticated user on a form.
     *
     * Absence of a field in `rules` means full access (view + edit).
     * Only fields with an explicit rule are returned.
     *
     * Union across roles: if any role grants edit (or view), the user has it.
     */
    public function show(Request $request, string $form): JsonResponse
    {
        $user = $request->user();

        if ($user->isSuperAdmin()) {
            return response()->json([
                'form'  => $form,
                'rules' => (object) [],
            ]);
        }

        $roleIds = $user->roles()->pluck('roles.id')->toArray();

        if (empty($roleIds)) {
            return response()->json([
                'form'  => $form,
                'rules' => (object) [],
            ]);
        }

        $rows = FieldPermission::query()
            ->whereIn('role_id', $roleIds)
            ->where('form', $form)
            ->get();

        $rules = [];
        foreach ($rows as $row) {
            $field = $row->field;

            if (! isset($rules[$field])) {
                $rules[$field] = ['view' => false, 'edit' => false];
            }

            $rules[$field]['view'] = $rules[$field]['view'] || (bool) $row->can_view;
            $rules[$field]['edit'] = $rules[$field]['edit'] || (bool) $row->can_edit;
        }

        return response()->json([
            'form'  => $form,
            'rules' => empty($rules) ? (object) [] : $rules,
        ]);
    }
}
