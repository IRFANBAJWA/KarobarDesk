<?php

namespace App\Http\Requests\Api\Pos;

use Illuminate\Foundation\Http\FormRequest;

class StorePosReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_request_id' => ['required', 'string', 'max:100'],
            'invoice_number'    => ['required', 'string', 'max:50'],

            // Optional: If provided, validates against original. If null/empty, processes Blind.
            'original_client_request_id' => ['nullable', 'string', 'max:100'],
            'return_reason'     => ['nullable', 'string'],

            'customer'          => ['nullable', 'array'],
            'customer.phone'    => ['required_with:customer', 'string', 'max:50'],
            'customer.name'     => ['nullable', 'string', 'max:255'],

            'items'             => ['required', 'array', 'min:1'],
            'items.*.item_code' => ['required', 'string', 'max:255'],
            'items.*.qty'       => ['required', 'numeric', 'min:0.001'],
            'items.*.sale_price' => ['nullable', 'numeric'],

            'payments'          => ['array'],
            'payments.*.account' => ['required_with:payments', 'string'],
            'payments.*.paid_amount' => ['required_with:payments', 'numeric'],
            'payments.*.payment_method' => ['nullable', 'string'],
        ];
    }
}
