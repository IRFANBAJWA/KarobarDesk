<?php

namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class PosAuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'username' => ['required', 'string', 'max:100'],
            'password' => ['required', 'string'],
        ]);

        /** @var User|null $user */
        $user = User::with([
            'company',
            'tillOperation.priceList',
            'tillOperation.accounts',
        ])->where('username', $request->input('username'))->first();

        if (! $user || ! Hash::check($request->input('password'), $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Invalid credentials.'],
            ]);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Account is disabled.'], 403);
        }

        $till = $user->tillOperation;

        if (! $till) {
            return response()->json([
                'message' => 'No till operation is linked to this user. Contact an administrator.',
            ], 403);
        }

        $user->tokens()->where('name', 'pos')->delete();
        $token = $user->createToken('pos')->plainTextToken;
        $user->forceFill(['last_login_at' => now()])->save();

        return response()->json([
            'message' => [
                'status'  => true,
                'message' => 'User logged in successfully!',
                'token'   => $token,
                'user'    => [
                    'name'      => $user->erpnext_user ?? $user->username,
                    'full_name' => $user->name,
                    'email'     => $user->email,
                    'company'   => $user->company?->erpnext_company ?? $user->company?->name,
                ],
                'till_operations' => [
                    $this->tillOperationBlock($user, $till),
                ],
                'till_operations_count' => 1,
                '_karobardesk' => [
                    'till_id'       => $till->id,
                    'price_list_id' => $till->price_list_id,
                    'company_id'    => $till->company_id,
                ],
            ],
            'home_page' => '/app/home',
            'full_name' => $user->name,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()->currentAccessToken();
        if ($token) {
            $token->delete();
        }
        return response()->json(['message' => 'Logged out.']);
    }

    private function tillOperationBlock(User $user, $till): array
    {
        $accounts = $till->accounts->values()->map(function ($account) {
            return [
                'id'           => $account->id, // <--- KAROBARDESK ID FOR IBPOS
                'account_name' => $account->name,
                'accounts'     => $account->erpnext_account ?? $account->name,
                'account_type' => ucfirst(strtolower($account->account_type)),
                'default'      => (int) ($account->pivot->is_default ?? 0),
            ];
        })->all();

        return [
            'name'       => $till->erpnext_name,
            'creation'   => $till->created_at ? $till->created_at->format('Y-m-d H:i:s.u') : null,
            'modified'   => $till->updated_at ? $till->updated_at->format('Y-m-d H:i:s.u') : null,
            'user'       => $user->erpnext_user ?? $user->username,
            'company'    => $user->company?->erpnext_company ?? $user->company?->name,
            'price_list' => $till->price_list,
            'isoneline'  => (int) $till->is_online,
            'role'       => $till->erpnext_role,
            'is_online'  => (int) $till->is_online,
            'shop_code'  => $till->shop_code,
            'till_no'    => $till->till_no,
            'warehouse'  => $till->warehouse,
            'shop_name'  => $till->shop_name,
            'address'    => $till->address,
            'phone'      => $till->phone,
            'email'      => null,
            'taxnumber'  => null,
            'allow_rate' => (int) $till->allow_rate,
            'return_pin' => (string) $till->return_pin,
            'accounts'   => $accounts,
        ];
    }
}
