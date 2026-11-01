import { useEffect, useState } from "react";
import { listJournalEntries } from "@/modules/journal-entries/api";
import type { JournalEntry } from "@/modules/journal-entries/types";
import JournalEntriesTable from "@/modules/journal-entries/components/JournalEntriesTable";
import JournalEntryDrawer from "@/modules/journal-entries/components/JournalEntryDrawer";
import CreateJournalEntryModal from "@/modules/journal-entries/components/CreateJournalEntryModal";
import { RefreshCw, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import Combobox from "@/components/ui/Combobox";
import { useAuth } from "@/auth/useAuth";
import { apiFetch } from "@/lib/apiFetch";

export default function JournalEntries() {
    const { roles, isSuperAdmin } = useAuth();

    // Role check for company filter
    const canFilterCompanies =
        isSuperAdmin ||
        roles.some((r: any) => ["admin", "manager"].includes(r.name));

    const [data, setData] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Filters
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [search, setSearch] = useState("");
    const [companyFilter, setCompanyFilter] = useState("");
    const [companies, setCompanies] = useState<
        { value: string; label: string }[]
    >([]);

    // Fetch companies for the dropdown
    useEffect(() => {
        if (canFilterCompanies) {
            apiFetch<any>("/api/companies")
                .then((res) => {
                    const companyData = res.data?.data || res.data || [];
                    setCompanies(
                        companyData.map((c: any) => ({
                            value: String(c.id),
                            label: c.name,
                        })),
                    );
                })
                .catch(console.error);
        }
    }, [canFilterCompanies]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await listJournalEntries({
                date,
                search,
                company_id: companyFilter ? Number(companyFilter) : undefined,
            });
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Small debounce for search typing
        const timer = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(timer);
    }, [date, search, companyFilter]);

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 p-6">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        Expenses & Journal Entries
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        View and record daily expenses.
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={fetchData}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm transition hover:bg-white/10"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                        />{" "}
                        Refresh
                    </button>

                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="inline-flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-medium text-white transition hover:bg-violet-700"
                    >
                        <Plus className="h-4 w-4" /> Record Expense
                    </button>
                </div>
            </div>

            {/* Filters Card */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search entry or title..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-9 pl-9"
                        />
                    </div>

                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="h-9 w-auto"
                    />

                    {canFilterCompanies && companies.length > 0 && (
                        <div className="w-48">
                            <Combobox
                                options={[
                                    { value: "", label: "All Companies" },
                                    ...companies,
                                ]}
                                value={companyFilter}
                                onChange={setCompanyFilter}
                                placeholder="All Companies"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Data Table Card */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
                <JournalEntriesTable
                    data={data}
                    loading={loading}
                    onView={setSelectedId}
                />
            </div>

            {/* Drawer for viewing details */}
            <JournalEntryDrawer
                entryId={selectedId}
                onClose={() => setSelectedId(null)}
            />

            {/* Modal for creating new entries */}
            {isCreateOpen && (
                <CreateJournalEntryModal
                    onClose={() => setIsCreateOpen(false)}
                    onSuccess={fetchData}
                />
            )}
        </div>
    );
}
