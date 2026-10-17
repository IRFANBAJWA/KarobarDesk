<?php

namespace App\Http\Requests;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
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
        /** @var User|null $target */
        $target = $this->route('user');
        $userId = $target?->id;

        return [
            'name'              => ['required', 'string', 'max:255'],
            'username'          => [
                'required',
                'string',
                'max:100',
                Rule::unique('users', 'username')->ignore($userId),
            ],
            'email'             => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'password'          => ['nullable', 'string', 'min:8', 'max:255'],
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

            if (! empty($roles)) {
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
            }

            /** @var User|null $target */
            $target  = $this->route('user');
            $actorId = (int) auth()->id();

            if (
                $target
                && $target->id === $actorId
                && $this->has('is_active')
                && $this->boolean('is_active') === false
            ) {
                $validator->errors()->add(
                    'is_active',
                    'You cannot deactivate your own account.'
                );
            }
        });
    }
}
