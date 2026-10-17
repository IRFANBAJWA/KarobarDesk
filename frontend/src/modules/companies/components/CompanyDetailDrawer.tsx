import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    X,
    Loader2,
    Power,
    PowerOff,
    Building2,
    Hash,
    RefreshCw,
} from "lucide-react";

import { cn } from "@/lib/utils";
import SyncStatusBadge from "@/components/badges/SyncStatusBadge";
import ActiveStatusBadge from "@/components/badges/ActiveStatusBadge";
import { getCompany } from "../api";
import type { Company } from "../types";

interface Props {
    open: boolean;
    company: Company | null;
    onClose: () => void;
    onToggleActive: (company: Company) => void;
    onCompanyUpdated: (company: Company) => void;
    toggling?: boolean;
}

function formatDateTime(iso: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function CompanyDetailDrawer({
    open,
    company,
    onClose,
    onToggleActive,
    onCompanyUpdated,
    toggling = false,
}: Props) {
    const [current, setCurrent] = useState<Company | null>(company);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Mirror prop into local state when it changes
    useEffect(() => {
        setCurrent(company);
        setError(null);
    }, [company]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    async function handleRefresh() {
        if (!current) return;
        setRefreshing(true);
        setError(null);
        try {
            const fresh = await getCompany(current.id);
            setCurrent(fresh);
            onCompanyUpdated(fresh);
        } catch (e: any) {
            setError(e?.message ?? "Failed to refresh.");
        } finally {
            setRefreshing(false);
        }
    }

    if (!open || !current) return null;

    const content = (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel — h-[100dvh] matches the visible viewport exactly */}
            <aside
                className="fixed right-0 top-0 z-50 flex h-[100dvh] max-h-[100dvh] w-full max-w-md flex-col border-l border-white/10 bg-neutral-950/95 shadow-2xl backdrop-blur-xl"
                role="dialog"
                aria-modal="true"
            >
                {/* Header — fixed */}
                <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 p-5">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <h2 className="truncate text-lg font-semibold">
                                {current.name}
                            </h2>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {current.erpnext_company ?? "No ERPNext link"}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </header>

                {/* Body — scrollable, min-h-0 keeps footer pinned */}
                <div className="no-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
                    {error && (
                        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Status */}
                    <section className="flex flex-wrap items-center gap-2">
                        <ActiveStatusBadge active={current.is_active} />
                        <SyncStatusBadge status={current.sync_status} />
                    </section>

                    {/* Identity */}
                    <section className="space-y-3">
                        <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            Identity
                        </h3>
                        <dl className="grid grid-cols-3 gap-y-3 text-sm">
                            <dt className="text-muted-foreground">Name</dt>
                            <dd className="col-span-2 font-medium">
                                {current.name}
                            </dd>

                            <dt className="text-muted-foreground">Code</dt>
                            <dd className="col-span-2 font-mono text-xs text-muted-foreground">
                                {current.code}
                            </dd>

                            <dt className="text-muted-foreground">ERPNext</dt>
                            <dd className="col-span-2">
                                {current.erpnext_company ?? (
                                    <span className="opacity-40">—</span>
                                )}
                            </dd>
                        </dl>
                    </section>

                    {/* Counts */}
                    <section className="space-y-3">
                        <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            Linked records
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            <Stat label="Users" value={current.users_count} />
                            <Stat
                                label="Accounts"
                                value={current.accounts_count}
                            />
                            <Stat
                                label="Tills"
                                value={current.till_operations_count}
                            />
                        </div>
                    </section>

                    {/* Sync */}
                    <section className="space-y-3">
                        <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            Sync
                        </h3>
                        <dl className="grid grid-cols-3 gap-y-3 text-sm">
                            <dt className="text-muted-foreground">Status</dt>
                            <dd className="col-span-2">
                                <SyncStatusBadge status={current.sync_status} />
                            </dd>

                            <dt className="text-muted-foreground">
                                Last synced
                            </dt>
                            <dd className="col-span-2">
                                {formatDateTime(current.last_synced_at)}
                            </dd>

                            <dt className="text-muted-foreground">
                                ERPNext mod.
                            </dt>
                            <dd className="col-span-2">
                                {formatDateTime(current.erpnext_modified_at)}
                            </dd>
                        </dl>
                    </section>

                    {/* Record */}
                    <section className="space-y-3">
                        <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            Record
                        </h3>
                        <dl className="grid grid-cols-3 gap-y-3 text-sm">
                            <dt className="text-muted-foreground">ID</dt>
                            <dd className="col-span-2 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                                <Hash className="h-3 w-3" />
                                {current.id}
                            </dd>

                            <dt className="text-muted-foreground">Created</dt>
                            <dd className="col-span-2">
                                {formatDateTime(current.created_at)}
                            </dd>

                            <dt className="text-muted-foreground">Updated</dt>
                            <dd className="col-span-2">
                                {formatDateTime(current.updated_at)}
                            </dd>
                        </dl>
                    </section>
                </div>

                {/* Footer — fixed, always visible */}
                <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-white/10 bg-neutral-950/95 p-4">
                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-foreground disabled:opacity-50"
                    >
                        {refreshing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                        Refresh
                    </button>

                    <button
                        type="button"
                        onClick={() => onToggleActive(current)}
                        disabled={toggling}
                        className={cn(
                            "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition disabled:opacity-50",
                            current.is_active
                                ? "border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
                        )}
                    >
                        {toggling ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : current.is_active ? (
                            <PowerOff className="h-4 w-4" />
                        ) : (
                            <Power className="h-4 w-4" />
                        )}
                        {current.is_active ? "Deactivate" : "Activate"}
                    </button>
                </footer>
            </aside>
        </>
    );

    return createPortal(content, document.body);
}

/* ------------------------------------------------------------------ */

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {label}
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums">
                {value}
            </div>
        </div>
    );
}
