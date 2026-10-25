<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccountResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'name'            => $this->name,
            'erpnext_account' => $this->erpnext_account,
            'account_type'    => $this->account_type,
            'is_disabled'     => (bool) $this->is_disabled,
            'company'         => $this->whenLoaded('company', fn() => [
                'id'   => $this->company->id,
                'name' => $this->company->name,
            ]),
        ];
    }
}
