<?php

namespace App\Console\Commands;

use App\Services\AdminProvisioning;
use Illuminate\Console\Command;
use RuntimeException;
use Throwable;

class CreateAdminCommand extends Command
{
    protected $signature = 'karobardesk:create-admin
                            {--username= : Super Admin username}
                            {--email= : Super Admin email}
                            {--password= : Super Admin password}';

    protected $description = 'Create the first Super Admin user (idempotent, safe to re-run).';

    public function handle(AdminProvisioning $provisioning): int
    {
        $username = $this->option('username') ?: $this->ask('Username');
        $email    = $this->option('email')    ?: $this->ask('Email');

        if ($this->option('password')) {
            $password = $this->option('password');
        } else {
            $password = $this->secret('Password (min 8 chars)');
            $confirm  = $this->secret('Confirm password');

            if ($password !== $confirm) {
                $this->error('Passwords do not match.');
                return self::FAILURE;
            }
        }

        if (strlen((string) $password) < 8) {
            $this->error('Password must be at least 8 characters.');
            return self::FAILURE;
        }

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Invalid email address.');
            return self::FAILURE;
        }

        try {
            $user = $provisioning->create($username, $email, $password);
        } catch (RuntimeException $e) {
            $this->error($e->getMessage());
            return self::FAILURE;
        } catch (Throwable $e) {
            $this->error('Unexpected error: ' . $e->getMessage());
            return self::FAILURE;
        }

        $this->info("Super Admin created. ID: {$user->id}, username: {$user->username}");
        return self::SUCCESS;
    }
}
