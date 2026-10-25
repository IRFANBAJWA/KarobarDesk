<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TillAccountResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'name'            => $this->name,
            'erpnext_account' => $this->erpnext_account,
            'account_type'    => $this->account_type,
            // This is where the pivot data lives
            'is_default'      => (bool) ($this->pivot->is_default ?? false),
        ];
    }
}
