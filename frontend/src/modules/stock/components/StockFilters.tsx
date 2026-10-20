import { Search, X } from "lucide-react";
import Select from "@/modules/users/components/Select";
import type { CompanyOption } from "../api";

export interface StockFilterState {
    search: string;
    companyId: string;
    dateFrom: string;
    dateTo: string;
    hideZero: boolean;
}

const today = new Date().toISOString().split("T")[0];

export const DEFAULT_STOCK_FILTERS: StockFilterState = {
    search: "",
    companyId: "all",
    dateFrom: today,
    dateTo: today,
    hideZero: true, // Default to hiding zero stock
};

interface Props {
    value: StockFilterState;
    onChange: (next: StockFilterState) => void;
    companies: CompanyOption[];
}

export default function StockFilters({ value, onChange, companies }: Props) {
    const isFiltered =
        value.search.trim() !== "" ||
        value.companyId !== "all" ||
        value.dateFrom !== today ||
        value.dateTo !== today ||
        value.hideZero !== true;

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-3">
                {/* 1. Search */}
                <div className="relative min-w-[200px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={value.search}
                        onChange={(e) =>
                            onChange({ ...value, search: e.target.value })
                        }
                        placeholder="Search item..."
                        className="h-9 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm outline-none focus:border-violet-500/40"
                    />
                </div>

                {/* 2. Company Dropdown */}
                <div className="w-48">
                    <Select
                        value={value.companyId}
                        onChange={(v) => onChange({ ...value, companyId: v })}
                        options={[
                            { value: "all", label: "All companies" },
                            ...companies.map((c) => ({
                                value: String(c.id),
                                label: c.name,
                            })),
                        ]}
                    />
                </div>

                {/* 3. Date Range */}
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={value.dateFrom}
                        onChange={(e) =>
                            onChange({ ...value, dateFrom: e.target.value })
                        }
                        className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-foreground outline-none"
                    />
                    <span className="text-muted-foreground text-sm">to</span>
                    <input
                        type="date"
                        value={value.dateTo}
                        onChange={(e) =>
                            onChange({ ...value, dateTo: e.target.value })
                        }
                        className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-foreground outline-none"
                    />
                </div>

                {/* 4. Hide Zero Checkbox */}
                <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 hover:bg-white/10 transition">
                    <input
                        type="checkbox"
                        checked={value.hideZero}
                        onChange={(e) =>
                            onChange({ ...value, hideZero: e.target.checked })
                        }
                        className="accent-violet-500 h-4 w-4"
                    />
                    <span className="text-sm text-foreground select-none">
                        Hide zero stock
                    </span>
                </label>

                {/* 5. Reset Button */}
                {isFiltered && (
                    <button
                        onClick={() => onChange(DEFAULT_STOCK_FILTERS)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-muted-foreground hover:bg-white/10"
                    >
                        <X className="h-3.5 w-3.5" /> Reset
                    </button>
                )}
            </div>
        </div>
    );
}
