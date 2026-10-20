<?php

namespace App\Services\ErpNext;

use Carbon\Carbon;
use App\Models\Account;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Item;
use App\Models\ItemPrice;
use App\Models\ItemStock;
use App\Models\PriceList;
use Illuminate\Support\Facades\DB;

class ErpNextSyncService
{
    public function __construct(protected ErpNextClient $client) {}

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
                'item_stocks' => $this->syncItemStocks(), // <--- NEW
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

    protected function syncCompanies(): array
    {
        $rows = $this->client->listAll('Company', [
            'fields' => '["name","company_name","abbr","modified"]',
        ]);

        $inserted = 0;
        $updated  = 0;

        DB::transaction(function () use ($rows, &$inserted, &$updated) {
            foreach ($rows as $row) {
                $existing = Company::where('erpnext_company', $row['name'])->first();

                $payload = [
                    'erpnext_company'     => $row['name'],
                    'name'                => $row['company_name'] ?? $row['name'],
                    'code'                => $row['abbr'] ?? null,
                    'is_active'           => true,
                    'erpnext_modified_at' => $row['modified'] ?? null,
                    'sync_status'         => 'synced',
                    'last_synced_at'      => now(),
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

    protected function syncAccounts(): array
    {
        $rows = $this->client->listAll('Account', [
            'fields' => '["name","account_name","account_type","root_type","company","is_group"]',
        ]);

        $inserted = 0;
        $updated  = 0;

        DB::transaction(function () use ($rows, &$inserted, &$updated) {
            foreach ($rows as $row) {
                $rootType = strtolower($row['root_type'] ?? '');
                if (! in_array($rootType, ['asset', 'expense'], true)) {
                    continue;
                }

                $company = Company::where('erpnext_company', $row['company'] ?? '')->first();
                if (! $company) {
                    continue;
                }

                $existing = Account::where('erpnext_account', $row['name'])->first();

                $payload = [
                    'company_id'          => $company->id,
                    'erpnext_account'     => $row['name'],
                    'source'              => 'erpnext',
                    'name'                => $row['account_name'] ?? $row['name'],
                    'account_type'        => $row['account_type'] ?? null,
                    'is_group'            => (bool) ($row['is_group'] ?? 0),
                    'is_disabled'         => false,
                    'erpnext_modified_at' => null,
                    'sync_status'         => 'synced',
                    'last_synced_at'      => now(),
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

    protected function syncPriceLists(): array
    {
        $rows = $this->client->listAll('Price List', [
            'fields' => '["name","price_list_name","currency","selling","enabled"]',
        ]);

        $inserted = 0;
        $updated  = 0;

        DB::transaction(function () use ($rows, &$inserted, &$updated) {
            foreach ($rows as $row) {
                if (empty($row['selling'])) {
                    continue;
                }

                $existing = PriceList::where('erpnext_name', $row['name'])->first();

                $payload = [
                    'erpnext_name'        => $row['name'],
                    'name'                => $row['price_list_name'] ?? $row['name'],
                    'is_selling'          => true,
                    'is_active'           => (bool) ($row['enabled'] ?? 1),
                    'erpnext_modified_at' => null,
                    'sync_status'         => 'synced',
                    'last_synced_at'      => now(),
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

    protected function syncItems(): array
    {
        $rows = $this->client->listAll('Item', [
            'fields' => '["name","item_code","item_name","item_group","brand","stock_uom","description","weight_per_unit","weight_uom","is_stock_item","has_variants","variant_of","modified"]',
        ]);

        $inserted = 0;
        $updated  = 0;

        DB::transaction(function () use ($rows, &$inserted, &$updated) {
            foreach ($rows as $row) {
                $itemCode  = $row['item_code'] ?? $row['name'];
                $itemName  = $row['item_name'] ?? $itemCode;
                $itemGroup = $row['item_group'] ?? '';

                $existing = Item::where('erpnext_item_code', $itemCode)->first();

                $payload = [
                    'erpnext_item_code'   => $itemCode,
                    'item_name'           => $itemName,
                    'item_group'          => $itemGroup ?: null,
                    'brand'               => $row['brand'] ?? null,
                    'uom'                 => $row['stock_uom'] ?? null,
                    'description'         => $row['description'] ?? null,
                    'weight'              => $row['weight_per_unit'] ?? null,
                    'weight_uom'          => $row['weight_uom'] ?? null,
                    'is_stock_item'       => (bool) ($row['is_stock_item'] ?? 1),
                    'has_variants'        => (bool) ($row['has_variants'] ?? 0),
                    'is_active'           => true,
                    'alias'               => $this->makeAlias($itemGroup),
                    'barcode'             => $itemCode,
                    'erpnext_modified_at' => $row['modified'] ?? null,
                    'sync_status'         => 'synced',
                    'last_synced_at'      => now(),
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

    protected function makeAlias(string $source): string
    {
        $source = trim($source);
        if ($source === '') return '';

        $words = preg_split('/\s+/', $source);
        $alias = '';

        foreach ($words as $word) {
            if ($word === '') continue;
            $alias .= strtoupper($word[0]);
        }

        return $alias;
    }

    protected function syncItemPrices(): array
    {
        $rows = $this->client->listAll('Item Price', [
            'fields' => json_encode([
                'name',
                'item_code',
                'price_list',
                'price_list_rate',
                'pack_rate',
                'selling',
                'modified',
            ]),
        ]);

        $priceListMap = PriceList::query()->pluck('id', 'erpnext_name')->all();
        $itemMap = Item::query()->pluck('id', 'erpnext_item_code')->all();

        $inserted = 0;
        $updated  = 0;
        $now      = now();

        foreach ($rows as $row) {
            $priceListName = $row['price_list'] ?? null;
            $itemCode      = $row['item_code']  ?? null;

            if (! $priceListName || ! $itemCode) continue;
            if (! isset($priceListMap[$priceListName], $itemMap[$itemCode])) continue;

            $priceListId = $priceListMap[$priceListName];
            $itemId      = $itemMap[$itemCode];

            $payload = [
                'rate'                => $row['price_list_rate'] ?? 0,
                'pack_rate'           => $row['pack_rate'] ?? null,
                'is_active'           => 1,
                'erpnext_modified_at' => $row['modified'] ?? null,
                'sync_status'         => 'synced',
                'last_synced_at'      => $now,
            ];

            $existing = ItemPrice::where('price_list_id', $priceListId)
                ->where('item_id', $itemId)
                ->first();

            if ($existing) {
                $existing->update($payload);
                $updated++;
            } else {
                ItemPrice::create(array_merge($payload, [
                    'price_list_id' => $priceListId,
                    'item_id'       => $itemId,
                ]));
                $inserted++;
            }
        }

        return compact('inserted', 'updated');
    }

    protected function syncCustomers(): array
    {
        $rows = $this->client->listAll('Customer', [
            'fields' => '["name","customer_name","customer_type","territory","mobile_no","email_id","custom_phone","custom_address","custom_loyalty_code","modified"]',
        ]);

        $inserted = 0;
        $updated  = 0;

        DB::transaction(function () use ($rows, &$inserted, &$updated) {
            foreach ($rows as $row) {
                $existing = Customer::where('erpnext_customer', $row['name'])->first();
                $phone = $row['mobile_no'] ?? $row['custom_phone'] ?? null;

                $payload = [
                    'erpnext_customer'    => $row['name'],
                    'customer_name'       => $row['customer_name'] ?? $row['name'],
                    'customer_type'       => $row['customer_type'] ?? null,
                    'email'               => $row['email_id'] ?? null,
                    'city'                => $row['city'] ?? null,
                    'loyalty_card_number' => $row['custom_loyalty_code'] ?? null,
                    'is_active'           => true,
                    'erpnext_modified_at' => $row['modified'] ?? null,
                    'sync_status'         => 'synced',
                    'last_synced_at'      => now(),
                ];

                if (!empty($row['custom_address']) || !$existing) {
                    $payload['address'] = $row['custom_address'] ?? null;
                }

                if (!empty($phone) || !$existing) {
                    $payload['phone'] = $phone;
                }

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

    /**
     * NEW: Sync Stock from ERPNext Bins
     */

    protected function syncItemStocks(): array
    {
        $inserted = 0;
        $updated = 0;
        $skipped = 0;

        $companies = Company::where('is_active', true)->get();

        // Load item mappings once to avoid querying for every stock row.
        $items = Item::whereNotNull('erpnext_item_code')
            ->pluck('id', 'erpnext_item_code');

        DB::transaction(function () use (
            $companies,
            $items,
            &$inserted,
            &$updated,
            &$skipped
        ) {
            foreach ($companies as $company) {
                // Get all non-group warehouses for this company.
                $warehouses = $this->client->listAll('Warehouse', [
                    'fields' => '["name","company","is_group"]',
                    'filters' => json_encode([
                        ['company', '=', $company->name],
                        ['is_group', '=', 0],
                    ]),
                ]);

                foreach ($warehouses as $warehouse) {
                    $warehouseName = $warehouse['name'];

                    // Fetch stock for every item in this warehouse.
                    $rows = $this->client->listAll('Bin', [
                        'fields' => '["item_code","warehouse","actual_qty","stock_uom"]',
                        'filters' => json_encode([
                            ['warehouse', '=', $warehouseName],
                        ]),
                    ]);

                    foreach ($rows as $row) {
                        $itemId = $items[$row['item_code']] ?? null;

                        if (!$itemId) {
                            $skipped++;
                            continue;
                        }

                        $qty = (float) $row['actual_qty'];

                        $existing = ItemStock::where('company_id', $company->id)
                            ->where('warehouse', $warehouseName)
                            ->where('item_id', $itemId)
                            ->first();

                        if ($existing) {
                            if ((float) $existing->qty !== $qty) {
                                $existing->update(['qty' => $qty]);
                                $updated++;
                            }
                        } else {
                            ItemStock::create([
                                'company_id' => $company->id,
                                'warehouse'  => $warehouseName,
                                'item_id'    => $itemId,
                                'qty'        => $qty,
                            ]);

                            $inserted++;
                        }
                    }
                }
            }
        });

        return compact('inserted', 'updated', 'skipped');
    }
}
