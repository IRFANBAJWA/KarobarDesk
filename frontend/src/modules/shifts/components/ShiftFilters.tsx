import { RotateCcw } from "lucide-react";
import Select from "@/modules/users/components/Select";
import { Input } from "@/components/ui/input"; // Use the same Input component

export interface ShiftFilterState {
    date: string;
    status: string;
    company_id: string;
    user_id: string;
}

export const DEFAULT_SHIFT_FILTERS: ShiftFilterState = {
    date: "",
    status: "",
    company_id: "",
    user_id: "",
};

interface Props {
    filters: ShiftFilterState;
    onChange: (filters: ShiftFilterState) => void;
    users: { id: number; name: string }[];
    companies: { id: number; name: string }[];
    isSuperAdmin: boolean;
    canFilterUsers: boolean;
}

export default function ShiftFilters({
    filters,
    onChange,
    users = [],
    companies = [],
    isSuperAdmin,
    canFilterUsers,
}: Props) {
    const hasFilters = Object.values(filters).some(Boolean);

    // Options for custom Select (matching Sales page pattern)
    const statusOptions = [
        { value: "", label: "All Statuses" },
        { value: "OPEN", label: "Open" },
        { value: "CLOSED", label: "Closed" },
    ];

    const companyOptions = [
        { value: "", label: "All Companies" },
        ...companies.map((c) => ({ value: String(c.id), label: c.name })),
    ];

    const userOptions = [
        { value: "", label: "All Users" },
        ...users.map((u) => ({ value: String(u.id), label: u.name })),
    ];

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-3">
                {/* 1. Date Filter */}
                <Input
                    type="date"
                    value={filters.date}
                    onChange={(e) =>
                        onChange({ ...filters, date: e.target.value })
                    }
                    className="h-9 w-auto"
                />

                {/* 2. Status Filter */}
                <div className="w-36">
                    <Select
                        value={filters.status}
                        onChange={(val: string) =>
                            onChange({ ...filters, status: val })
                        }
                        options={statusOptions}
                    />
                </div>

                {/* 3. Company Filter (Super Admin Only) */}
                {isSuperAdmin && companies.length > 0 && (
                    <div className="w-48">
                        <Select
                            value={filters.company_id}
                            onChange={(val: string) =>
                                onChange({
                                    ...filters,
                                    company_id: val,
                                    user_id: "", // Reset user filter if company changes
                                })
                            }
                            options={companyOptions}
                        />
                    </div>
                )}

                {/* 4. User Filter (Super Admin, Admin, Manager Only) */}
                {canFilterUsers && users.length > 0 && (
                    <div className="w-48">
                        <Select
                            value={filters.user_id}
                            onChange={(val: string) =>
                                onChange({ ...filters, user_id: val })
                            }
                            options={userOptions}
                        />
                    </div>
                )}

                {/* 5. Reset Button */}
                {hasFilters && (
                    <button
                        onClick={() => onChange(DEFAULT_SHIFT_FILTERS)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
                    >
                        <RotateCcw className="h-3.5 w-3.5" /> Reset
                    </button>
                )}
            </div>
        </div>
    );
}
