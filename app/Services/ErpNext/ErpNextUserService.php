<?php

namespace App\Services\ErpNext;

use App\Models\Account;
use App\Models\Company;
use App\Models\PriceList;
use App\Models\TillOperation;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ErpNextUserService
{
    protected string $baseUrl;

    public function __construct(?string $baseUrl = null)
    {
        $this->baseUrl = $baseUrl ?? (string) config('services.erpnext.base_url');
    }

    /**
     * Login with given credentials and return [token, fullLoginResponse].
     *
     * @throws ErpNextException
     */
    public function login(string $username, string $password): array
    {
        $client = new ErpNextClient($this->baseUrl, $username, $password);
        $token  = $client->login();

        return [
            'token'   => $token,
            'payload' => $client->getLastLoginPayload(),
        ];
    }

    /**
     * Provision a user's ERPNext link + till operation.
     * MUST be called inside a DB transaction — will throw on any failure.
     *
     * @throws ErpNextException|\RuntimeException
     */
    public function provisionUser(User $user, string $erpUsername, string $erpPassword): TillOperation
    {
        // 1. Login
        ['token' => $token, 'payload' => $payload] = $this->login($erpUsername, $erpPassword);

        // 2. Validate response has what we need
        $erpUser = $payload['user'] ?? null;
        $tills   = $payload['till_operations'] ?? [];

        if (! $erpUser || empty($erpUser['company'])) {
            throw new \RuntimeException('ERPNext login response missing user.company.');
        }

        if (empty($tills)) {
            throw new \RuntimeException('ERPNext login response contained no till operation for this user.');
        }

        // 3. Resolve local company
        $company = Company::where('erpnext_company', $erpUser['company'])->first();
        if (! $company) {
            throw new \RuntimeException(
                "Company '{$erpUser['company']}' not synced locally. Run master data sync first."
            );
        }

        // 4. Persist ERPNext link on the user
        $user->forceFill([
            'erpnext_user'           => $erpUser['name'] ?? $erpUsername,
            'erpnext_token'          => $token,
            'erpnext_last_tested_at' => now(),
            'erpnext_last_error'     => null,
            'company_id'             => $company->id,
        ])->save();

        // 5. Resolve price list (soft — null if missing)
        $tillRaw   = $tills[0];
        $priceList = PriceList::where('erpnext_name', $tillRaw['price_list'] ?? '')->first();

        // 6. Upsert till_operations on user_id (unique)
        $till = TillOperation::updateOrCreate(
            ['user_id' => $user->id],
            [
                'erpnext_name'         => $tillRaw['name'] ?? null,
                'source'               => 'erpnext',
                'company_id'           => $company->id,
                'price_list_id'        => $priceList?->id,
                'price_list'           => $tillRaw['price_list'] ?? null,
                'warehouse'            => $tillRaw['warehouse'] ?? null,
                'erpnext_role'         => $tillRaw['role'] ?? null,
                'shop_code'            => $tillRaw['shop_code'] ?? null,
                'till_no'              => isset($tillRaw['till_no']) ? (string) $tillRaw['till_no'] : null,
                'shop_name'            => $tillRaw['shop_name'] ?? null,
                'address'              => $tillRaw['address'] ?? null,
                'phone'                => $tillRaw['phone'] ?? null,
                'is_online'            => (bool) ($tillRaw['is_online'] ?? 0),
                'allow_rate'           => (bool) ($tillRaw['allow_rate'] ?? 0),
                'return_pin'           => isset($tillRaw['return_pin']) ? (int) $tillRaw['return_pin'] : null,
                'is_active'            => true,
                'erpnext_modified_at'  => isset($tillRaw['modified'])
                    ? Carbon::parse($tillRaw['modified'])
                    : null,
                'sync_status'          => 'synced',
                'last_synced_at'       => now(),
            ]
        );

        // 7. Attach accounts (create locally if missing)
        $till->accounts()->detach();
        foreach ($tillRaw['accounts'] ?? [] as $accRow) {
            if (empty($accRow['accounts'])) continue;

            $account = Account::firstOrCreate(
                [
                    'company_id'      => $company->id,
                    'erpnext_account' => $accRow['accounts'],
                ],
                [
                    'source'              => 'erpnext',
                    'name'                => $accRow['account_name'] ?? $accRow['accounts'],
                    'account_type'        => $accRow['account_type'] ?? 'Cash',
                    'is_group'            => false,
                    'is_disabled'         => false,
                    'erpnext_modified_at' => null,
                    'sync_status'         => 'synced',
                    'last_synced_at'      => now(),
                ]
            );

            $till->accounts()->attach($account->id, [
                'is_default' => ! empty($accRow['default']),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return $till;
    }

    /**
     * Clear the ERPNext link fields (used when re-linking fails).
     */
    public function clearLink(User $user, string $error): void
    {
        $user->forceFill([
            'erpnext_token'      => null,
            'erpnext_last_error' => $error,
        ])->save();
    }
}
