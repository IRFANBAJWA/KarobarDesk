<?php

namespace App\Services\Pos;

use App\Models\Company;
use App\Models\Item;
use App\Models\ItemStock;
use App\Models\TillOperation;
use App\Models\User;

class PosSyncService
{
    /**
     * Build the payload for POST /api/pos/sync/items.
     * Filters: active items, non-Raw Material, has price for till's price list.
     * pack_rate is passed through raw (0.0 if null) - no arithmetic.
     */
    public function itemsForUser(User $user): array
    {
        $till = $this->requireTill($user);
        $company = $this->requireCompany($user);

        $rows = Item::query()
            ->join('item_prices', function ($join) use ($till) {
                $join->on('item_prices.item_id', '=', 'items.id')
                    ->where('item_prices.price_list_id', '=', $till->price_list_id)
                    ->where('item_prices.is_active', '=', 1)
                    ->whereNotNull('item_prices.rate');
            })
            ->where('items.is_active', 1)
            ->where('items.item_group', '!=', 'Raw Material')
            ->orderBy('items.item_name')
            ->select([
                'items.erpnext_item_code',
                'items.item_name',
                'items.is_stock_item',
                'items.item_group',
                'items.uom',
                'items.has_variants',
                'items.standard_rate',
                'items.brand',
                'items.weight',
                'items.weight_uom',
                'items.last_purchase_rate',
                'item_prices.rate as price_list_rate',
                'item_prices.pack_rate as pack_rate_raw',
            ])
            ->get();

        $items = $rows->map(function ($row) use ($till) {
            return [
                'name'                   => $row->erpnext_item_code,
                'item_code'              => $row->erpnext_item_code,
                'item_name'              => $row->item_name,
                'is_stock_item'          => (int) $row->is_stock_item,
                'item_group'             => $row->item_group,
                'stock_uom'              => $row->uom ?? 'Nos',
                'disabled'               => 0,
                'allow_alternative_item' => 0,
                'has_variants'           => (int) $row->has_variants,
                'opening_stock'          => 0.0,
                'valuation_rate'         => 0.0,
                'standard_rate'          => (float) ($row->standard_rate ?? 0),
                'is_fixed_asset'         => 0,
                'image'                  => null,
                'brand'                  => $row->brand,
                'weight_per_unit'        => (float) ($row->weight ?? 0),
                'weight_uom'             => $row->weight_uom,
                'last_purchase_rate'     => (float) ($row->last_purchase_rate ?? 0),
                'buying'                 => 0,
                'price_list'             => $till->price_list,
                'price_list_rate'        => (float) $row->price_list_rate,
                'pack_rate'              => (float) ($row->pack_rate_raw ?? 0),
            ];
        })->all();

        return [
            'status'        => true,
            'company'       => $company->erpnext_company ?? $company->name,
            'warehouse'     => $till->warehouse,
            'price_list'    => $till->price_list,
            'price_list_id' => (int) $till->price_list_id,
            'items'         => $items,
            'items_count'   => count($items),
        ];
    }

    /**
     * Build the payload for POST /api/pos/sync/stocks.
     * Only { item_code, qty } per row.
     */
    public function stocksForUser(User $user): array
    {
        $till = $this->requireTill($user);
        $company = $this->requireCompany($user);

        $rows = ItemStock::query()
            ->join('items', 'items.id', '=', 'item_stocks.item_id')
            ->join('item_prices', function ($join) use ($till) {
                $join->on('item_prices.item_id', '=', 'items.id')
                    ->where('item_prices.price_list_id', '=', $till->price_list_id)
                    ->where('item_prices.is_active', '=', 1)
                    ->whereNotNull('item_prices.rate');
            })
            ->where('item_stocks.company_id', $company->id)
            ->where('item_stocks.warehouse', $till->warehouse)
            ->where('items.is_active', 1)
            ->where('items.item_group', '!=', 'Raw Material')
            ->orderBy('items.item_name')
            ->select([
                'items.erpnext_item_code as item_code',
                'item_stocks.qty',
            ])
            ->get();

        $stocks = $rows->map(fn($row) => [
            'item_code' => $row->item_code,
            'qty'       => (float) $row->qty,
        ])->all();

        return [
            'status'       => true,
            'company'      => $company->erpnext_company ?? $company->name,
            'warehouse'    => $till->warehouse,
            'stocks'       => $stocks,
            'stocks_count' => count($stocks),
        ];
    }

    public function assertCompanyMatches(User $user, ?string $companyFromBody): void
    {
        if ($companyFromBody === null || $companyFromBody === '') {
            return;
        }

        $company = $this->requireCompany($user);
        $allowed = [
            (string) ($company->erpnext_company ?? ''),
            (string) ($company->name ?? ''),
            (string) ($company->code ?? ''),
        ];

        if (! in_array($companyFromBody, $allowed, true)) {
            abort(403, 'Requested company does not match your assigned company.');
        }
    }

    private function requireTill(User $user): TillOperation
    {
        $till = $user->tillOperation;
        if (! $till) {
            abort(403, 'No till operation linked to this user.');
        }
        return $till;
    }

    private function requireCompany(User $user): Company
    {
        if (! $user->company_id) {
            abort(403, 'No company assigned to this user.');
        }
        $company = Company::find($user->company_id);
        if (! $company) {
            abort(403, 'Assigned company not found.');
        }
        return $company;
    }
}
