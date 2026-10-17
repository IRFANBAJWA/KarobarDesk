<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'erpnext_customer' => $this->erpnext_customer,
            'customer_name'    => $this->customer_name,
            'customer_type'    => $this->customer_type,
            'phone'            => $this->phone,
            'email'            => $this->email,
            'address'          => $this->address,
            'city'             => $this->city,
            'country'          => $this->country,
            'credit_limit'     => $this->credit_limit,
            'current_balance'  => $this->current_balance,
            'tax_number'       => $this->tax_number,

            'loyalty_card_number' => $this->loyalty_card_number,
            'loyalty_member'      => (bool) $this->loyalty_member,
            'special_discount'    => $this->special_discount,
            'loyalty_points'      => $this->loyalty_points,
            'loyalty_program'     => $this->loyalty_program,
            'loyalty_expiry'      => $this->loyalty_expiry?->toDateString(),

            'is_active'           => (bool) $this->is_active,
            'sync_status'         => $this->sync_status,
            'last_synced_at'      => $this->last_synced_at?->toIso8601String(),
            'erpnext_modified_at' => $this->erpnext_modified_at?->toIso8601String(),

            'sales_invoices_count' => $this->whenCounted('salesInvoices'),
            'rejected_sales_count' => $this->whenCounted('rejectedSales'),

            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}