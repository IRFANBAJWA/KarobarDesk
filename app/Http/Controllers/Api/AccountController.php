<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\AccountResource;
use App\Models\Account;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Account::query()->with('company:id,name');

        if ($search = $request->string('search')->toString()) {
            $query->where('name', 'like', "%{$search}%")
                ->orWhere('erpnext_account', 'like', "%{$search}%");
        }

        $accounts = $query->orderBy('name')->get();

        return response()->json(['data' => AccountResource::collection($accounts)]);
    }

    public function toggleActive(Request $request, Account $account): JsonResponse
    {
        $account->update(['is_disabled' => !$account->is_disabled]);

        return response()->json([
            'message' => 'Account status updated.',
            'data' => new AccountResource($account)
        ]);
    }
}
