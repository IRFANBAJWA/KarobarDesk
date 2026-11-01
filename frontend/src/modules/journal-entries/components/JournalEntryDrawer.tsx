import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, FileText, DollarSign } from "lucide-react";
import { getJournalEntry } from "../api";
import type { JournalEntryDetail } from "../types";

export default function JournalEntryDrawer({
    entryId,
    onClose,
}: {
    entryId: number | null;
    onClose: () => void;
}) {
    const [entry, setEntry] = useState<JournalEntryDetail | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (entryId) {
            setLoading(true);
            getJournalEntry(entryId).then((res) => {
                setEntry(res.data);
                setLoading(false);
            });
        }
    }, [entryId]);

    if (!entryId) return null;

    const content = (
        <>
            <div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <aside className="fixed right-0 top-0 z-50 flex h-[100dvh] w-full max-w-md flex-col border-l border-white/10 bg-neutral-950/95 shadow-2xl backdrop-blur-xl">
                <header className="shrink-0 border-b border-white/10 px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <FileText className="h-5 w-5 text-violet-400" />
                            {entry?.title || "Journal Entry"}
                        </h2>
                        <p className="text-xs text-muted-foreground uppercase mt-1">
                            {entry?.entry_number} • {entry?.posting_date}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
                    {loading || !entry ? (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                        </div>
                    ) : (
                        <>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Created By
                                    </span>
                                    <span className="text-foreground">
                                        {entry.user?.name || "—"}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Remarks
                                    </span>
                                    <span className="text-foreground text-right">
                                        {entry.user_remark || "—"}
                                    </span>
                                </div>
                            </div>

                            {/* Accounts Breakdown */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium border-b border-white/10 pb-2 flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />{" "}
                                    Account Details
                                </h3>
                                {entry.accounts.map((acc, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-white/[0.02] p-3 rounded-lg border border-white/5 flex justify-between text-sm"
                                    >
                                        <div>
                                            <p className="text-foreground">
                                                {acc.account_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {acc.user_remark}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            {Number(acc.debit) > 0 && (
                                                <p className="text-red-400 tabular-nums">
                                                    Dr {acc.debit}
                                                </p>
                                            )}
                                            {Number(acc.credit) > 0 && (
                                                <p className="text-emerald-400 tabular-nums">
                                                    Cr {acc.credit}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <footer className="shrink-0 border-t border-white/10 bg-white/[0.02] px-6 py-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">
                            Total Debit
                        </span>
                        <span className="text-lg font-semibold tabular-nums text-violet-400">
                            {entry?.total_debit || "0.00"}
                        </span>
                    </div>
                </footer>
            </aside>
        </>
    );

    return createPortal(content, document.body);
}
