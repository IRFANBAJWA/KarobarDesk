<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use App\Models\SalesInvoice;
use App\Jobs\SyncSalesInvoiceToErpNextJob;

class QueueMonitorController extends Controller
{
    public function stats(): JsonResponse
    {
        // 1. Pending Jobs
        $pendingJobs = DB::table('jobs')
            ->select('id', 'queue', 'attempts', 'created_at')
            ->orderBy('id', 'desc')
            ->limit(50)
            ->get();

        // 2. Failed Jobs
        $failedJobs = DB::table('failed_jobs')
            ->select('id', 'uuid', 'queue', 'exception', 'failed_at')
            ->orderBy('id', 'desc')
            ->limit(50)
            ->get();

        // 3. Stuck Invoices (Invoices marked pending/failed in DB)
        $stuckInvoices = SalesInvoice::whereIn('sync_status', ['pending', 'failed'])
            ->where('created_at', '>=', now()->subDays(7))
            ->select('id', 'invoice_number', 'sync_status', 'sync_error', 'sync_attempts', 'created_at')
            ->orderBy('id', 'desc')
            ->limit(50)
            ->get();

        return response()->json([
            'pending_jobs' => $pendingJobs,
            'failed_jobs' => $failedJobs,
            'stuck_invoices' => $stuckInvoices,
        ]);
    }

    public function retryFailedJob(Request $request, $uuid): JsonResponse
    {
        try {
            Artisan::call('queue:retry', ['id' => $uuid]);
            return response()->json(['message' => 'Job pushed back to queue.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to retry job: ' . $e->getMessage()], 500);
        }
    }

    public function retryInvoice(Request $request, SalesInvoice $invoice): JsonResponse
    {
        if ($invoice->sync_status === 'synced') {
            return response()->json(['message' => 'Invoice is already synced.'], 400);
        }

        $invoice->update([
            'sync_status' => 'pending',
            'sync_error' => null,
        ]);

        SyncSalesInvoiceToErpNextJob::dispatch($invoice);

        return response()->json(['message' => 'Invoice re-queued successfully.']);
    }
}
