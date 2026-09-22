<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FieldPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $roleIds = DB::table('roles')->pluck('id', 'name');

        $rules = [
            // Cashier
            ['cashier', 'sales_invoice', 'cost_price',      false, false],
            ['cashier', 'sales_invoice', 'profit',          false, false],
            ['cashier', 'sales_invoice', 'purchase_rate',   false, false],
            ['cashier', 'sales_invoice', 'discount',        true,  true],
            ['cashier', 'sales_invoice', 'discount_reason', true,  true],
            ['cashier', 'sales_invoice', 'customer_phone',  true,  false],

            // Manager
            ['manager', 'sales_invoice', 'cost_price',      false, false],
            ['manager', 'sales_invoice', 'profit',          false, false],
            ['manager', 'sales_invoice', 'purchase_rate',   false, false],
            ['manager', 'sales_invoice', 'discount',        true,  true],
            ['manager', 'sales_invoice', 'discount_reason', true,  true],
            ['manager', 'sales_invoice', 'customer_phone',  true,  false],
        ];

        foreach ($rules as $r) {
            [$roleName, $form, $field, $canView, $canEdit] = $r;
            if (!isset($roleIds[$roleName])) {
                continue;
            }
            DB::table('field_permissions')->updateOrInsert(
                [
                    'role_id' => $roleIds[$roleName],
                    'form'    => $form,
                    'field'   => $field,
                ],
                [
                    'can_view'   => $canView,
                    'can_edit'   => $canEdit,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
