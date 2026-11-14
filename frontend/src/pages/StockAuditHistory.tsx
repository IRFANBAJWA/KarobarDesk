import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { apiFetch } from "@/lib/apiFetch";
import { useAuth } from "@/auth/useAuth";
import {
    ShieldCheck,
    Eye,
    Calendar,
    X,
    Loader2,
    Filter,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    Boxes,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Combobox from "@/components/ui/Combobox";

// ⭐ Helpers
const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-PK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

const getTodayString = () => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
};

// ⭐ Item Flow Panel
function ItemFlowPanel({
    itemId,
    dateFrom,
    dateTo,
}: {
    itemId: number;
    dateFrom: string;
    dateTo: string;
}) {
    const [flows, setFlows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!itemId) return;
        setLoading(true);
        const params = new URLSearchParams({ item_id: String(itemId) });
        if (dateFrom) params.append("date_from", dateFrom);
        if (dateTo) params.append("date_to", dateTo);

        apiFetch(`/api/stock-audits/item-history?${params.toString()}`)
            .then((res) => setFlows(res.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [itemId, dateFrom, dateTo]);

    return (
        <div className="glass-panel p-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20">
                    <Boxes className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white">
                        Item Movement History
                    </h3>
                    <p className="text-xs text-slate-400">
                        Complete stock ledger for this item
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                </div>
            ) : flows.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-6">
                    No movements found for this item.
                </p>
            ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                    {flows.map((flow) => {
                        const isPositive = Number(flow.qty) >= 0;
                        return (
                            <div
                                key={flow.id}
                                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={cn(
                                            "flex h-8 w-8 items-center justify-center rounded-lg",
                                            isPositive
                                                ? "bg-emerald-500/10 text-emerald-400"
                                                : "bg-red-500/10 text-red-400",
                                        )}
                                    >
                                        {isPositive ? (
                                            <ArrowUpRight className="h-4 w-4" />
                                        ) : (
                                            <ArrowDownRight className="h-4 w-4" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-white capitalize">
                                            {flow.reference_type} #
                                            {flow.reference_id}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                            {new Date(
                                                flow.created_at,
                                            ).toLocaleString("en-PK")}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p
                                        className={cn(
                                            "text-sm font-bold",
                                            isPositive
                                                ? "text-emerald-400"
                                                : "text-red-400",
                                        )}
                                    >
                                        {isPositive ? `+${flow.qty}` : flow.qty}
                                    </p>
                                    <p className="text-[10px] text-slate-500">
                                        Bal: {flow.balance_after}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ⭐ Audit Detail Drawer
function AuditDetailDrawer({
    auditId,
    onClose,
}: {
    auditId: number | null;
    onClose: () => void;
}) {
    const [audit, setAudit] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!auditId) return;
        setLoading(true);
        apiFetch(`/api/stock-audits/${auditId}`)
            .then((res) => setAudit(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [auditId]);

    if (!auditId) return null;

    return createPortal(
        <>
            <div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <aside className="fixed right-0 top-0 z-50 flex h-[100dvh] w-full max-w-2xl flex-col border-l border-white/10 bg-[#0a0a0f]/95 shadow-2xl backdrop-blur-xl">
                <header className="shrink-0 border-b border-white/10 px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-violet-400" />
                            Audit —{" "}
                            {audit?.audit_date
                                ? formatDate(audit.audit_date)
                                : "Loading..."}
                        </h2>
                        {audit && (
                            <p className="text-xs text-slate-400 mt-1">
                                {audit.company?.name} • Finalized by{" "}
                                {audit.finalized_by?.name || "N/A"}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </header>
                <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar p-6">
                    {loading || !audit ? (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                        </div>
                    ) : (
                        <div className="glass-panel overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/10 bg-white/[0.02]">
                                    <tr>
                                        <th className="px-4 py-3">Item</th>
                                        <th className="px-4 py-3 text-center">
                                            System
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Counted
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Diff
                                        </th>
                                        <th className="px-4 py-3">Reason</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {audit.items?.map((item: any) => {
                                        const diff = Number(item.difference);
                                        return (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-white/[0.02]"
                                            >
                                                <td className="px-4 py-3 font-medium text-white">
                                                    {item.item?.item_name}
                                                </td>
                                                <td className="px-4 py-3 text-center text-slate-300">
                                                    {Number(item.system_qty)}
                                                </td>
                                                <td className="px-4 py-3 text-center text-emerald-400 font-bold">
                                                    {Number(
                                                        item.total_counted_qty,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span
                                                        className={cn(
                                                            "px-2 py-0.5 rounded text-xs font-bold",
                                                            diff === 0
                                                                ? "bg-emerald-500/10 text-emerald-400"
                                                                : "bg-red-500/10 text-red-400",
                                                        )}
                                                    >
                                                        {diff > 0
                                                            ? `+${diff}`
                                                            : diff}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-400">
                                                    {item.discrepancy_reason ||
                                                        "—"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </aside>
        </>,
        document.body,
    );
}

// ⭐ Main Page
export default function StockAuditHistory() {
    const { roles } = useAuth();
    const isManager = roles.some(
        (r) =>
            r.name === "manager" ||
            r.name === "admin" ||
            r.name === "super_admin",
    );

    const [audits, setAudits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null);

    const [dateFrom, setDateFrom] = useState(getTodayString());
    const [dateTo, setDateTo] = useState(getTodayString());
    const [companies, setCompanies] = useState<any[]>([]);

    // ⭐ Combobox options format
    const [itemOptions, setItemOptions] = useState<
        { value: string; label: string }[]
    >([]);

    const [selectedCompanyId, setSelectedCompanyId] = useState("all");
    const [selectedItemId, setSelectedItemId] = useState<string>("");
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<any>({
        current_page: 1,
        last_page: 1,
        total: 0,
    });

    useEffect(() => {
        if (isManager) {
            apiFetch("/api/companies").then((res) =>
                setCompanies(res.data || []),
            );

            apiFetch("/api/items/picker")
                .then((res) => {
                    // ⭐ Map to Combobox options with item_name as label
                    // We explicitly use fallbacks to ensure we never show an ID
                    const options = (res.data || []).map((i: any) => {
                        const name = i.item_name || i.name || `Item ${i.id}`;
                        const code = i.erpnext_item_code
                            ? ` (${i.erpnext_item_code})`
                            : "";
                        return {
                            value: String(i.id),
                            label: `${name}${code}`,
                        };
                    });
                    setItemOptions(options);
                })
                .catch((err) => console.error("Failed to load items:", err));
        }
    }, [isManager]);
    const fetchAudits = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (dateFrom) params.append("date_from", dateFrom);
            if (dateTo) params.append("date_to", dateTo);
            if (selectedCompanyId !== "all")
                params.append("company_id", selectedCompanyId);
            if (selectedItemId) params.append("item_id", selectedItemId);
            params.append("page", String(page));

            const res = await apiFetch(
                `/api/stock-audits?${params.toString()}`,
            );
            setAudits(res.data || []);
            setMeta(res.meta || {});
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
        fetchAudits();
    }, [dateFrom, dateTo, selectedCompanyId, selectedItemId]);
    useEffect(() => {
        fetchAudits();
    }, [page]);

    const clearFilters = () => {
        const today = getTodayString();
        setDateFrom(today);
        setDateTo(today);
        setSelectedCompanyId("all");
        setSelectedItemId("");
        setPage(1);
    };

    const totals = audits.reduce(
        (acc, a) => ({
            items: acc.items + (a.total_items || 0),
            stock: acc.stock + (a.total_stock_audited || 0),
        }),
        { items: 0, stock: 0 },
    );

    return (
        <div className="mx-auto max-w-[1400px] p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20">
                    <ShieldCheck className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Audit History
                    </h1>
                    <p className="text-sm text-slate-400">
                        Past stock audits with item-level stock flow.
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Total Audits
                    </p>
                    <p className="text-2xl font-bold text-white mt-1">
                        {meta.total}
                    </p>
                </div>
                <div className="glass-panel p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Total Items Audited
                    </p>
                    <p className="text-2xl font-bold text-white mt-1">
                        {totals.items}
                    </p>
                </div>
                <div className="glass-panel p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Total Stock Audited
                    </p>
                    <p className="text-2xl font-bold text-white mt-1">
                        {totals.stock.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-panel p-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <Filter className="h-4 w-4" /> Filters
                </div>

                {isManager && companies.length > 0 && (
                    <select
                        value={selectedCompanyId}
                        onChange={(e) => setSelectedCompanyId(e.target.value)}
                        className="h-9 px-3 rounded-lg bg-[#0a0a0f] border border-white/10 text-xs text-white focus:outline-none"
                    >
                        <option value="all">All Companies</option>
                        {companies.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                )}

                {/* ⭐ REPLACE NATIVE SELECT WITH COMBOBOX */}
                {isManager && itemOptions.length > 0 && (
                    <div className="w-64">
                        <Combobox
                            options={itemOptions}
                            value={selectedItemId}
                            onChange={setSelectedItemId}
                            placeholder="Search all items..."
                        />
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="h-9 px-3 rounded-lg bg-[#0a0a0f] border border-white/10 text-xs text-white focus:outline-none"
                    />
                    <span className="text-slate-500 text-xs">to</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="h-9 px-3 rounded-lg bg-[#0a0a0f] border border-white/10 text-xs text-white focus:outline-none"
                    />
                </div>

                <button
                    onClick={clearFilters}
                    className="h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition flex items-center gap-2"
                >
                    <RotateCcw className="h-3.5 w-3.5" /> Clear
                </button>
            </div>

            {/* Item Flow Panel */}
            {selectedItemId && (
                <ItemFlowPanel
                    itemId={Number(selectedItemId)}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                />
            )}

            {/* Table */}
            <div className="glass-panel overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/10 bg-white/[0.02]">
                        <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Company</th>
                            <th className="px-6 py-4 text-center">Items</th>
                            <th className="px-6 py-4 text-center">
                                Stock Audited
                            </th>
                            <th className="px-6 py-4 text-center">
                                Discrepancies
                            </th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="p-8 text-center text-slate-400"
                                >
                                    Loading...
                                </td>
                            </tr>
                        ) : audits.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="p-8 text-center text-slate-400"
                                >
                                    No audits found for this filter.
                                </td>
                            </tr>
                        ) : (
                            audits.map((audit: any) => (
                                <tr
                                    key={audit.id}
                                    className="hover:bg-white/[0.02] transition-colors"
                                >
                                    <td className="px-6 py-4 text-white font-medium flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                        {formatDate(audit.audit_date)}
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">
                                        {audit.company_name}
                                    </td>
                                    <td className="px-6 py-4 text-center text-slate-300">
                                        {audit.total_items}
                                    </td>
                                    <td className="px-6 py-4 text-center text-slate-300 font-bold">
                                        {audit.total_stock_audited}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {audit.total_discrepancies > 0 ? (
                                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/10 text-red-400">
                                                {audit.total_discrepancies}
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400">
                                                All OK
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span
                                            className={cn(
                                                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
                                                audit.status === "finalized"
                                                    ? "bg-emerald-500/10 text-emerald-400"
                                                    : "bg-blue-500/10 text-blue-400",
                                            )}
                                        >
                                            {audit.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() =>
                                                setSelectedAuditId(audit.id)
                                            }
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                                        >
                                            <Eye className="h-3.5 w-3.5" /> View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {meta.total > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 text-sm text-slate-400">
                    <p>
                        Showing{" "}
                        <span className="text-white font-medium">
                            {audits.length}
                        </span>{" "}
                        of{" "}
                        <span className="text-white font-medium">
                            {meta.total}
                        </span>{" "}
                        audits
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={meta.current_page === 1}
                            className="flex h-9 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium hover:bg-white/10 disabled:opacity-50 transition"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" /> Prev
                        </button>
                        <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white">
                            Page {meta.current_page} of {meta.last_page}
                        </div>
                        <button
                            onClick={() =>
                                setPage((p) => Math.min(meta.last_page, p + 1))
                            }
                            disabled={meta.current_page === meta.last_page}
                            className="flex h-9 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium hover:bg-white/10 disabled:opacity-50 transition"
                        >
                            Next <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            )}

            <AuditDetailDrawer
                auditId={selectedAuditId}
                onClose={() => setSelectedAuditId(null)}
            />
        </div>
    );
}
