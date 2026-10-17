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

export interface ItemsFilterState {
    search: string;
    itemGroup: string; // "all" or a specific group name
    active: ActiveFilter;
    sync: SyncFilter;
    showInternal: boolean;
}

export const DEFAULT_ITEMS_FILTERS: ItemsFilterState = {
    search: "",
    itemGroup: "all",
    active: "all",
    sync: "all",
    showInternal: false,
};

interface Props {
    value: ItemsFilterState;
    onChange: (next: ItemsFilterState) => void;
    totalCount: number;
    filteredCount: number;
    itemGroups: string[];
}

export default function ItemsFilters({
    value,
    onChange,
    totalCount,
    filteredCount,
    itemGroups,
}: Props) {
    const isFiltered =
        value.search.trim() !== "" ||
        value.itemGroup !== "all" ||
        value.active !== "all" ||
        value.sync !== "all" ||
        value.showInternal;

    function reset() {
        onChange(DEFAULT_ITEMS_FILTERS);
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative min-w-[240px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={value.search}
                        onChange={(e) =>
                            onChange({ ...value, search: e.target.value })
                        }
                        placeholder="Search name, code, barcode, alias..."
                        className="h-9 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm outline-none transition focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
                    />
                </div>

                {/* Item group */}
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

                {/* Active */}
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

                {/* Sync */}
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

                {/* Show internal toggle */}
                <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 transition hover:bg-white/10">
                    <button
                        type="button"
                        role="switch"
                        aria-checked={value.showInternal}
                        onClick={() =>
                            onChange({
                                ...value,
                                showInternal: !value.showInternal,
                            })
                        }
                        className={`relative h-4 w-7 shrink-0 rounded-full transition ${
                            value.showInternal ? "bg-violet-600" : "bg-white/10"
                        }`}
                    >
                        <span
                            className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition ${
                                value.showInternal ? "left-[14px]" : "left-0.5"
                            }`}
                        />
                    </button>
                    <span className="text-sm text-muted-foreground">
                        Show internal items
                    </span>
                </label>

                {/* Reset */}
                {isFiltered && (
                    <button
                        onClick={reset}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
                    >
                        <X className="h-3.5 w-3.5" />
                        Reset
                    </button>
                )}

                {/* Count */}
                <span className="ml-auto text-xs text-muted-foreground">
                    {isFiltered
                        ? `${filteredCount} of ${totalCount}`
                        : `${totalCount} total`}
                </span>
            </div>
        </div>
    );
}
