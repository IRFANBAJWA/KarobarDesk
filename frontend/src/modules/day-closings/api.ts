import { apiFetch } from "@/lib/apiFetch";
import type { DayClosingSummary, DayClosingDetail } from "./types";

export async function listDayClosings(params: {
    date?: string;
    company_id?: number;
}) {
    const query = new URLSearchParams();
    if (params.date) query.append("date", params.date);
    if (params.company_id) query.append("company_id", params.company_id.toString());

    return apiFetch<{ data: DayClosingSummary[] }>(`/api/day-closings?${query.toString()}`);
}

export async function getDayClosing(id: string) {
    return apiFetch<DayClosingDetail>(`/api/day-closings/${id}`);
}