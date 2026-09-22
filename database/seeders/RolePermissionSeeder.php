<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $roleIds = DB::table('roles')->pluck('id', 'name');
        $permissions = DB::table('permissions')->get();

        // Super Admin: all permissions
        $superAdminId = $roleIds['super_admin'];
        foreach ($permissions as $p) {
            DB::table('role_permissions')->updateOrInsert(
                ['role_id' => $superAdminId, 'permission_id' => $p->id],
                ['created_at' => now(), 'updated_at' => now()]
            );
        }

        // Admin: all except system-level manage permissions
        $adminId = $roleIds['admin'];
        $adminExcluded = [
            ['sync', 'manage'],
            ['settings', 'manage'],
            ['roles', 'create'],
            ['roles', 'edit'],
            ['roles', 'delete'],
            ['permissions', 'create'],
            ['permissions', 'edit'],
            ['permissions', 'delete'],
        ];
        foreach ($permissions as $p) {
            $excluded = false;
            foreach ($adminExcluded as $ex) {
                if ($p->module === $ex[0] && $p->action === $ex[1]) {
                    $excluded = true;
                    break;
                }
            }
            if (!$excluded) {
                DB::table('role_permissions')->updateOrInsert(
                    ['role_id' => $adminId, 'permission_id' => $p->id],
                    ['created_at' => now(), 'updated_at' => now()]
                );
            }
        }

        // Manager: operational + reporting, no admin/system
        $managerId = $roleIds['manager'];
        $managerAllowed = [
            ['sales', 'view'],
            ['sales', 'create'],
            ['sales', 'edit'],
            ['sales', 'void'],
            ['sales', 'return'],
            ['returns', 'view'],
            ['returns', 'create'],
            ['payments', 'view'],
            ['payments', 'create'],
            ['payments', 'edit'],
            ['stock', 'view'],
            ['stock', 'adjust'],
            ['items', 'view'],
            ['item_prices', 'view'],
            ['customers', 'view'],
            ['customers', 'create'],
            ['customers', 'edit'],
            ['expenses', 'view'],
            ['expenses', 'create'],
            ['expenses', 'edit'],
            ['expenses', 'approve'],
            ['purchasing', 'view'],
            ['purchasing', 'create'],
            ['purchasing', 'edit'],
            ['shifts', 'view'],
            ['shifts', 'create'],
            ['shifts', 'edit'],
            ['day_closings', 'view'],
            ['day_closings', 'create'],
            ['day_closings', 'edit'],
            ['reports', 'view'],
            ['courier', 'view'],
            ['courier', 'create'],
            ['courier', 'edit'],
            ['courier', 'book'],
            ['courier', 'track'],
            ['courier', 'advise'],
        ];
        foreach ($permissions as $p) {
            foreach ($managerAllowed as $a) {
                if ($p->module === $a[0] && $p->action === $a[1]) {
                    DB::table('role_permissions')->updateOrInsert(
                        ['role_id' => $managerId, 'permission_id' => $p->id],
                        ['created_at' => now(), 'updated_at' => now()]
                    );
                    break;
                }
            }
        }

        // Cashier: POS-only
        $cashierId = $roleIds['cashier'];
        $cashierAllowed = [
            ['sales', 'view'],
            ['sales', 'create'],
            ['sales', 'void'],
            ['returns', 'view'],
            ['returns', 'create'],
            ['payments', 'view'],
            ['payments', 'create'],
            ['stock', 'view'],
            ['items', 'view'],
            ['item_prices', 'view'],
            ['customers', 'view'],
            ['customers', 'create'],
            ['shifts', 'view'],
            ['shifts', 'create'],
            ['day_closings', 'view'],
            ['reports', 'view'],
            ['courier', 'view'],
            ['courier', 'create'],
            ['courier', 'book'],
            ['courier', 'track'],
        ];
        foreach ($permissions as $p) {
            foreach ($cashierAllowed as $a) {
                if ($p->module === $a[0] && $p->action === $a[1]) {
                    DB::table('role_permissions')->updateOrInsert(
                        ['role_id' => $cashierId, 'permission_id' => $p->id],
                        ['created_at' => now(), 'updated_at' => now()]
                    );
                    break;
                }
            }
        }
    }
}
