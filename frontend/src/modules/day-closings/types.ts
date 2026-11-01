export interface DayClosingSummary {
    id: number;
    business_date: string;
    company_id: number;
    company_name: string;
    user_id: number;
    user?: { name: string };
    
    // Transactions
    total_transactions: number;
    sale_count: number;
    return_count: number;
    void_count: number;
    
    // Sales
    total_sales: string;
    cash_sales: string;
    card_sales: string;
    other_sales: string;
    total_discount: string;
    total_tax: string;
    total_returns: string;
    
    // Cash
    opening_balance: string;
    total_expenses: string;
    expected_cash: string;
    actual_cash: string;
    cash_difference: string;
    
    shift_count: number;
    status: string;
    closing_time: string;
}

export interface DayClosingDetail {
    data: DayClosingSummary;
    denominations: {
        d5000: number; d1000: number; d500: number; d100: number;
        d50: number; d20: number; d10: number; d5: number; d2: number; d1: number;
        c50: number; c25: number; c10: number; c5: number; c1: number;
    };
}