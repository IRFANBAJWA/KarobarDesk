<?php

namespace App\Services\ErpNext;

use App\Models\Account;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Item;
use App\Models\ItemPrice;
use App\Models\PriceList;
use Illuminate\Support\Facades\DB;

class ErpNextSyncService
{
    public function __construct(protected ErpNextClient $client) {}

    /**
     * Run one sync step. Returns a result array.
     */
    public function run(string $step): array
    {
        $started = microtime(true);

        try {
            $counts = match ($step) {
                'companies'   => $this->syncCompanies(),
                'accounts'    => $this->syncAccounts(),
                'price_lists' => $this->syncPriceLists(),
                'items'       => $this->syncItems(),
                'item_prices' => $this->syncItemPrices(),
                'customers'   => $this->syncCustomers(),
                default       => throw ErpNextException::unknownStep($step),
            };

            return [
                'step'        => $step,
                'status'      => 'ok',
                'inserted'    => $counts['inserted'],
                'updated'     => $counts['updated'],
                'duration_ms' => (int) ((microtime(true) - $started) * 1000),
            ];
        } catch (\Throwable $e) {
            return [
                'step'        => $step,
                'status'      => 'failed',
                'error'       => $e->getMessage(),
                'duration_ms' => (int) ((microtime(true) - $started) * 1000),
            ];
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  Companies
    // ─────────────────────────────────────────────────────────────
    protected function syncCompanies(): array
    {
        $rows = $this->client->list('Company', [
            'fields'            => '["name","company_name","abbr","default_currency","country","is_group"]',
            'filters'           => '[["is_group","=",0]]',
            'limit_page_length' => 500,
        ]);

        $inserted = 0;
        $updated  = 0;

        DB::transaction(function () use ($rows, &$inserted, &$updated) {
            foreach ($rows as $row) {
                $existing = Company::where('erpnext_name', $row['name'])->first();

                $payload = [
                    'erpnext_name' => $row['name'],
                    'name'         => $row['company_name'] ?? $row['name'],
                    'code'         => $row['abbr'] ?? null,
                    'currency'     => $row['default_currency'] ?? 'PKR',
                    'country'      => $row['country'] ?? null,
                    'is_active'    => true,
                    'source'       => 'erpnext',
                ];

                if ($existing) {
                    $existing->update($payload);
                    $updated++;
                } else {
                    Company::create($payload);
                    $inserted++;
                }
            }
        });

        return compact('inserted', 'updated');
    }

    // ─────────────────────────────────────────────────────────────
    //  Accounts (Cash / Bank / Expense per company)
    // ─────────────────────────────────────────────────────────────
    protected function syncAccounts(): array
    {
        $rows = $this->client->list('Account', [
            'fields'            => '["name","account_name","account_type","root_type","is_group","company"]',
            'filters'           => '[["is_group","=",0]]',
            'limit_page_length' => 2000,
        ]);

        $inserted = 0;
        $updated  = 0;

        DB::transaction(function () use ($rows, &$inserted, &$updated) {
            foreach ($rows as $row) {
                $rootType = strtolower($row['root_type'] ?? '');
                if (! in_array($rootType, ['asset', 'expense'], true)) {
                    continue;
                }

                $company = Company::where('erpnext_name', $row['company'] ?? '')->first();
                if (! $company) {
                    continue;
                }

                $existing = Account::where('erpnext_name', $row['name'])->first();

                $payload = [
                    'erpnext_name' => $row['name'],
                    'company_id'   => $company->id,
                    'name'         => $row['account_name'] ?? $row['name'],
                    'account_type' => $row['account_type'] ?? null,
                    'source'       => 'erpnext',
                    'is_disabled'  => false,
                ];

                if ($existing) {
                    $existing->update($payload);
                    $updated++;
                } else {
                    Account::create($payload);
                    $inserted++;
                }
            }
        });

        return compact('inserted', 'updated');
    }

    // ─────────────────────────────────────────────────────────────
    //  Price Lists (selling only)
    // ─────────────────────────────────────────────────────────────
    protected function syncPriceLists(): array
    {
        $rows = $this->client->list('Price List', [
            'fields'            => '["name","price_list_name","currency","selling","enabled"]',
            'filters'           => '[["selling","=",1]]',
            'limit_page_length' => 200,
        ]);

        $inserted = 0;
        $updated  = 0;

        DB::transaction(function () use ($rows, &$inserted, &$updated) {
            foreach ($rows as $row) {
                $existing = PriceList::where('erpnext_name', $row['name'])->first();

                $payload = [
                    'erpnext_name' => $row['name'],
                    'name'         => $row['price_list_name'] ?? $row['name'],
                    'currency'     => $row['currency'] ?? 'PKR',
                    'is_selling'   => true,
                    'is_enabled'   => (bool) ($row['enabled'] ?? 1),
                    'source'       => 'erpnext',
                ];

                if ($existing) {
                    $existing->update($payload);
                    $updated++;
                } else {
                    PriceList::create($payload);
                    $inserted++;
                }
            }
        });

        return compact('inserted', 'updated');
    }

    // ─────────────────────────────────────────────────────────────
    //  Items (full mirror)
    // ─────────────────────────────────────────────────────────────
    protected function syncItems(): array
    {
        $rows = $this->client->list('Item', [
            'fields'            => '["name","item_code","item_name","item_group","stock_uom","is_stock_item","has_variants","variant_of","weight_per_unit"]',
            'limit_page_length' => 5000,
        ]);

        $inserted = 0;
        $updated  = 0;

        DB::transaction(function () use ($rows, &$inserted, &$updated) {
            foreach ($rows as $row) {
                $existing = Item::where('erpnext_item_code', $row['item_code'])->first();

                $payload = [
                    'erpnext_item_code' => $row['item_code'],
                    'name'              => $row['item_name'] ?? $row['item_code'],
                    'item_group'        => $row['item_group'] ?? null,
                    'uom'               => $row['stock_uom'] ?? null,
                    'is_stock_item'     => (bool) ($row['is_stock_item'] ?? 1),
                    'has_variants'      => (bool) ($row['has_variants'] ?? 0),
                    'variant_of'        => $row['variant_of'] ?? null,
                    'weight'            => $row['weight_per_unit'] ?? null,
                    'source'            => 'erpnext',
                ];

                if ($existing) {
                    $existing->update($payload);
                    $updated++;
                } else {
                    Item::create($payload);
                    $inserted++;
                }
            }
        });

        return compact('inserted', 'updated');
    }

    // ─────────────────────────────────────────────────────────────
    //  Item Prices (selling only)
    // ─────────────────────────────────────────────────────────────
    protected function syncItemPrices(): array
    {
        $rows = $this->client->list('Item Price', [
            'fields'            => '["name","item_code","price_list","price_list_rate","currency","selling"]',
            'filters'           => '[["selling","=",1]]',
            'limit_page_length' => 20000,
        ]);

        $inserted = 0;
        $updated  = 0;

        DB::transaction(function () use ($rows, &$inserted, &$updated) {
            foreach ($rows as $row) {
                $item = Item::where('erpnext_item_code', $row['item_code'])->first();
                $pl   = PriceList::where('erpnext_name', $row['price_list'])->first();

                if (! $item || ! $pl) {
                    continue;
                }

                $existing = ItemPrice::where('price_list_id', $pl->id)
                    ->where('item_id', $item->id)
                    ->first();

                $payload = [
                    'price_list_id' => $pl->id,
                    'item_id'       => $item->id,
                    'rate'          => $row['price_list_rate'] ?? 0,
                    'currency'      => $row['currency'] ?? 'PKR',
                ];

                if ($existing) {
                    $existing->update($payload);
                    $updated++;
                } else {
                    ItemPrice::create($payload);
                    $inserted++;
                }
            }
        });

        return compact('inserted', 'updated');
    }

    // ─────────────────────────────────────────────────────────────
    //  Customers
    // ─────────────────────────────────────────────────────────────
    protected function syncCustomers(): array
    {
        $rows = $this->client->list('Customer', [
            'fields'            => '["name","customer_name","customer_type","territory","mobile_no","email_id"]',
            'limit_page_length' => 5000,
        ]);

        $inserted = 0;
        $updated  = 0;

        DB::transaction(function () use ($rows, &$inserted, &$updated) {
            foreach ($rows as $row) {
                $existing = Customer::where('erpnext_customer', $row['name'])->first();

                $payload = [
                    'erpnext_customer' => $row['name'],
                    'name'             => $row['customer_name'] ?? $row['name'],
                    'customer_type'    => $row['customer_type'] ?? null,
                    'territory'        => $row['territory'] ?? null,
                    'phone'            => $row['mobile_no'] ?? null,
                    'email'            => $row['email_id'] ?? null,
                    'source'           => 'erpnext',
                ];

                if ($existing) {
                    $existing->update($payload);
                    $updated++;
                } else {
                    Customer::create($payload);
                    $inserted++;
                }
            }
        });

        return compact('inserted', 'updated');
    }
}
