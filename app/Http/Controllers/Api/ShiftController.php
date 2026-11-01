<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Shift::with(['user:id,name', 'tillOperation:id,till_no,shop_name']);

        // 1. Role-Based Security
        if ($user->isSuperAdmin()) {
            if ($request->query('company_id')) {
                $query->where('company_id', $request->query('company_id'));
            }
        } else {
            $isManagerOrAdmin = $user->hasRole('admin') || $user->hasRole('manager');

            if ($isManagerOrAdmin) {
                $allowedCompanyIds = $user->companyAccess()->pluck('companies.id')->toArray();
                if ($request->query('company_id')) {
                    if (in_array((int) $request->query('company_id'), $allowedCompanyIds)) {
                        $query->where('company_id', $request->query('company_id'));
                    } else {
                        $query->whereRaw('1 = 0');
                    }
                } else {
                    $query->whereIn('company_id', $allowedCompanyIds);
                }
            } else {
                $query->where('user_id', $user->id)
                    ->where('company_id', $user->company_id);
            }
        }

        // 2. User Filter
        if ($request->query('user_id') && !$user->hasRole('cashier')) {
            $query->where('user_id', $request->query('user_id'));
        }

        // 3. Date & Status Filters
        if ($request->query('date')) {
            $query->whereDate('shift_date', $request->query('date'));
        }
        if ($request->query('status')) {
            $query->where('shift_status', $request->query('status'));
        }

        $paginator = $query->orderByDesc('id')->paginate(50);

        // ⭐ Calculate Account Summary for the List ⭐
        $items = collect($paginator->items())->map(function ($shift) {
            return $this->appendAccountSummary($shift);
        });

        return response()->json([
            'data' => $items,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'total'        => $paginator->total(),
            ]
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $shift = Shift::with([
            'user:id,name',
            'closedBy:id,name',
            'tillOperation:id,till_no,shop_name',
            'denominations'
        ])->findOrFail($id);

        // Security Check for Drawer
        if ($user->isSuperAdmin()) {
            // SA can view all
        } elseif ($user->hasRole('admin') || $user->hasRole('manager')) {
            $allowedCompanyIds = $user->companyAccess()->pluck('companies.id')->toArray();
            if (!in_array($shift->company_id, $allowedCompanyIds)) {
                abort(403, 'Unauthorized to view this shift.');
            }
        } else {
            if ($shift->user_id !== $user->id) {
                abort(403, 'Unauthorized to view this shift.');
            }
        }

        // ⭐ Calculate Account Summary for the Drawer ⭐
        $shift = $this->appendAccountSummary($shift);

        return response()->json(['data' => $shift]);
    }

    /**
     * ⭐ Helper to attach the payment account summary to a shift ⭐
     */
    private function appendAccountSummary($shift)
    {
        $summary = Payment::selectRaw('accounts.name as account_name, sum(payments.payment_amount) as total_amount')
            ->join('accounts', 'payments.account_id', '=', 'accounts.id')
            ->join('sales_invoices', 'payments.sales_invoice_id', '=', 'sales_invoices.id')
            ->where('payments.company_id', $shift->company_id)
            ->where('payments.received_by', $shift->user_id)
            ->where('sales_invoices.created_at', '>=', $shift->start_time)
            ->where(function ($query) use ($shift) {
                if ($shift->end_time) {
                    $query->where('sales_invoices.created_at', '<=', $shift->end_time);
                } else {
                    $query->where('sales_invoices.created_at', '<=', now());
                }
            })
            ->groupBy('accounts.id', 'accounts.name')
            ->get();

        $shift->account_summary = $summary;
        return $shift;
    }
}
