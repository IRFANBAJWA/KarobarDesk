import { useEffect, useState } from "react";
import { listShifts, listUsers, listCompanies } from "@/modules/shifts/api";
import type { Shift } from "@/modules/shifts/types";
import ShiftsTable from "@/modules/shifts/components/ShiftsTable";
import ShiftDetailDrawer from "@/modules/shifts/components/ShiftDetailDrawer";
import ShiftFilters, {
    DEFAULT_SHIFT_FILTERS,
    type ShiftFilterState,
} from "@/modules/shifts/components/ShiftFilters";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/auth/useAuth";

export default function Shifts() {
    const { user, roles, isSuperAdmin: contextIsSuperAdmin } = useAuth();

    const isSuperAdmin =
        contextIsSuperAdmin || roles.some((r) => r.name === "super_admin");
    const isAdminOrManager = roles.some((r) =>
        ["admin", "manager"].includes(r.name),
    );

    const canFilterUsers = isSuperAdmin || isAdminOrManager;

    const [data, setData] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);

    // Filters State
    const [filters, setFilters] = useState<ShiftFilterState>(
        DEFAULT_SHIFT_FILTERS,
    );
    const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
    const [companies, setCompanies] = useState<{ id: number; name: string }[]>(
        [],
    );

    const fetchShifts = async () => {
        setLoading(true);
        try {
            const res = await listShifts({
                page: 1,
                date: filters.date || undefined,
                status: filters.status || undefined,
                company_id: filters.company_id
                    ? Number(filters.company_id)
                    : undefined,
                user_id: filters.user_id ? Number(filters.user_id) : undefined,
            });
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Load Dropdown Data based on role
    useEffect(() => {
        if (isSuperAdmin) {
            console.log("🔥 FETCHING COMPANIES..."); // Add this!
            listCompanies()
                .then((res) => {
                    console.log("✅ COMPANIES LOADED:", res);
                    setCompanies(res);
                })
                .catch((err) => console.error("❌ COMPANIES ERROR:", err));
        }
        if (canFilterUsers) {
            listUsers()
                .then((res) => {
                    console.log("✅ USERS LOADED:", res);
                    setUsers(res);
                })
                .catch((err) => console.error("❌ USERS ERROR:", err));
        }
    }, [isSuperAdmin, canFilterUsers]);

    // Refetch when filters change
    useEffect(() => {
        fetchShifts();
    }, [filters]);

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 p-6">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        Shifts & Day Closings
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        View POS shifts, cash balances, and denomination counts.
                    </p>
                </div>
                <button
                    onClick={fetchShifts}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm transition hover:bg-white/10"
                >
                    <RefreshCw
                        className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />{" "}
                    Refresh
                </button>
            </div>

            <ShiftFilters
                filters={filters}
                onChange={setFilters}
                users={users}
                companies={companies}
                isSuperAdmin={isSuperAdmin}
                canFilterUsers={canFilterUsers}
            />

            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
                <ShiftsTable
                    data={data}
                    loading={loading}
                    onView={setSelectedShiftId}
                />
            </div>

            <ShiftDetailDrawer
                shiftId={selectedShiftId}
                onClose={() => setSelectedShiftId(null)}
            />
        </div>
    );
}
