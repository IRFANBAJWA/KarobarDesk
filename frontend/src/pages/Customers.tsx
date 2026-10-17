import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomersTable from "@/modules/customers/components/CustomersTable";
import CustomersFilters, {
    DEFAULT_CUSTOMERS_FILTERS,
    type CustomersFilterState,
} from "@/modules/customers/components/CustomersFilters";
import CustomerDetailDrawer from "@/modules/customers/components/CustomerDetailDrawer";
import EditCustomerDialog from "@/modules/customers/components/EditCustomerDialog";
import { listCustomers } from "@/modules/customers/api";
import type { Customer } from "@/modules/customers/types";

export default function Customers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [meta, setMeta] = useState<{
        current_page: number;
        last_page: number;
        total: number;
    } | null>(null);
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<CustomersFilterState>(
        DEFAULT_CUSTOMERS_FILTERS,
    );

    const [drawerCustomer, setDrawerCustomer] = useState<Customer | null>(null);
    const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await listCustomers({
                page,
                search: filters.search.trim() || undefined,
                is_active:
                    filters.active === "all"
                        ? undefined
                        : filters.active === "active",
            });

            setCustomers(res.data);
            setMeta(res.meta);
        } catch (e) {
            setError(
                e instanceof Error ? e.message : "Failed to load customers.",
            );
            setCustomers([]);
            setMeta(null);
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

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(t);
    }, [toast]);

    function handleSaved(updated: Customer) {
        setCustomers((prev) =>
            prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
        );
        setDrawerCustomer((cur) =>
            cur && cur.id === updated.id ? { ...cur, ...updated } : cur,
        );
        setToast("Customer updated.");
    }

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 p-6">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        Customers
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Synced from ERPNext. Operational fields are editable
                        locally.
                    </p>
                </div>
                <Button variant="ghost" onClick={load} disabled={loading}>
                    <RefreshCw
                        className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />{" "}
                    Refresh
                </Button>
            </div>

            <CustomersFilters
                value={filters}
                onChange={setFilters}
                totalCount={meta?.total ?? 0}
                filteredCount={customers.length}
            />

            {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                    {error}
                </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
                <CustomersTable
                    customers={customers}
                    loading={loading}
                    onView={(c) => setDrawerCustomer(c)}
                    onEdit={(c) => setEditCustomer(c)}
                />

                {/* Pagination Bar */}
                {meta && meta.total > 0 && (
                    <div className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-3">
                        <span className="text-xs text-muted-foreground">
                            Showing {(meta.current_page - 1) * 50 + 1}–
                            {Math.min(meta.current_page * 50, meta.total)} of{" "}
                            {meta.total}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={page <= 1 || loading}
                                onClick={() =>
                                    setPage((p) => Math.max(1, p - 1))
                                }
                                className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-muted-foreground transition hover:bg-white/10 hover:text-foreground disabled:opacity-40"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" /> Prev
                            </button>
                            <span className="text-xs text-muted-foreground tabular-nums">
                                Page {meta.current_page} of {meta.last_page}
                            </span>
                            <button
                                type="button"
                                disabled={page >= meta.last_page || loading}
                                onClick={() =>
                                    setPage((p) =>
                                        Math.min(meta.last_page, p + 1),
                                    )
                                }
                                className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-muted-foreground transition hover:bg-white/10 hover:text-foreground disabled:opacity-40"
                            >
                                Next <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <CustomerDetailDrawer
                customer={drawerCustomer}
                onClose={() => setDrawerCustomer(null)}
                onEdit={(c) => {
                    setDrawerCustomer(null);
                    setEditCustomer(c);
                }}
            />

            <EditCustomerDialog
                customer={editCustomer}
                onClose={() => setEditCustomer(null)}
                onSaved={handleSaved}
            />

            {toast && (
                <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-white/10 bg-neutral-900/95 px-4 py-3 text-sm shadow-2xl backdrop-blur-xl">
                    {toast}
                </div>
            )}
        </div>
    );
}
