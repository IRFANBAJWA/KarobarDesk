import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Plus, Search, X } from "lucide-react";
import Select from "@/modules/users/components/Select";
import Combobox from "@/components/ui/Combobox";
import { apiFetch } from "@/lib/apiFetch";
import type { Item } from "@/modules/items/types";
import type { PriceList } from "@/modules/price-lists/types";

interface Props {
    open: boolean;
    priceLists: { id: number; name: string }[];
    onClose: () => void;
    onAddPrice: (itemId: number, priceListId: number) => void; // Triggers the Create dialog
}

export default function UnpricedItemsDialog({
    open,
    priceLists,
    onClose,
    onAddPrice,
}: Props) {
    const [priceListId, setPriceListId] = useState("");
    const [items, setItems] = useState<Item[]>([]);
    const [meta, setMeta] = useState<{
        total: number;
        last_page: number;
    } | null>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    // Fetch unpriced items
    async function loadItems() {
        if (!priceListId) return;
        setLoading(true);
        try {
            const qs = new URLSearchParams();
            qs.append("price_list_id", priceListId);
            qs.append("page", String(page));
            if (search.trim()) qs.append("search", search.trim());

            const res = await apiFetch<{ data: Item[]; meta: any }>(
                `/api/items/unpriced?${qs.toString()}`,
            );
            setItems(res.data);
            setMeta(res.meta);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    // Reload when price list, page, or search changes
    useEffect(() => {
        if (open && priceListId) {
            loadItems();
        }
    }, [open, priceListId, page]);

    // Handle search with a slight delay so it doesn't spam the server
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            loadItems();
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    // Reset when opened
    useEffect(() => {
        if (open) {
            setPriceListId("");
            setItems([]);
            setMeta(null);
            setSearch("");
            setPage(1);
        }
    }, [open]);

    if (!open) return null;

    const content = (
        <>
            <div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="flex h-[90dvh] w-full max-w-4xl flex-col rounded-2xl border border-white/10 bg-neutral-950/95 shadow-2xl backdrop-blur-xl">
                    <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-4">
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">
                                Find Unpriced Items
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Select a price list to see which items are
                                missing a price.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/10 hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </header>

                    <div className="flex shrink-0 items-center gap-4 border-b border-white/10 px-6 py-3 bg-white/[0.02]">
                        <div className="w-64">
                            <Select
                                value={priceListId}
                                onChange={(v) => {
                                    setPriceListId(v);
                                    setPage(1);
                                }}
                                options={[
                                    {
                                        value: "",
                                        label: "Select Price List...",
                                    },
                                    ...priceLists.map((pl) => ({
                                        value: String(pl.id),
                                        label: pl.name,
                                    })),
                                ]}
                            />
                        </div>
                        {priceListId && (
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search item name or code..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-9 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm outline-none focus:border-violet-500/40"
                                />
                            </div>
                        )}
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-6">
                        {!priceListId ? (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                Please select a price list above.
                            </div>
                        ) : loading ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                            </div>
                        ) : items.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                                <span className="text-lg font-medium text-emerald-400">
                                    All items priced!
                                </span>
                                <span className="text-sm">
                                    No missing prices found for this list.
                                </span>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                                        <th className="py-2">Item</th>
                                        <th className="py-2">Group</th>
                                        <th className="py-2 text-right">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((it) => (
                                        <tr
                                            key={it.id}
                                            className="border-b border-white/5 hover:bg-white/[0.02]"
                                        >
                                            <td className="py-3">
                                                <div className="font-medium text-foreground">
                                                    {it.item_name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {it.erpnext_item_code}
                                                </div>
                                            </td>
                                            <td className="py-3 text-muted-foreground">
                                                {it.item_group ?? "—"}
                                            </td>
                                            <td className="py-3 text-right">
                                                <button
                                                    onClick={() =>
                                                        onAddPrice(
                                                            it.id,
                                                            Number(priceListId),
                                                        )
                                                    }
                                                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-violet-600/20 px-3 text-xs font-medium text-violet-300 hover:bg-violet-600/30"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />{" "}
                                                    Add Price
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {meta && meta.last_page > 1 && (
                        <footer className="flex shrink-0 items-center justify-between border-t border-white/10 px-6 py-3">
                            <span className="text-xs text-muted-foreground">
                                Total missing: {meta.total}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    className="text-xs text-foreground disabled:opacity-50"
                                >
                                    Prev
                                </button>
                                <span className="text-xs text-muted-foreground">
                                    Page {page} of {meta.last_page}
                                </span>
                                <button
                                    disabled={page >= meta.last_page}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="text-xs text-foreground disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </footer>
                    )}
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
}
