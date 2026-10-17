<?php

namespace App\Services\ErpNext;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ErpNextClient
{
    protected ?string $token = null;
    protected array $userInfo = [];
    protected array $lastLoginPayload = [];
    public function __construct(
        protected string $baseUrl,
        protected string $username,
        protected string $password,
    ) {
        $this->baseUrl = rtrim($baseUrl, '/');
    }
    public function getLastLoginPayload(): array
    {
        return $this->lastLoginPayload;
    }
    /**
     * Login to custom ERPNext endpoint.
     * Endpoint: POST /api/method/till_apis.till_apis.apis.auth.login
     * Body:     { "username": "...", "password": "..." }
     * Response: { "message": { "status": true, "token": "...", "user": {...} } }
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
        $this->lastLoginPayload  = $response->json('message') ?? [];

        return $token;
    }

    /**
     * Fetch a list of documents from a doctype.
     */
    public function list(string $doctype, array $params = []): array
    {
        $response = $this->request()
            ->get("{$this->baseUrl}/api/resource/{$doctype}", $params);
        Log::info('[ERPNext] → list request', [
            'doctype'           => $doctype,
            'params'            => $params,
            'limit_page_length' => $params['limit_page_length'] ?? 100,
        ]);
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
     * Fetch all rows from a doctype, paginating through results.
     *
     * ERPNext caps limit_page_length, so we chunk at $pageSize and use
     * limit_start offsets to walk through the full dataset.
     *
     * @param  string  $doctype   Doctype name (e.g. "Item", "Customer")
     * @param  array   $params    Query params (fields, filters, etc.)
     * @param  int     $pageSize  Rows per request (keep ≤ 100 for custom ERPNext)
     * @param  int     $maxRows   Safety cap — stop after this many rows total
     * @return array              Flat list of all rows
     */
    public function listAll(
        string $doctype,
        array $params = [],
        int $pageSize = 100,
        int $maxRows = 100000
    ): array {
        $all   = [];
        $start = 0;

        while (true) {
            if (count($all) >= $maxRows) {
                \Illuminate\Support\Facades\Log::warning('[ERPNext] listAll hit maxRows', [
                    'doctype' => $doctype,
                    'count'   => count($all),
                    'maxRows' => $maxRows,
                ]);
                break;
            }

            $pageParams = array_merge($params, [
                'limit_page_length' => $pageSize,
                'limit_start'       => $start,
            ]);

            $page = $this->list($doctype, $pageParams);

            \Illuminate\Support\Facades\Log::info('[ERPNext] listAll page', [
                'doctype'       => $doctype,
                'start'         => $start,
                'returned'      => count($page),
                'page_size'     => $pageSize,
                'is_last_page'  => count($page) < $pageSize,
            ]);

            if (empty($page)) {
                break; // No rows at all — nothing to fetch
            }

            $all = array_merge($all, $page);

            // If this page returned fewer than pageSize, we've hit the end
            if (count($page) < $pageSize) {
                break;
            }

            $start += $pageSize;
        }

        return $all;
    }
    /**
     * Return the full name of the currently authenticated user,
     * taken from the login response.
     */
    public function currentUser(): ?string
    {
        return $this->userInfo['full_name']
            ?? $this->userInfo['name']
            ?? null;
    }

    /**
     * Build an authenticated request.
     * Uses `Authorization: token XXX` — change to `Bearer` if your
     * custom ERPNext expects that instead.
     */
    protected function request(): PendingRequest
    {
        if (! $this->token) {
            throw new ErpNextException('Not logged in. Call login() first.');
        }
        $authHeader = "basic {$this->token}";

        return Http::acceptJson()
            ->timeout(120)
            ->withHeaders([
                'Authorization' => $authHeader,
            ]);
    }
    public function getToken(): ?string
    {
        return $this->token;
    }

    public static function fromToken(string $baseUrl, string $token): self
    {
        $client = new self($baseUrl, '', '');
        $client->token = $token;
        return $client;
    }
}
