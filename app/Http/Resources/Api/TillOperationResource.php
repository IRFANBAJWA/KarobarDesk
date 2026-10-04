<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TillOperationResource extends JsonResource
{
    /**
     * POS-only. Includes return_pin (hidden on the model by default).
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'till_no'    => (int) $this->till_no,
            'warehouse'  => $this->warehouse,
            'shop_name'  => $this->shop_name,
            'shop_code'  => $this->shop_code,
            'address'    => $this->address,
            'phone'      => $this->phone,
            'is_online'  => (bool) $this->is_online,
            'allow_rate' => (bool) $this->allow_rate,
            'return_pin' => (int) $this->return_pin,
            'price_list' => $this->whenLoaded(
                'priceList',
                fn() => new PriceListResource($this->priceList)
            ),
            'accounts' => AccountResource::collection(
                $this->whenLoaded('accounts')
            ),
        ];
    }
}
