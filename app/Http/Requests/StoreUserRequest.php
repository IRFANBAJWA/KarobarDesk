<?php

namespace App\Http\Requests;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name'              => ['required', 'string', 'max:255'],
            'username'          => ['required', 'string', 'max:100', 'unique:users,username'],
            'email'             => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'          => ['required', 'string', 'min:8', 'max:255'],
            'company_id'        => ['required', 'integer', 'exists:companies,id'],
            'company_access'    => ['nullable', 'array'],
            'company_access.*'  => ['integer', 'exists:companies,id'],
            'roles'             => ['nullable', 'array'],
            'roles.*'           => ['string', 'exists:roles,name'],
            'is_active'         => ['boolean'],

        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            /** @var array<int, string> $roles */
            $roles = $this->input('roles', []);

            if (empty($roles)) {
                return;
            }

            $superAdminRequested = Role::query()
                ->whereIn('name', $roles)
                ->where('is_super_admin', true)
                ->exists();

            if ($superAdminRequested) {
                $validator->errors()->add(
                    'roles',
                    'The super-admin role cannot be assigned through this endpoint.'
                );
            }
        });
    }
}
