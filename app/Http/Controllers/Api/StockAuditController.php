<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockAudit;
use App\Models\StockAuditItem;
use App\Models\StockAuditCount;
use App\Models\Item;
use App\Models\User;
use App\Models\ItemStock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StockAuditController extends Controller
{
    // 1. Get or Create Today's Audit & Return UI Data
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

        // ⭐ FIX: Only fetch items that have LIVE stock > 0 OR were counted in this audit
        $items = Item::where('is_active', true)
            ->where(function ($q) use ($companyId, $audit) {
                // 1. Has live stock > 0 (Items currently on the shelf)
                $q->whereHas('itemStocks', function ($sq) use ($companyId) {
                    $sq->where('company_id', $companyId)->where('qty', '>', 0);
                })
                    // 2. OR was counted in this specific audit (Items sold out today but counted)
                    ->orWhereHas('stockAuditItems', function ($sq) use ($audit) {
                        $sq->where('stock_audit_id', $audit->id);
                    });
            })
            ->leftJoin('item_stocks', function ($join) use ($companyId) {
                $join->on('items.id', '=', 'item_stocks.item_id')
                    ->where('item_stocks.company_id', '=', $companyId);
            })
            ->select(
                'items.id',
                'items.item_name',
                'items.erpnext_item_code',
                'item_stocks.qty as system_qty'
            )
            ->get()
            ->map(function ($item) {
                // Ensure system_qty is a clean number
                $item->system_qty = (float) ($item->system_qty ?? 0);
                return $item;
            });

        $salespersons = User::where('company_id', $companyId)
            ->whereHas('roles', fn($q) => $q->whereIn('name', ['cashier', 'sales_person', 'manager']))
            ->get(['id', 'name']);

        $counts = StockAuditCount::whereHas('stockAuditItem', function ($q) use ($audit) {
            $q->where('stock_audit_id', $audit->id);
        })->with([
            'user:id,name',
            'creator:id,name',
            'stockAuditItem:id,item_id,stock_audit_id',
            'stockAuditItem.item:id,item_name'
        ])->get();

        return response()->json([
            'audit' => $audit,
            'items' => $items,
            'counts' => $counts,
            'salespersons' => $salespersons,
            'today' => $today
        ]);
    }

    // 2. Save Batch Counts
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
                // Find or create the audit item row (No system_qty locked here)
                $auditItem = StockAuditItem::firstOrCreate([
                    'stock_audit_id' => $audit->id,
                    'item_id' => $count['item_id'],
                ]);

                // Save or update the physical count
                StockAuditCount::updateOrCreate(
                    [
                        'stock_audit_item_id' => $auditItem->id,
                        'user_id' => $targetUserId,
                    ],
                    [
                        'created_by' => $createdBy,
                        'role_area' => $count['role_area'],
                        'physical_qty' => $count['physical_qty'],
                        'entered_at' => now(),
                    ]
                );
            }
        });

        return response()->json(['message' => 'Counts saved successfully.']);
    }

    // 3. Finalize Audit
    public function finalize(Request $request, StockAudit $audit): JsonResponse
    {
        if ($audit->status === 'finalized') {
            return response()->json(['message' => 'Audit already finalized.'], 422);
        }

        DB::transaction(function () use ($audit, $request) {
            foreach ($audit->items as $auditItem) {
                $totalPhysical = $auditItem->counts()->sum('physical_qty');

                // Fetch LIVE system stock at this exact moment
                $systemStock = ItemStock::where('company_id', $audit->company_id)
                    ->where('item_id', $auditItem->item_id)
                    ->sum('qty');

                $auditItem->update([
                    'system_qty' => $systemStock,
                    'total_counted_qty' => $totalPhysical,
                    'difference' => $totalPhysical - $systemStock,
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
