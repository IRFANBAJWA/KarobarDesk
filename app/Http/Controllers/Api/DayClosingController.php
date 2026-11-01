<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DayClosing;
use App\Models\Shift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DayClosingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = DayClosing::with(['user:id,name', 'company:id,name']);

        // Role Security
        if (!$user->isSuperAdmin()) {
            if ($user->hasRole('admin') || $user->hasRole('manager')) {
                $allowedCompanyIds = $user->companyAccess()->pluck('companies.id')->toArray();
                $query->whereIn('company_id', $allowedCompanyIds);
            } else {
                $query->where('user_id', $user->id)->where('company_id', $user->company_id);
            }
        }

        if ($request->query('date')) {
            $query->whereDate('business_date', $request->query('date'));
        }

        $paginator = $query->orderByDesc('business_date')->paginate(50);

        // Map to add company_name to the root level
        $items = collect($paginator->items())->map(function ($dc) {
            return [
                'id' => $dc->id,
                'business_date' => $dc->business_date->format('Y-m-d'),
                'company_id' => $dc->company_id,
                'company_name' => $dc->company->name ?? 'Unknown',
                'user_id' => $dc->user_id,
                'user' => $dc->user,
                'total_transactions' => $dc->total_transactions,
                'sale_count' => $dc->sale_count,
                'return_count' => $dc->return_count,
                'void_count' => $dc->void_count,
                'total_sales' => $dc->total_sales,
                'cash_sales' => $dc->cash_sales,
                'card_sales' => $dc->card_sales,
                'other_sales' => $dc->other_sales,
                'total_discount' => $dc->total_discount,
                'total_tax' => $dc->total_tax,
                'total_returns' => $dc->total_returns,
                'opening_balance' => $dc->opening_balance,
                'total_expenses' => $dc->total_expenses,
                'expected_cash' => $dc->expected_cash,
                'actual_cash' => $dc->actual_cash,
                'cash_difference' => $dc->cash_difference,
                'shift_count' => $dc->shift_count,
                'status' => $dc->status,
                'closing_time' => $dc->closing_time,
            ];
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

    public function show(int $id): JsonResponse
    {
        $dayClosing = DayClosing::with(['user:id,name', 'company:id,name'])->findOrFail($id);

        // Fetch shifts to get the closing denominations
        $shifts = Shift::where('company_id', $dayClosing->company_id)
            ->where('user_id', $dayClosing->user_id)
            ->whereDate('shift_date', $dayClosing->business_date)
            ->with('denominations')
            ->get();

        $closingDenoms = $shifts->flatMap->denominations->where('denomination_type', 'CLOSING');

        $denominations = [
            'd5000' => $closingDenoms->sum('d5000'),
            'd1000' => $closingDenoms->sum('d1000'),
            'd500'  => $closingDenoms->sum('d500'),
            'd100'  => $closingDenoms->sum('d100'),
            'd50'   => $closingDenoms->sum('d50'),
            'd20'   => $closingDenoms->sum('d20'),
            'd10'   => $closingDenoms->sum('d10'),
            'd5'    => $closingDenoms->sum('d5'),
            'd2'    => $closingDenoms->sum('d2'),
            'd1'    => $closingDenoms->sum('d1'),
            'c50'   => $closingDenoms->sum('c50'),
            'c25'   => $closingDenoms->sum('c25'),
            'c10'   => $closingDenoms->sum('c10'),
            'c5'    => $closingDenoms->sum('c5'),
            'c1'    => $closingDenoms->sum('c1'),
        ];

        return response()->json([
            'data' => $dayClosing,
            'denominations' => $denominations
        ]);
    }
}
