<?php

namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Pos\StorePosReturnRequest;
use App\Models\ItemStock;
use App\Models\SalesInvoice;
use App\Models\StockLedger;
use App\Models\TillOperation;
use App\Services\Pos\SalePayloadNormalizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Jobs\SyncSalesInvoiceToErpNextJob;

class PosReturnsController extends Controller
{
    public function __construct(
        private readonly SalePayloadNormalizer $normalizer
    ) {}

    public function store(StorePosReturnRequest $request): JsonResponse
    {
        $user = $request->user();

        $till = TillOperation::where('company_id', $user->company_id)->first();

        if (! $till) {
            return response()->json(['message' => 'No till assigned to your company.'], 403);
        }

        $validatedData = $request->validated();
        $originalInvoiceId = null;

        // 1. If original invoice is provided, validate it and inherit customer if needed
        if (!empty($validatedData['original_client_request_id'])) {
            $original = SalesInvoice::where('company_id', $till->company_id)
                ->where('client_request_id', $validatedData['original_client_request_id'])
                ->first();

            if (! $original) {
                return response()->json(['message' => 'Original invoice not found.'], 422);
            }
            $originalInvoiceId = $original->id;

            // Inherit customer if not sent by POS
            if (empty($validatedData['customer']) && $original->customer_id) {
                $customer = \App\Models\Customer::find($original->customer_id);
                if ($customer) {
                    $validatedData['customer'] = [
                        'phone' => $customer->phone,
                        'name'  => $customer->customer_name,
                    ];
                }
            }
        }

        // 2. Normalize the data
        $normalizedData = $this->normalizer->normalize($validatedData, $till, isReturn: true);
        $normalizedData['original_invoice_id'] = $originalInvoiceId;

        try {
            $return = DB::transaction(function () use ($normalizedData, $till, $user) {
                $itemIds = collect($normalizedData['items'])->pluck('item_id')->sort()->values()->all();
                $stocks = ItemStock::where('company_id', $till->company_id)
                    ->where('warehouse', $till->warehouse)
                    ->whereIn('item_id', $itemIds)
                    ->orderBy('item_id')->lockForUpdate()->get()->keyBy('item_id');

                // 3. Add Stock Back
                foreach ($normalizedData['items'] as $line) {
                    $stock = $stocks->get($line['item_id']);
                    if ($stock) {
                        $stock->qty = (float) $stock->qty + (float) $line['qty'];
                        $stock->save();
                    } else {
                        ItemStock::create([
                            'company_id' => $till->company_id,
                            'warehouse'  => $till->warehouse,
                            'item_id'    => $line['item_id'],
                            'qty'        => $line['qty']
                        ]);
                    }
                }

                // 4. Save Return Invoice, Items, Payments
                $return = SalesInvoice::create(\Illuminate\Support\Arr::except($normalizedData, ['items', 'payments']));

                foreach ($normalizedData['items'] as $line) {
                    $return->items()->create($line);
                }
                foreach ($normalizedData['payments'] as $payment) {
                    $return->payments()->create($payment);
                }

                // 5. Save Stock Ledgers (Return = positive qty)
                foreach ($normalizedData['items'] as $line) {
                    $latestStock = ItemStock::where('company_id', $till->company_id)
                        ->where('warehouse', $till->warehouse)
                        ->where('item_id', $line['item_id'])
                        ->first();

                    StockLedger::create([
                        'company_id'     => $till->company_id,
                        'warehouse'      => $till->warehouse,
                        'item_id'        => $line['item_id'],
                        'qty'            => abs($line['qty']),
                        'balance_after'  => $latestStock->qty,
                        'reference_type' => 'return',
                        'reference_id'   => $return->id,
                        'created_by'     => $user->id,
                    ]);
                }

                return $return;
            }, 3);
            // SyncSalesInvoiceToErpNextJob::dispatch($return);

            return response()->json(['message' => 'Return processed.', 'data' => $return->load('items', 'payments')], 201);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Unable to process return.', 'error' => $e->getMessage()], 500);
        }
    }
}
