export interface Job {
    id: number;
    queue: string;
    attempts: number;
    created_at: string;
}

export interface FailedJob {
    id: number;
    uuid: string;
    queue: string;
    exception: string;
    failed_at: string;
}

export interface StuckInvoice {
    id: number;
    invoice_number: string;
    sync_status: string;
    sync_error: string | null;
    sync_attempts: number;
    created_at: string;
}