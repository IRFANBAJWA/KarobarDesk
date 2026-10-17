import { Search, X } from "lucide-react";
import Select from "@/modules/users/components/Select";

export type ActiveFilter = "all" | "active" | "inactive";

export interface CustomersFilterState {
    search: string;
    active: ActiveFilter;
}

export const DEFAULT_CUSTOMERS_FILTERS: CustomersFilterState = {
    search: "",
    active: "all",
};

interface Props {
    value: CustomersFilterState;
    onChange: (next: CustomersFilterState) => void;
    totalCount: number;
    filteredCount: number;
}

export default function CustomersFilters({
    value,
    onChange,
    totalCount,
    filteredCount,
}: Props) {
    const isFiltered = value.search.trim() !== "" || value.active !== "all";

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
                        placeholder="Search name, phone, email..."
                        className="h-9 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm outline-none transition focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
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

                {isFiltered && (
                    <button
                        onClick={() => onChange(DEFAULT_CUSTOMERS_FILTERS)}
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
