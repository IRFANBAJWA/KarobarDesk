import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/useAuth";
import ItemsTable from "@/modules/items/components/ItemsTable";
import ItemsFilters, {
    DEFAULT_ITEMS_FILTERS,
    type ItemsFilterState,
} from "@/modules/items/components/ItemsFilters";
import ItemDetailDrawer from "@/modules/items/components/ItemDetailDrawer";
import EditItemDialog from "@/modules/items/components/EditItemDialog";
import { listItems } from "@/modules/items/api";
import type { Item } from "@/modules/items/types";

// Groups that are hidden from the default view and dropdown.
const HIDDEN_GROUPS = ["Raw Material"];

export default function Items() {
    const { roles } = useAuth();
    const roleNames = useMemo(() => roles.map((r) => r.name), [roles]);
    const canEdit = useMemo(
        () =>
            roleNames.includes("super_admin") ||
            roleNames.includes("admin") ||
            roleNames.includes("manager"),
        [roleNames],
    );

    const [items, setItems] = useState<Item[]>([]);
    const [meta, setMeta] = useState<{
        current_page: number;
        last_page: number;
        total: number;
    } | null>(null);
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<ItemsFilterState>(
        DEFAULT_ITEMS_FILTERS,
    );

    const [drawerItem, setDrawerItem] = useState<Item | null>(null);
    const [editItem, setEditItem] = useState<Item | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await listItems({
                page,
                search: filters.search.trim() || undefined,
                item_group:
                    filters.itemGroup === "all" ? undefined : filters.itemGroup,
                is_active:
                    filters.active === "all"
                        ? undefined
                        : filters.active === "active",
                sync_status: filters.sync === "all" ? undefined : filters.sync,
                hide_internal: !filters.showInternal, // <-- SEND THIS TO BACKEND
            });

            // REMOVED THE CLIENT-SIDE FILTER HERE
            setItems(res.data);
            setMeta(res.meta);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load items.");
            setItems([]);
            setMeta(null);
        } finally {
            setLoading(false);
        }
    }

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [filters]);

    // Load when page or filters change
    useEffect(() => {
        load();
    }, [page, filters]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(t);
    }, [toast]);

    // Item groups for the dropdown (we extract them from the current page's items)
    // Note: If you want ALL groups in the dropdown, the backend should return a separate list of groups.
    const itemGroups = useMemo(() => {
        const set = new Set<string>();
        for (const it of items) {
            const g = it.item_group;
            if (!g) continue;
            if (!filters.showInternal && HIDDEN_GROUPS.includes(g)) continue;
            set.add(g);
        }
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [items, filters.showInternal]);

    function handleSaved(updated: Item) {
        // Update the item in the current page
        setItems((prev) =>
            prev.map((it) =>
                it.id === updated.id ? { ...it, ...updated } : it,
            ),
        );
        setDrawerItem((cur) =>
            cur && cur.id === updated.id ? { ...cur, ...updated } : cur,
        );
        setToast("Item updated.");
    }

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 p-6">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        Items
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Synced from ERPNext. Local edits are logged and kept in
                        KarobarDesk only.
                    </p>
                </div>
                <Button variant="ghost" onClick={load} disabled={loading}>
                    <RefreshCw
                        className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />
                    Refresh
                </Button>
            </div>

            <ItemsFilters
                value={filters}
                onChange={setFilters}
                totalCount={meta?.total ?? 0}
                filteredCount={items.length}
                itemGroups={itemGroups}
            />

            {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                    {error}
                </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
                <ItemsTable
                    items={items}
                    loading={loading}
                    canEdit={canEdit}
                    onView={(it) => setDrawerItem(it)}
                    onEdit={(it) => setEditItem(it)}
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

            <ItemDetailDrawer
                item={drawerItem}
                canEdit={canEdit}
                onClose={() => setDrawerItem(null)}
                onEdit={(it) => {
                    setDrawerItem(null);
                    setEditItem(it);
                }}
            />

            <EditItemDialog
                item={editItem}
                onClose={() => setEditItem(null)}
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
