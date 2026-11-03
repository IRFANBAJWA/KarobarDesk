<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesInvoice;
use App\Models\Shift;
use App\Models\User;
use App\Models\Company;
use App\Models\SalesInvoiceItem;
use App\Models\SyncLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $tz = 'Asia/Karachi';

        // 1. Determine Date Range
        $range = $request->query('date_range', 'today');
        $companyId = $request->query('company_id');

        $now = Carbon::now($tz);
        $startDate = $now->copy()->startOfDay();
        $endDate = $now->copy()->endOfDay();
        $comparisonStartDate = $now->copy()->subDay()->startOfDay();
        $comparisonEndDate = $now->copy()->subDay()->endOfDay();

        switch ($range) {
            case 'yesterday':
                $startDate = $now->copy()->subDay()->startOfDay();
                $endDate = $now->copy()->subDay()->endOfDay();
                $comparisonStartDate = $now->copy()->subDays(2)->startOfDay();
                $comparisonEndDate = $now->copy()->subDays(2)->endOfDay();
                break;
            case 'last_7_days':
                $startDate = $now->copy()->subDays(6)->startOfDay();
                $comparisonStartDate = $now->copy()->subDays(13)->startOfDay();
                $comparisonEndDate = $now->copy()->subDays(7)->endOfDay();
                break;
            case 'this_month':
                $startDate = $now->copy()->startOfMonth();
                $comparisonStartDate = $now->copy()->subMonth()->startOfMonth();
                $comparisonEndDate = $now->copy()->subMonth()->endOfMonth();
                break;
            case 'last_month':
                $startDate = $now->copy()->subMonth()->startOfMonth();
                $endDate = $now->copy()->subMonth()->endOfMonth();
                $comparisonStartDate = $now->copy()->subMonths(2)->startOfMonth();
                $comparisonEndDate = $now->copy()->subMonths(2)->endOfMonth();
                break;
        }

        $startStr = $startDate->toDateString();
        $endStr = $endDate->toDateString();
        $compStartStr = $comparisonStartDate->toDateString();
        $compEndStr = $comparisonEndDate->toDateString();

        // 2. Base Queries & Role Scoping
        $salesBase = SalesInvoice::query();
        $shiftBase = Shift::query();
        $companyBase = Company::query();
        $companyIds = [];

        if (!$user->isSuperAdmin()) {
            if ($user->hasRole('admin') || $user->hasRole('manager')) {
                $companyIds = $user->companyAccess()->pluck('companies.id')->toArray();
                $salesBase->whereIn('company_id', $companyIds);
                $shiftBase->whereIn('company_id', $companyIds);
                $companyBase->whereIn('id', $companyIds);
            } else {
                $companyIds = [$user->company_id];
                $salesBase->where('company_id', $user->company_id);
                $shiftBase->where('company_id', $user->company_id);
                $companyBase->where('id', $user->company_id);
            }
        } else {
            $companyIds = Company::where('is_active', true)->pluck('id')->toArray();
        }

        // Apply Company Filter
        if ($companyId && $companyId !== 'all') {
            if (!$user->isSuperAdmin() && !in_array($companyId, $companyIds)) {
                abort(403, 'Unauthorized company access.');
            }
            $companyIds = [$companyId];
            $salesBase->where('company_id', $companyId);
            $shiftBase->where('company_id', $companyId);
            $companyBase->where('id', $companyId);
        }

        // Global exclusion for void/cancelled
        $salesBase->where('is_void', false)->where('status', '!=', 'cancelled');

        // 3. Main KPI Calculations
        $currentSales = (clone $salesBase)->whereBetween('working_date', [$startStr, $endStr])->where('invoice_type', 'sale')->sum('grand_total');
        $previousSales = (clone $salesBase)->whereBetween('working_date', [$compStartStr, $compEndStr])->where('invoice_type', 'sale')->sum('grand_total');

        $currentInvoices = (clone $salesBase)->whereBetween('working_date', [$startStr, $endStr])->where('invoice_type', 'sale')->count();
        $previousInvoices = (clone $salesBase)->whereBetween('working_date', [$compStartStr, $compEndStr])->where('invoice_type', 'sale')->count();

        $salesTrend = $previousSales > 0 ? (($currentSales - $previousSales) / $previousSales) * 100 : ($currentSales > 0 ? 100 : 0);
        $invoiceTrend = $previousInvoices > 0 ? (($currentInvoices - $previousInvoices) / $previousInvoices) * 100 : ($currentInvoices > 0 ? 100 : 0);

        // 4. Live Data
        $activeCompanies = (clone $companyBase)->where('is_active', true)->count();
        $activeCashiers = User::whereIn('company_id', $companyIds)
            ->where('is_active', true)
            ->whereHas('roles', fn($q) => $q->where('name', 'cashier'))
            ->count();
        $openShifts = (clone $shiftBase)->where('shift_status', 'OPEN')->count();

        // 5. Product KPIs
        $itemBase = SalesInvoiceItem::whereHas('salesInvoice', function ($q) use ($companyIds, $startStr, $endStr) {
            $q->whereIn('company_id', $companyIds)
                ->where('is_void', false)
                ->where('status', '!=', 'cancelled')
                ->whereBetween('working_date', [$startStr, $endStr])
                ->where('invoice_type', 'sale');
        });

        $totalUnitsSold = (clone $itemBase)->sum('qty');
        $totalPackTransactions = (clone $itemBase)->where('is_set', true)->count();
        $totalDefectiveUnits = (clone $itemBase)->where('is_b', true)->sum('qty');
        $totalDefectiveValue = (clone $itemBase)->where('is_b', true)->sum(DB::raw('(qty * sale_price) - line_discount'));

        $returnBase = SalesInvoice::whereIn('company_id', $companyIds)
            ->whereBetween('working_date', [$startStr, $endStr])
            ->where('invoice_type', 'return')
            ->where('is_void', false)->where('status', '!=', 'cancelled');
        $totalReturnValue = $returnBase->sum('grand_total');
        $totalReturnUnits = SalesInvoiceItem::whereHas('salesInvoice', function ($q) use ($companyIds, $startStr, $endStr) {
            $q->whereIn('company_id', $companyIds)
                ->whereBetween('working_date', [$startStr, $endStr])
                ->where('invoice_type', 'return')
                ->where('is_void', false)->where('status', '!=', 'cancelled');
        })->sum('qty');

        // 6. Company Performance (Build the array FIRST so Chart can use it)
        $companiesArray = [];
        $companyModels = (clone $companyBase)->where('is_active', true)->get();

        foreach ($companyModels as $company) {
            $sales = SalesInvoice::where('company_id', $company->id)
                ->whereBetween('working_date', [$startStr, $endStr])
                ->where('invoice_type', 'sale')->where('is_void', false)->where('status', '!=', 'cancelled')
                ->sum('grand_total');
            $invoices = SalesInvoice::where('company_id', $company->id)
                ->whereBetween('working_date', [$startStr, $endStr])
                ->where('invoice_type', 'sale')->where('is_void', false)->where('status', '!=', 'cancelled')
                ->count();
            $openShiftsComp = Shift::where('company_id', $company->id)->where('shift_status', 'OPEN')->count();

            $companiesArray[] = [
                'id' => $company->id,
                'name' => $company->name,
                'sales' => (float) $sales,
                'invoices' => $invoices,
                'open_shifts' => $openShiftsComp,
                'status' => 'Synced',
                'is_live' => $openShiftsComp > 0,
            ];
        }

        // 7. Top Designs
        $topDesigns = (clone $itemBase)
            ->select(
                'item_name',
                DB::raw('SUM(qty) as total_units'),
                DB::raw('SUM(CASE WHEN is_set = 1 THEN 1 ELSE 0 END) as pack_transactions'),
                DB::raw('SUM((qty * sale_price) - line_discount) as total_revenue')
            )
            ->groupBy('item_name')
            ->orderBy('total_revenue', 'desc')
            ->limit(5)
            ->get();

        // 8. Chart Data (Now using array access)
        $chartData = [];
        if (in_array($range, ['today', 'yesterday'])) {
            for ($i = 8; $i <= 22; $i++) {
                $hourString = str_pad($i, 2, '0', STR_PAD_LEFT) . ':00';
                $hStart = $startDate->copy()->setTime($i, 0, 0)->toDateTimeString();
                $hEnd = $startDate->copy()->setTime($i, 59, 59)->toDateTimeString();

                $series = [];
                foreach ($companiesArray as $c) {
                    $series[$c['id']] = SalesInvoice::where('company_id', $c['id'])
                        ->whereBetween('created_at', [$hStart, $hEnd]) // created_at for hourly charts
                        ->where('invoice_type', 'sale')->where('is_void', false)->where('status', '!=', 'cancelled')
                        ->sum('grand_total');
                }

                $chartData[] = [
                    'date' => $hourString,
                    'series' => $series
                ];
            }
        } else {
            for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
                $dStr = $date->toDateString();
                $series = [];
                foreach ($companiesArray as $c) {
                    $series[$c['id']] = SalesInvoice::where('company_id', $c['id'])
                        ->where('working_date', $dStr)
                        ->where('invoice_type', 'sale')->where('is_void', false)->where('status', '!=', 'cancelled')
                        ->sum('grand_total');
                }

                $chartData[] = [
                    'date' => $date->format('M d'),
                    'series' => $series
                ];
            }
        }

        // 9. System Health
        $failedJobs = DB::table('failed_jobs')->count();
        $pendingJobs = DB::table('jobs')->count();
        $stuckInvoices = SalesInvoice::whereIn('company_id', $companyIds)
            ->where('sync_status', 'pending')
            ->where('created_at', '<', now()->subMinutes(15))
            ->count();

        $lastSync = SyncLog::whereIn('company_id', $companyIds)
            ->where('status', 'success')
            ->orderBy('completed_at', 'desc')
            ->value('completed_at');

        return response()->json([
            'kpis' => [
                'today_sales' => (float) $currentSales,
                'today_invoices' => $currentInvoices,
                'active_companies' => $activeCompanies,
                'active_cashiers' => $activeCashiers,
                'open_shifts' => $openShifts,
                'sales_trend_percent' => round($salesTrend, 1),
                'invoice_trend_percent' => round($invoiceTrend, 1),
            ],
            'product_kpis' => [
                'units_sold' => (float) $totalUnitsSold,
                'pack_transactions' => $totalPackTransactions,
                'defective_units' => (float) $totalDefectiveUnits,
                'defective_value' => (float) $totalDefectiveValue,
                'return_units' => (float) $totalReturnUnits,
                'return_value' => (float) $totalReturnValue,
            ],
            'companies' => $companiesArray, // Use the array we built
            'top_designs' => $topDesigns,
            'chartData' => $chartData,
            'systemHealth' => [
                'erp_status' => ($stuckInvoices > 0 || $failedJobs > 0) ? 'warning' : 'healthy',
                'pending_jobs' => $pendingJobs,
                'failed_jobs' => $failedJobs,
                'stuck_invoices' => $stuckInvoices,
                'last_sync' => $lastSync ? Carbon::parse($lastSync)->diffForHumans() : 'Never',
            ]
        ]);
    }
}
