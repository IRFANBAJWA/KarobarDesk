<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone'      => ['sometimes', 'nullable', 'string', 'max:50'],
            'email'      => ['sometimes', 'nullable', 'email', 'max:255'],
            'address'    => ['sometimes', 'nullable', 'string', 'max:2000'],
            'city'       => ['sometimes', 'nullable', 'string', 'max:100'],
            'country'    => ['sometimes', 'nullable', 'string', 'max:100'],
            'tax_number' => ['sometimes', 'nullable', 'string', 'max:100'],
            'is_active'  => ['sometimes', 'boolean'],
        ];
    }
}
