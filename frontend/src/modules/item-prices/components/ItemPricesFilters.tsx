import { Search, X } from "lucide-react";
import Select from "@/modules/users/components/Select";

export type ActiveFilter = "all" | "active" | "inactive";
export type SyncFilter =
    | "all"
    | "synced"
    | "pending"
    | "processing"
    | "retrying"
    | "failed";

export interface ItemPricesFilterState {
    search: string;
    priceListId: string; // "all" or a numeric string
    itemGroup: string; // "all" or a group name
    active: ActiveFilter;
    sync: SyncFilter;
}

export const DEFAULT_ITEM_PRICES_FILTERS: ItemPricesFilterState = {
    search: "",
    priceListId: "all",
    itemGroup: "all",
    active: "all",
    sync: "all",
};

interface Props {
    value: ItemPricesFilterState;
    onChange: (next: ItemPricesFilterState) => void;
    totalCount: number;
    filteredCount: number;
    priceLists: { id: number; name: string }[];
    itemGroups: string[];
}

export default function ItemPricesFilters({
    value,
    onChange,
    totalCount,
    filteredCount,
    priceLists,
    itemGroups,
}: Props) {
    const isFiltered =
        value.search.trim() !== "" ||
        value.priceListId !== "all" ||
        value.itemGroup !== "all" ||
        value.active !== "all" ||
        value.sync !== "all";

    function reset() {
        onChange(DEFAULT_ITEM_PRICES_FILTERS);
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[240px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={value.search}
                        onChange={(e) =>
                            onChange({ ...value, search: e.target.value })
                        }
                        placeholder="Search item name, code, barcode..."
                        className="h-9 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm outline-none transition focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
                    />
                </div>

                <div className="w-48">
                    <Select
                        value={value.priceListId}
                        onChange={(v) => onChange({ ...value, priceListId: v })}
                        options={[
                            { value: "all", label: "All price lists" },
                            ...priceLists.map((pl) => ({
                                value: String(pl.id),
                                label: pl.name,
                            })),
                        ]}
                    />
                </div>

                <div className="w-48">
                    <Select
                        value={value.itemGroup}
                        onChange={(v) => onChange({ ...value, itemGroup: v })}
                        options={[
                            { value: "all", label: "All groups" },
                            ...itemGroups.map((g) => ({ value: g, label: g })),
                        ]}
                    />
                </div>

                <div className="w-40">
                    <Select
                        value={value.active}
                        onChange={(v) =>
                            onChange({ ...value, active: v as ActiveFilter })
                        }
                        options={[
                            { value: "all", label: "All status" },
                            { value: "active", label: "Active" },
                            { value: "inactive", label: "Inactive" },
                        ]}
                    />
                </div>

                <div className="w-40">
                    <Select
                        value={value.sync}
                        onChange={(v) =>
                            onChange({ ...value, sync: v as SyncFilter })
                        }
                        options={[
                            { value: "all", label: "All sync" },
                            { value: "synced", label: "Synced" },
                            { value: "pending", label: "Pending" },
                            { value: "processing", label: "Processing" },
                            { value: "retrying", label: "Retrying" },
                            { value: "failed", label: "Failed" },
                        ]}
                    />
                </div>

                {isFiltered && (
                    <button
                        onClick={reset}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
                    >
                        <X className="h-3.5 w-3.5" />
                        Reset
                    </button>
                )}

                <span className="ml-auto text-xs text-muted-foreground">
                    {isFiltered
                        ? `${filteredCount} of ${totalCount}`
                        : `${totalCount} total`}
                </span>
            </div>
        </div>
    );
}
