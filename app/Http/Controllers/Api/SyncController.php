<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ErpNextLoginRequest;
use App\Models\Account;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Item;
use App\Models\ItemPrice;
use App\Models\PriceList;
use App\Models\SyncLog;
use App\Services\ErpNext\ErpNextClient;
use App\Services\ErpNext\ErpNextSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SyncController extends Controller
{
    /** GET /api/sync/status */
    public function status(): JsonResponse
    {
        return response()->json([
            'steps' => [
                ['step' => 'companies',   'count' => Company::count()],
                ['step' => 'accounts',    'count' => Account::count()],
                ['step' => 'price_lists', 'count' => PriceList::count()],
                ['step' => 'items',       'count' => Item::count()],
                ['step' => 'item_prices', 'count' => ItemPrice::count()],
                ['step' => 'customers',   'count' => Customer::count()],
            ],
        ]);
    }

    /**
     * POST /api/sync/login
     * Login only. Returns the token to the frontend.
     * Laravel does NOT store the token.
     */
    public function login(ErpNextLoginRequest $request): JsonResponse
    {
        $baseUrl = config('services.erpnext.base_url');

        if (! $baseUrl) {
            return response()->json([
                'ok'    => false,
                'error' => 'ERPNEXT_BASE_URL is not set in .env',
            ], 422);
        }

        try {
            $client = new ErpNextClient(
                $baseUrl,
                $request->string('username'),
                $request->string('password'),
            );

            $token = $client->login();
            $user  = $client->currentUser();

            return response()->json([
                'ok'             => true,
                'user'           => $user,
                'token'  => $token,   // ← frontend holds this
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'ok'    => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * POST /api/sync/{step}
     * Expects header: X-ERPNext-Token: <token>
     * No body. Uses the token to call ERPNext.
     */
    public function run(Request $request, string $step): JsonResponse
    {
        $validSteps = [
            'companies',
            'accounts',
            'price_lists',
            'items',
            'item_prices',
            'customers',
        ];

        if (! in_array($step, $validSteps, true)) {
            return response()->json(['error' => "Unknown step: {$step}"], 404);
        }

        $token = $request->header('X-ERPNext-Token');

        if (! $token) {
            return response()->json([
                'step'   => $step,
                'status' => 'failed',
                'error'  => 'No ERPNext token provided. Test connection first.',
            ], 422);
        }

        $baseUrl = config('services.erpnext.base_url');

        if (! $baseUrl) {
            return response()->json([
                'step'   => $step,
                'status' => 'failed',
                'error'  => 'ERPNEXT_BASE_URL is not set in .env',
            ], 422);
        }

        try {
            $client = ErpNextClient::fromToken($baseUrl, $token);

            $result = (new ErpNextSyncService($client))->run($step);

            SyncLog::create([
                'company_id'      => null,
                'source'          => 'erpnext',
                'doctype'         => $step,
                'document_name'   => null,
                'operation'       => 'sync',
                'direction'       => 'in',
                'status'          => $result['status'],
                'error'           => $result['error'] ?? null,
                'retry_count'     => 0,
                'last_attempt_at' => now(),
                'completed_at'    => now(),
            ]);

            return response()->json($result);
        } catch (\Throwable $e) {
            return response()->json([
                'step'   => $step,
                'status' => 'failed',
                'error'  => $e->getMessage(),
            ], 422);
        }
    }

    /** GET /api/sync/activity */
    public function activity(): JsonResponse
    {
        $rows = SyncLog::query()
            ->orderByDesc('id')
            ->limit(20)
            ->get(['id', 'doctype', 'status', 'error', 'created_at']);

        return response()->json(['activity' => $rows]);
    }
}
