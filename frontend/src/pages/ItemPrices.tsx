import { useEffect, useMemo, useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    RefreshCw,
    Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/useAuth";
import ItemPricesTable from "@/modules/item-prices/components/ItemPricesTable";
import ItemPricesFilters, {
    DEFAULT_ITEM_PRICES_FILTERS,
    type ItemPricesFilterState,
} from "@/modules/item-prices/components/ItemPricesFilters";
import EditItemPriceDialog from "@/modules/item-prices/components/EditItemPriceDialog";
import CreateItemPriceDialog from "@/modules/item-prices/components/CreateItemPriceDialog";
import { listItemPrices } from "@/modules/item-prices/api";
import { listPriceLists } from "@/modules/price-lists/api";
import { pickerAllItems } from "@/modules/items/api";
import ItemPriceDetailDrawer from "@/modules/item-prices/components/ItemPriceDetailDrawer";
import UnpricedItemsDialog from "@/modules/item-prices/components/UnpricedItemsDialog";

import type {
    ItemPrice,
    ListItemPricesMeta,
} from "@/modules/item-prices/types";
import type { PriceList } from "@/modules/price-lists/types";
import type { PickerItem } from "@/modules/items/api";

const PER_PAGE = 50;

export default function ItemPrices() {
    const { roles } = useAuth();
    const roleNames = useMemo(() => roles.map((r) => r.name), [roles]);
    const canEdit = useMemo(
        () => roleNames.includes("super_admin") || roleNames.includes("admin"),
        [roleNames],
    );

    const [itemPrices, setItemPrices] = useState<ItemPrice[]>([]);
    const [meta, setMeta] = useState<ListItemPricesMeta | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<ItemPricesFilterState>(
        DEFAULT_ITEM_PRICES_FILTERS,
    );
    const [viewItem, setViewItem] = useState<ItemPrice | null>(null);

    const [priceLists, setPriceLists] = useState<PriceList[]>([]);
    const [items, setItems] = useState<PickerItem[]>([]);

    const [editItem, setEditItem] = useState<ItemPrice | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    // New states for the unpriced feature
    const [unpricedOpen, setUnpricedOpen] = useState(false);
    const [prefillCreate, setPrefillCreate] = useState<{
        itemId: number;
        priceListId: number;
    } | null>(null);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await listItemPrices({
                price_list_id:
                    filters.priceListId === "all"
                        ? undefined
                        : Number(filters.priceListId),
                item_group:
                    filters.itemGroup === "all" ? undefined : filters.itemGroup,
                search: filters.search.trim() || undefined,
                is_active:
                    filters.active === "all"
                        ? undefined
                        : filters.active === "active",
                sync_status: filters.sync === "all" ? undefined : filters.sync,
                page,
                per_page: PER_PAGE,
            });
            setItemPrices(res.data);
            setMeta(res.meta);
        } catch (e) {
            setError(
                e instanceof Error ? e.message : "Failed to load item prices.",
            );
            setItemPrices([]);
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
    }, [filters, page]);

    useEffect(() => {
        (async () => {
            try {
                const [plRes, itRes] = await Promise.all([
                    listPriceLists(),
                    pickerAllItems(),
                ]);
                setPriceLists(Array.isArray(plRes?.data) ? plRes.data : []);
                setItems(Array.isArray(itRes?.data) ? itRes.data : []);
            } catch {
                // Non-fatal
            }
        })();
    }, []);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(t);
    }, [toast]);

    function handleSaved(updated: ItemPrice) {
        setItemPrices((prev) =>
            prev.map((ip) =>
                ip.id === updated.id ? { ...ip, ...updated } : ip,
            ),
        );
        setToast("Item price updated.");
    }

    function handleCreated(_created: ItemPrice) {
        setToast("Item price created.");
        setCreateOpen(false);
        setPrefillCreate(null);
        load();
    }

    const itemGroups = useMemo(() => {
        const set = new Set<string>();
        for (const ip of itemPrices) {
            const g = ip.item_group;
            if (!g) continue;
            if (g === "Raw Material") continue;
            set.add(g);
        }
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [itemPrices]);

    const priceListOptions = useMemo(
        () => priceLists.map((pl) => ({ id: pl.id, name: pl.name })),
        [priceLists],
    );

    const itemOptions = useMemo(
        () =>
            items.map((it) => ({
                id: it.id,
                name: it.item_name,
                code: it.item_code,
            })),
        [items],
    );

    const from = meta?.from ?? 0;
    const to = meta?.to ?? 0;
    const total = meta?.total ?? 0;
    const lastPage = meta?.last_page ?? 1;

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 p-6">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        Item Prices
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Rates per item × price list. Synced from ERPNext; local
                        edits are logged.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={load} disabled={loading}>
                        <RefreshCw
                            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                        />
                        Refresh
                    </Button>
                    {canEdit && (
                        <>
                            {/* NEW: Button to open the Unpriced Modal */}
                            <Button
                                variant="outline"
                                onClick={() => setUnpricedOpen(true)}
                            >
                                <Search className="mr-2 h-4 w-4" />
                                Find Unpriced
                            </Button>

                            <Button
                                onClick={() => {
                                    setPrefillCreate(null);
                                    setCreateOpen(true);
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add price
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <ItemPricesFilters
                value={filters}
                onChange={setFilters}
                totalCount={total}
                filteredCount={itemPrices.length}
                priceLists={priceListOptions}
                itemGroups={itemGroups}
            />

            {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                    {error}
                </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
                <ItemPricesTable
                    itemPrices={itemPrices}
                    loading={loading}
                    canEdit={canEdit}
                    onView={(ip) => setViewItem(ip)}
                    onEdit={(ip) => setEditItem(ip)}
                />

                {total > 0 && (
                    <div className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-3">
                        <span className="text-xs text-muted-foreground">
                            Showing {from}–{to} of {total}
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
                                Page {page} of {lastPage}
                            </span>
                            <button
                                type="button"
                                disabled={page >= lastPage || loading}
                                onClick={() =>
                                    setPage((p) => Math.min(lastPage, p + 1))
                                }
                                className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-muted-foreground transition hover:bg-white/10 hover:text-foreground disabled:opacity-40"
                            >
                                Next <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ItemPriceDetailDrawer
                itemPrice={viewItem}
                canEdit={canEdit}
                onClose={() => setViewItem(null)}
                onEdit={(ip) => {
                    setViewItem(null);
                    setEditItem(ip);
                }}
            />

            <EditItemPriceDialog
                itemPrice={editItem}
                onClose={() => setEditItem(null)}
                onSaved={handleSaved}
            />

            {/* Create Dialog - now accepts prefill values from the Unpriced Modal */}
            <CreateItemPriceDialog
                open={createOpen}
                priceLists={priceListOptions}
                items={itemOptions}
                defaultPriceListId={
                    prefillCreate?.priceListId
                        ? String(prefillCreate.priceListId)
                        : undefined
                }
                defaultItemId={
                    prefillCreate?.itemId
                        ? String(prefillCreate.itemId)
                        : undefined
                }
                onClose={() => {
                    setCreateOpen(false);
                    setPrefillCreate(null);
                }}
                onCreated={handleCreated}
            />

            {/* NEW: Unpriced Items Modal */}
            <UnpricedItemsDialog
                open={unpricedOpen}
                priceLists={priceListOptions}
                onClose={() => setUnpricedOpen(false)}
                onAddPrice={(itemId, priceListId) => {
                    setUnpricedOpen(false);
                    setPrefillCreate({ itemId, priceListId });
                    setCreateOpen(true);
                }}
            />

            {toast && (
                <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-white/10 bg-neutral-900/95 px-4 py-3 text-sm shadow-2xl backdrop-blur-xl">
                    {toast}
                </div>
            )}
        </div>
    );
}
