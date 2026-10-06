<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RunSyncStepRequest;
use App\Http\Requests\TestErpNextRequest;
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

class SyncController extends Controller
{
    /** GET /api/sync/status — row counts per syncable table. */
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

    /** POST /api/sync/test — verify ERPNext credentials. */
    public function test(TestErpNextRequest $request): JsonResponse
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

            $client->login();
            $user = $client->currentUser();

            return response()->json([
                'ok'   => true,
                'user' => $user,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'ok'    => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /** POST /api/sync/{step} — run a single sync step. */
    public function run(RunSyncStepRequest $request, string $step): JsonResponse
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

        $baseUrl = config('services.erpnext.base_url');

        if (! $baseUrl) {
            return response()->json([
                'step'   => $step,
                'status' => 'failed',
                'error'  => 'ERPNEXT_BASE_URL is not set in .env',
            ], 422);
        }

        try {
            $client = new ErpNextClient(
                $baseUrl,
                $request->string('erpnext_userusername'),
                $request->string('erpnext_password'),
            );

            $client->login();

            $result = (new ErpNextSyncService($client))->run($step);

            // Log to sync_logs (Section 32)
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

    /** GET /api/sync/activity — last 20 sync log rows. */
    public function activity(): JsonResponse
    {
        $rows = SyncLog::query()
            ->orderByDesc('id')
            ->limit(20)
            ->get(['id', 'doctype', 'status', 'error', 'created_at']);

        return response()->json(['activity' => $rows]);
    }
}
