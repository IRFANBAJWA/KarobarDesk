<?php

namespace App\Services\ErpNext;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

class ErpNextClient
{
    protected ?string $token = null;
    protected array $userInfo = [];

    public function __construct(
        protected string $baseUrl,
        protected string $username,
        protected string $password,
    ) {
        $this->baseUrl = rtrim($baseUrl, '/');
    }

    /**
     * Log into ERPNext and store the session token for subsequent calls.
     * Custom endpoint: POST /api/method/till_apis.till_apis.apis.auth.login
     * Body:           { "username": "...", "password": "..." }
     * Returns:        { "message": { "token": "...", "user": { ... } } }
     */
    public function login(): string
    {
        $response = Http::acceptJson()
            ->timeout(30)
            ->post("{$this->baseUrl}/api/method/till_apis.till_apis.apis.auth.login", [
                'username' => $this->username,
                'password' => $this->password,
            ]);

        if (! $response->successful()) {
            throw ErpNextException::loginFailed(
                $response->status(),
                $response->body(),
            );
        }

        $token = $response->json('message.token');

        if (! $token) {
            throw ErpNextException::missingToken();
        }

        $this->token    = $token;
        $this->userInfo = $response->json('message.user') ?? [];

        return $token;
    }

    /**
     * Fetch a list of documents from a doctype.
     */
    public function list(string $doctype, array $params = []): array
    {
        $response = $this->request()
            ->get("{$this->baseUrl}/api/resource/{$doctype}", $params);

        if (! $response->successful()) {
            throw ErpNextException::requestFailed(
                $doctype,
                $response->status(),
                $response->body(),
            );
        }

        return $response->json('data') ?? [];
    }

    /**
     * Return the currently authenticated ERPNext user's display name,
     * sourced from the login response (no second API call).
     */
    public function currentUser(): ?string
    {
        return $this->userInfo['full_name']
            ?? $this->userInfo['name']
            ?? null;
    }

    /**
     * Internal: build a request with auth header attached.
     */
    protected function request(): PendingRequest
    {
        if (! $this->token) {
            throw new ErpNextException('Not logged in. Call login() first.');
        }

        return Http::acceptJson()
            ->timeout(120)
            ->withHeaders([
                'Authorization' => "token {$this->token}",
            ]);
    }
}
