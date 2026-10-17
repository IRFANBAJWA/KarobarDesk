<?php

namespace App\Http\Resources\Users;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserListResource extends JsonResource
{
    /**
     * Row shape for the users table.
     * Light: no accounts, no full till payload.
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

            'company' => $this->whenLoaded('company', fn () => $this->company ? [
                'id'   => $this->company->id,
                'name' => $this->company->name,
                'code' => $this->company->code,
            ] : null),

            'roles' => $this->whenLoaded('roles', fn () =>
                $this->roles->map(fn ($r) => [
                    'id'             => $r->id,
                    'name'           => $r->name,
                    'label'          => $r->label,
                    'is_super_admin' => (bool) $r->is_super_admin,
                ])->values()
            ),

            // ERPNext link status only — never the token/password.
            'erpnext' => [
                'user'           => $this->erpnext_user,
                'linked'         => ! empty($this->erpnext_user) && ! empty($this->erpnext_token),
                'last_tested_at' => $this->erpnext_last_tested_at?->toIso8601String(),
                'last_error'     => $this->erpnext_last_error,
            ],

            // Compact till summary for the row (till no + shop name + warehouse).
            'till_operation' => $this->whenLoaded('tillOperation', fn () =>
                $this->tillOperation ? [
                    'id'           => $this->tillOperation->id,
                    'erpnext_name' => $this->tillOperation->erpnext_name,
                    'till_no'      => $this->tillOperation->till_no,
                    'shop_name'    => $this->tillOperation->shop_name,
                    'warehouse'    => $this->tillOperation->warehouse,
                    'is_active'    => (bool) $this->tillOperation->is_active,
                ] : null
            ),
        ];
    }
}