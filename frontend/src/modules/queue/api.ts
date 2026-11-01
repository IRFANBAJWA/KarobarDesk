import { apiFetch } from "@/lib/apiFetch";

export async function getQueueStats() {
    return apiFetch<{
        pending_jobs: Job[];
        failed_jobs: FailedJob[];
        stuck_invoices: StuckInvoice[];
    }>("/api/admin/queue/stats");
}

export async function retryFailedJob(uuid: string) {
    return apiFetch(`/api/admin/queue/retry-job/${uuid}`, { method: "POST" });
}

export async function retryInvoice(id: number) {
    return apiFetch(`/api/admin/queue/retry-invoice/${id}`, { method: "POST" });
}