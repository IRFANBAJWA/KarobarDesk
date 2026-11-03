export interface DashboardData {
    kpis: {
        today_sales: number;
        today_invoices: number;
        active_companies: number;
        active_cashiers: number;
        open_shifts: number;
        sales_trend_percent: number;
        invoice_trend_percent: number;
    };
    companies: Array<{
        id: number;
        name: string;
        sales: number;
        invoices: number;
        cashiers: number;
        open_shifts: number;
        status: string;
        is_live: boolean;
    }>;
    chartData: Array<any>;
    systemHealth: {
        erp_status: string;
        pending_jobs: number;
        failed_jobs: number;
        stuck_invoices: number;
        last_sync: string;
    };
}