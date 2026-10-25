<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ItemStock;
use App\Models\StockLedger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockController extends Controller
{
    // 1. Get distinct warehouses for filters
    public function warehouses(): JsonResponse
    {
        $warehouses = ItemStock::query()
            ->select('warehouse')
            ->distinct()
            ->orderBy('warehouse')
            ->pluck('warehouse');

        return response()->json(['data' => $warehouses]);
    }

    // 2. Stock Balance (from item_stocks)
    public function balances(Request $request): JsonResponse
    {
        $from = $request->string('date_from')->toString() ?: now()->format('Y-m-d');
        $to = $request->string('date_to')->toString() ?: now()->format('Y-m-d');

        $hideZero = $request->boolean('hide_zero', true);

        $query = ItemStock::query()
            ->with(['item:id,item_name,erpnext_item_code', 'company:id,name']);

        if ($companyId = $request->integer('company_id')) {
            $query->where('company_id', $companyId);
        }

        if ($search = $request->string('search')->toString()) {
            $query->whereHas('item', function ($q) use ($search) {
                $q->where('item_name', 'like', "%{$search}%")
                    ->orWhere('erpnext_item_code', 'like', "%{$search}%");
            });
        }

        if ($hideZero) {
            $query->where('qty', '!=', 0);
        }

        $paginator = $query->orderByDesc('id')->paginate(50);

        $data = collect($paginator->items())->map(function ($stock) use ($from, $to) {
            $closing = (float) $stock->qty;
            $movements = StockLedger::where('item_id', $stock->item_id)
                ->where('warehouse', $stock->warehouse)
                ->whereDate('created_at', '>=', $from)
                ->whereDate('created_at', '<=', $to)
                ->selectRaw('SUM(CASE WHEN qty > 0 THEN qty ELSE 0 END) as total_in, SUM(CASE WHEN qty < 0 THEN qty ELSE 0 END) as total_out')
                ->first();

            $inQty = (float) ($movements->total_in ?? 0);
            $outQty = (float) ($movements->total_out ?? 0);
            $opening = $closing - $inQty - $outQty;

            return [
                'id' => $stock->id,
                'item_id' => $stock->item_id,
                'company' => $stock->company,
                'item' => $stock->item,
                'opening_qty' => $opening,
                'in_qty' => $inQty,
                'out_qty' => abs($outQty),
                'closing_qty' => $closing,
            ];
        });

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'total'        => $paginator->total(),
            ]
        ]);
    }

    // 3. Stock Ledger (from stock_ledgers)
    public function ledger(Request $request, int $itemId): JsonResponse
    {
        $warehouse = $request->string('warehouse')->toString();
        $from = $request->string('date_from')->toString();
        $to = $request->string('date_to')->toString();

        $openingBalance = 0.0;

        if ($from) {
            $openingEntry = StockLedger::query()
                ->where('item_id', $itemId)
                ->when($warehouse, fn($q) => $q->where('warehouse', $warehouse))
                ->whereDate('created_at', '<', $from)
                ->orderByDesc('id')
                ->first();

            if ($openingEntry) {
                $openingBalance = (float) $openingEntry->balance_after;
            }
        }

        // ⭐ MODIFIED: Added 'reference' to eager load the SalesInvoice details
        $query = StockLedger::query()
            ->with([
                'company:id,name',
                'createdBy:id,name',
                'reference:id,invoice_number' // Loads invoice_number from sales_invoices
            ])
            ->where('item_id', $itemId);

        if ($warehouse) {
            $query->where('warehouse', $warehouse);
        }
        if ($from) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to) {
            $query->whereDate('created_at', '<=', $to);
        }

        $paginator = $query->orderByDesc('id')->paginate(50);

        $closingBalance = $openingBalance;
        if ($paginator->count() > 0) {
            $closingBalance = (float) $paginator->items()[0]->balance_after;
        }

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'total'        => $paginator->total(),
                'opening_balance' => $openingBalance ?: 0,
                'closing_balance' => $closingBalance ?: 0,
            ]
        ]);
    }

    // 4. Companies list
    public function companies(): JsonResponse
    {
        $companies = \App\Models\Company::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json(['data' => $companies]);
    }
}
