import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, X, Calendar } from "lucide-react";
import { listStockLedger } from "../api";
import type { StockLedger, LedgerMeta } from "../types";

interface Props {
    itemId: number | null;
    itemName: string;
    onClose: () => void;
}

const getToday = () => new Date().toISOString().split("T")[0];

export default function StockLedgerDrawer({
    itemId,
    itemName,
    onClose,
}: Props) {
    const [ledger, setLedger] = useState<StockLedger[]>([]);
    const [meta, setMeta] = useState<LedgerMeta | null>(null);
    const [loading, setLoading] = useState(false);

    const [dateFrom, setDateFrom] = useState(getToday());
    const [dateTo, setDateTo] = useState(getToday());

    // Reset dates when item changes
    useEffect(() => {
        if (itemId) {
            const today = getToday();
            setDateFrom(today);
            setDateTo(today);
        }
    }, [itemId]);

    useEffect(() => {
        if (itemId) {
            setLoading(true);
            listStockLedger(itemId, {
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            })
                .then((res) => {
                    setLedger(res.data);
                    setMeta(res.meta);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [itemId, dateFrom, dateTo]);

    if (!itemId) return null;

    const content = (
        <>
            <div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <aside className="fixed right-0 top-0 z-50 flex h-[100dvh] w-full max-w-md flex-col border-l border-white/10 bg-neutral-950/95 shadow-2xl backdrop-blur-xl">
                <header className="shrink-0 border-b border-white/10 px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">
                            {itemName}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Stock Movement History
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </header>

                <div className="shrink-0 border-b border-white/10 bg-white/[0.02] px-6 py-3 flex gap-3">
                    <div className="flex-1">
                        <label className="text-[10px] text-muted-foreground uppercase mb-1 block">
                            From
                        </label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-foreground outline-none"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] text-muted-foreground uppercase mb-1 block">
                            To
                        </label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-foreground outline-none"
                        />
                    </div>
                </div>

                {meta && (
                    <div className="shrink-0 grid grid-cols-2 gap-4 border-b border-white/10 px-6 py-4 bg-white/[0.01]">
                        <div>
                            <p className="text-[10px] uppercase text-muted-foreground">
                                Opening
                            </p>
                            <p className="text-lg font-medium text-foreground">
                                {Number(meta.opening_balance || 0).toFixed(2)}
                            </p>
                        </div>
                        <div className="text-right border-l border-white/5">
                            <p className="text-[10px] uppercase text-muted-foreground">
                                Closing
                            </p>
                            <p className="text-lg font-medium text-violet-400">
                                {Number(meta.closing_balance || 0).toFixed(2)}
                            </p>
                        </div>
                    </div>
                )}

                <div className="min-h-0 flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                        </div>
                    ) : ledger.length === 0 ? (
                        <div className="text-center text-muted-foreground text-sm mt-10">
                            No movements found for this date range.
                        </div>
                    ) : (
                        <div className="relative border-l border-white/10 pl-4 space-y-6">
                            {ledger.map((entry) => {
                                const isPositive = Number(entry.qty) > 0;
                                return (
                                    <div key={entry.id} className="relative">
                                        <div
                                            className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-neutral-950 ${isPositive ? "bg-emerald-500" : "bg-red-500"}`}
                                        />
                                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(
                                                entry.created_at,
                                            ).toLocaleString()}
                                        </div>
                                        <div className="text-sm text-foreground flex justify-between">
                                            <span className="truncate pr-4">
                                                {entry.reference_type ||
                                                    "Adjustment"}
                                            </span>
                                            <span
                                                className={`font-medium tabular-nums ${isPositive ? "text-emerald-400" : "text-red-400"}`}
                                            >
                                                {isPositive ? "+" : ""}
                                                {Number(entry.qty).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Bal:{" "}
                                            {Number(
                                                entry.balance_after,
                                            ).toFixed(2)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </aside>
        </>
    );

    return createPortal(content, document.body);
}
