<?php

namespace App\Services\Pos;

use App\Models\TillOperation;

class AccountResolver
{
    public function resolve(string $accountId, TillOperation $till): int
    {
        // Check if the account is actually assigned to this till
        $account = $till->accounts()
            ->where('accounts.id', (int) $accountId)
            ->first();

        if (! $account) {
            abort(422, "Account ID {$accountId} is not assigned to this till.");
        }

        return $account->id;
    }
}
