<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Company;
use App\Models\PriceList;
use App\Models\Role;
use App\Models\TillOperation;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DevDataSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local')) {
            $this->command?->warn('DevDataSeeder skipped — not local environment.');
            return;
        }

        if (Company::count() > 0) {
            $this->command?->info('DevDataSeeder skipped — companies already exist.');
            return;
        }

        DB::transaction(function () {
            $company = Company::create([
                'name'      => 'Test Company',
                'code'      => 'TEST',
                'is_active' => true,
            ]);

            $priceList = PriceList::create([
                'name'       => 'Retail Selling',
                'is_selling' => true,
                'is_active'  => true,
            ]);

            $cash = Account::create([
                'company_id'   => $company->id,
                'name'         => 'Cash',
                'account_type' => 'cash',
                'source'       => 'local',
                'is_disabled'  => false,
            ]);

            $bank = Account::create([
                'company_id'   => $company->id,
                'name'         => 'Bank',
                'account_type' => 'bank',
                'source'       => 'local',
                'is_disabled'  => false,
            ]);

            // Dedicated POS test user
            $cashierRole = Role::where('name', 'cashier')->firstOrFail();

            $poscashier = User::create([
                'name'       => 'POS Cashier',
                'username'   => 'poscashier',
                'email'      => 'poscashier@karobardesk.local',
                'password'   => Hash::make('password123'),
                'company_id' => $company->id,
                'is_active'  => true,
            ]);

            UserRole::create([
                'user_id' => $poscashier->id,
                'role_id' => $cashierRole->id,
            ]);

            $till = TillOperation::create([
                'company_id'    => $company->id,
                'user_id'       => $poscashier->id,
                'price_list_id' => $priceList->id,
                'price_list'    => $priceList->name,
                'warehouse'     => 'Main Store',
                'till_no'       => 1,
                'shop_name'     => 'Test Shop',
                'shop_code'     => 'TS01',
                'is_online'     => true,
                'allow_rate'    => false,
                'return_pin'    => 1234,
                'is_active'     => true,
                'source'        => 'local',
            ]);

            // Attach accounts to till via pivot
            $till->accounts()->attach([
                $cash->id => ['is_default' => true],
                $bank->id => ['is_default' => false],
            ]);

            $this->command?->info('DevDataSeeder: created Test Company, POS Cashier, 1 till, 2 accounts, 1 price list.');
        });
    }
}
