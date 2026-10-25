import { useState, useEffect } from "react";
import SalesFilters, {
    DEFAULT_SALES_FILTERS,
    type SalesFilterState,
} from "@/modules/sales/components/SalesFilters";
import SalesTable from "@/modules/sales/components/SalesTable";
import SaleDetailDrawer from "@/modules/sales/components/SaleDetailDrawer";
import { listSales } from "@/modules/sales/api";
import type { SaleInvoice } from "@/modules/sales/types";
import { useAuth } from "@/auth/useAuth";

export default function Sales() {
    const { user } = useAuth();
    const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);

    const [data, setData] = useState<SaleInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState<SalesFilterState>(
        DEFAULT_SALES_FILTERS,
    );
    const [meta, setMeta] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
    });
    const [companies, setCompanies] = useState<{ id: number; name: string }[]>(
        [],
    );

    const isSuperAdmin = user?.is_super_admin ?? false;

    useEffect(() => {
        if (isSuperAdmin) {
            fetch("/api/companies", { headers: { Accept: "application/json" } })
                .then((res) => res.json())
                .then((res) => setCompanies(res.data || []))
                .catch(console.error);
        }
    }, [isSuperAdmin]);

    useEffect(() => {
        let isMounted = true;
        console.log("Selected sales filters:", filters);

        setLoading(true);
        setError(null);

        listSales({
            search: filters.search,
            invoice_type: filters.invoice_type,
            status: filters.status,
            date_from: filters.date_from,
            date_to: filters.date_to,
            company_id: filters.company_id,
        })
            .then((res) => {
                console.log("1. Active filters:", filters);
                console.log("2. API returned rows:", res.data);
                console.log("3. API row count:", res.data.length);
                console.log("4. API metadata:", res.meta);
                if (isMounted) {
                    setData(res.data);
                    setMeta(res.meta);
                }
            })
            .catch((err: any) => {
                if (isMounted)
                    setError(err?.message || "Failed to load sales data.");
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [filters]);

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 p-6">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        Sales & Returns
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        View all POS transactions and returns.
                    </p>
                </div>
            </div>

            <SalesFilters
                filters={filters}
                onChange={setFilters}
                totalCount={meta.total}
                companies={companies}
                isSuperAdmin={isSuperAdmin}
            />

            {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                    {error}
                </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
                {/* 
                  ⭐ THE ULTIMATE FIX: The key forces the table to 
                  completely rebuild itself when filters change.
                */}
                {/* <div>
                    <p>DEBUG: Sales page is rendering</p>
                    <p>DEBUG: Rows in parent state: {data.length}</p>

                    <SalesTable
                        data={data}
                        loading={loading}
                        onView={(id) => setSelectedSaleId(id)}
                    />
                </div> */}
                <SalesTable
                    // key={JSON.stringify(filters)}
                    data={data}
                    loading={loading}
                    onView={(id) => setSelectedSaleId(id)}
                />
            </div>

            <SaleDetailDrawer
                saleId={selectedSaleId}
                onClose={() => setSelectedSaleId(null)}
            />
        </div>
    );
}
