<?php

namespace App\Services\ErpNext;

use RuntimeException;

class ErpNextException extends RuntimeException
{
    public static function loginFailed(int $status, string $body): self
    {
        // Frappe wraps errors in:
        //   { "message": { "status": false, "message": "...", "error": "..." } }
        // Try to pull the human-readable reason out of that envelope.
        $reason = null;
        $decoded = json_decode($body, true);

        if (is_array($decoded)) {
            $m = $decoded['message'] ?? null;

            if (is_array($m)) {
                // Case 1: message is an object with `message` or `error`
                $reason = $m['message'] ?? $m['error'] ?? null;
            } elseif (is_string($m) && $m !== '') {
                // Case 2: message is a plain string
                $reason = $m;
            } else {
                // Case 3: top-level error
                $reason = $decoded['error'] ?? null;
            }
        }

        // Fallback: map HTTP status to a friendly message
        if (! is_string($reason) || trim($reason) === '') {
            $reason = match (true) {
                $status === 401, $status === 403 => 'Incorrect ERPNext username or password.',
                $status === 404                  => 'ERPNext login endpoint not found.',
                $status >= 500                   => 'ERPNext server is not responding. Try again later.',
                default                          => 'ERPNext login failed.',
            };
        }

        return new self(trim($reason));
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
