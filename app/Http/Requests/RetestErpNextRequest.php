<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RetestErpNextRequest extends FormRequest
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
            'erpnext_user'     => ['required', 'string', 'max:255'],
            'erpnext_password' => ['required', 'string', 'max:255'],
        ];
    }
}
