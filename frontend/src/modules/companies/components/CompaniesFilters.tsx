import { Search, X } from "lucide-react";
import Select from "@/modules/users/components/Select";
import type { SyncStatus } from "../types";

export type ActiveFilter = "all" | "active" | "inactive";
export type SyncFilter = "all" | SyncStatus;

export interface CompaniesFilterState {
    search: string;
    active: ActiveFilter;
    sync: SyncFilter;
}

export const DEFAULT_COMPANIES_FILTERS: CompaniesFilterState = {
    search: "",
    active: "all",
    sync: "all",
};

interface Props {
    value: CompaniesFilterState;
    onChange: (next: CompaniesFilterState) => void;
    total: number;
    shown: number;
}

const ACTIVE_OPTIONS: { value: ActiveFilter; label: string }[] = [
    { value: "all", label: "All statuses" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
];

const SYNC_OPTIONS: { value: SyncFilter; label: string }[] = [
    { value: "all", label: "All sync states" },
    { value: "synced", label: "Synced" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "retrying", label: "Retrying" },
    { value: "failed", label: "Failed" },
];

export default function CompaniesFilters({
    value,
    onChange,
    total,
    shown,
}: Props) {
    const isFiltered =
        value.search.trim() !== "" ||
        value.active !== "all" ||
        value.sync !== "all";

    function patch<K extends keyof CompaniesFilterState>(
        key: K,
        v: CompaniesFilterState[K],
    ) {
        onChange({ ...value, [key]: v });
    }

    function reset() {
        onChange({ ...DEFAULT_COMPANIES_FILTERS });
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative min-w-[220px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={value.search}
                        onChange={(e) => patch("search", e.target.value)}
                        placeholder="Search name, code, or ERPNext company…"
                        className="h-9 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm outline-none transition focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
                    />
                </div>

                {/* Active */}
                <div className="w-[160px]">
                    <Select<ActiveFilter>
                        value={value.active}
                        onChange={(v) => patch("active", v)}
                        options={ACTIVE_OPTIONS}
                    />
                </div>

                {/* Sync */}
                <div className="w-[180px]">
                    <Select<SyncFilter>
                        value={value.sync}
                        onChange={(v) => patch("sync", v)}
                        options={SYNC_OPTIONS}
                    />
                </div>

                {/* Reset */}
                {isFiltered && (
                    <button
                        type="button"
                        onClick={reset}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
                    >
                        <X className="h-3.5 w-3.5" />
                        Reset
                    </button>
                )}

                {/* Count */}
                <div className="ml-auto text-xs text-muted-foreground tabular-nums">
                    {isFiltered ? `${shown} of ${total}` : `${total} total`}
                </div>
            </div>
        </div>
    );
}
