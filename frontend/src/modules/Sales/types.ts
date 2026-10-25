export interface SaleInvoice {
    id: number;
    invoice_number: string;
    invoice_type: 'sale' | 'return';
    status: 'paid' | 'unpaid' | 'partial';
    grand_total: string;
    total_paid: string;
    invoice_date: string;
    invoice_time: string;
    created_at: string;
    customer: { customer_name: string; phone: string } | null;
    user: { name: string };
}

export interface SaleDetail extends SaleInvoice {
    items: {
        id: number;
        item_name: string;
        qty: string;
        sale_price: string;
        line_total: string; // You may need to compute this in frontend or backend
    }[];
    payments: {
        id: number;
        payment_method: string;
        payment_amount: string;
        account: { name: string };
    }[];
}