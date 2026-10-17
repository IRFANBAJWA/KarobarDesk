<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'erpnext_item_code' => $this->erpnext_item_code,
            'item_name'         => $this->item_name,
            'item_group'        => $this->item_group,
            'brand'             => $this->brand,
            'uom'               => $this->uom,
            'barcode'           => $this->barcode,
            'alias'             => $this->alias,
            'description'       => $this->description,
            'weight'            => $this->weight,
            'weight_uom'        => $this->weight_uom,
            'cost_price'        => $this->cost_price,
            'standard_rate'     => $this->standard_rate,
            'last_purchase_rate' => $this->last_purchase_rate,
            'average_rate'      => $this->average_rate,
            'tax_rate'          => $this->tax_rate,
            'is_stock_item'     => (bool) $this->is_stock_item,
            'is_taxable'        => (bool) $this->is_taxable,
            'is_active'         => (bool) $this->is_active,
            'has_variants'      => (bool) $this->has_variants,
            'woocommerce_id'    => $this->woocommerce_id,
            'sync_status'       => $this->sync_status,
            'last_synced_at'    => $this->last_synced_at?->toIso8601String(),
            'erpnext_modified_at' => $this->erpnext_modified_at?->toIso8601String(),

            // Counts — only present when controller calls withCount/loadCount
            'item_prices_count'            => $this->whenCounted('itemPrices'),
            'item_stocks_count'            => $this->whenCounted('itemStocks'),
            'stock_ledgers_count'          => $this->whenCounted('stockLedgers'),
            'sales_invoice_items_count'    => $this->whenCounted('salesInvoiceItems'),
            'purchase_order_items_count'   => $this->whenCounted('purchaseOrderItems'),
            'purchase_receipt_items_count' => $this->whenCounted('purchaseReceiptItems'),
            'company_item_statuses_count'  => $this->whenCounted('companyItemStatuses'),

            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
