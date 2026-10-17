import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
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
// Revealed by the "Show internal items" toggle.
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
            const res = await listItems();
            const list: Item[] = Array.isArray(res)
                ? (res as unknown as Item[])
                : Array.isArray(res?.data)
                  ? res.data
                  : [];
            setItems(list);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load items.");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(t);
    }, [toast]);

    // Live item group list — unique, sorted, hides internal groups unless toggled
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

    const filtered = useMemo(() => {
        const safeItems = Array.isArray(items) ? items : [];
        const q = filters.search.trim().toLowerCase();

        return safeItems.filter((it) => {
            // Hide internal groups unless explicitly revealed
            if (
                !filters.showInternal &&
                it.item_group &&
                HIDDEN_GROUPS.includes(it.item_group)
            ) {
                return false;
            }

            // Specific group filter
            if (
                filters.itemGroup !== "all" &&
                it.item_group !== filters.itemGroup
            ) {
                return false;
            }

            // Active filter
            if (filters.active === "active" && !it.is_active) return false;
            if (filters.active === "inactive" && it.is_active) return false;

            // Sync filter
            if (filters.sync !== "all") {
                if ((it.sync_status ?? "").toLowerCase() !== filters.sync)
                    return false;
            }

            // Search
            if (q) {
                const hay = [
                    it.item_name,
                    it.erpnext_item_code,
                    it.barcode,
                    it.alias,
                    it.item_group,
                    it.brand,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                if (!hay.includes(q)) return false;
            }

            return true;
        });
    }, [items, filters]);

    function handleSaved(updated: Item) {
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
                totalCount={items.length}
                filteredCount={filtered.length}
                itemGroups={itemGroups}
            />

            {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                    {error}
                </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
                <ItemsTable
                    items={filtered}
                    loading={loading}
                    canEdit={canEdit}
                    onView={(it) => setDrawerItem(it)}
                    onEdit={(it) => setEditItem(it)}
                />
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
