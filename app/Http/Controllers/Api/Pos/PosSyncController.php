<?php

namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Pos\SyncItemsRequest;
use App\Http\Requests\Api\Pos\SyncStocksRequest;
use App\Services\Pos\PosSyncService;
use Illuminate\Http\JsonResponse;

class PosSyncController extends Controller
{
    public function __construct(private readonly PosSyncService $sync) {}

    public function items(SyncItemsRequest $request): JsonResponse
    {
        $user = $request->user();
        $this->sync->assertCompanyMatches($user, $request->input('company'));

        return response()->json([
            'message' => $this->sync->itemsForUser($user),
        ]);
    }

    public function stocks(SyncStocksRequest $request): JsonResponse
    {
        $user = $request->user();
        $this->sync->assertCompanyMatches($user, $request->input('company'));

        return response()->json([
            'message' => $this->sync->stocksForUser($user),
        ]);
    }
}
