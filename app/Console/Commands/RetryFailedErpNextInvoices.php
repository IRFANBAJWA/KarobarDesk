<?php

namespace App\Console\Commands;

use App\Models\SalesInvoice;
use App\Jobs\SyncSalesInvoiceToErpNextJob;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class RetryFailedErpNextInvoices extends Command
{
    // This is the command you will run in the terminal
    protected $signature = 'erp:retry-failed';

    protected $description = 'Finds permanently failed ERPNext invoices and pushes them back to the queue';

    public function handle()
    {
        // Find invoices that failed in the last 24 hours (so we don't retry ancient ones forever)
        $failedInvoices = SalesInvoice::where('sync_status', 'failed')
            ->where('updated_at', '>=', now()->subHours(24))
            ->get();

        if ($failedInvoices->isEmpty()) {
            $this->info('No failed invoices found to retry.');
            return;
        }

        foreach ($failedInvoices as $invoice) {
            // 1. Reset status to pending so the Job's first check passes
            $invoice->update([
                'sync_status' => 'pending',
                'sync_error' => null,
            ]);

            // 2. Push back to the queue
            SyncSalesInvoiceToErpNextJob::dispatch($invoice);

            $this->info("Pushed Invoice {$invoice->invoice_number} back to queue.");
            Log::info("Safety Net: Pushed failed Invoice {$invoice->invoice_number} back to queue.");
        }
    }
}
