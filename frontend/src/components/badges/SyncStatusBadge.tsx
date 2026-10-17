// src/components/badges/SyncStatusBadge.tsx
import { cn } from "@/lib/utils";

export type SyncStatus =
    | "pending"
    | "processing"
    | "synced"
    | "failed"
    | "retrying"
    | string
    | null;

interface Props {
    status: SyncStatus | string | null | undefined;
}

const STYLES: Record<string, string> = {
    synced: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    processing: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    retrying: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    failed: "border-red-500/30 bg-red-500/10 text-red-300",
};

const LABELS: Record<string, string> = {
    synced: "Synced",
    pending: "Pending",
    processing: "Processing",
    retrying: "Retrying",
    failed: "Failed",
};

export default function SyncStatusBadge({ status }: Props) {
    const key = (status ?? "").toLowerCase();
    const style =
        STYLES[key] ?? "border-white/10 bg-white/5 text-muted-foreground";
    const label = LABELS[key] ?? (status ? String(status) : "Unknown");

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                style,
            )}
        >
            {label}
        </span>
    );
}
