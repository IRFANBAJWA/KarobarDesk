import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import CompaniesTable from "@/modules/companies/components/CompaniesTable";
import CompanyDetailDrawer from "@/modules/companies/components/CompanyDetailDrawer";
import CompaniesFilters, {
    DEFAULT_COMPANIES_FILTERS,
    type CompaniesFilterState,
} from "@/modules/companies/components/CompaniesFilters";
import { listCompanies, toggleCompanyActive } from "@/modules/companies/api";
import type { Company } from "@/modules/companies/types";

export default function Companies() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<CompaniesFilterState>(
        DEFAULT_COMPANIES_FILTERS,
    );

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selected, setSelected] = useState<Company | null>(null);
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    /* ------------------------------ fetch ------------------------------ */

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listCompanies();
            setCompanies(data);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load companies.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(t);
    }, [toast]);

    /* ----------------------------- filter ------------------------------ */

    const filtered = useMemo(() => {
        const q = filters.search.trim().toLowerCase();

        return companies.filter((c) => {
            if (filters.active === "active" && !c.is_active) return false;
            if (filters.active === "inactive" && c.is_active) return false;

            if (
                filters.sync !== "all" &&
                (c.sync_status ?? "") !== filters.sync
            )
                return false;

            if (q) {
                const haystack = [c.name, c.code, c.erpnext_company ?? ""]
                    .join(" ")
                    .toLowerCase();
                if (!haystack.includes(q)) return false;
            }

            return true;
        });
    }, [companies, filters]);

    /* ----------------------------- actions ----------------------------- */

    function openDrawer(company: Company) {
        setSelected(company);
        setDrawerOpen(true);
    }

    function closeDrawer() {
        setDrawerOpen(false);
        setSelected(null);
    }

    async function handleToggleActive(company: Company) {
        setTogglingId(company.id);
        try {
            const res = await toggleCompanyActive(company.id);
            const updated = res.data;

            setCompanies((prev) =>
                prev.map((c) => (c.id === updated.id ? updated : c)),
            );

            if (selected?.id === updated.id) {
                setSelected(updated);
            }

            setToast(res.message);
        } catch (e: any) {
            setToast(e?.message ?? "Failed to update status.");
        } finally {
            setTogglingId(null);
        }
    }

    function handleCompanyUpdated(updated: Company) {
        setCompanies((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c)),
        );
    }

    /* ------------------------------ render ----------------------------- */

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        Companies
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Synced from ERPNext. Read-only — manage masters in
                        ERPNext.
                    </p>
                </div>
                <Button
                    variant="ghost"
                    onClick={load}
                    disabled={loading}
                    className="h-9 px-3 text-sm"
                >
                    <RefreshCw
                        className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <CompaniesFilters
                value={filters}
                onChange={setFilters}
                total={companies.length}
                shown={filtered.length}
            />

            {/* Error */}
            {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                    {error}
                </div>
            )}

            {/* Table card — card lives HERE, matching Users */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
                <CompaniesTable
                    companies={filtered}
                    loading={loading}
                    onView={openDrawer}
                    onToggleActive={handleToggleActive}
                    togglingId={togglingId}
                />
            </div>

            {/* Drawer */}
            <CompanyDetailDrawer
                open={drawerOpen}
                company={selected}
                onClose={closeDrawer}
                onToggleActive={handleToggleActive}
                onCompanyUpdated={handleCompanyUpdated}
                toggling={togglingId === selected?.id}
            />

            {/* Toast — matches Users exactly */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-white/10 bg-neutral-900/95 px-4 py-3 text-sm shadow-2xl backdrop-blur-xl">
                    {toast}
                </div>
            )}
        </div>
    );
}
