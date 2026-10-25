<?php

namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Pos\StorePosSaleRequest;
use App\Models\ItemStock;
use App\Models\RejectedSale;
use App\Models\SalesInvoice;
use App\Models\StockLedger;
use App\Models\TillOperation;
use App\Services\Pos\SalePayloadNormalizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PosSalesController extends Controller
{
    public function __construct(
        private readonly SalePayloadNormalizer $normalizer
    ) {}

    public function store(StorePosSaleRequest $request): JsonResponse
    {
        return $this->processSale($request, persistOnStockFailure: false);
    }

    public function sync(StorePosSaleRequest $request): JsonResponse
    {
        return $this->processSale($request, persistOnStockFailure: true);
    }

    private function processSale(StorePosSaleRequest $request, bool $persistOnStockFailure): JsonResponse
    {
        $user = $request->user();

        $till = TillOperation::where('company_id', $user->company_id)->first();

        if (! $till) {
            return response()->json(['message' => 'No till assigned to your company.'], 403);
        }

        try {
            $normalizedData = $this->normalizer->normalize($request->validated(), $till);

            $existing = SalesInvoice::where('company_id', $normalizedData['company_id'])
                ->where('client_request_id', $normalizedData['client_request_id'])
                ->first();

            if ($existing) {
                if ($existing->payload_hash !== $normalizedData['payload_hash']) {
                    return response()->json([
                        'message' => 'A sale with this client_request_id already exists with a different payload.'
                    ], 409);
                }

                return response()->json(['message' => 'Sale already processed.', 'data' => $existing->load('items', 'payments')], 200);
            }

            $invoice = DB::transaction(function () use ($normalizedData, $till, $user) {
                $itemIds = collect($normalizedData['items'])->pluck('item_id')->sort()->values()->all();

                // 1. Lock and check stock
                $stocks = ItemStock::where('company_id', $till->company_id)
                    ->where('warehouse', $till->warehouse)
                    ->whereIn('item_id', $itemIds)
                    ->orderBy('item_id')->lockForUpdate()->get()->keyBy('item_id');

                $requested = [];
                foreach ($normalizedData['items'] as $line) {
                    $requested[$line['item_id']] = ($requested[$line['item_id']] ?? 0) + (float) $line['qty'];
                }

                foreach ($requested as $itemId => $qty) {
                    $stock = $stocks->get($itemId);
                    if (! $stock || ((float) $stock->qty - $qty) < 0) {
                        throw new \RuntimeException("Insufficient stock for item ID {$itemId}.");
                    }
                    $stock->qty = (float) $stock->qty - $qty;
                    $stock->save();
                }

                // 2. Save Invoice
                $invoice = SalesInvoice::create(\Illuminate\Support\Arr::except($normalizedData, ['items', 'payments']));

                // 3. Save Items & Payments
                foreach ($normalizedData['items'] as $line) {
                    $invoice->items()->create($line);
                }
                foreach ($normalizedData['payments'] as $payment) {
                    $invoice->payments()->create($payment);
                }

                // 4. Save Stock Ledgers (Sale = negative qty)
                foreach ($normalizedData['items'] as $line) {
                    $latestStock = ItemStock::where('company_id', $till->company_id)
                        ->where('warehouse', $till->warehouse)
                        ->where('item_id', $line['item_id'])
                        ->first();

                    StockLedger::create([
                        'company_id'     => $till->company_id,
                        'warehouse'      => $till->warehouse,
                        'item_id'        => $line['item_id'],
                        'qty'            => -abs($line['qty']),
                        'balance_after'  => $latestStock->qty,
                        'reference_type' => 'sale',
                        'reference_id'   => $invoice->id,
                        'created_by'     => $user->id,
                    ]);
                }

                return $invoice;
            }, 3);

            return response()->json(['message' => 'Sale processed.', 'data' => $invoice->load('items', 'payments')], 201);
        } catch (\RuntimeException $e) {
            if ($persistOnStockFailure) {
                $rejected = RejectedSale::create([
                    'company_id'        => $till->company_id,
                    'till_operation_id' => $till->id,
                    'user_id'           => $user->id,
                    'client_request_id' => $request->input('client_request_id'),
                    'invoice_number'    => $request->input('invoice_number'),
                    'status'            => 'pending',
                    'rejection_reason'  => $e->getMessage(),
                    'payload_snapshot'  => json_encode($request->validated()),
                    'sync_status'       => 'pending',
                ]);
                return response()->json([
                    'message' => $e->getMessage(),
                    'rejected' => true,
                    'rejected_sale_id' => $rejected->id
                ], 422);
            }
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Server Error: ' . $e->getMessage()], 500);
        }
    }
}
