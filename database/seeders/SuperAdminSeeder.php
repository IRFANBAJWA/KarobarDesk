<?php

namespace Database\Seeders;

use App\Models\User;
use App\Services\AdminProvisioning;
use Illuminate\Database\Seeder;
use RuntimeException;

class SuperAdminSeeder extends Seeder
{
    public function run(AdminProvisioning $provisioning): void
    {
        $username = env('SUPER_ADMIN_USERNAME');
        $email    = env('SUPER_ADMIN_EMAIL');
        $password = env('SUPER_ADMIN_PASSWORD');

        if (empty($username) || empty($email) || empty($password)) {
            $this->command?->warn(
                'SUPER_ADMIN_USERNAME / SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set — skipping.'
            );
            return;
        }

        if (User::where('username', $username)->exists()) {
            $this->command?->info("Super Admin '{$username}' already exists — skipping.");
            return;
        }

        try {
            $user = $provisioning->create($username, $email, $password);
            $this->command?->info("Super Admin created. ID: {$user->id}, username: {$user->username}");
        } catch (RuntimeException $e) {
            $this->command?->error($e->getMessage());
        }
    }
}
