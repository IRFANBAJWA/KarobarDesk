<?php

namespace App\Services\Pos;

use App\Models\Item;
use App\Models\TillOperation;
use App\Services\AuditLogger;

class SalePayloadNormalizer
{
    public function __construct(
        private readonly CustomerResolver $customerResolver,
        private readonly AccountResolver $accountResolver,
        private readonly AuditLogger $auditLogger
    ) {}

    public function normalize(array $data, TillOperation $till, bool $isReturn = false): array
    {
        $customerId = $this->customerResolver->resolve($data['customer'] ?? null);

        $items = [];
        $subtotal = 0;

        foreach ($data['items'] as $index => $item) {
            $dbItem = Item::where('erpnext_item_code', $item['item_code'])->first();
            if (! $dbItem) {
                abort(422, "Item code {$item['item_code']} not found in KarobarDesk.");
            }

            $qty = (float) $item['qty'];
            $salePrice = (float) ($item['sale_price'] ?? 0);
            $lineTotal = $qty * $salePrice;
            $subtotal += $lineTotal;

            $items[] = [
                'item_id'               => $dbItem->id,
                'line_number'           => $index + 1,
                'item_code'             => $item['item_code'],
                'item_name'             => $item['item_name'] ?? $dbItem->item_name,
                'uom'                   => $item['uom'] ?? $dbItem->uom ?? 'Nos',
                'qty'                   => $qty,
                'unit_price'            => (float) ($item['unit_price'] ?? $salePrice),
                'sale_price'            => $salePrice,
                'cost_price'            => (float) ($item['cost_price'] ?? 0),
                'line_discount'         => (float) ($item['discount'] ?? 0),
                'line_discount_percent' => (float) ($item['discount_percent'] ?? 0),
                'is_b'                  => (bool) ($item['is_b'] ?? false),
                'is_set'                => (bool) ($item['is_set'] ?? false),
                'is_b_reason'           => $item['is_b_reason'] ?? null,
                'discount_reason'       => $item['discount_reason'] ?? null,
                'remarks'               => $item['remarks'] ?? null,
            ];
        }

        $payments = [];
        $totalTendered = 0;

        foreach ($data['payments'] ?? [] as $payment) {
            $accountId = $this->accountResolver->resolve($payment['account'], $till);
            $amount = (float) $payment['paid_amount'];
            $method = strtolower($payment['payment_method'] ?? 'cash');
            $totalTendered += $amount;

            $payments[] = [
                'company_id'       => $till->company_id,
                'account_id'       => $accountId,
                'payment_method'   => $method,
                'payment_amount'   => $amount,
                'reference_number' => $payment['reference_number'] ?? null,
                'card_last_4'      => $payment['card_last_4'] ?? null,
                'card_type'        => $payment['card_type'] ?? null,
                'payment_date'     => now()->toDateString(),
                'payment_time'     => now()->toTimeString(),
            ];
        }

        $discountAmount = (float) ($data['discount_amount'] ?? 0);
        $grandTotal = $subtotal - $discountAmount;

        // ⭐ CASH TENDER & BANK STRICT VALIDATION ⭐
        if ($totalTendered > $grandTotal) {
            $cashIndex = null;
            foreach ($payments as $index => $p) {
                if ($p['payment_method'] === 'cash') {
                    $cashIndex = $index;
                }
            }

            if ($cashIndex !== null) {
                // Apply change logic to cash
                $excess = $totalTendered - $grandTotal;
                $payments[$cashIndex]['payment_amount'] -= $excess;
                $totalPaid = $grandTotal;
            } else {
                abort(422, "Payment amount ({$totalTendered}) exceeds the invoice total ({$grandTotal}) for non-cash methods.");
            }
        } else {
            $totalPaid = $totalTendered;
        }

        $status = 'unpaid';
        if ($totalPaid > 0 && $totalPaid >= $grandTotal) {
            $status = 'paid';
        } elseif ($totalPaid > 0 && $totalPaid < $grandTotal) {
            $status = 'partial';
        }

        $payloadHash = hash('sha256', json_encode([
            'client_request_id' => $data['client_request_id'],
            'items'             => $items,
            'payments'          => $payments,
        ]));

        // Log the raw payload
        $this->auditLogger->log(
            action: $isReturn ? 'pos_return_payload' : 'pos_sale_payload',
            module: 'pos',
            companyId: $till->company_id,
            userId: request()->user()?->id,
            newValues: $data
        );

        return [
            'company_id'        => $till->company_id,
            'till_operation_id' => $till->id,
            'user_id'           => request()->user()->id,
            'customer_id'       => $customerId,
            'client_request_id' => $data['client_request_id'],
            'payload_hash'      => $payloadHash,
            'invoice_number'    => $data['invoice_number'],
            'invoice_type'      => $isReturn ? 'return' : 'sale',
            'status'            => $status,
            'invoice_date'      => $data['invoice_date'] ?? now()->toDateString(),
            'invoice_time'      => $data['invoice_time'] ?? now()->toTimeString(),
            'subtotal'          => $subtotal,
            'discount_amount'   => $discountAmount,
            'grand_total'       => $grandTotal,
            'total_paid'        => $totalPaid,
            'item_count'        => count($items),
            'sync_status'       => 'pending',
            'items'             => $items,
            'payments'          => $payments,
        ];
    }
}
