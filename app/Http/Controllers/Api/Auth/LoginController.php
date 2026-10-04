<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Auth\LoginRequest;
use App\Http\Resources\Api\CompanyResource;
use App\Http\Resources\Api\TillOperationResource;
use App\Http\Resources\Api\UserResource;
use App\Models\Company;
use App\Models\TillOperation;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class LoginController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $username   = $request->input('username');
        $password   = $request->input('password');
        $clientType = $request->input('client_type');

        $user = User::where('username', $username)->first();

        // Same message for "user not found" and "wrong password" — don't leak which.
        if (! $user || ! Hash::check($password, $user->password)) {
            $this->audit->log(
                action: 'login_failed',
                module: 'auth',
                companyId: $user?->company_id,
                userId: $user?->id,
                entityType: User::class,
                entityId: $user?->id,
                newValues: ['reason' => ! $user ? 'user_not_found' : 'invalid_password'],
            );

            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        if (! $user->is_active) {
            $this->audit->log(
                action: 'login_failed',
                module: 'auth',
                companyId: $user->company_id,
                userId: $user->id,
                entityType: User::class,
                entityId: $user->id,
                newValues: ['reason' => 'inactive'],
            );

            return response()->json(['message' => 'Account is disabled.'], 403);
        }

        $user->forceFill(['last_login_at' => now()])->save();

        return $clientType === 'pos'
            ? $this->posLogin($user)
            : $this->spaLogin($user);
    }

    private function posLogin(User $user): JsonResponse
    {
        $token = $user->createToken('pos')->plainTextToken;

        $tills = TillOperation::with(['priceList', 'accounts'])
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->get();

        $company = $user->company_id ? Company::find($user->company_id) : null;

        $this->audit->log(
            action: 'login',
            module: 'auth',
            companyId: $user->company_id,
            userId: $user->id,
            entityType: User::class,
            entityId: $user->id,
            newValues: ['client_type' => 'pos'],
        );

        return response()->json([
            'token'           => $token,
            'user'            => new UserResource($user),
            'company'         => $company ? new CompanyResource($company) : null,
            'till_operations' => TillOperationResource::collection($tills),
        ]);
    }

    private function spaLogin(User $user): JsonResponse
    {
        Auth::login($user, false);
        request()->session()->regenerate();

        $companies = $this->resolveAccessibleCompanies($user);
        $roles = $user->roles()->get(['roles.id', 'roles.name', 'roles.label']);

        $this->audit->log(
            action: 'login',
            module: 'auth',
            companyId: $user->company_id,
            userId: $user->id,
            entityType: User::class,
            entityId: $user->id,
            newValues: ['client_type' => 'spa'],
        );

        return response()->json([
            'user'      => new UserResource($user),
            'companies' => CompanyResource::collection($companies),
            'roles'     => $roles->map(fn($r) => [
                'name'  => $r->name,
                'label' => $r->label,
            ])->values(),
        ]);
    }

    /**
     * Locked context Section 8:
     *   Super Admin         → all active companies
     *   Manager / Admin     → companies via user_company_access
     *   Cashier / Sales     → only users.company_id
     */
    private function resolveAccessibleCompanies(User $user)
    {
        if ($user->isSuperAdmin()) {
            return Company::where('is_active', true)->orderBy('name')->get();
        }

        $pivotCompanies = $user->companies()
            ->where('companies.is_active', true)
            ->orderBy('companies.name')
            ->get();

        if ($pivotCompanies->isNotEmpty()) {
            return $pivotCompanies;
        }

        if ($user->company_id) {
            return Company::where('id', $user->company_id)
                ->where('is_active', true)
                ->get();
        }

        return collect();
    }
}
