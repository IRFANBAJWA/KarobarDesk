<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $modules = [
            'companies' => ['view', 'create', 'edit', 'delete'],
            'users' => ['view', 'create', 'edit', 'delete'],
            'roles' => ['view', 'create', 'edit', 'delete'],
            'permissions' => ['view', 'create', 'edit', 'delete'],
            'price_lists' => ['view', 'create', 'edit', 'delete'],
            'items' => ['view', 'create', 'edit', 'delete'],
            'item_prices' => ['view', 'create', 'edit', 'delete'],
            'customers' => ['view', 'create', 'edit', 'delete'],
            'accounts' => ['view', 'create', 'edit', 'delete'],
            'till_operations' => ['view', 'create', 'edit', 'delete'],
            'stock' => ['view', 'adjust'],
            'sales' => ['view', 'create', 'edit', 'delete', 'void', 'return'],
            'returns' => ['view', 'create'],
            'payments' => ['view', 'create', 'edit', 'delete'],
            'shifts' => ['view', 'create', 'edit', 'delete'],
            'day_closings' => ['view', 'create', 'edit'],
            'expenses' => ['view', 'create', 'edit', 'delete', 'approve'],
            'purchasing' => ['view', 'create', 'edit', 'delete'],
            'courier' => ['view', 'create', 'edit', 'delete', 'book', 'track', 'advise'],
            'sync' => ['view', 'manage'],
            'reports' => ['view'],
            'settings' => ['view', 'manage'],
            'audit' => ['view'],
        ];

        foreach ($modules as $module => $actions) {
            foreach ($actions as $action) {
                DB::table('permissions')->updateOrInsert(
                    ['module' => $module, 'action' => $action],
                    [
                        'label' => ucfirst($action) . ' ' . str_replace('_', ' ', ucfirst($module)),
                        'description' => null,
                        'is_system' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }
        }
    }
}
