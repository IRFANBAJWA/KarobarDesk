<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name' => 'super_admin',
                'label' => 'Super Admin',
                'description' => 'Full system access. Bypasses company scoping and field permissions.',
                'is_system' => true,
                'is_super_admin' => true,
                'is_active' => true,
            ],
            [
                'name' => 'admin',
                'label' => 'Admin',
                'description' => 'Administrative access. Manages users, roles, and company operations.',
                'is_system' => true,
                'is_super_admin' => false,
                'is_active' => true,
            ],
            [
                'name' => 'manager',
                'label' => 'Manager',
                'description' => 'Operational management. Reports, approvals, purchasing.',
                'is_system' => true,
                'is_super_admin' => false,
                'is_active' => true,
            ],
            [
                'name' => 'cashier',
                'label' => 'Cashier',
                'description' => 'POS operator. Sells, returns, opens and closes shifts.',
                'is_system' => true,
                'is_super_admin' => false,
                'is_active' => true,
            ],
        ];

        foreach ($roles as $role) {
            DB::table('roles')->updateOrInsert(
                ['name' => $role['name']],
                $role + ['created_at' => now(), 'updated_at' => now()]
            );
        }
    }
}
