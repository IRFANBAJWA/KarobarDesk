<?php

namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Pos\UpdateRejectedSaleRequest;
use App\Models\ItemStock;
use App\Models\RejectedSale;
use App\Models\SalesInvoice;
use App\Models\StockLedger;
use App\Models\TillOperation;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PosRejectedSalesController extends Controller
{
    /**
     * PUT /api/pos/rejected-sales/{id}
     *
     * Cashier's fix-and-retry. Loads the rejected sale, validates the corrected
     * payload against current stock, creates the real invoice in one atomic
     * transaction, updates the rejected_sales row to 'approved'.
     *
     * Same rejected_sales row is updated — no new row created.
     * No new client_request_id — reuses the original one.
     */
    public function update(UpdateRejectedSaleRequest $request, int $id): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        // ---- Load the rejected sale, must be pending + belong to this user ----
        $rejected = RejectedSale::where('id', $id)
            ->where('company_id', $data['company_id'])
            ->where('user_id', $user->id)
            ->first();

        if (! $rejected) {
            return response()->json(['message' => 'Rejected sale not found.'], 404);
        }

        if ($rejected->status !== 'pending') {
            return response()->json([
                'message' => "Rejected sale is already {$rejected->status}.",
            ], 409);
        }

        // ---- client_request_id must match the original rejection ----
        if ($rejected->client_request_id !== $data['client_request_id']) {
            return response()->json([
                'message' => 'client_request_id does not match the original rejected sale.',
            ], 422);
        }

        // ---- Till ownership ----
        $till = TillOperation::where('id', $data['till_operation_id'])
            ->where('company_id', $data['company_id'])
            ->first();

        if (! $till) {
            return response()->json(['message' => 'Till operation does not belong to the selected company.'], 422);
        }

        if ((int) $till->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Till operation does not belong to the authenticated user.'], 403);
        }

        // ---- Atomic stock check on CORRECTED items + invoice creation ----
        try {
            $invoice = DB::transaction(function () use ($data, $rejected, $till, $user) {
                $ledgerRows = [];

                $itemIds = collect($data['items'])
                    ->pluck('item_id')
                    ->map(fn($id) => (int) $id)
                    ->unique()
                    ->sort()
                    ->values()
                    ->all();

                $stocks = ItemStock::where('company_id', $data['company_id'])
                    ->where('warehouse', $till->warehouse)
                    ->whereIn('item_id', $itemIds)
                    ->orderBy('item_id')
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('item_id');

                $requested = [];
                foreach ($data['items'] as $line) {
                    $iid = (int) $line['item_id'];
                    $requested[$iid] = ($requested[$iid] ?? 0) + (float) $line['qty'];
                }

                foreach ($requested as $itemId => $qty) {
                    /** @var ItemStock|null $stock */
                    $stock = $stocks->get($itemId);

                    if (! $stock) {
                        throw new \RuntimeException(
                            "No stock row found for item_id {$itemId} in warehouse {$till->warehouse}."
                        );
                    }

                    if ((float) $stock->qty - $qty < 0) {
                        throw new \RuntimeException(
                            "Insufficient stock for item_id {$itemId}. Available: {$stock->qty}, requested: {$qty}."
                        );
                    }

                    $newQty = (float) $stock->qty - $qty;
                    $stock->qty = $newQty;
                    $stock->save();

                    $ledgerRows[] = [
                        'item_id'       => $itemId,
                        'qty'           => -$qty,
                        'balance_after' => $newQty,
                    ];
                }

                // ---- Create the REAL invoice from the CORRECTED payload ----
                $invoice = SalesInvoice::create([
                    'company_id'              => $data['company_id'],
                    'till_operation_id'       => $data['till_operation_id'],
                    'user_id'                 => $user->id,
                    'customer_id'             => $data['customer_id'] ?? null,
                    'client_request_id'       => $data['client_request_id'],
                    'payload_hash'            => $this->payloadHash($data),
                    'invoice_number'          => $data['invoice_number'],
                    'invoice_type'            => 'sale',
                    'status'                  => 'unpaid',
                    'invoice_date'            => $data['invoice_date'],
                    'invoice_time'            => $data['invoice_time'],
                    'working_date'            => $data['working_date'] ?? $data['invoice_date'],
                    'due_date'                => $data['due_date'] ?? null,
                    'subtotal'                => $data['subtotal'],
                    'discount_amount'         => $data['discount_amount'] ?? 0,
                    'discount_percentage'     => $data['discount_percentage'] ?? null,
                    'discount_reason'         => $data['discount_reason'] ?? null,
                    'tax_amount'              => $data['tax_amount'] ?? 0,
                    'shipping_amount'         => $data['shipping_amount'] ?? 0,
                    'rounding_adjustment'     => $data['rounding_adjustment'] ?? 0,
                    'grand_total'             => $data['grand_total'],
                    'total_paid'              => $data['total_paid'] ?? 0,
                    'item_count'              => count($data['items']),
                    'source_rejected_sale_id' => $rejected->id,
                    'sync_status'             => 'pending',
                ]);

                foreach ($data['items'] as $line) {
                    $invoice->items()->create([
                        'item_id'               => $line['item_id'],
                        'line_number'           => $line['line_number'],
                        'item_code'             => $line['item_code'],
                        'item_name'             => $line['item_name'],
                        'uom'                   => $line['uom'] ?? 'Nos',
                        'qty'                   => $line['qty'],
                        'free_qty'              => $line['free_qty'] ?? 0,
                        'return_qty'            => $line['return_qty'] ?? 0,
                        'unit_price'            => $line['unit_price'],
                        'sale_price'            => $line['sale_price'],
                        'cost_price'            => $line['cost_price'] ?? null,
                        'line_discount'         => $line['line_discount'] ?? 0,
                        'line_discount_percent' => $line['line_discount_percent'] ?? 0,
                        'tax_rate'              => $line['tax_rate'] ?? 0,
                        'is_returned'           => $line['is_returned'] ?? false,
                        'is_b'                  => $line['is_b'] ?? false,
                        'is_set'                => $line['is_set'] ?? false,
                        'is_b_reason'           => $line['is_b_reason'] ?? null,
                        'return_reason'         => $line['return_reason'] ?? null,
                        'discount_reason'       => $line['discount_reason'] ?? null,
                        'remarks'               => $line['remarks'] ?? null,
                    ]);
                }

                foreach ($data['payments'] as $payment) {
                    $invoice->payments()->create([
                        'company_id'       => $data['company_id'],
                        'account_id'       => $payment['account_id'],
                        'erpnext_account'  => $payment['erpnext_account'] ?? null,
                        'payment_method'   => $payment['payment_method'],
                        'payment_amount'   => $payment['payment_amount'],
                        'reference_number' => $payment['reference_number'] ?? null,
                        'card_last_4'      => $payment['card_last_4'] ?? null,
                        'card_type'        => $payment['card_type'] ?? null,
                        'payment_date'     => $payment['payment_date'],
                        'payment_time'     => $payment['payment_time'],
                        'received_by'      => $user->id,
                    ]);
                }

                foreach ($ledgerRows as $row) {
                    StockLedger::create([
                        'company_id'     => $data['company_id'],
                        'warehouse'      => $till->warehouse,
                        'item_id'        => $row['item_id'],
                        'qty'            => $row['qty'],
                        'balance_after'  => $row['balance_after'],
                        'reference_type' => 'sale',
                        'reference_id'   => $invoice->id,
                        'created_by'     => $user->id,
                    ]);
                }

                // ---- Update the rejected row in-place ----
                $rejected->status           = 'approved';
                $rejected->sales_invoice_id = $invoice->id;
                $rejected->resolved_by      = $user->id;
                $rejected->resolved_at      = now();
                $rejected->resolution_notes = 'Resolved by cashier via POS fix-and-retry.';
                $rejected->payload_snapshot = json_encode($data, JSON_UNESCAPED_UNICODE);
                $rejected->sync_status      = 'pending';
                $rejected->save();

                return $invoice;
            }, 3);
        } catch (\RuntimeException $e) {
            // Corrected payload still insufficient — keep the rejected row pending.
            return response()->json([
                'message'           => $e->getMessage(),
                'rejected'          => true,
                'rejected_sale_id'  => $rejected->id,
                'client_request_id' => $data['client_request_id'],
            ], 422);
        } catch (\Throwable $e) {
            report($e);
            return response()->json([
                'message' => 'Unable to resolve rejected sale. Please retry or contact support.',
            ], 500);
        }

        return response()->json([
            'message' => 'Sale fixed and processed.',
            'data'    => $invoice->load('items', 'payments'),
        ], 201);
    }

    private function payloadHash(array $data): string
    {
        $slice = [
            'company_id'        => $data['company_id'],
            'till_operation_id' => $data['till_operation_id'],
            'customer_id'       => $data['customer_id'] ?? null,
            'invoice_number'    => $data['invoice_number'],
            'grand_total'       => (string) $data['grand_total'],
            'subtotal'          => (string) $data['subtotal'],
            'items' => collect($data['items'])
                ->map(fn($l) => [
                    'item_id'    => $l['item_id'],
                    'qty'        => (string) $l['qty'],
                    'sale_price' => (string) $l['sale_price'],
                ])
                ->sortBy('item_id')
                ->values()
                ->all(),
            'payments' => collect($data['payments'])
                ->map(fn($p) => [
                    'account_id'     => $p['account_id'],
                    'payment_amount' => (string) $p['payment_amount'],
                    'payment_method' => $p['payment_method'],
                ])
                ->sortBy('account_id')
                ->values()
                ->all(),
        ];

        return hash('sha256', json_encode($slice, JSON_UNESCAPED_UNICODE));
    }
}
