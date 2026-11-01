import { apiFetch } from "@/lib/apiFetch";
import type { JournalEntry, JournalEntryDetail } from "./types";

export async function listJournalEntries(params: {
    page?: number;
    date?: string;
    search?: string;
}) {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page.toString());
    if (params.date) query.append("date", params.date);
    if (params.search) query.append("search", params.search);

    return apiFetch<{
        data: JournalEntry[];
        meta: { current_page: number; last_page: number; total: number };
    }>(`/api/journal-entries?${query.toString()}`);
}

export async function getJournalEntry(id: number) {
    return apiFetch<{ data: JournalEntryDetail }>(`/api/journal-entries/${id}`);
}