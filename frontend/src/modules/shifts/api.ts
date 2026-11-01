import { apiFetch } from "@/lib/apiFetch";
import type { Shift, ShiftDetail, ShiftAccountSummary } from "./types";

export async function listShifts(params: {
    page?: number;
    date?: string;
    status?: string;
    company_id?: number;
    user_id?: number;
}) {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page.toString());
    if (params.date) query.append("date", params.date);
    if (params.status) query.append("status", params.status);
    if (params.company_id) query.append("company_id", params.company_id.toString());
    if (params.user_id) query.append("user_id", params.user_id.toString());

    return apiFetch<{
        data: Shift[];
        meta: { current_page: number; last_page: number; total: number };
    }>(`/api/shifts?${query.toString()}`);
}

export async function getShift(id: number) {
    return apiFetch<{ 
        data: ShiftDetail; 
        account_summary: ShiftAccountSummary[] 
    }>(`/api/shifts/${id}`);
}

export async function listCompanies() {
    const res = await apiFetch<any>("/api/companies");
    
    // If apiFetch returns the full object: { data: [...] }
    if (res?.data && Array.isArray(res.data)) return res.data;
    
    // If apiFetch already unwrapped it: [...]
    if (Array.isArray(res)) return res;
    
    // Fallback
    return [];
}

export async function listUsers() {
    const res = await apiFetch<any>("/api/users");
    
    if (res?.data?.data && Array.isArray(res.data.data)) return res.data.data; // For paginated
    if (res?.data && Array.isArray(res.data)) return res.data;
    if (Array.isArray(res)) return res;
    
    return [];
}