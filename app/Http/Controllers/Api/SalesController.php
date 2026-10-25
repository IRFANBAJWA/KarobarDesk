<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesInvoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalesController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = SalesInvoice::with(['customer:id,customer_name,phone', 'user:id,name', 'company:id,name']);

        // Company Access Control
        if (! $user->isSuperAdmin()) {
            $query->where('company_id', $user->company_id);
        } elseif ($request->query('company_id')) {
            $query->where('company_id', (int) $request->query('company_id'));
        }

        // Dates
        $from = $request->query('date_from') ?: now()->format('Y-m-d');
        $to = $request->query('date_to') ?: now()->format('Y-m-d');
        $query->whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<=', $to);

        // Force Filters
        if ($request->query('invoice_type')) {
            $query->where('invoice_type', $request->query('invoice_type'));
        }
        if ($request->query('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->query('search')) {
            $query->where('invoice_number', 'like', '%' . $request->query('search') . '%');
        }

        $paginator = $query->orderByDesc('id')->paginate(50);

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
        $invoice = SalesInvoice::with([
            'customer',
            'user:id,name',
            'items.item',
            'payments.account',
            'company:id,name'
        ])->findOrFail($id);

        return response()->json(['data' => $invoice]);
    }
}
