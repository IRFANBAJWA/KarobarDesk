import { apiFetch } from "@/lib/apiFetch";
import type { SaleInvoice, SaleDetail } from "./types";

export interface ListSalesParams {
    invoice_type?: string;
    status?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
    company_id?: string;
    page?: number;
}

export interface ListSalesResponse {
    data: SaleInvoice[];
    meta: { current_page: number; last_page: number; total: number; };
}

export async function listSales(params: ListSalesParams = {}): Promise<ListSalesResponse> {
    const query = new URLSearchParams();
    
    // Force add a timestamp to bypass any browser caching
    query.append("_t", String(Date.now()));

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            query.append(key, String(value));
        }
    });

    const path = `/api/sales?${query.toString()}`;
    return apiFetch<ListSalesResponse>(path);
}

export async function getSale(id: number): Promise<{ data: SaleDetail }> {
    return apiFetch<{ data: SaleDetail }>(`/api/sales/${id}?_t=${Date.now()}`);
}