<?php

namespace App\Http\Requests\Api\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
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
            'username'    => ['required', 'string', 'max:100'],
            'password'    => ['required', 'string'],
            'client_type' => ['required', 'string', 'in:pos,spa'],
        ];
    }
}
