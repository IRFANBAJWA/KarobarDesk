import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import StockFilters, {
    DEFAULT_STOCK_FILTERS,
    type StockFilterState,
} from "@/modules/stock/components/StockFilters";
import StockBalancesTable from "@/modules/stock/components/StockBalancesTable";
import StockLedgerDrawer from "@/modules/stock/components/StockLedgerDrawer";
import {
    listStockBalances,
    listStockCompanies,
    type CompanyOption,
} from "@/modules/stock/api";
import type { StockBalance, PaginationMeta } from "@/modules/stock/types";

export default function Stock() {
    const [balances, setBalances] = useState<StockBalance[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState<StockFilterState>(
        DEFAULT_STOCK_FILTERS,
    );
    const [companies, setCompanies] = useState<CompanyOption[]>([]);
    const [ledgerItem, setLedgerItem] = useState<{
        id: number;
        name: string;
    } | null>(null);

    // Load companies for the dropdown
    useEffect(() => {
        listStockCompanies()
            .then((res) => setCompanies(res.data))
            .catch(console.error);
    }, []);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await listStockBalances({
                page,
                search: filters.search.trim() || undefined,
                company_id:
                    filters.companyId === "all"
                        ? undefined
                        : Number(filters.companyId),
                date_from: filters.dateFrom,
                date_to: filters.dateTo,
                hide_zero: filters.hideZero,
            });
            setBalances(res.data);
            setMeta(res.meta);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load stock.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        setPage(1);
    }, [filters]);

    useEffect(() => {
        load();
    }, [page, filters]);

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 p-6">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        Stock Balance
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Live inventory quantities.
                    </p>
                </div>
                <Button variant="ghost" onClick={load} disabled={loading}>
                    <RefreshCw
                        className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />
                    Refresh
                </Button>
            </div>

            <StockFilters
                value={filters}
                onChange={setFilters}
                companies={companies}
            />

            {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                    {error}
                </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
                <StockBalancesTable
                    balances={balances}
                    loading={loading}
                    onViewLedger={(id, name) => setLedgerItem({ id, name })}
                />

                {meta && meta.total > 0 && (
                    <div className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-3">
                        <span className="text-xs text-muted-foreground">
                            Showing {(meta.current_page - 1) * 50 + 1}–
                            {Math.min(meta.current_page * 50, meta.total)} of{" "}
                            {meta.total}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={page <= 1 || loading}
                                onClick={() =>
                                    setPage((p) => Math.max(1, p - 1))
                                }
                                className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-muted-foreground hover:bg-white/10 disabled:opacity-40"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" /> Prev
                            </button>
                            <span className="text-xs text-muted-foreground tabular-nums">
                                Page {meta.current_page} of {meta.last_page}
                            </span>
                            <button
                                disabled={page >= meta.last_page || loading}
                                onClick={() =>
                                    setPage((p) =>
                                        Math.min(meta.last_page, p + 1),
                                    )
                                }
                                className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-muted-foreground hover:bg-white/10 disabled:opacity-40"
                            >
                                Next <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <StockLedgerDrawer
                itemId={ledgerItem?.id ?? null}
                itemName={ledgerItem?.name ?? ""}
                onClose={() => setLedgerItem(null)}
            />
        </div>
    );
}
