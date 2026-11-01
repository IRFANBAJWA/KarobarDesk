<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JournalEntry;
use App\Models\JournalEntryAccount;
use App\Models\Account;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JournalEntryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = JournalEntry::with(['user:id,name', 'company:id,name']);

        // Role Security
        if (!$user->isSuperAdmin()) {
            if ($user->hasRole('admin') || $user->hasRole('manager')) {
                $allowedCompanyIds = $user->companyAccess()->pluck('companies.id')->toArray();
                $query->whereIn('company_id', $allowedCompanyIds);
            } else {
                $query->where('user_id', $user->id)->where('company_id', $user->company_id);
            }
        }

        // Date Filter
        if ($request->query('date')) {
            $query->whereDate('posting_date', $request->query('date'));
        }
        if ($request->query('company_id')) {
            $query->where('company_id', $request->query('company_id'));
        }
        // Search Filter (Wrapped in a closure for security)
        if ($request->query('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('entry_number', 'like', "%{$search}%");
            });
        }

        $paginator = $query->orderByDesc('posting_date')->paginate(50);

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'total'        => $paginator->total(),
            ]
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $journalEntry = JournalEntry::with(['user:id,name', 'company:id,name', 'accounts.account'])
            ->findOrFail($id);

        return response()->json(['data' => $journalEntry]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_id' => 'required|exists:companies,id',
            'posting_date' => 'required|date',
            'title' => 'required|string|max:255',
            'user_remark' => 'nullable|string',
            'accounts' => 'required|array|min:2',
            'accounts.*.account_id' => 'required|exists:accounts,id',
            'accounts.*.debit' => 'required|numeric|min:0',
            'accounts.*.credit' => 'required|numeric|min:0',
        ]);

        // Validate Debit == Credit
        $totalDebit = collect($validated['accounts'])->sum('debit');
        $totalCredit = collect($validated['accounts'])->sum('credit');

        if (round($totalDebit, 2) !== round($totalCredit, 2)) {
            return response()->json([
                'message' => 'Total Debit must equal Total Credit.',
                'errors' => ['accounts' => ['The debits and credits do not balance.']]
            ], 422);
        }

        return DB::transaction(function () use ($validated, $request, $totalDebit, $totalCredit) {
            $user = $request->user();

            // Generate unique entry number
            $count = JournalEntry::whereDate('created_at', now())->count() + 1;
            $entryNumber = 'JV-' . now()->format('Ymd') . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);

            // 1. Create Header
            $journalEntry = JournalEntry::create([
                'company_id' => $validated['company_id'],
                'user_id' => $user->id,
                'entry_number' => $entryNumber,
                'posting_date' => $validated['posting_date'],
                'voucher_type' => 'Journal Entry',
                'title' => $validated['title'],
                'user_remark' => $validated['user_remark'] ?? null,
                'total_debit' => $totalDebit,
                'total_credit' => $totalCredit,
                'sync_status' => 'pending',
            ]);

            // 2. Create Account Lines
            foreach ($validated['accounts'] as $line) {
                $account = Account::findOrFail($line['account_id']);

                // Only save lines that actually have an amount
                if ($line['debit'] > 0 || $line['credit'] > 0) {
                    JournalEntryAccount::create([
                        'journal_entry_id' => $journalEntry->id,
                        'account_id' => $account->id,
                        'erpnext_account' => $account->erpnext_account ?? $account->name,
                        'account_name' => $account->name,
                        'debit' => $line['debit'],
                        'credit' => $line['credit'],
                    ]);
                }
            }
            \App\Jobs\SyncJournalEntryToErpNextJob::dispatch($journalEntry);

            return response()->json([
                'message' => 'Journal Entry created successfully.',
                'data' => $journalEntry
            ], 201);
        });
    }
}
