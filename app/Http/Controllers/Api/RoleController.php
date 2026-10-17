<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RoleController extends Controller
{
    /**
     * List roles available for assignment.
     * Excludes the super-admin role — the Users Module never assigns it.
     */
    public function index(Request $request): JsonResponse
    {
        $roles = Role::query()
            ->active()
            ->where('is_super_admin', false)
            ->orderBy('label')
            ->get();

        return response()->json(['data' => $roles]);
    }
}
