<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ItemPriceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'price_list_id' => $this->price_list_id,
            'item_id'       => $this->item_id,
            'rate'          => $this->rate,
            'pack_rate'     => $this->pack_rate,
            'is_active'     => (bool) $this->is_active,
            'sync_status'   => $this->sync_status,
            'last_synced_at'      => $this->last_synced_at?->toIso8601String(),
            'erpnext_modified_at' => $this->erpnext_modified_at?->toIso8601String(),

            'price_list_name'         => $this->whenLoaded('priceList', fn() => $this->priceList->name),
            'price_list_erpnext_name' => $this->whenLoaded('priceList', fn() => $this->priceList->erpnext_name),
            'price_list_is_selling'   => $this->whenLoaded('priceList', fn() => (bool) $this->priceList->is_selling),

            'item_name'  => $this->whenLoaded('item', fn() => $this->item->item_name),
            'item_code'  => $this->whenLoaded('item', fn() => $this->item->erpnext_item_code),
            'item_group' => $this->whenLoaded('item', fn() => $this->item->item_group),
            'item_uom'   => $this->whenLoaded('item', fn() => $this->item->uom),

            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
