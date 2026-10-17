<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class UpdateItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Auth is enforced by the controller's authorizeAdminManager() guard.
        return true;
    }

    public function rules(): array
    {
        return [
            'item_name'     => ['sometimes', 'string', 'min:1', 'max:255'],
            'alias'         => ['sometimes', 'nullable', 'string', 'max:255'],
            'barcode'       => ['sometimes', 'nullable', 'string', 'max:255'],
            'description'   => ['sometimes', 'nullable', 'string', 'max:5000'],
            'item_group'    => ['sometimes', 'nullable', 'string', 'max:255'],
            'brand'         => ['sometimes', 'nullable', 'string', 'max:255'],
            'weight'        => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:999999999.999'],
            'weight_uom'    => ['sometimes', 'nullable', 'string', 'max:20'],
            'cost_price'    => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:9999999999999.99'],
            'standard_rate' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:9999999999999.99'],
            'tax_rate'      => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:100'],
            'is_taxable'    => ['sometimes', 'boolean'],
            'is_active'     => ['sometimes', 'boolean'],
        ];
    }
}
