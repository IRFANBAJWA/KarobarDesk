export interface Shift {
    id: number;
    shift_code: string;
    shift_date: string;
    shift_type: string;
    start_time: string;
    end_time: string | null;
    opening_balance: string;
    closing_balance: string;
    expected_cash: string;
    actual_cash: string;
    cash_difference: string;
    total_sales: string;
    total_returns: string;
    // working_hours: string | null; // ❌ REMOVED: We calculate this in the UI now
    shift_status: 'OPEN' | 'CLOSED';
    user?: { name: string };
    till_operation?: { till_no: string; shop_name: string };
}

// ⭐ Added the Account Summary interface
export interface ShiftAccountSummary {
    account_name: string;
    total_amount: string;
}

export interface ShiftDetail extends Shift {
    closed_by?: { name: string };
    denominations?: Array<{
        denomination_type: 'OPENING' | 'CLOSING';
        d5000: number; d1000: number; d500: number; d100: number;
        d50: number; d20: number; d10: number; d5: number; d2: number; d1: number;
        c50: number; c25: number; c10: number; c5: number; c1: number;
    }>;
    account_summary?: ShiftAccountSummary[]; // ⭐ Added to the detail type
}