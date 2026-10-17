<?php

namespace App\Http\Resources\Users;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserDetailResource extends JsonResource
{
    /**
     * Full shape for the detail drawer.
     * Includes companies[], roles[], till_operation with accounts[].
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'name'          => $this->name,
            'username'      => $this->username,
            'email'         => $this->email,
            'is_active'     => (bool) $this->is_active,
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'created_at'    => $this->created_at?->toIso8601String(),
            'updated_at'    => $this->updated_at?->toIso8601String(),

            'company' => $this->whenLoaded('company', fn () => $this->company ? [
                'id'              => $this->company->id,
                'name'            => $this->company->name,
                'code'            => $this->company->code,
                'erpnext_company' => $this->company->erpnext_company,
            ] : null),

            'companies' => $this->whenLoaded('companies', fn () =>
                $this->companies->map(fn ($c) => [
                    'id'   => $c->id,
                    'name' => $c->name,
                    'code' => $c->code,
                ])->values()
            ),

            'roles' => $this->whenLoaded('roles', fn () =>
                $this->roles->map(fn ($r) => [
                    'id'             => $r->id,
                    'name'           => $r->name,
                    'label'          => $r->label,
                    'description'    => $r->description,
                    'is_super_admin' => (bool) $r->is_super_admin,
                ])->values()
            ),

            'erpnext' => [
                'user'           => $this->erpnext_user,
                'linked'         => ! empty($this->erpnext_user) && ! empty($this->erpnext_token),
                'last_tested_at' => $this->erpnext_last_tested_at?->toIso8601String(),
                'last_error'     => $this->erpnext_last_error,
            ],

            'till_operation' => $this->whenLoaded('tillOperation', fn () =>
                $this->tillOperation ? [
                    'id'             => $this->tillOperation->id,
                    'erpnext_name'   => $this->tillOperation->erpnext_name,
                    'source'         => $this->tillOperation->source,
                    'till_no'        => $this->tillOperation->till_no,
                    'shop_name'      => $this->tillOperation->shop_name,
                    'shop_code'      => $this->tillOperation->shop_code,
                    'warehouse'      => $this->tillOperation->warehouse,
                    'price_list'     => $this->tillOperation->price_list,
                    'erpnext_role'   => $this->tillOperation->erpnext_role,
                    'address'        => $this->tillOperation->address,
                    'phone'          => $this->tillOperation->phone,
                    'is_online'      => (bool) $this->tillOperation->is_online,
                    'allow_rate'     => (bool) $this->tillOperation->allow_rate,
                    'return_pin_set' => $this->tillOperation->return_pin !== null,
                    'is_active'      => (bool) $this->tillOperation->is_active,
                    'sync_status'    => $this->tillOperation->sync_status,
                    'last_synced_at' => $this->tillOperation->last_synced_at?->toIso8601String(),

                    'accounts' => $this->tillOperation->relationLoaded('accounts')
                        ? $this->tillOperation->accounts->map(fn ($a) => [
                            'id'              => $a->id,
                            'erpnext_account' => $a->erpnext_account,
                            'name'            => $a->name,
                            'account_type'    => $a->account_type,
                            'is_default'      => (bool) $a->pivot->is_default,
                        ])->values()
                        : [],
                ] : null
            ),
        ];
    }
}