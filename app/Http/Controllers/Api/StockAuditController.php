<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockAudit;
use App\Models\StockAuditItem;
use App\Models\StockAuditCount;
use App\Models\StockAuditVerification;
use App\Models\Item;
use App\Models\User;
use App\Models\ItemStock;
use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StockAuditController extends Controller
{
    // =====================================================
    // 1. TODAY'S AUDIT (Counting View)
    // =====================================================
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $companyId = $user->company_id;
        if (!$companyId || $user->hasRole('admin') || $user->isSuperAdmin()) {
            $companyId = $request->query('company_id') ?: $user->companies()->first()?->id;
        }

        if (!$companyId) {
            return response()->json(['message' => 'No company selected.'], 422);
        }

        $today = Carbon::now('Asia/Karachi')->toDateString();

        $audit = StockAudit::firstOrCreate(
            ['company_id' => $companyId, 'audit_date' => $today],
            ['status' => 'counting', 'started_by' => $user->id]
        );

        $items = Item::where('is_active', true)
            ->where(function ($q) use ($companyId, $audit) {
                $q->whereHas('itemStocks', fn($sq) => $sq->where('company_id', $companyId)->where('qty', '>', 0))
                    ->orWhereHas('stockAuditItems', fn($sq) => $sq->where('stock_audit_id', $audit->id));
            })
            ->leftJoin('item_stocks', function ($join) use ($companyId) {
                $join->on('items.id', '=', 'item_stocks.item_id')
                    ->where('item_stocks.company_id', '=', $companyId);
            })
            ->select('items.id', 'items.item_name', 'items.erpnext_item_code', 'item_stocks.qty as system_qty')
            ->get()
            ->map(fn($item) => (object) array_merge((array) $item, ['system_qty' => (float) ($item->system_qty ?? 0)]));

        $salespersons = User::where('company_id', $companyId)
            ->whereHas('roles', fn($q) => $q->whereIn('name', ['cashier', 'sales_person', 'manager']))
            ->get(['id', 'name']);

        $counts = StockAuditCount::whereHas('stockAuditItem', fn($q) => $q->where('stock_audit_id', $audit->id))
            ->with(['user:id,name', 'creator:id,name', 'stockAuditItem:id,item_id,stock_audit_id,system_qty,difference,discrepancy_reason,decision', 'stockAuditItem.item:id,item_name'])
            ->get();

        return response()->json([
            'audit' => $audit,
            'items' => $items,
            'counts' => $counts,
            'salespersons' => $salespersons,
            'today' => $today
        ]);
    }

    // =====================================================
    // 1. AUDIT HISTORY LIST (with Summary + Item Filter)
    // =====================================================
    public function list(Request $request): JsonResponse
    {
        $user = $request->user();

        $companyIds = [];
        if ($user->isSuperAdmin()) {
            $requested = $request->query('company_id');
            $companyIds = ($requested && $requested !== 'all') ? [$requested] : Company::where('is_active', true)->pluck('id')->toArray();
        } elseif ($user->hasRole('admin') || $user->hasRole('manager')) {
            $assigned = $user->companies()->pluck('companies.id')->toArray();
            $companyIds = !empty($assigned) ? $assigned : [$user->company_id];
        } else {
            $companyIds = [$user->company_id];
        }

        $query = StockAudit::with(['company:id,name', 'finalizedBy:id,name'])
            ->whereIn('company_id', $companyIds)
            ->orderByDesc('audit_date')
            ->orderByDesc('id');

        // Salesperson Scope
        if ($user->hasRole('cashier') || $user->hasRole('sales_person')) {
            $query->whereHas('items.counts', fn($q) => $q->where('user_id', $user->id));
        }

        // ⭐ Item Filter (if manager wants to see audits for a specific item)
        if ($request->filled('item_id')) {
            $query->whereHas('items', fn($q) => $q->where('item_id', $request->item_id));
        }

        // Date Filters
        if ($request->filled('date_from')) $query->whereDate('audit_date', '>=', $request->date_from);
        if ($request->filled('date_to'))   $query->whereDate('audit_date', '<=', $request->date_to);
        if ($request->filled('company_id') && $request->company_id !== 'all') $query->where('company_id', $request->company_id);

        $audits = $query->paginate(20)->through(function ($audit) {
            // Load items for this audit to calculate totals
            $items = $audit->items()->get();

            $totalItems = $items->count();
            $totalStockAudited = $items->sum('total_counted_qty');
            $totalDiscrepancies = $items->where('difference', '!=', 0)->count();

            return [
                'id' => $audit->id,
                'audit_date' => $audit->audit_date,
                'status' => $audit->status,
                'company_name' => $audit->company?->name ?? 'Unknown',
                'finalized_by' => $audit->finalizedBy?->name,
                'finalized_at' => $audit->finalized_at?->toIso8601String(),
                'total_items' => $totalItems,                // ⭐ New
                'total_stock_audited' => (float) $totalStockAudited, // ⭐ New
                'total_discrepancies' => $totalDiscrepancies,
            ];
        });

        return response()->json([
            'data' => $audits->items(),
            'meta' => [
                'current_page' => $audits->currentPage(),
                'last_page' => $audits->lastPage(),
                'total' => $audits->total(),
                'per_page' => $audits->perPage(),
            ],
        ]);
    }

    // =====================================================
    // 2. ITEM HISTORY (Chronological stock ledger movements)
    // =====================================================
    public function itemHistory(Request $request): JsonResponse
    {
        $user = $request->user();
        $companyId = $user->company_id;

        if (!$companyId || $user->hasRole('admin') || $user->isSuperAdmin()) {
            $companyId = $request->query('company_id') ?: $user->companies()->first()?->id;
        }

        $request->validate([
            'item_id' => 'required|exists:items,id',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
        ]);

        $query = \App\Models\StockLedger::with('item:id,item_name,erpnext_item_code')
            ->where('company_id', $companyId)
            ->where('item_id', $request->item_id)
            ->orderByDesc('created_at');

        if ($request->filled('date_from')) $query->whereDate('created_at', '>=', $request->date_from);
        if ($request->filled('date_to'))   $query->whereDate('created_at', '<=', $request->date_to);

        $flows = $query->get()->map(fn($f) => [
            'id' => $f->id,
            'item_name' => $f->item?->item_name,
            'qty' => (float) $f->qty,
            'balance_after' => (float) $f->balance_after,
            'reference_type' => $f->reference_type,
            'reference_id' => $f->reference_id,
            'created_at' => $f->created_at?->toIso8601String(),
        ]);

        return response()->json(['data' => $flows]);
    }

    // =====================================================
    // 3. AUDIT DETAIL (Item-wise)
    // =====================================================
    public function show(StockAudit $audit): JsonResponse
    {
        $audit->load([
            'items.item:id,item_name,erpnext_item_code',
            'items.counts.user:id,name',
            'items.counts.creator:id,name',
            'company:id,name',
            'finalizedBy:id,name',
        ]);

        return response()->json(['data' => $audit]);
    }

    // =====================================================
    // 4. SAVE BATCH COUNTS
    // =====================================================
    public function saveBatchCounts(Request $request): JsonResponse
    {
        $user = $request->user();

        $companyId = $user->company_id;
        if (!$companyId || $user->hasRole('admin') || $user->isSuperAdmin()) {
            $companyId = $request->input('company_id') ?: $user->companies()->first()?->id;
        }

        if (!$companyId) return response()->json(['message' => 'Company ID required.'], 422);

        $request->validate([
            'counts' => 'required|array',
            'counts.*.item_id' => 'required|exists:items,id',
            'counts.*.physical_qty' => 'required|numeric|min:0',
            'counts.*.role_area' => 'required|in:shop,online',
            'target_user_id' => 'nullable|exists:users,id',
        ]);

        $targetUserId = $request->input('target_user_id', $user->id);
        $createdBy = ($targetUserId != $user->id) ? $user->id : null;
        $today = Carbon::now('Asia/Karachi')->toDateString();

        $audit = StockAudit::firstOrCreate(
            ['company_id' => $companyId, 'audit_date' => $today],
            ['status' => 'counting', 'started_by' => $user->id]
        );

        if ($audit->status === 'finalized') {
            return response()->json(['message' => 'Audit finalized. Cannot edit.'], 403);
        }

        DB::transaction(function () use ($audit, $request, $targetUserId, $createdBy) {
            foreach ($request->counts as $count) {
                $auditItem = StockAuditItem::firstOrCreate([
                    'stock_audit_id' => $audit->id,
                    'item_id' => $count['item_id'],
                ]);

                StockAuditCount::updateOrCreate(
                    ['stock_audit_item_id' => $auditItem->id, 'user_id' => $targetUserId],
                    ['created_by' => $createdBy, 'role_area' => $count['role_area'], 'physical_qty' => $count['physical_qty'], 'entered_at' => now()]
                );
            }
        });

        return response()->json(['message' => 'Counts saved successfully.']);
    }

    // =====================================================
    // 5. VERIFY
    // =====================================================
    public function verify(Request $request, StockAudit $audit): JsonResponse
    {
        $request->validate(['notes' => 'nullable|string']);

        StockAuditVerification::create([
            'stock_audit_id' => $audit->id,
            'verified_by' => $request->user()->id,
            'verification_status' => 'verified',
            'verification_notes' => $request->notes,
            'verified_at' => now(),
        ]);

        $audit->update(['status' => 'verifying']);

        return response()->json(['message' => 'Audit verified by checker.']);
    }

    // =====================================================
    // 6. FINALIZE
    // =====================================================
    public function finalize(Request $request, StockAudit $audit): JsonResponse
    {
        if ($audit->status === 'finalized') {
            return response()->json(['message' => 'Audit already finalized.'], 422);
        }

        $request->validate([
            'items' => 'nullable|array',
            'items.*.id' => 'required|exists:stock_audit_items,id',
            'items.*.discrepancy_reason' => 'nullable|string',
            'items.*.decision' => 'nullable|string',
        ]);

        DB::transaction(function () use ($audit, $request) {
            foreach ($audit->items as $auditItem) {
                $totalPhysical = $auditItem->counts()->sum('physical_qty');
                $systemStock = ItemStock::where('company_id', $audit->company_id)->where('item_id', $auditItem->item_id)->sum('qty');
                $diff = $totalPhysical - $systemStock;
                $inputItem = collect($request->items)->firstWhere('id', $auditItem->id);

                $auditItem->update([
                    'system_qty' => $systemStock,
                    'total_counted_qty' => $totalPhysical,
                    'difference' => $diff,
                    'discrepancy_reason' => $inputItem['discrepancy_reason'] ?? null,
                    'decision' => $inputItem['decision'] ?? null,
                ]);
            }

            $audit->update([
                'status' => 'finalized',
                'finalized_by' => $request->user()->id,
                'finalized_at' => now(),
                'immutability_hash' => hash('sha256', $audit->id . now()),
            ]);
        });

        return response()->json(['message' => 'Audit finalized and locked.']);
    }
}
