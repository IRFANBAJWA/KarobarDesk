<?php

namespace App\Jobs;

use App\Models\JournalEntry;
use App\Services\ErpNext\ErpNextClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class SyncJournalEntryToErpNextJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 60;

    public function backoff(): array
    {
        return [10, 30];
    }

    public function __construct(public JournalEntry $journalEntry)
    {
        $this->onQueue('erp-company-' . $this->journalEntry->company_id);
    }

    public function handle(): void
    {
        $this->journalEntry->refresh();
        if ($this->journalEntry->sync_status !== 'pending') return;

        $user = $this->journalEntry->user;
        if (! $user || ! $user->erpnext_token) {
            $this->markFailed('User missing ERPNext token.');
            return;
        }

        $erpUrl = config('services.erpnext.base_url', env('ERPNEXT_BASE_URL', ''));
        $client = ErpNextClient::fromToken($erpUrl, $user->erpnext_token);

        try {
            $payload = [
                'doctype' => 'Journal Entry',
                'company' => $this->journalEntry->company->erpnext_company,
                'posting_date' => $this->journalEntry->posting_date,
                'voucher_type' => 'Journal Entry',
                'title' => $this->journalEntry->title,
                'user_remark' => $this->journalEntry->user_remark,
                'accounts' => $this->journalEntry->accounts->map(function ($acc) {
                    return [
                        'account' => $acc->erpnext_account,
                        'debit_in_account_currency' => (float) $acc->debit,
                        'credit_in_account_currency' => (float) $acc->credit,
                    ];
                })->toArray(),
            ];

            // Use the standard ERPNext v15 endpoint
            $response = Http::acceptJson()
                ->timeout(15)
                ->withHeaders(['Authorization' => "basic {$client->getToken()}"])
                ->post($erpUrl . '/api/resource/Journal Entry', $payload);

            if (! $response->successful()) {
                throw new \Exception('ERPNext API Error: ' . $response->body());
            }

            $erpnextName = $response->json('data.name');

            $this->journalEntry->update([
                'sync_status' => 'synced',
                'erpnext_jv_reference' => $erpnextName,
                'sync_error' => null,
                'sync_attempts' => $this->journalEntry->sync_attempts + 1,
            ]);

            Log::info("Journal Entry {$this->journalEntry->id} synced to ERPNext: {$erpnextName}");
        } catch (\Throwable $e) {
            Log::error("JVE Sync Failed for ID {$this->journalEntry->id}: " . $e->getMessage());

            $this->journalEntry->update([
                'sync_attempts' => $this->journalEntry->sync_attempts + 1,
                'sync_error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function failed(\Throwable $exception): void
    {
        $this->journalEntry->update([
            'sync_status' => 'failed',
            'sync_error' => 'Final Failure: ' . $exception->getMessage(),
        ]);
    }

    private function markFailed(string $message): void
    {
        $this->journalEntry->update([
            'sync_status' => 'failed',
            'sync_error' => $message,
        ]);
    }
}
