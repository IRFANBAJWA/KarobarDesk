import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Pencil, RefreshCw, X } from "lucide-react";
import ActiveStatusBadge from "@/components/badges/ActiveStatusBadge";
import SyncStatusBadge from "@/components/badges/SyncStatusBadge";
import { getCustomer } from "../api";
import type { Customer } from "../types";

interface Props {
    customer: Customer | null;
    onClose: () => void;
    onEdit: (c: Customer) => void;
}

function formatCurrency(v: string | null): string {
    if (v === null || v === undefined || v === "") return "—";
    const n = Number(v);
    if (Number.isNaN(n)) return String(v);
    return n.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-right text-sm text-foreground">
                {value || "—"}
            </span>
        </div>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="border-t border-white/5 py-4 first:border-t-0 first:pt-0">
            <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {title}
            </h3>
            <div className="divide-y divide-white/5">{children}</div>
        </div>
    );
}

export default function CustomerDetailDrawer({
    customer,
    onClose,
    onEdit,
}: Props) {
    const [current, setCurrent] = useState<Customer | null>(customer);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setCurrent(customer);
        setError(null);
    }, [customer]);

    useEffect(() => {
        function onEsc(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        if (customer) {
            document.addEventListener("keydown", onEsc);
            return () => document.removeEventListener("keydown", onEsc);
        }
    }, [customer, onClose]);

    if (!customer || !current) return null;

    async function refresh() {
        setRefreshing(true);
        setError(null);
        try {
            const res = await getCustomer(current!.id);
            setCurrent(res.data);
        } catch (e) {
            setError(
                e instanceof Error ? e.message : "Failed to refresh customer.",
            );
        } finally {
            setRefreshing(false);
        }
    }

    const content = (
        <>
            <div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />
            <aside className="fixed right-0 top-0 z-50 flex h-[100dvh] max-h-[100dvh] w-full max-w-md flex-col border-l border-white/10 bg-neutral-950/95 shadow-2xl backdrop-blur-xl">
                <header className="shrink-0 border-b border-white/10 px-6 py-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <h2 className="truncate text-lg font-semibold tracking-tight">
                                {current.customer_name}
                            </h2>
                            <p className="truncate text-xs text-muted-foreground">
                                {current.erpnext_customer}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar px-6 py-4">
                    {error && (
                        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
                            {error}
                        </div>
                    )}

                    <Section title="Status">
                        <Row
                            label="Active"
                            value={
                                <ActiveStatusBadge active={current.is_active} />
                            }
                        />
                        <Row
                            label="Sync"
                            value={
                                <SyncStatusBadge status={current.sync_status} />
                            }
                        />
                        <Row
                            label="Type"
                            value={current.customer_type ?? "Individual"}
                        />
                        {current.loyalty_member && (
                            <Row label="Loyalty" value="Member" />
                        )}
                    </Section>

                    <Section title="Contact">
                        <Row label="Phone" value={current.phone ?? "—"} />
                        <Row label="Email" value={current.email ?? "—"} />
                    </Section>

                    <Section title="Address">
                        <Row label="Address" value={current.address ?? "—"} />
                        <Row label="City" value={current.city ?? "—"} />
                        <Row label="Country" value={current.country ?? "—"} />
                    </Section>

                    <Section title="Financial">
                        <Row
                            label="Credit limit"
                            value={formatCurrency(current.credit_limit)}
                        />
                        <Row
                            label="Balance"
                            value={formatCurrency(current.current_balance)}
                        />
                        <Row
                            label="Tax number"
                            value={current.tax_number ?? "—"}
                        />
                    </Section>

                    <Section title="Loyalty">
                        <Row
                            label="Card"
                            value={current.loyalty_card_number ?? "—"}
                        />
                        <Row
                            label="Points"
                            value={current.loyalty_points ?? "—"}
                        />
                        <Row
                            label="Program"
                            value={current.loyalty_program ?? "—"}
                        />
                        <Row
                            label="Expiry"
                            value={current.loyalty_expiry ?? "—"}
                        />
                        <Row
                            label="Discount"
                            value={
                                current.special_discount
                                    ? `${current.special_discount}%`
                                    : "—"
                            }
                        />
                    </Section>

                    <Section title="Linked records">
                        <Row
                            label="Sales invoices"
                            value={current.sales_invoices_count ?? 0}
                        />
                        <Row
                            label="Rejected sales"
                            value={current.rejected_sales_count ?? 0}
                        />
                    </Section>

                    <Section title="Sync">
                        <Row
                            label="Last synced"
                            value={formatDateTime(current.last_synced_at)}
                        />
                        <Row
                            label="ERPNext modified"
                            value={formatDateTime(current.erpnext_modified_at)}
                        />
                    </Section>

                    <Section title="Record">
                        <Row label="ID" value={current.id} />
                        <Row
                            label="Created"
                            value={formatDateTime(current.created_at)}
                        />
                        <Row
                            label="Updated"
                            value={formatDateTime(current.updated_at)}
                        />
                    </Section>
                </div>

                <footer className="shrink-0 border-t border-white/10 px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={refresh}
                            disabled={refreshing}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-foreground disabled:opacity-50"
                        >
                            <RefreshCw
                                className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
                            />{" "}
                            Refresh
                        </button>
                        <button
                            onClick={() => onEdit(current)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-violet-600 px-3 text-sm font-medium text-white transition hover:bg-violet-500"
                        >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                    </div>
                </footer>
            </aside>
        </>
    );

    return createPortal(content, document.body);
}
