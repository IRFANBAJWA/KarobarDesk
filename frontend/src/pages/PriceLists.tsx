import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import PriceListsTable from "@/modules/price-lists/components/PriceListsTable";
import PriceListsFilters, {
    DEFAULT_PRICE_LISTS_FILTERS,
    type PriceListsFilterState,
} from "@/modules/price-lists/components/PriceListsFilters";
import PriceListDetailDrawer from "@/modules/price-lists/components/PriceListDetailDrawer";
import { listPriceLists } from "@/modules/price-lists/api";
import type { PriceList } from "@/modules/price-lists/types";

export default function PriceLists() {
    const [priceLists, setPriceLists] = useState<PriceList[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<PriceListsFilterState>(
        DEFAULT_PRICE_LISTS_FILTERS,
    );

    const [drawerItem, setDrawerItem] = useState<PriceList | null>(null);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await listPriceLists();
            const list: PriceList[] = Array.isArray(res)
                ? (res as unknown as PriceList[])
                : Array.isArray(res?.data)
                  ? res.data
                  : [];
            setPriceLists(list);
        } catch (e) {
            setError(
                e instanceof Error ? e.message : "Failed to load price lists.",
            );
            setPriceLists([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    const filtered = useMemo(() => {
        const safe = Array.isArray(priceLists) ? priceLists : [];
        const q = filters.search.trim().toLowerCase();
        return safe.filter((pl) => {
            if (filters.active === "active" && !pl.is_active) return false;
            if (filters.active === "inactive" && pl.is_active) return false;
            if (filters.selling === "selling" && !pl.is_selling) return false;
            if (filters.selling === "buying" && pl.is_selling) return false;
            if (filters.sync !== "all") {
                if ((pl.sync_status ?? "").toLowerCase() !== filters.sync)
                    return false;
            }
            if (q) {
                const hay = [pl.name, pl.erpnext_name]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [priceLists, filters]);

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 p-6">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        Price Lists
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Synced from ERPNext. Read-only — manage masters in
                        ERPNext.
                    </p>
                </div>
                <Button variant="ghost" onClick={load} disabled={loading}>
                    <RefreshCw
                        className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />
                    Refresh
                </Button>
            </div>

            <PriceListsFilters
                value={filters}
                onChange={setFilters}
                totalCount={priceLists.length}
                filteredCount={filtered.length}
            />

            {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                    {error}
                </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
                <PriceListsTable
                    priceLists={filtered}
                    loading={loading}
                    onView={(pl) => setDrawerItem(pl)}
                />
            </div>

            <PriceListDetailDrawer
                priceList={drawerItem}
                onClose={() => setDrawerItem(null)}
            />
        </div>
    );
}
