<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\User;
use App\Http\Resources\Api\AccountResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TillAccountController extends Controller
{
    // 1. Get all users who have a till operation (for the dropdown)
    public function tills(): JsonResponse
    {
        // Fetch users who have a related till operation
        $users = User::whereHas('tillOperation')
            ->with(['tillOperation' => function ($query) {
                $query->select('id', 'user_id', 'till_no', 'shop_name');
            }])
            ->get(['id', 'name']);

        // Map them to a clean format for the frontend dropdown
        $data = $users->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'till_no' => $user->tillOperation?->till_no ?? 'N/A',
                'shop_name' => $user->tillOperation?->shop_name,
            ];
        });

        return response()->json(['data' => $data]);
    }

    // 2. Get all active accounts + which ones are linked to this user's till
    public function show(User $user): JsonResponse
    {
        $till = $user->tillOperation;
        if (!$till) {
            return response()->json(['message' => 'User does not have a till operation.'], 404);
        }

        // ONLY fetch Cash or Bank accounts for this company
        $allAccounts = Account::with('company:id,name')
            ->where('company_id', $user->company_id)
            ->whereIn('account_type', ['Cash', 'Bank', 'Shipping', 'Credit']) // <--- FILTER HERE
            ->where('is_disabled', false)
            ->orderBy('name')
            ->get();

        $linkedAccountIds = \DB::table('till_operation_accounts')
            ->where('till_operation_id', $till->id)
            ->pluck('account_id')
            ->toArray();

        $defaultAccount = \DB::table('till_operation_accounts')
            ->where('till_operation_id', $till->id)
            ->where('is_default', 1)
            ->first();
        $defaultAccountId = $defaultAccount ? $defaultAccount->account_id : null;

        return response()->json([
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'company_id' => $user->company_id, // <--- Needed for the Create button
                ],
                'till' => [
                    'id' => $till->id,
                    'till_no' => $till->till_no,
                    'shop_name' => $till->shop_name,
                ],
                'accounts' => AccountResource::collection($allAccounts),
                'linked_account_ids' => $linkedAccountIds,
                'default_account_id' => $defaultAccountId,
            ]
        ]);
    }

    // 3. Save the linked accounts
    public function update(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'account_ids' => 'array',
            'account_ids.*' => 'exists:accounts,id',
            'default_account_id' => 'nullable|exists:accounts,id',
        ]);

        $till = $user->tillOperation;
        if (!$till) {
            return response()->json(['message' => 'User does not have a till operation.'], 404);
        }

        $syncData = [];
        foreach ($request->account_ids as $accountId) {
            $syncData[$accountId] = [
                'is_default' => ($accountId == $request->default_account_id) ? 1 : 0
            ];
        }

        // Sync the pivot table
        $till->accounts()->sync($syncData);

        return response()->json([
            'message' => 'Till accounts updated successfully.'
        ]);
    }
    // 3. create the linked accounts
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'account_type' => 'required|string|max:50',
            'company_id' => 'required|exists:companies,id', // <--- REQUIRE COMPANY
        ]);

        $account = Account::create([
            'company_id' => $request->company_id,
            'name' => $request->name,
            'account_type' => $request->account_type,
            'source' => 'local',
            'is_group' => false,
            'is_disabled' => false,
            'sync_status' => 'pending',
            'erpnext_account' => null,
        ]);

        return response()->json([
            'message' => 'Account created.',
            'data' => $account
        ], 201);
    }
}
