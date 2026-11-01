<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use App\Models\ShiftDenomination;
use App\Models\DayClosing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PosShiftController extends Controller
{
    public function sync(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_id' => 'required|exists:companies,id',
            'till_operation_id' => 'required|exists:till_operations,id',
            'user_id' => 'required|exists:users,id',
            'shift_code' => 'required|string',
            'shift_date' => 'required|date_format:Y-m-d',
            'action' => 'required|in:open,close',

            // Opening fields
            'start_time' => 'required_if:action,open|date',
            'opening_balance' => 'required_if:action,open|numeric',
            'opening_denominations' => 'required_if:action,open|array',

            // Closing fields
            'end_time' => 'nullable|date',
            'closing_balance' => 'nullable|numeric',
            'actual_cash' => 'nullable|numeric',
            'total_sales' => 'nullable|numeric',
            'total_returns' => 'nullable|numeric',
            'closing_denominations' => 'nullable|array',
        ]);

        return DB::transaction(function () use ($validated) {
            $shift = Shift::where('shift_code', $validated['shift_code'])
                ->where('company_id', $validated['company_id'])
                ->first();

            if ($validated['action'] === 'open') {
                if ($shift) {
                    return response()->json(['message' => 'Shift already open.', 'data' => $shift], 200);
                }

                $shift = Shift::create([
                    'shift_code' => $validated['shift_code'],
                    'company_id' => $validated['company_id'],
                    'till_operation_id' => $validated['till_operation_id'],
                    'user_id' => $validated['user_id'],
                    'shift_date' => $validated['shift_date'],
                    'start_time' => Carbon::parse($validated['start_time']),
                    'opening_balance' => $validated['opening_balance'],
                    'expected_cash' => $validated['opening_balance'],
                    'shift_status' => 'OPEN',
                ]);

                $this->saveDenominations($shift->id, 'OPENING', $validated['opening_denominations']);

                return response()->json(['message' => 'Shift opened.', 'data' => $shift], 201);
            }

            if ($validated['action'] === 'close') {
                if (!$shift || $shift->shift_status === 'CLOSED') {
                    return response()->json(['message' => 'Shift not found or already closed.'], 404);
                }

                $endTime = Carbon::parse($validated['end_time']);
                $startTime = Carbon::parse($shift->start_time);
                $workingHours = $startTime->diffInMinutes($endTime) / 60;

                $expectedCash = $shift->opening_balance + ($validated['total_sales'] ?? 0) - ($validated['total_returns'] ?? 0);
                $difference = ($validated['actual_cash'] ?? 0) - $expectedCash;

                $shift->update([
                    'end_time' => $endTime,
                    'closing_balance' => $validated['closing_balance'],
                    'actual_cash' => $validated['actual_cash'],
                    'expected_cash' => $expectedCash,
                    'cash_difference' => $difference,
                    'total_sales' => $validated['total_sales'] ?? 0,
                    'total_returns' => $validated['total_returns'] ?? 0,
                    'working_hours' => round($workingHours, 2),
                    'shift_status' => 'CLOSED',
                ]);

                if (isset($validated['closing_denominations'])) {
                    $this->saveDenominations($shift->id, 'CLOSING', $validated['closing_denominations']);
                }

                // ⭐ TRIGGER CASHIER DAY CLOSING ⭐
                $this->generateCashierDayClosing($shift);

                return response()->json(['message' => 'Shift closed.', 'data' => $shift], 200);
            }
        });
    }

    private function saveDenominations(int $shiftId, string $type, array $denoms): void
    {
        $data = array_merge([
            'shift_id' => $shiftId,
            'denomination_type' => $type,
            'd5000' => 0,
            'd1000' => 0,
            'd500' => 0,
            'd100' => 0,
            'd50' => 0,
            'd20' => 0,
            'd10' => 0,
            'd5' => 0,
            'd2' => 0,
            'd1' => 0,
            'c50' => 0,
            'c25' => 0,
            'c10' => 0,
            'c5' => 0,
            'c1' => 0,
        ], $denoms);

        ShiftDenomination::create($data);
    }

    /**
     * ⭐ Auto-Generate Day Closing for the Cashier ⭐
     */
    private function generateCashierDayClosing(Shift $closedShift)
    {
        // 1. Check if this cashier has any other open shifts today
        $hasOpenShifts = Shift::where('company_id', $closedShift->company_id)
            ->where('user_id', $closedShift->user_id)
            ->whereDate('shift_date', $closedShift->shift_date)
            ->where('shift_status', 'OPEN')
            ->exists();

        if ($hasOpenShifts) {
            return; // Cashier is still working, don't close the day yet.
        }

        // 2. Fetch all of this cashier's closed shifts for today
        $shifts = Shift::where('company_id', $closedShift->company_id)
            ->where('user_id', $closedShift->user_id)
            ->whereDate('shift_date', $closedShift->shift_date)
            ->where('shift_status', 'CLOSED')
            ->get();

        // ⭐ 3. Calculate Total Expenses from Journal Entries ⭐
        $totalExpenses = \App\Models\JournalEntry::where('company_id', $closedShift->company_id)
            ->where('user_id', $closedShift->user_id)
            ->whereDate('posting_date', $closedShift->shift_date)
            ->sum('total_debit'); // Assuming total_debit is the expense amount


        // 4. Generate / Update the Day Closing record for this cashier
        DayClosing::updateOrCreate(
            [
                'company_id' => $closedShift->company_id,
                'user_id' => $closedShift->user_id,
                'business_date' => $closedShift->shift_date,
            ],
            [
                'till_operation_id' => $closedShift->till_operation_id,
                'closing_user_id' => $closedShift->user_id,
                'shift_count' => $shifts->count(),
                'total_transactions' => $shifts->sum('total_transactions'),
                'sale_count' => $shifts->sum('sale_count'),
                'return_count' => $shifts->sum('return_count'),
                'void_count' => $shifts->sum('void_count'),
                'total_sales' => $shifts->sum('total_sales'),
                'cash_sales' => $shifts->sum('cash_sales'),
                'card_sales' => $shifts->sum('card_sales'),
                'other_sales' => $shifts->sum('other_sales'),
                'total_discount' => $shifts->sum('total_discount'),
                'total_tax' => $shifts->sum('total_tax'),
                'total_returns' => $shifts->sum('total_returns'),
                'total_expenses' => $totalExpenses,
                'opening_balance' => $shifts->sum('opening_balance'),
                'closing_balance' => $shifts->sum('closing_balance'),
                'expected_cash' => $shifts->sum('expected_cash'),
                'actual_cash' => $shifts->sum('actual_cash'),
                'cash_difference' => $shifts->sum('cash_difference'),
                'closing_time' => now(),
                'status' => 'closed',
            ]
        );
    }
    private function generateCashierDayClosing(Shift $closedShift)
    {
        // 1. Check if this cashier has any other open shifts today
        $hasOpenShifts = Shift::where('company_id', $closedShift->company_id)
            ->where('user_id', $closedShift->user_id)
            ->whereDate('shift_date', $closedShift->shift_date)
            ->where('shift_status', 'OPEN')
            ->exists();

        if ($hasOpenShifts) {
            return; // Cashier is still working, don't close the day yet.
        }

        // 2. Fetch all of this cashier's closed shifts for today
        $shifts = Shift::where('company_id', $closedShift->company_id)
            ->where('user_id', $closedShift->user_id)
            ->whereDate('shift_date', $closedShift->shift_date)
            ->where('shift_status', 'CLOSED')
            ->get();

        // ⭐ 3. Calculate Total Expenses from Journal Entries ⭐
        $totalExpenses = \App\Models\JournalEntry::where('company_id', $closedShift->company_id)
            ->where('user_id', $closedShift->user_id)
            ->whereDate('posting_date', $closedShift->shift_date)
            ->sum('total_debit'); // Assuming total_debit is the expense amount

        // 4. Generate / Update the Day Closing record for this cashier
        \App\Models\DayClosing::updateOrCreate(
            [
                'company_id' => $closedShift->company_id,
                'user_id' => $closedShift->user_id,
                'business_date' => $closedShift->shift_date,
            ],
            [
                'till_operation_id' => $closedShift->till_operation_id,
                'closing_user_id' => $closedShift->user_id,
                'shift_count' => $shifts->count(),
                'total_transactions' => $shifts->sum('total_transactions'),
                'sale_count' => $shifts->sum('sale_count'),
                'return_count' => $shifts->sum('return_count'),
                'void_count' => $shifts->sum('void_count'),
                'total_sales' => $shifts->sum('total_sales'),
                'cash_sales' => $shifts->sum('cash_sales'),
                'card_sales' => $shifts->sum('card_sales'),
                'other_sales' => $shifts->sum('other_sales'),
                'total_discount' => $shifts->sum('total_discount'),
                'total_tax' => $shifts->sum('total_tax'),
                'total_returns' => $shifts->sum('total_returns'),
                'total_expenses' => $totalExpenses, // ⭐ Use the calculated value
                'opening_balance' => $shifts->sum('opening_balance'),
                'closing_balance' => $shifts->sum('closing_balance'),
                'expected_cash' => $shifts->sum('expected_cash'),
                'actual_cash' => $shifts->sum('actual_cash'),
                'cash_difference' => $shifts->sum('cash_difference'),
                'closing_time' => now(),
                'status' => 'closed',
            ]
        );
    }
}
