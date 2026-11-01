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
use Illuminate\Support\Facades\Http;

class SyncSalesInvoiceToErpNextJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 60;

    // ⭐ This adds a delay between retries (10s, then 30s) so we don't spam a dead server
    public function backoff(): array
    {
        return [10, 30];
    }

    public function __construct(
        public SalesInvoice $invoice
    ) {
        $this->onQueue('erp-company-' . $this->invoice->company_id);
    }

    public function middleware(): array
    {
        return [
            (new WithoutOverlapping($this->invoice->id))->expireAfter(120)
        ];
    }

    public function handle(): void
    {
        $this->invoice->refresh();

        // Only process if pending
        if ($this->invoice->sync_status !== 'pending') {
            return;
        }

        $user = $this->invoice->user;

        if (! $user || ! $user->erpnext_token || ! $user->erpnext_user) {
            $this->invoice->update([
                'sync_status' => 'failed',
                'sync_error' => 'User does not have ERPNext credentials linked (User/Token missing).',
                'sync_attempts' => $this->invoice->sync_attempts + 1,
            ]);
            return;
        }

        $erpUrl = config('services.erpnext.base_url', env('ERPNEXT_BASE_URL', ''));
        $client = ErpNextClient::fromToken($erpUrl, $user->erpnext_token);

        try {
            $payload = $this->buildErpNextPayload();

            $endpoint = $this->invoice->invoice_type === 'sale'
                ? '/api/method/till_apis.till_apis.apis.sale_invoice.add_sale_invoice'
                : '/api/method/till_apis.till_apis.apis.return.create';

            // Timeout lowered to 15s so it fails faster if server is completely unreachable
            $response = Http::acceptJson()
                ->timeout(15)
                ->withHeaders(['Authorization' => "basic {$client->getToken()}"])
                ->post($erpUrl . $endpoint, $payload);

            if (! $response->successful()) {
                throw new \Exception('ERPNext API Error: ' . $response->body());
            }

            $erpnextName = $response->json('message.data.name')
                ?? $response->json('message.name')
                ?? $response->json('name')
                ?? 'Synced';

            $this->invoice->update([
                'sync_status' => 'synced',
                'erpnext_invoice_reference' => $erpnextName,
                'sync_error' => null,
                'sync_attempts' => $this->invoice->sync_attempts + 1,
            ]);

            Log::info("ERPNext Sync Success for Invoice ID {$this->invoice->id}. Ref: {$erpnextName}");
        } catch (\Throwable $e) {
            $errorMessage = $e->getMessage() ?: 'Unknown Error.';
            Log::error("ERPNext Sync Attempt " . $this->attempts() . " Failed for Invoice ID {$this->invoice->id}: " . $errorMessage);

            // Increment attempts but KEEP status as 'pending' so Laravel can retry it
            $this->invoice->update([
                'sync_attempts' => $this->invoice->sync_attempts + 1,
                'sync_error' => $errorMessage,
            ]);

            // Re-throw to tell Laravel to try again
            throw $e;
        }
    }

    /**
     * ⭐ THIS METHOD RUNS AUTOMATICALLY WHEN ALL 3 TRIES FAIL
     */
    public function failed(\Throwable $exception): void
    {
        // Mark as permanently failed only after all retries are exhausted
        $this->invoice->update([
            'sync_status' => 'failed',
            'sync_error' => 'Final Failure after 3 attempts: ' . $exception->getMessage(),
        ]);

        Log::critical("ERPNext Sync PERMANENTLY FAILED for Invoice {$this->invoice->id}");
    }

    private function buildErpNextPayload(): array
    {
        $invoice = $this->invoice->load(['customer', 'items', 'payments.account', 'company', 'user']);
        $isReturn = $invoice->invoice_type === 'return';

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

        $payments = $invoice->payments->map(function ($payment) {
            return [
                'account' => $payment->account->erpnext_account ?? $payment->account->name,
                'paid_amount' => (float) $payment->payment_amount,
            ];
        })->toArray();

        $orderId = $invoice->company->code . '-' . $invoice->invoice_number . '-' . $invoice->id;

        $returnInvoice = null;
        if ($isReturn && $invoice->original_invoice_id) {
            $original = SalesInvoice::find($invoice->original_invoice_id);
            if ($original) {
                $returnInvoice = $original->company->code . '-' . $original->invoice_number . '-' . $original->id;
            }
        }

        $salesMan = null;
        if (!$isReturn) {
            $salesMan = $invoice->user->erpnext_user ?? $invoice->user->name ?? '';
        }

        $workingDate = $invoice->working_date
            ? \Carbon\Carbon::parse($invoice->working_date)->format('d-m-Y')
            : \Carbon\Carbon::parse($invoice->invoice_date)->format('d-m-Y');

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
            'working_date' => $workingDate,
            'posting_date' => \Carbon\Carbon::parse($invoice->invoice_date)->format('Y-m-d'),
            'posting_time' => $invoice->invoice_time ?? now()->toTimeString(),
        ];
    }
}
