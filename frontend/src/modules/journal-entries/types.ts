export interface JournalEntry {
    id: number;
    entry_number: string;
    posting_date: string;
    voucher_type: string;
    title: string;
    total_debit: string;
    total_credit: string;
    erpnext_jv_reference: string | null;
    sync_status: string;
    user?: { name: string };
    company?: { name: string };
    created_at: string;
}

export interface JournalEntryDetail extends JournalEntry {
    user_remark: string | null;
    accounts: Array<{
        id: number;
        erpnext_account: string;
        account_name: string;
        debit: string;
        credit: string;
        user_remark: string | null;
    }>;
}

export interface CreateJournalEntryPayload {
    company_id: number;
    posting_date: string;
    title: string;
    user_remark?: string;
    total_amount: number;
    expense_account_id: number;
    payment_account_id: number;
}