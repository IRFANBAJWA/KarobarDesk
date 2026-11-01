<?php

namespace App\Console\Commands;

use App\Models\SalesInvoice;
use App\Models\JournalEntry;
use App\Jobs\SyncSalesInvoiceToErpNextJob;
use App\Jobs\SyncJournalEntryToErpNextJob; // ⭐ Import the new Job
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class RetryFailedErpNextInvoices extends Command
{
    protected $signature = 'erp:retry-failed';
    protected $description = 'Finds permanently failed ERPNext records and pushes them back to the queue';

    public function handle()
    {
        $this->retryInvoices();
        $this->retryJournalEntries(); // ⭐ Add Journal Entries to the safety net
    }

    private function retryInvoices()
    {
        $failedInvoices = SalesInvoice::where('sync_status', 'failed')
            ->where('updated_at', '>=', now()->subHours(24))
            ->get();

        if ($failedInvoices->isEmpty()) {
            $this->info('No failed invoices found to retry.');
            return;
        }

        foreach ($failedInvoices as $invoice) {
            $invoice->update(['sync_status' => 'pending', 'sync_error' => null]);
            SyncSalesInvoiceToErpNextJob::dispatch($invoice);
            $this->info("Pushed Invoice {$invoice->invoice_number} back to queue.");
            Log::info("Safety Net: Pushed failed Invoice {$invoice->invoice_number} back to queue.");
        }
    }

    private function retryJournalEntries()
    {
        $failedJVs = JournalEntry::where('sync_status', 'failed')
            ->where('updated_at', '>=', now()->subHours(24))
            ->get();

        if ($failedJVs->isEmpty()) {
            $this->info('No failed Journal Entries found to retry.');
            return;
        }

        foreach ($failedJVs as $jv) {
            $jv->update(['sync_status' => 'pending', 'sync_error' => null]);
            SyncJournalEntryToErpNextJob::dispatch($jv);
            $this->info("Pushed Journal Entry {$jv->entry_number} back to queue.");
            Log::info("Safety Net: Pushed failed Journal Entry {$jv->entry_number} back to queue.");
        }
    }
}
