<?php

namespace App\Services\Pos;

use App\Models\Customer;

class CustomerResolver
{
    public function resolve(?array $customerData): ?int
    {
        if (! $customerData || empty($customerData['phone'])) {
            return null; // Walk-in
        }

        $phone = $customerData['phone'];
        $customer = Customer::where('phone', $phone)->first();

        if ($customer) {
            return $customer->id;
        }

        // Create new customer on the fly
        $newCustomer = Customer::create([
            'erpnext_customer' => 'POS-' . $phone . '-' . time(), // Temp ID until synced
            'customer_name'    => $customerData['name'] ?? 'Walk-in Customer',
            'phone'            => $phone,
            'address'          => $customerData['address'] ?? null,
            'is_active'        => true,
            'sync_status'      => 'pending',
        ]);

        return $newCustomer->id;
    }
}
