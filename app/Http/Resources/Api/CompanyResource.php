<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompanyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                    => $this->id,
            'name'                  => $this->name,
            'code'                  => $this->code,
            'erpnext_company'       => $this->erpnext_company,
            'is_active'             => (bool) $this->is_active,
            'sync_status'           => $this->sync_status,
            'last_synced_at'        => $this->last_synced_at?->toIso8601String(),
            'erpnext_modified_at'   => $this->erpnext_modified_at?->toIso8601String(),

            'users_count'           => $this->whenCounted('users'),
            'accounts_count'        => $this->whenCounted('accounts'),
            'till_operations_count' => $this->whenCounted('tillOperations'),

            'created_at'            => $this->created_at?->toIso8601String(),
            'updated_at'            => $this->updated_at?->toIso8601String(),
        ];
    }
}
