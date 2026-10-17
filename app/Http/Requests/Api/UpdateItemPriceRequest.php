<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class UpdateItemPriceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // price_list_id and item_id are IMMUTABLE on update.
        return [
            'rate'      => ['sometimes', 'numeric', 'min:0', 'max:9999999999999.99'],
            'pack_rate' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:9999999999999.99'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
