<?php

namespace App\Http\Resources\Users;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'name'           => $this->name,
            'label'          => $this->label,
            'description'    => $this->description,
            'is_system'      => (bool) $this->is_system,
            'is_super_admin' => (bool) $this->is_super_admin,
            'is_active'      => (bool) $this->is_active,
        ];
    }
}
