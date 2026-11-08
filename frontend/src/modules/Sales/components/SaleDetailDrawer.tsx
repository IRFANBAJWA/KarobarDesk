import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    X,
    Loader2,
    Receipt,
    CreditCard,
    User,
    RefreshCw,
    RotateCcw,
} from "lucide-react";
import { getSale, retrySync } from "../api"; // Assuming you have a retrySync API function
import type { SaleDetail } from "../types";
import SyncStatusBadge from "@/components/badges/SyncStatusBadge";

const formatPKR = (value: number) =>
    `Rs ${Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

export default function SaleDetailDrawer({
    saleId,
    onClose,
}: {
    saleId: number | null;
    onClose: () => void;
}) {
    const [sale, setSale] = useState<SaleDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        if (saleId) {
            setLoading(true);
            getSale(saleId).then((res) => {
                setSale(res.data);
                setLoading(false);
            });
        }
    }, [saleId]);

    const handleRetrySync = async () => {
        if (!sale) return;
        try {
            setSyncing(true);
            await retrySync(sale.id);
            // Re-fetch to get the latest status
            const res = await getSale(sale.id);
            setSale(res.data);
        } catch (err) {
            console.error("Failed to retry sync", err);
        } finally {
            setSyncing(false);
        }
    };

    if (!saleId) return null;

    const content = (
        <>
            <div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <aside className="fixed right-0 top-0 z-50 flex h-[100dvh] w-full max-w-md flex-col border-l border-white/10 bg-[#0a0a0f]/95 shadow-2xl backdrop-blur-xl">
                <header className="shrink-0 border-b border-white/10 px-6 py-4 flex justify-between items-center bg-white/[0.02]">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-violet-400" />
                            {sale?.invoice_number || "Loading..."}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span
                                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${sale?.invoice_type === "return" ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}
                            >
                                {sale?.invoice_type}
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                {sale?.status}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
                    {loading || !sale ? (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                        </div>
                    ) : (
                        <>
                            {/* Original Invoice Link for Returns */}
                            {sale.invoice_type === "return" &&
                                (sale as any).original_invoice && (
                                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-3">
                                        <RotateCcw className="h-5 w-5 text-red-400" />
                                        <div>
                                            <p className="text-xs text-red-400 font-medium">
                                                Return against Invoice
                                            </p>
                                            <p className="text-sm font-bold text-white mt-0.5">
                                                {
                                                    (sale as any)
                                                        .original_invoice
                                                        .invoice_number
                                                }
                                            </p>
                                        </div>
                                    </div>
                                )}

                            {/* Customer Info */}
                            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                                    <User className="h-4 w-4" /> Customer
                                </h3>
                                <p className="text-sm font-medium text-white">
                                    {sale.customer?.customer_name ||
                                        "Walk-in Customer"}
                                </p>
                                {sale.customer?.phone && (
                                    <p className="text-xs text-slate-400 mt-1">
                                        {sale.customer.phone}
                                    </p>
                                )}
                            </div>

                            {/* Items List */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 pb-2">
                                    Items
                                </h3>
                                {sale.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex justify-between items-start text-sm"
                                    >
                                        <div>
                                            <p className="text-white font-medium">
                                                {item.item_name}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {item.qty} pcs @{" "}
                                                {formatPKR(
                                                    Number(item.sale_price),
                                                )}
                                                {/* Show IsB/IsSet flags */}
                                                {item.is_b && (
                                                    <span className="ml-2 text-[9px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded uppercase font-bold">
                                                        IsB
                                                    </span>
                                                )}
                                                {item.is_set && (
                                                    <span className="ml-2 text-[9px] bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded uppercase font-bold">
                                                        IsSet
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <p className="font-bold text-white tabular-nums">
                                            {formatPKR(
                                                Number(item.qty) *
                                                    Number(item.sale_price),
                                            )}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* ERPNext Sync Status */}
                            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    ERPNext Sync
                                </h3>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">
                                        Status
                                    </span>
                                    <SyncStatusBadge
                                        status={sale.sync_status}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">
                                        Reference
                                    </span>
                                    <span className="font-mono text-xs text-white">
                                        {sale.erpnext_invoice_reference || "—"}
                                    </span>
                                </div>

                                {sale.sync_status === "failed" && (
                                    <div className="rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20 mt-2">
                                        <p className="font-semibold mb-1">
                                            Error:
                                        </p>
                                        <p className="opacity-90">
                                            {sale.sync_error}
                                        </p>
                                    </div>
                                )}

                                {/* Retry Button for Failed Syncs */}
                                {sale.sync_status === "failed" && (
                                    <button
                                        onClick={handleRetrySync}
                                        disabled={syncing}
                                        className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-bold text-white transition-colors disabled:opacity-50"
                                    >
                                        <RefreshCw
                                            className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`}
                                        />
                                        {syncing ? "Retrying..." : "Retry Sync"}
                                    </button>
                                )}
                            </div>

                            {/* Payments List */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 pb-2 flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" /> Payments
                                </h3>
                                {sale.payments.map((pmt) => (
                                    <div
                                        key={pmt.id}
                                        className="flex justify-between text-sm"
                                    >
                                        <div>
                                            <p className="text-white font-medium capitalize">
                                                {pmt.payment_method}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {pmt.account?.name}
                                            </p>
                                        </div>
                                        <p className="font-bold text-white tabular-nums">
                                            {formatPKR(
                                                Number(pmt.payment_amount),
                                            )}
                                        </p>
                                    </div>
                                ))}
                                {sale.payments.length === 0 && (
                                    <p className="text-xs text-slate-500 italic">
                                        No payments recorded.
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <footer className="shrink-0 border-t border-white/10 bg-white/[0.02] px-6 py-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-400">
                            Grand Total
                        </span>
                        <span className="text-xl font-bold tabular-nums text-violet-400">
                            {sale
                                ? formatPKR(Number(sale.grand_total))
                                : "Rs 0"}
                        </span>
                    </div>
                </footer>
            </aside>
        </>
    );

    return createPortal(content, document.body);
}
