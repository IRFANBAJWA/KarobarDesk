<?php

namespace App\Services;

use App\Models\Role;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class AdminProvisioning
{
    /**
     * Create a Super Admin user.
     *
     * Super Admin has no company (company_id = null) and no user_company_access rows.
     * Access to all companies is determined at request time via roles.is_super_admin = true.
     */
    public function create(string $username, string $email, string $password): User
    {
        $username = trim($username);
        $email = trim($email);

        if ($username === '' || $email === '' || $password === '') {
            throw new RuntimeException('Username, email, and password are all required.');
        }

        if (User::where('username', $username)->exists()) {
            throw new RuntimeException("A user with username '{$username}' already exists.");
        }

        if (User::where('email', $email)->exists()) {
            throw new RuntimeException("A user with email '{$email}' already exists.");
        }

        $superAdminRole = Role::where('name', 'super_admin')->first();
        if (! $superAdminRole) {
            throw new RuntimeException(
                "Role 'super_admin' not found. Run 'php artisan db:seed' first to seed roles."
            );
        }

        return DB::transaction(function () use ($username, $email, $password, $superAdminRole) {
            $user = User::create([
                'name'       => $username,
                'username'   => $username,
                'email'      => $email,
                'password'   => Hash::make($password),
                'company_id' => null,
                'is_active'  => true,
            ]);

            UserRole::create([
                'user_id' => $user->id,
                'role_id' => $superAdminRole->id,
            ]);

            return $user;
        });
    }
}
