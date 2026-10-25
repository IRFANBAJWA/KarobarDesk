import { Search, X } from "lucide-react";
// Import your custom UI components
import { Input } from "@/components/ui/input";
import Select from "@/modules/users/components/Select"; // Adjust path to your custom Select

export interface SalesFilterState {
    search: string;
    invoice_type: string;
    status: string;
    date_from: string;
    date_to: string;
    company_id: string;
}

export const DEFAULT_SALES_FILTERS: SalesFilterState = {
    search: "",
    invoice_type: "",
    status: "",
    date_from: new Date().toISOString().split("T")[0],
    date_to: new Date().toISOString().split("T")[0],
    company_id: "",
};

interface Props {
    filters: SalesFilterState;
    onChange: (filters: SalesFilterState) => void;
    totalCount: number;
    companies?: { id: number; name: string }[];
    isSuperAdmin?: boolean;
}

export default function SalesFilters({
    filters,
    onChange,
    totalCount,
    companies = [],
    isSuperAdmin,
}: Props) {
    const isFiltered =
        filters.search !== "" ||
        filters.invoice_type !== "" ||
        filters.status !== "" ||
        filters.company_id !== "" ||
        filters.date_from !== DEFAULT_SALES_FILTERS.date_from ||
        filters.date_to !== DEFAULT_SALES_FILTERS.date_to;

    const reset = () => onChange({ ...DEFAULT_SALES_FILTERS });

    // Options for custom Select
    const typeOptions = [
        { value: "", label: "All Types" },
        { value: "sale", label: "Sales Only" },
        { value: "return", label: "Returns Only" },
    ];

    const statusOptions = [
        { value: "", label: "All Statuses" },
        { value: "paid", label: "Paid" },
        { value: "partial", label: "Partial" },
        { value: "unpaid", label: "Unpaid" },
    ];

    const companyOptions = [
        { value: "", label: "All Companies" },
        ...companies.map((c) => ({ value: String(c.id), label: c.name })),
    ];

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative w-full max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search invoice #..."
                        value={filters.search}
                        onChange={(e) =>
                            onChange({ ...filters, search: e.target.value })
                        }
                        className="h-9 pl-9"
                    />
                </div>

                {/* Dates */}
                <Input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) =>
                        onChange({ ...filters, date_from: e.target.value })
                    }
                    className="h-9 w-auto"
                />
                <Input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) =>
                        onChange({ ...filters, date_to: e.target.value })
                    }
                    className="h-9 w-auto"
                />

                {/* Type (Using Custom Select) */}
                <div className="w-36">
                    <Select
                        value={filters.invoice_type}
                        onChange={(val: string) =>
                            onChange({ ...filters, invoice_type: val })
                        }
                        options={typeOptions}
                    />
                </div>

                {/* Status (Using Custom Select) */}
                <div className="w-36">
                    <Select
                        value={filters.status}
                        onChange={(val: string) =>
                            onChange({ ...filters, status: val })
                        }
                        options={statusOptions}
                    />
                </div>

                {/* Company (Super Admin only, using Custom Select) */}
                {isSuperAdmin && companies.length > 0 && (
                    <div className="w-48">
                        <Select
                            value={filters.company_id}
                            onChange={(val: string) =>
                                onChange({ ...filters, company_id: val })
                            }
                            options={companyOptions}
                        />
                    </div>
                )}

                {/* Reset */}
                {isFiltered && (
                    <button
                        onClick={reset}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
                    >
                        <X className="h-4 w-4" /> Reset
                    </button>
                )}

                <div className="ml-auto text-sm text-muted-foreground">
                    {totalCount}{" "}
                    {totalCount === 1 ? "transaction" : "transactions"}
                </div>
            </div>
        </div>
    );
}
