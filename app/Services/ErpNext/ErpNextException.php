<?php

namespace App\Services\ErpNext;

use RuntimeException;

class ErpNextException extends RuntimeException
{
    public static function loginFailed(int $status, string $body): self
    {
        return new self("ERPNext login failed ({$status}): {$body}");
    }

    public static function requestFailed(string $endpoint, int $status, string $body): self
    {
        return new self("ERPNext request to {$endpoint} failed ({$status}): {$body}");
    }

    public static function missingToken(): self
    {
        return new self('ERPNext login succeeded but no token was returned.');
    }

    public static function unknownStep(string $step): self
    {
        return new self("Unknown sync step: {$step}");
    }
}
