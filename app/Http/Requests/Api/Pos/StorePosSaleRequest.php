<?php

namespace App\Http\Requests\Api\Pos;

use Illuminate\Foundation\Http\FormRequest;

class StorePosSaleRequest extends FormRequest
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
            'invoice_date'      => ['nullable', 'date'],
            'invoice_time'      => ['nullable', 'date_format:H:i:s'],

            'customer'          => ['nullable', 'array'],
            'customer.phone'    => ['required_with:customer', 'string', 'max:50'],
            'customer.name'     => ['nullable', 'string', 'max:255'],
            'customer.address'  => ['nullable', 'string'],

            'items'                   => ['required', 'array', 'min:1'],
            'items.*.item_code'       => ['required', 'string', 'max:255'],
            'items.*.item_name'       => ['nullable', 'string', 'max:255'],
            'items.*.qty'             => ['required', 'numeric', 'min:0.001'],
            'items.*.sale_price'      => ['required', 'numeric', 'min:0'],
            'items.*.unit_price'      => ['nullable', 'numeric', 'min:0'],
            'items.*.uom'             => ['nullable', 'string', 'max:50'],
            'items.*.discount'        => ['nullable', 'numeric', 'min:0'],
            'items.*.discount_percent' => ['nullable', 'numeric', 'min:0'],
            'items.*.is_b'            => ['nullable', 'boolean'],
            'items.*.is_set'          => ['nullable', 'boolean'],
            'items.*.is_b_reason'     => ['nullable', 'string'],
            'items.*.discount_reason' => ['nullable', 'string'],
            'items.*.remarks'         => ['nullable', 'string'],
            'items.*.cost_price'      => ['nullable', 'numeric'],

            'payments'                    => ['array'],
            'payments.*.account'          => ['required_with:payments', 'string'],
            'payments.*.paid_amount'      => ['required_with:payments', 'numeric'],
            'payments.*.payment_method'   => ['nullable', 'string'],
            'payments.*.reference_number' => ['nullable', 'string'],
            'payments.*.card_last_4'      => ['nullable', 'string', 'max:4'],
            'payments.*.card_type'        => ['nullable', 'string'],
        ];
    }
}
