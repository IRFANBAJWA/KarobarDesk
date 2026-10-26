<?php

namespace App\Jobs;

use App\Models\SalesInvoice;
use App\Services\ErpNext\ErpNextClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncSalesInvoiceToErpNextJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 60;

    public function __construct(
        public SalesInvoice $invoice
    ) {
        // Isolate queues by company (e.g., erp-company-1)
        $this->onQueue('erp-company-' . $this->invoice->company_id);
    }

    public function middleware(): array
    {
        // Layer 1: Prevent double-firing for the exact same invoice ID
        return [
            (new WithoutOverlapping($this->invoice->id))->expireAfter(120)
        ];
    }

    public function handle(ErpNextClient $client): void
    {
        // Layer 2: Safety Check
        $this->invoice->refresh();
        if ($this->invoice->sync_status !== 'pending') {
            return;
        }

        try {
            $payload = $this->buildErpNextPayload();

            $endpoint = $this->invoice->invoice_type === 'sale'
                ? '/api/method/till_apis.till_apis.apis.sale.create'
                : '/api/method/till_apis.till_apis.apis.return.create';

            $response = $client->post($endpoint, $payload);
            $erpnextName = $response['message']['name'] ?? 'Synced';

            $this->invoice->update([
                'sync_status' => 'synced',
                'erpnext_invoice_reference' => $erpnextName,
                'sync_error' => null,
                'sync_attempts' => $this->invoice->sync_attempts + 1,
            ]);
        } catch (\Throwable $e) {
            Log::error("ERPNext Sync Failed for Invoice ID {$this->invoice->id}: " . $e->getMessage());

            $this->invoice->update([
                'sync_status' => 'failed',
                'sync_error' => $e->getMessage(),
                'sync_attempts' => $this->invoice->sync_attempts + 1,
            ]);

            throw $e;
        }
    }

    private function buildErpNextPayload(): array
    {
        $invoice = $this->invoice->load(['customer', 'items', 'payments.account', 'company', 'user']);
        $isReturn = $invoice->invoice_type === 'return';

        // 1. Customer
        $customerData = null;
        if (!$isReturn && $invoice->customer) {
            $customerData = [[
                'customer_name' => $invoice->customer->customer_name,
                'cutomer_phone' => $invoice->customer->phone ?? '',
                'customer_address' => $invoice->customer->address ?? null,
            ]];
        } elseif (!$isReturn && !$invoice->customer) {
            $customerData = [[
                'customer_name' => 'Walking Customer',
                'cutomer_phone' => '00000000000',
                'customer_address' => null,
            ]];
        }

        // 2. Items (Negative for returns)
        $items = $invoice->items->map(function ($item) use ($isReturn) {
            $qty = (float) $item->qty;
            $rate = (float) $item->sale_price;
            $total = $qty * $rate;

            if ($isReturn) {
                $qty = -abs($qty);
                $total = -abs($total);
            }

            return [
                'item_code' => $item->item_code,
                'qty' => $qty,
                'TotalAmount' => $total,
                'rate' => $rate,
            ];
        })->toArray();

        // 3. Payments
        $payments = $invoice->payments->map(function ($payment) {
            return [
                'account' => $payment->account->erpnext_account ?? $payment->account->name,
                'paid_amount' => (float) $payment->payment_amount,
            ];
        })->toArray();

        // 4. Order ID: CompanyCode - InvoiceNumber - PrimaryKey
        // e.g., AIO-00112510000123-1419430
        $orderId = $invoice->company->code . '-' . $invoice->invoice_number . '-' . $invoice->id;

        // 5. Return Link
        $returnInvoice = null;
        if ($isReturn && $invoice->original_invoice_id) {
            $original = SalesInvoice::find($invoice->original_invoice_id);
            if ($original) {
                $returnInvoice = $original->company->code . '-' . $original->invoice_number . '-' . $original->id;
            }
        }

        // 6. Salesman
        $salesMan = null;
        if (!$isReturn) {
            $salesMan = $invoice->user->erpnext_user ?? $invoice->user->name ?? '';
        }

        return [
            'order_id' => $orderId,
            'is_return' => $isReturn ? 1 : 0,
            'company' => $invoice->company->erpnext_company ?? $invoice->company->name,
            'return_invoice' => $returnInvoice,
            'items' => $items,
            'customer' => $customerData,
            'payments' => $payments,
            'discount_amount' => (float) $invoice->discount_amount,
            'shipping_amount' => 0.0,
            'Sales_man' => $salesMan,
        ];
    }
}
