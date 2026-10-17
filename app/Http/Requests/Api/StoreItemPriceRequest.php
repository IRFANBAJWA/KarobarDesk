<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StoreItemPriceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'price_list_id' => ['required', 'integer', 'exists:price_lists,id'],
            'item_id'       => ['required', 'integer', 'exists:items,id'],
            'rate'          => ['required', 'numeric', 'min:0', 'max:9999999999999.99'],
            'pack_rate'     => ['nullable', 'numeric', 'min:0', 'max:9999999999999.99'],
            'is_active'     => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'price_list_id.exists' => 'The selected price list does not exist.',
            'item_id.exists'       => 'The selected item does not exist.',
        ];
    }
}
