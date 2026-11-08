<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesInvoice;
use App\Models\Shift;
use App\Models\User;
use App\Models\Company;
use App\Models\SalesInvoiceItem;
use App\Models\SyncLog;
use App\Models\TillOperation;
use App\Models\DayClosing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $isSuperAdmin = $user->isSuperAdmin();
        $isAdmin = $user->hasRole('admin');
        $isManager = $user->hasRole('manager');

        $isCashier = ($user->hasRole('cashier') || $user->hasRole('sales_person'))
            && !$isSuperAdmin && !$isAdmin && !$isManager;

        if ($isCashier) return $this->cashierDashboard($request, $user);
        if ($isManager && !$isAdmin && !$isSuperAdmin) return $this->managerDashboard($request, $user);
        if ($isAdmin && !$isSuperAdmin) return $this->adminDashboard($request, $user);

        return $this->superAdminDashboard($request, $user);
    }

    // =================================================================
    // 1. CASHIER DASHBOARD (Strictly Personal)
    // =================================================================
    private function cashierDashboard(Request $request, User $user): JsonResponse
    {
        $tz = 'Asia/Karachi';
        $startStr = Carbon::now($tz)->toDateString();

        $salesBase = SalesInvoice::where('company_id', $user->company_id)
            ->where('user_id', $user->id)
            ->where('is_void', false)
            ->where('status', '!=', 'cancelled')
            ->whereDate('working_date', $startStr);

        $grossSales = (clone $salesBase)->where('invoice_type', 'sale')->sum('grand_total');
        $returnValue = (clone $salesBase)->where('invoice_type', 'return')->sum('grand_total');
        $netSales = $grossSales - $returnValue;

        $saleCount = (clone $salesBase)->where('invoice_type', 'sale')->count();
        $returnCount = (clone $salesBase)->where('invoice_type', 'return')->count();
        $totalInvoices = $saleCount + $returnCount;

        $itemsQuery = SalesInvoiceItem::whereHas('salesInvoice', function ($q) use ($startStr, $user) {
            $q->where('company_id', $user->company_id)
                ->where('user_id', $user->id)
                ->whereDate('working_date', $startStr);
        });

        $soldUnits = (clone $itemsQuery)->whereHas('salesInvoice', fn($q) => $q->where('invoice_type', 'sale'))->sum('qty');
        $returnedUnits = (clone $itemsQuery)->whereHas('salesInvoice', fn($q) => $q->where('invoice_type', 'return'))->sum('qty');
        $netUnits = $soldUnits - $returnedUnits;

        $packUnits = (clone $itemsQuery)->whereHas('salesInvoice', fn($q) => $q->where('invoice_type', 'sale'))->where('is_set', true)->sum('qty');
        $defectiveUnits = (clone $itemsQuery)->whereHas('salesInvoice', fn($q) => $q->where('invoice_type', 'sale'))->where('is_b', true)->sum('qty');

        $payments = DB::table('payments')
            ->join('accounts', 'payments.account_id', '=', 'accounts.id')
            ->join('sales_invoices', 'payments.sales_invoice_id', '=', 'sales_invoices.id')
            ->where('sales_invoices.company_id', $user->company_id)
            ->where('sales_invoices.user_id', $user->id)
            ->whereDate('sales_invoices.working_date', $startStr)
            ->select(
                'accounts.name as account_name',
                DB::raw('SUM(CASE WHEN sales_invoices.invoice_type = "sale" THEN payments.payment_amount ELSE 0 END) as sale_amount'),
                DB::raw('SUM(CASE WHEN sales_invoices.invoice_type = "return" THEN payments.payment_amount ELSE 0 END) as return_amount')
            )
            ->groupBy('accounts.name')
            ->get()
            ->map(function ($p) {
                return [
                    'account_name' => $p->account_name,
                    'sale_amount' => (float) $p->sale_amount,
                    'return_amount' => (float) $p->return_amount,
                    'net_amount' => (float) ($p->sale_amount - $p->return_amount),
                ];
            })
            ->filter(fn($p) => $p['sale_amount'] > 0 || $p['return_amount'] > 0)
            ->values();

        $myShift = Shift::where('user_id', $user->id)->where('shift_status', 'OPEN')->first();
        $till = TillOperation::where('user_id', $user->id)->first();

        $recentInvoices = (clone $salesBase)->orderBy('created_at', 'desc')->limit(5)->get()->map(fn($inv) => [
            'id' => $inv->id,
            'invoice_number' => $inv->invoice_number,
            'grand_total' => (float)$inv->grand_total,
            'time' => Carbon::parse($inv->created_at)->format('h:i A'),
            'invoice_type' => $inv->invoice_type,
        ]);

        return response()->json([
            'kpis' => [
                'today_sales' => (float) $netSales,
                'gross_sales' => (float) $grossSales,
                'return_value' => (float) $returnValue,
                'today_invoices' => (int) $totalInvoices,
                'sale_count' => (int) $saleCount,
                'return_count' => (int) $returnCount,
            ],
            'product_kpis' => [
                'total_items' => (float) $netUnits,
                'gross_units' => (float) $soldUnits,
                'returned_units' => (float) $returnedUnits,
                'pack_units' => (float) $packUnits,
                'defective_units' => (float) $defectiveUnits,
            ],
            'payment_breakdown' => $payments,
            'cashier_data' => [
                'till_name' => $till ? "{$till->shop_name} (Till {$till->till_no})" : "My Station",
                'shift_status' => $myShift ? 'OPEN' : 'CLOSED',
                'shift_start_time' => $myShift ? Carbon::parse($myShift->start_time)->format('h:i A') : null,
                'opening_balance' => $myShift ? (float)$myShift->opening_balance : 0,
                'expected_cash' => $myShift ? (float)$myShift->expected_cash : 0,
                'recent_invoices' => $recentInvoices
            ],
            'top_designs' => [],
            'companies' => [],
            'chartData' => [],
            'manager_data' => null,
            'systemHealth' => null,
        ]);
    }

    // =================================================================
    // 2. MANAGER DASHBOARD (Single Company Operations)
    // =================================================================
    private function managerDashboard(Request $request, User $user): JsonResponse
    {
        $tz = 'Asia/Karachi';
        $startStr = Carbon::now($tz)->toDateString();
        $companyId = $user->company_id;

        $salesBase = SalesInvoice::where('company_id', $companyId)
            ->where('is_void', false)->where('status', '!=', 'cancelled')->whereDate('working_date', $startStr);

        $grossSales = (clone $salesBase)->where('invoice_type', 'sale')->sum('grand_total');
        $returnValue = (clone $salesBase)->where('invoice_type', 'return')->sum('grand_total');
        $netSales = $grossSales - $returnValue;

        $saleCount = (clone $salesBase)->where('invoice_type', 'sale')->count();
        $returnCount = (clone $salesBase)->where('invoice_type', 'return')->count();
        $totalInvoices = $saleCount + $returnCount;

        $itemsQuery = SalesInvoiceItem::whereHas('salesInvoice', function ($q) use ($startStr, $companyId) {
            $q->where('company_id', $companyId)->whereDate('working_date', $startStr);
        });

        $soldUnits = (clone $itemsQuery)->whereHas('salesInvoice', fn($q) => $q->where('invoice_type', 'sale'))->sum('qty');
        $returnedUnits = (clone $itemsQuery)->whereHas('salesInvoice', fn($q) => $q->where('invoice_type', 'return'))->sum('qty');
        $netUnits = $soldUnits - $returnedUnits;

        $packUnits = (clone $itemsQuery)->whereHas('salesInvoice', fn($q) => $q->where('invoice_type', 'sale'))->where('is_set', true)->sum('qty');
        $defectiveUnits = (clone $itemsQuery)->whereHas('salesInvoice', fn($q) => $q->where('invoice_type', 'sale'))->where('is_b', true)->sum('qty');

        $payments = DB::table('payments')
            ->join('accounts', 'payments.account_id', '=', 'accounts.id')
            ->join('sales_invoices', 'payments.sales_invoice_id', '=', 'sales_invoices.id')
            ->where('sales_invoices.company_id', $companyId)->whereDate('sales_invoices.working_date', $startStr)
            ->select(
                'accounts.name as account_name',
                DB::raw('SUM(CASE WHEN sales_invoices.invoice_type = "sale" THEN payments.payment_amount ELSE 0 END) as sale_amount'),
                DB::raw('SUM(CASE WHEN sales_invoices.invoice_type = "return" THEN payments.payment_amount ELSE 0 END) as return_amount')
            )
            ->groupBy('accounts.name')
            ->get()
            ->map(fn($p) => ['account_name' => $p->account_name, 'sale_amount' => (float) $p->sale_amount, 'return_amount' => (float) $p->return_amount, 'net_amount' => (float) ($p->sale_amount - $p->return_amount)])
            ->filter(fn($p) => $p['sale_amount'] > 0 || $p['return_amount'] > 0)->values();

        $tills = TillOperation::where('company_id', $companyId)->get()->map(function ($till) {
            $openShift = Shift::where('till_operation_id', $till->id)->where('shift_status', 'OPEN')->first();
            return ['id' => $till->id, 'shop_name' => $till->shop_name, 'till_no' => $till->till_no, 'is_online' => (bool)$till->is_online, 'shift_status' => $openShift ? 'OPEN' : 'CLOSED', 'cashier_name' => $openShift ? User::find($openShift->user_id)?->name : null];
        });

        $topItems = (clone $itemsQuery)->select('item_name', DB::raw('SUM(qty) as total_units'), DB::raw('SUM((qty * sale_price) - line_discount) as total_revenue'))->whereHas('salesInvoice', fn($q) => $q->where('invoice_type', 'sale'))->groupBy('item_name')->orderBy('total_units', 'desc')->limit(10)->get();

        $topCustomers = (clone $salesBase)->where('invoice_type', 'sale')->whereNotNull('customer_id')->with('customer:id,customer_name,phone')
            ->select('customer_id', DB::raw('SUM(grand_total) as total_spent'), DB::raw('COUNT(id) as invoice_count'))->groupBy('customer_id')->orderBy('total_spent', 'desc')->limit(10)->get()
            ->map(fn($sale) => ['name' => $sale->customer?->customer_name ?? 'Walk-in', 'phone' => $sale->customer?->phone, 'total_spent' => (float) $sale->total_spent, 'invoice_count' => $sale->invoice_count]);

        $cashierLeaderboard = DB::table('sales_invoices')->join('users', 'sales_invoices.user_id', '=', 'users.id')
            ->where('sales_invoices.company_id', $companyId)->whereDate('sales_invoices.working_date', $startStr)->where('sales_invoices.is_void', false)->whereIn('sales_invoices.invoice_type', ['sale', 'return'])
            ->select('users.name as cashier_name', DB::raw('SUM(CASE WHEN sales_invoices.invoice_type = "sale" THEN sales_invoices.grand_total ELSE 0 END) as gross_sales'), DB::raw('SUM(CASE WHEN sales_invoices.invoice_type = "return" THEN sales_invoices.grand_total ELSE 0 END) as total_returns'), DB::raw('COUNT(sales_invoices.id) as invoice_count'))
            ->groupBy('users.id', 'users.name')->get()
            ->map(fn($c) => (object)['cashier_name' => $c->cashier_name, 'gross_sales' => (float)$c->gross_sales, 'total_returns' => (float)$c->total_returns, 'invoice_count' => $c->invoice_count, 'net_sales' => (float)($c->gross_sales - $c->total_returns)])
            ->sortByDesc('net_sales')->take(5)->values();

        return response()->json([
            'kpis' => ['today_sales' => (float) $netSales, 'gross_sales' => (float) $grossSales, 'return_value' => (float) $returnValue, 'today_invoices' => (int) $totalInvoices, 'sale_count' => (int) $saleCount, 'return_count' => (int) $returnCount],
            'product_kpis' => ['total_items' => (float) $netUnits, 'gross_units' => (float) $soldUnits, 'returned_units' => (float) $returnedUnits, 'pack_units' => (float) $packUnits, 'defective_units' => (float) $defectiveUnits],
            'payment_breakdown' => $payments,
            'manager_data' => ['tills' => $tills, 'cashier_leaderboard' => $cashierLeaderboard],
            'top_items' => $topItems,
            'top_customers' => $topCustomers,
            'cashier_data' => null,
            'companies' => [],
            'chartData' => [],
            'systemHealth' => null,
        ]);
    }

    // =================================================================
    // 3. ADMIN DASHBOARD (Multi-Company)
    // =================================================================
    private function adminDashboard(Request $request, User $user): JsonResponse
    {
        $tz = 'Asia/Karachi';
        $today = Carbon::now($tz)->toDateString();
        $range = $request->query('date_range', 'today');
        $companyId = $request->query('company_id');

        $startStr = $today;
        $endStr = $today;
        if ($range === 'yesterday') {
            $startStr = Carbon::now($tz)->subDay()->toDateString();
            $endStr = $startStr;
        } elseif ($range === 'last_7_days') {
            $startStr = Carbon::now($tz)->subDays(6)->toDateString();
        } elseif ($range === 'this_month') {
            $startStr = Carbon::now($tz)->startOfMonth()->toDateString();
        } elseif ($range === 'last_month') {
            $startStr = Carbon::now($tz)->subMonth()->startOfMonth()->toDateString();
            $endStr = Carbon::now($tz)->subMonth()->endOfMonth()->toDateString();
        }

        $assignedCompanyIds = $user->companies()->pluck('companies.id')->toArray();
        if (empty($assignedCompanyIds) && $user->company_id) $assignedCompanyIds = [$user->company_id];
        if (empty($assignedCompanyIds)) return response()->json(['error' => 'No companies assigned'], 403);

        $companyIds = $assignedCompanyIds;
        if ($companyId && $companyId !== 'all') {
            if (!in_array($companyId, $assignedCompanyIds)) abort(403, 'Unauthorized');
            $companyIds = [$companyId];
        }

        $salesBase = SalesInvoice::whereIn('company_id', $companyIds)->where('is_void', false)->where('status', '!=', 'cancelled')->whereDate('working_date', '>=', $startStr)->whereDate('working_date', '<=', $endStr);

        $grossSales = (clone $salesBase)->where('invoice_type', 'sale')->sum('grand_total');
        $returnValue = (clone $salesBase)->where('invoice_type', 'return')->sum('grand_total');
        $netSales = $grossSales - $returnValue;
        $saleCount = (clone $salesBase)->where('invoice_type', 'sale')->count();
        $returnCount = (clone $salesBase)->where('invoice_type', 'return')->count();
        $totalInvoices = $saleCount + $returnCount;

        $itemsQuery = SalesInvoiceItem::whereHas('salesInvoice', function ($q) use ($startStr, $endStr, $companyIds) {
            $q->whereIn('company_id', $companyIds)->whereDate('working_date', '>=', $startStr)->whereDate('working_date', '<=', $endStr);
        });

        $soldUnits = (clone $itemsQuery)->whereHas('salesInvoice', fn($q) => $q->where('invoice_type', 'sale'))->sum('qty');
        $returnedUnits = (clone $itemsQuery)->whereHas('salesInvoice', fn($q) => $q->where('invoice_type', 'return'))->sum('qty');
        $netUnits = $soldUnits - $returnedUnits;
        $packUnits = (clone $itemsQuery)->whereHas('salesInvoice', fn($q) => $q->where('invoice_type', 'sale'))->where('is_set', true)->sum('qty');
        $defectiveUnits = (clone $itemsQuery)->whereHas('salesInvoice', fn($q) => $q->where('invoice_type', 'sale'))->where('is_b', true)->sum('qty');

        $payments = DB::table('payments')->join('accounts', 'payments.account_id', '=', 'accounts.id')->join('sales_invoices', 'payments.sales_invoice_id', '=', 'sales_invoices.id')
            ->whereIn('sales_invoices.company_id', $companyIds)->whereDate('sales_invoices.working_date', '>=', $startStr)->whereDate('sales_invoices.working_date', '<=', $endStr)
            ->select('accounts.name as account_name', DB::raw('SUM(CASE WHEN sales_invoices.invoice_type = "sale" THEN payments.payment_amount ELSE 0 END) as sale_amount'), DB::raw('SUM(CASE WHEN sales_invoices.invoice_type = "return" THEN payments.payment_amount ELSE 0 END) as return_amount'))
            ->groupBy('accounts.name')->get()->map(fn($p) => ['account_name' => $p->account_name, 'sale_amount' => (float) $p->sale_amount, 'return_amount' => (float) $p->return_amount, 'net_amount' => (float) ($p->sale_amount - $p->return_amount)])
            ->filter(fn($p) => $p['sale_amount'] > 0 || $p['return_amount'] > 0)->values();

        $companiesLeaderboard = Company::whereIn('id', $companyIds)->get()->map(function ($company) use ($startStr, $endStr) {
            $s = SalesInvoice::where('company_id', $company->id)->whereDate('working_date', '>=', $startStr)->whereDate('working_date', '<=', $endStr)->where('invoice_type', 'sale')->sum('grand_total');
            $r = SalesInvoice::where('company_id', $company->id)->whereDate('working_date', '>=', $startStr)->whereDate('working_date', '<=', $endStr)->where('invoice_type', 'return')->sum('grand_total');
            $c = SalesInvoice::where('company_id', $company->id)->whereDate('working_date', '>=', $startStr)->whereDate('working_date', '<=', $endStr)->count();
            return ['id' => $company->id, 'name' => $company->name, 'net_sales' => (float) ($s - $r), 'gross_sales' => (float) $s, 'return_value' => (float) $r, 'invoice_count' => $c];
        })->sortByDesc('net_sales')->values();

        // ⭐ Top Items with detailed breakdown
        $topItems = DB::table('sales_invoice_items')
            ->join('sales_invoices', 'sales_invoice_items.sales_invoice_id', '=', 'sales_invoices.id')
            ->whereIn('sales_invoices.company_id', $companyIds)
            ->whereDate('sales_invoices.working_date', '>=', $startStr)
            ->whereDate('sales_invoices.working_date', '<=', $endStr)
            ->where('sales_invoices.is_void', false)
            ->where('sales_invoices.status', '!=', 'cancelled')
            ->select(
                'sales_invoice_items.item_name',

                // 1. Total Sold (Gross)
                DB::raw('SUM(CASE WHEN sales_invoices.invoice_type = "sale" THEN sales_invoice_items.qty ELSE 0 END) as sold_qty'),

                // 2. Total Returned
                DB::raw('SUM(CASE WHEN sales_invoices.invoice_type = "return" THEN sales_invoice_items.qty ELSE 0 END) as returned_qty'),

                // 3. Net Quantity (Sold - Returned)
                DB::raw('SUM(CASE WHEN sales_invoices.invoice_type = "sale" THEN sales_invoice_items.qty ELSE -sales_invoice_items.qty END) as net_units'),

                // 4. Net Revenue
                DB::raw('SUM(CASE WHEN sales_invoices.invoice_type = "sale" THEN (sales_invoice_items.qty * sales_invoice_items.sale_price) - sales_invoice_items.line_discount ELSE -((sales_invoice_items.qty * sales_invoice_items.sale_price) - sales_invoice_items.line_discount) END) as total_revenue')
            )
            ->groupBy('sales_invoice_items.item_name')
            ->orderBy('net_units', 'desc') // Sort by the actual net amount
            ->limit(10)
            ->get();

        $cashierLeaderboard = DB::table('sales_invoices')->join('users', 'sales_invoices.user_id', '=', 'users.id')
            ->whereIn('sales_invoices.company_id', $companyIds)->whereDate('sales_invoices.working_date', '>=', $startStr)->whereDate('sales_invoices.working_date', '<=', $endStr)->where('sales_invoices.is_void', false)->whereIn('sales_invoices.invoice_type', ['sale', 'return'])
            ->select('users.name as cashier_name', 'sales_invoices.company_id', DB::raw('SUM(CASE WHEN sales_invoices.invoice_type = "sale" THEN sales_invoices.grand_total ELSE 0 END) as gross_sales'), DB::raw('SUM(CASE WHEN sales_invoices.invoice_type = "return" THEN sales_invoices.grand_total ELSE 0 END) as total_returns'), DB::raw('COUNT(sales_invoices.id) as invoice_count'))
            ->groupBy('users.id', 'users.name', 'sales_invoices.company_id')->get()
            ->map(fn($c) => (object)['cashier_name' => $c->cashier_name, 'company_id' => $c->company_id, 'gross_sales' => (float)$c->gross_sales, 'total_returns' => (float)$c->total_returns, 'invoice_count' => $c->invoice_count, 'net_sales' => (float)($c->gross_sales - $c->total_returns)])
            ->sortByDesc('net_sales')->take(10)->values();

        $shiftsQuery = Shift::whereIn('company_id', $companyIds)->whereDate('shift_date', '>=', $startStr)->whereDate('shift_date', '<=', $endStr);
        $shiftSummary = ['total' => (clone $shiftsQuery)->count(), 'open' => (clone $shiftsQuery)->where('shift_status', 'OPEN')->count(), 'closed' => (clone $shiftsQuery)->where('shift_status', 'CLOSED')->count()];

        $closingsQuery = DayClosing::whereIn('company_id', $companyIds)->whereDate('business_date', '>=', $startStr)->whereDate('business_date', '<=', $endStr);
        $dayCloseSummary = ['total_closings' => (clone $closingsQuery)->count(), 'expected_cash' => (float) (clone $closingsQuery)->sum('expected_cash'), 'actual_cash' => (float) (clone $closingsQuery)->sum('actual_cash'), 'cash_difference' => (float) (clone $closingsQuery)->sum('cash_difference')];

        return response()->json([
            'kpis' => ['today_sales' => (float) $netSales, 'gross_sales' => (float) $grossSales, 'return_value' => (float) $returnValue, 'today_invoices' => (int) $totalInvoices, 'sale_count' => (int) $saleCount, 'return_count' => (int) $returnCount],
            'product_kpis' => ['total_items' => (float) $netUnits, 'gross_units' => (float) $soldUnits, 'returned_units' => (float) $returnedUnits, 'pack_units' => (float) $packUnits, 'defective_units' => (float) $defectiveUnits],
            'payment_breakdown' => $payments,
            'companies_leaderboard' => $companiesLeaderboard,
            'top_items' => $topItems,
            'cashier_leaderboard' => $cashierLeaderboard,
            'shift_summary' => $shiftSummary,
            'day_close_summary' => $dayCloseSummary,
            'assigned_companies' => Company::whereIn('id', $assignedCompanyIds)->get(['id', 'name']),
            'cashier_data' => null,
            'manager_data' => null,
            'companies' => [],
            'chartData' => [],
            'systemHealth' => null,
        ]);
    }

    // =================================================================
    // 4. SUPER ADMIN DASHBOARD (Global Command Center)
    // =================================================================
    private function superAdminDashboard(Request $request, User $user): JsonResponse
    {
        $tz = 'Asia/Karachi';
        $today = Carbon::now($tz)->toDateString();
        $range = $request->query('date_range', 'today');
        $companyId = $request->query('company_id');

        // 1. Date Range Logic
        $startStr = $today;
        $endStr = $today;

        if ($range === 'yesterday') {
            $startStr = Carbon::now($tz)->subDay()->toDateString();
            $endStr = $startStr;
        } elseif ($range === 'last_7_days') {
            $startStr = Carbon::now($tz)->subDays(6)->toDateString();
            $endStr = $today;
        } elseif ($range === 'this_month') {
            $startStr = Carbon::now($tz)->startOfMonth()->toDateString();
            $endStr = Carbon::now($tz)->endOfMonth()->toDateString();
        } elseif ($range === 'last_month') {
            $startStr = Carbon::now($tz)->subMonth()->startOfMonth()->toDateString();
            $endStr = Carbon::now($tz)->subMonth()->endOfMonth()->toDateString();
        }

        // 2. Base Query
        $salesBase = SalesInvoice::query();
        $companyIds = Company::where('is_active', true)->pluck('id')->toArray();

        if ($companyId && $companyId !== 'all') {
            $companyIds = [$companyId];
            $salesBase->where('company_id', $companyId);
        } else {
            $salesBase->whereIn('company_id', $companyIds);
        }

        $salesBase->where('is_void', false)->where('status', '!=', 'cancelled');

        // 3. Main KPIs
        $grossSales = (clone $salesBase)->whereBetween('working_date', [$startStr, $endStr])->where('invoice_type', 'sale')->sum('grand_total');
        $returnValue = (clone $salesBase)->whereBetween('working_date', [$startStr, $endStr])->where('invoice_type', 'return')->sum('grand_total');
        $netSales = $grossSales - $returnValue;

        $saleCount = (clone $salesBase)->whereBetween('working_date', [$startStr, $endStr])->where('invoice_type', 'sale')->count();
        $returnCount = (clone $salesBase)->whereBetween('working_date', [$startStr, $endStr])->where('invoice_type', 'return')->count();
        $totalInvoices = $saleCount + $returnCount;

        // 4. Product KPIs
        $itemsQuery = SalesInvoiceItem::whereHas('salesInvoice', function ($q) use ($salesBase, $startStr, $endStr) {
            $q->whereBetween('working_date', [$startStr, $endStr]);
            $baseQuery = $salesBase->getQuery();
            if (!empty($baseQuery->wheres)) {
                foreach ($baseQuery->wheres as $where) {
                    if (isset($where['column']) && !in_array($where['column'], ['invoice_type', 'working_date'])) {
                        if ($where['type'] === 'In') {
                            $q->whereIn($where['column'], $where['values']);
                        } else {
                            $q->where($where['column'], $where['operator'], $where['value']);
                        }
                    }
                }
            }
        });

        $soldUnits = (clone $itemsQuery)->whereHas('salesInvoice', fn($q) => $q->where('invoice_type', 'sale'))->sum('qty');
        $returnedUnits = (clone $itemsQuery)->whereHas('salesInvoice', fn($q) => $q->where('invoice_type', 'return'))->sum('qty');
        $netUnits = $soldUnits - $returnedUnits;

        $packUnits = (clone $itemsQuery)->whereHas('salesInvoice', fn($q) => $q->where('invoice_type', 'sale'))->where('is_set', true)->sum('qty');
        $defectiveUnits = (clone $itemsQuery)->whereHas('salesInvoice', fn($q) => $q->where('invoice_type', 'sale'))->where('is_b', true)->sum('qty');

        // 5. Top Designs
        $topDesigns = DB::table('sales_invoice_items')
            ->join('sales_invoices', 'sales_invoice_items.sales_invoice_id', '=', 'sales_invoices.id')
            ->whereIn('sales_invoices.company_id', $companyIds)
            ->whereBetween('sales_invoices.working_date', [$startStr, $endStr])
            ->where('sales_invoices.is_void', false)
            ->where('sales_invoices.status', '!=', 'cancelled')
            ->select(
                'sales_invoice_items.item_name',
                DB::raw('SUM(CASE WHEN sales_invoices.invoice_type = "sale" THEN sales_invoice_items.qty ELSE 0 END) as sold_qty'),
                DB::raw('SUM(CASE WHEN sales_invoices.invoice_type = "return" THEN sales_invoice_items.qty ELSE 0 END) as returned_qty'),
                DB::raw('SUM(CASE WHEN sales_invoices.invoice_type = "sale" THEN sales_invoice_items.qty ELSE -sales_invoice_items.qty END) as net_units'),
                DB::raw('SUM(CASE WHEN sales_invoices.invoice_type = "sale" THEN (sales_invoice_items.qty * sales_invoice_items.sale_price) - sales_invoice_items.line_discount ELSE -((sales_invoice_items.qty * sales_invoice_items.sale_price) - sales_invoice_items.line_discount) END) as total_revenue')
            )
            ->groupBy('sales_invoice_items.item_name')
            ->orderBy('net_units', 'desc')
            ->limit(5)
            ->get();

        // 6. Company Performance & Chart Data
        $companiesArray = [];
        $chartSales = [];
        $chartInvoices = [];
        $companyModels = Company::whereIn('id', $companyIds)->get();

        foreach ($companyModels as $company) {
            $s = (clone $salesBase)->where('company_id', $company->id)->whereBetween('working_date', [$startStr, $endStr])->where('invoice_type', 'sale')->sum('grand_total');
            $r = (clone $salesBase)->where('company_id', $company->id)->whereBetween('working_date', [$startStr, $endStr])->where('invoice_type', 'return')->sum('grand_total');
            $i = (clone $salesBase)->where('company_id', $company->id)->whereBetween('working_date', [$startStr, $endStr])->where('invoice_type', 'sale')->count();
            $os = Shift::where('company_id', $company->id)->where('shift_status', 'OPEN')->count();

            $companiesArray[] = [
                'id' => $company->id,
                'name' => $company->name,
                'sales' => (float) ($s - $r),
                'gross_sales' => (float) $s,
                'return_value' => (float) $r,
                'invoices' => $i,
                'open_shifts' => $os,
                'status' => 'Synced',
                'is_live' => $os > 0
            ];
        }

        // ⭐ FIXED CHART DATA (Separating Sales and Invoices)
        if (in_array($range, ['today', 'yesterday'])) {
            for ($i = 8; $i <= 22; $i++) {
                $hStart = Carbon::parse($startStr)->setTime($i, 0, 0)->toDateTimeString();
                $hEnd = Carbon::parse($startStr)->setTime($i, 59, 59)->toDateTimeString();

                $salesSeries = [];
                $invoiceSeries = [];

                foreach ($companiesArray as $c) {
                    $salesSeries[$c['id']] = (clone $salesBase)->where('company_id', $c['id'])->whereBetween('created_at', [$hStart, $hEnd])->where('invoice_type', 'sale')->sum('grand_total');
                    $invoiceSeries[$c['id']] = (clone $salesBase)->where('company_id', $c['id'])->whereBetween('created_at', [$hStart, $hEnd])->where('invoice_type', 'sale')->count();
                }

                $chartSales[] = ['date' => str_pad($i, 2, '0', STR_PAD_LEFT) . ':00', 'series' => $salesSeries];
                $chartInvoices[] = ['date' => str_pad($i, 2, '0', STR_PAD_LEFT) . ':00', 'series' => $invoiceSeries];
            }
        } else {
            for ($date = Carbon::parse($startStr); $date->lte(Carbon::parse($endStr)); $date->addDay()) {
                $salesSeries = [];
                $invoiceSeries = [];

                foreach ($companiesArray as $c) {
                    $salesSeries[$c['id']] = (clone $salesBase)->where('company_id', $c['id'])->whereDate('working_date', $date->toDateString())->where('invoice_type', 'sale')->sum('grand_total');
                    $invoiceSeries[$c['id']] = (clone $salesBase)->where('company_id', $c['id'])->whereDate('working_date', $date->toDateString())->where('invoice_type', 'sale')->count();
                }

                $chartSales[] = ['date' => $date->format('M d'), 'series' => $salesSeries];
                $chartInvoices[] = ['date' => $date->format('M d'), 'series' => $invoiceSeries];
            }
        }

        // 7. Item Breakdown (Detailed)
        $itemBreakdown = DB::table('sales_invoice_items')
            ->join('sales_invoices', 'sales_invoice_items.sales_invoice_id', '=', 'sales_invoices.id')
            ->join('companies', 'sales_invoices.company_id', '=', 'companies.id')
            ->join('users', 'sales_invoices.user_id', '=', 'users.id')
            ->whereIn('sales_invoices.company_id', $companyIds)
            ->whereBetween('sales_invoices.working_date', [$startStr, $endStr])
            ->where('sales_invoices.is_void', false)
            ->where('sales_invoices.status', '!=', 'cancelled')
            ->select(
                'sales_invoice_items.item_name',
                'companies.name as company_name',
                'users.name as cashier_name',
                DB::raw('SUM(CASE WHEN sales_invoices.invoice_type = "sale" THEN sales_invoice_items.qty ELSE 0 END) as sold_qty'),
                DB::raw('SUM(CASE WHEN sales_invoices.invoice_type = "return" THEN sales_invoice_items.qty ELSE 0 END) as returned_qty'),
                DB::raw('SUM(CASE WHEN sales_invoices.invoice_type = "sale" THEN sales_invoice_items.qty ELSE -sales_invoice_items.qty END) as net_units'),
                DB::raw('SUM(CASE WHEN sales_invoices.invoice_type = "sale" THEN (sales_invoice_items.qty * sales_invoice_items.sale_price) - sales_invoice_items.line_discount ELSE -((sales_invoice_items.qty * sales_invoice_items.sale_price) - sales_invoice_items.line_discount) END) as net_revenue')
            )
            ->groupBy('sales_invoice_items.item_name', 'companies.name', 'users.name')
            ->havingRaw('net_units != 0 OR sold_qty > 0')
            ->orderBy('net_revenue', 'desc')
            ->limit(50)
            ->get();

        // 8. Shift & Closing Summaries
        $shiftsQuery = Shift::whereIn('company_id', $companyIds)->whereBetween('shift_date', [$startStr, $endStr]);
        $shiftSummary = ['total' => (clone $shiftsQuery)->count(), 'open' => (clone $shiftsQuery)->where('shift_status', 'OPEN')->count(), 'closed' => (clone $shiftsQuery)->where('shift_status', 'CLOSED')->count()];

        $closingsQuery = DayClosing::whereIn('company_id', $companyIds)->whereBetween('business_date', [$startStr, $endStr]);
        $dayCloseSummary = ['total_closings' => (clone $closingsQuery)->count(), 'expected_cash' => (float) (clone $closingsQuery)->sum('expected_cash'), 'actual_cash' => (float) (clone $closingsQuery)->sum('actual_cash'), 'cash_difference' => (float) (clone $closingsQuery)->sum('cash_difference')];

        // 9. Cashier Leaderboard
        $cashierLeaderboard = DB::table('sales_invoices')
            ->join('users', 'sales_invoices.user_id', '=', 'users.id')
            ->join('companies', 'sales_invoices.company_id', '=', 'companies.id')
            ->whereIn('sales_invoices.company_id', $companyIds)
            ->whereBetween('sales_invoices.working_date', [$startStr, $endStr])
            ->where('sales_invoices.is_void', false)
            ->whereIn('sales_invoices.invoice_type', ['sale', 'return'])
            ->select('users.name as cashier_name', 'companies.name as company_name', DB::raw('SUM(CASE WHEN sales_invoices.invoice_type = "sale" THEN sales_invoices.grand_total ELSE 0 END) as gross_sales'), DB::raw('SUM(CASE WHEN sales_invoices.invoice_type = "return" THEN sales_invoices.grand_total ELSE 0 END) as total_returns'), DB::raw('COUNT(sales_invoices.id) as invoice_count'))
            ->groupBy('users.id', 'users.name', 'companies.name')
            ->get()
            ->map(fn($c) => (object)['cashier_name' => $c->cashier_name, 'company_name' => $c->company_name, 'gross_sales' => (float)$c->gross_sales, 'total_returns' => (float)$c->total_returns, 'invoice_count' => $c->invoice_count, 'net_sales' => (float)($c->gross_sales - $c->total_returns)])
            ->sortByDesc('net_sales')->take(5)->values();

        // 10. System Health
        $pendingJobs = DB::table('jobs')->count();
        $failedJobs = DB::table('failed_jobs')->count();
        $lastSync = SyncLog::whereIn('company_id', $companyIds)->where('status', 'success')->orderBy('completed_at', 'desc')->value('completed_at');

        return response()->json([
            'kpis' => [
                'today_sales' => (float) $netSales,
                'gross_sales' => (float) $grossSales,
                'return_value' => (float) $returnValue,
                'today_invoices' => (int) $totalInvoices,
                'sale_count' => (int) $saleCount,
                'return_count' => (int) $returnCount,
                'active_companies' => count($companyIds),
                'active_cashiers' => User::whereIn('company_id', $companyIds)->where('is_active', true)->whereHas('roles', fn($q) => $q->where('name', 'cashier'))->count(),
                'open_shifts' => Shift::whereIn('company_id', $companyIds)->where('shift_status', 'OPEN')->count(),
            ],
            'product_kpis' => [
                'total_items' => (float) $netUnits,
                'gross_units' => (float) $soldUnits,
                'returned_units' => (float) $returnedUnits,
                'pack_units' => (float) $packUnits,
                'defective_units' => (float) $defectiveUnits,
            ],
            'companies' => $companiesArray,
            'top_designs' => $topDesigns,
            'chartData' => $chartSales,
            'chartInvoiceData' => $chartInvoices,
            'item_breakdown' => $itemBreakdown,
            'cashier_leaderboard' => $cashierLeaderboard,
            'shift_summary' => $shiftSummary,
            'day_close_summary' => $dayCloseSummary,
            'systemHealth' => [
                'erp_status' => ($failedJobs > 0) ? 'warning' : 'healthy',
                'pending_jobs' => $pendingJobs,
                'failed_jobs' => $failedJobs,
                'last_sync' => $lastSync ? Carbon::parse($lastSync)->diffForHumans() : 'Never',
            ],
            'cashier_data' => null,
            'manager_data' => null,
        ]);
    }
}
