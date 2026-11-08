import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
    Receipt,
    ArrowUpRight,
    Package,
    RotateCcw,
    Layers,
    AlertTriangle,
    Banknote,
    Building2,
    ChevronDown,
    CalendarDays,
    Check,
    TrendingUp,
    Trophy,
    Clock,
    Calculator,
} from "lucide-react";
import KpiCard from "./KpiCard";
import type { DashboardData } from "../types";
import { cn } from "@/lib/utils";

const formatPKR = (value: number) =>
    `Rs ${Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

const dateRanges = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 Days", value: "last_7_days" },
    { label: "This Month", value: "this_month" },
];

interface Props {
    data: DashboardData;
    dateRange: string;
    setDateRange: (val: string) => void;
    companyFilter: string;
    setCompanyFilter: (val: string) => void;
}

export default function AdminLayout({
    data,
    dateRange,
    setDateRange,
    companyFilter,
    setCompanyFilter,
}: Props) {
    const [dateOpen, setDateOpen] = useState(false);
    const [companyOpen, setCompanyOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"items" | "cashiers" | "shifts">(
        "items",
    );

    const dateBtnRef = useRef<HTMLButtonElement>(null);
    const companyBtnRef = useRef<HTMLButtonElement>(null);
    const [datePos, setDatePos] = useState({ top: 0, left: 0 });
    const [companyPos, setCompanyPos] = useState({ top: 0, left: 0 });

    useEffect(() => {
        const handleScroll = () => {
            setDateOpen(false);
            setCompanyOpen(false);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (!data?.kpis)
        return <div className="p-8 text-center text-slate-400">Loading...</div>;

    const {
        kpis,
        product_kpis,
        payment_breakdown,
        companies_leaderboard,
        assigned_companies,
        top_items,
        cashier_leaderboard,
        shift_summary,
        day_close_summary,
    } = data as any;

    const showCompanyFilter =
        assigned_companies && assigned_companies.length > 1;
    const selectedCompanyName =
        companyFilter === "all"
            ? "All My Companies"
            : assigned_companies?.find(
                  (c: any) => String(c.id) === companyFilter,
              )?.name || "Company";
    const selectedDateLabel =
        dateRanges.find((item) => item.value === dateRange)?.label || "Today";

    const toggleDate = () => {
        if (!dateOpen && dateBtnRef.current) {
            const rect = dateBtnRef.current.getBoundingClientRect();
            setDatePos({ top: rect.bottom + 8, left: rect.right - 192 });
        }
        setDateOpen(!dateOpen);
        setCompanyOpen(false);
    };

    const toggleCompany = () => {
        if (!companyOpen && companyBtnRef.current) {
            const rect = companyBtnRef.current.getBoundingClientRect();
            setCompanyPos({ top: rect.bottom + 8, left: rect.right - 224 });
        }
        setCompanyOpen(!companyOpen);
        setDateOpen(false);
    };

    return (
        <div className="relative min-h-screen bg-transparent p-4 md:p-6 lg:p-8 space-y-6 pb-10">
            {/* HEADER WITH FILTERS */}
            <section className="relative z-50 flex flex-col justify-between gap-5 xl:flex-row xl:items-center animate-fade-in-up">
                <div>
                    <div className="mb-2 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.7)]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400">
                            Admin Dashboard
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
                        {companyFilter === "all"
                            ? "Aggregated Performance"
                            : selectedCompanyName}
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2 relative z-50">
                    {/* Company Filter (Only if > 1 assigned) */}
                    {showCompanyFilter && (
                        <div className="relative">
                            <button
                                ref={companyBtnRef}
                                onClick={toggleCompany}
                                className="flex h-10 items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.045] px-4 text-xs font-semibold text-white backdrop-blur-xl transition hover:border-violet-400/30 hover:bg-white/[0.07]"
                            >
                                <Building2 className="h-3.5 w-3.5 text-violet-400" />
                                {selectedCompanyName}
                                <ChevronDown
                                    className={cn(
                                        "h-3.5 w-3.5 text-slate-500 transition-transform",
                                        companyOpen && "rotate-180",
                                    )}
                                />
                            </button>
                            {companyOpen &&
                                createPortal(
                                    <>
                                        <div
                                            className="fixed inset-0 z-[90]"
                                            onClick={() =>
                                                setCompanyOpen(false)
                                            }
                                        />
                                        <div
                                            className="fixed z-[100] w-56 rounded-xl border border-white/10 bg-[#151722]/95 p-1.5 shadow-2xl backdrop-blur-2xl"
                                            style={{
                                                top: companyPos.top,
                                                left: companyPos.left,
                                            }}
                                        >
                                            <button
                                                onClick={() => {
                                                    setCompanyFilter("all");
                                                    setCompanyOpen(false);
                                                }}
                                                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs text-white transition hover:bg-white/[0.06]"
                                            >
                                                All My Companies{" "}
                                                {companyFilter === "all" && (
                                                    <Check className="h-3.5 w-3.5 text-violet-400" />
                                                )}
                                            </button>
                                            {assigned_companies.map(
                                                (company: any) => (
                                                    <button
                                                        key={company.id}
                                                        onClick={() => {
                                                            setCompanyFilter(
                                                                String(
                                                                    company.id,
                                                                ),
                                                            );
                                                            setCompanyOpen(
                                                                false,
                                                            );
                                                        }}
                                                        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                                                    >
                                                        {company.name}{" "}
                                                        {companyFilter ===
                                                            String(
                                                                company.id,
                                                            ) && (
                                                            <Check className="h-3.5 w-3.5 text-violet-400" />
                                                        )}
                                                    </button>
                                                ),
                                            )}
                                        </div>
                                    </>,
                                    document.body,
                                )}
                        </div>
                    )}

                    {/* Date Filter */}
                    <div className="relative">
                        <button
                            ref={dateBtnRef}
                            onClick={toggleDate}
                            className="flex h-10 items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.045] px-4 text-xs font-semibold text-white backdrop-blur-xl transition hover:border-violet-400/30 hover:bg-white/[0.07]"
                        >
                            <CalendarDays className="h-3.5 w-3.5 text-blue-400" />{" "}
                            {selectedDateLabel}
                            <ChevronDown
                                className={cn(
                                    "h-3.5 w-3.5 text-slate-500 transition-transform",
                                    dateOpen && "rotate-180",
                                )}
                            />
                        </button>
                        {dateOpen &&
                            createPortal(
                                <>
                                    <div
                                        className="fixed inset-0 z-[90]"
                                        onClick={() => setDateOpen(false)}
                                    />
                                    <div
                                        className="fixed z-[100] w-48 rounded-xl border border-white/10 bg-[#151722]/95 p-1.5 shadow-2xl backdrop-blur-2xl"
                                        style={{
                                            top: datePos.top,
                                            left: datePos.left,
                                        }}
                                    >
                                        {dateRanges.map((item) => (
                                            <button
                                                key={item.value}
                                                onClick={() => {
                                                    setDateRange(item.value);
                                                    setDateOpen(false);
                                                }}
                                                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                                            >
                                                {item.label}{" "}
                                                {dateRange === item.value && (
                                                    <Check className="h-3.5 w-3.5 text-violet-400" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </>,
                                document.body,
                            )}
                    </div>
                </div>
            </section>

            {/* ROW 1: MAIN KPIS */}
            <section className="relative z-10">
                <div
                    className="mb-3 flex items-center justify-between animate-fade-in-up"
                    style={{ animationDelay: "50ms" }}
                >
                    <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                        Overall Performance
                    </h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        delay={100}
                        title="Net Sales"
                        value={formatPKR(Number(kpis.today_sales))}
                        breakdown={{
                            gross: formatPKR(Number(kpis.gross_sales)),
                            returns: formatPKR(Number(kpis.return_value)),
                        }}
                        icon={ArrowUpRight}
                        color="violet"
                    />
                    <KpiCard
                        delay={200}
                        title="Total Invoices"
                        value={Number(kpis.today_invoices).toLocaleString()}
                        breakdown={{
                            gross: `${kpis.sale_count} Sales`,
                            returns: `${kpis.return_count} Returns`,
                        }}
                        icon={Receipt}
                        color="blue"
                    />
                    <KpiCard
                        delay={300}
                        title="Net Items Sold"
                        value={Number(
                            product_kpis?.total_items || 0,
                        ).toLocaleString()}
                        breakdown={{
                            gross: `${product_kpis?.gross_units} pcs`,
                            returns: `${product_kpis?.returned_units} pcs`,
                        }}
                        icon={Package}
                        color="emerald"
                    />
                    <KpiCard
                        delay={400}
                        title="Return Value"
                        value={formatPKR(Number(kpis.return_value))}
                        icon={RotateCcw}
                        color="red"
                    />
                </div>
            </section>

            {/* ROW 2: FLAGS & PAYMENTS */}
            <section
                className="grid grid-cols-1 lg:grid-cols-3 gap-5 relative z-10 animate-fade-in-up"
                style={{ animationDelay: "150ms" }}
            >
                <div className="lg:col-span-1 space-y-4">
                    <KpiCard
                        delay={500}
                        title="Packs Sold (IsSet)"
                        value={Number(
                            product_kpis?.pack_units || 0,
                        ).toLocaleString()}
                        icon={Layers}
                        color="orange"
                    />
                    <KpiCard
                        delay={600}
                        title="Defective Sold (IsB)"
                        value={Number(
                            product_kpis?.defective_units || 0,
                        ).toLocaleString()}
                        icon={AlertTriangle}
                        color="red"
                    />
                </div>
                <div className="lg:col-span-2 glass-panel p-6">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-emerald-400" />{" "}
                        Collections (By Account)
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/10">
                                <tr>
                                    <th className="pb-3 font-semibold">
                                        Account
                                    </th>
                                    <th className="pb-3 font-semibold text-right">
                                        Sale (+)
                                    </th>
                                    <th className="pb-3 text-right font-semibold">
                                        Return (-)
                                    </th>
                                    <th className="pb-3 text-right font-semibold">
                                        Net
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {payment_breakdown?.map(
                                    (acc: any, idx: number) => (
                                        <tr
                                            key={idx}
                                            className="hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="py-3 font-medium text-white flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                {acc.account_name}
                                            </td>
                                            <td className="py-3 text-right text-slate-300">
                                                {acc.sale_amount > 0
                                                    ? formatPKR(acc.sale_amount)
                                                    : "-"}
                                            </td>
                                            <td className="py-3 text-right text-red-400">
                                                {acc.return_amount > 0
                                                    ? formatPKR(
                                                          acc.return_amount,
                                                      )
                                                    : "-"}
                                            </td>
                                            <td className="py-3 text-right text-emerald-400 font-bold">
                                                {formatPKR(acc.net_amount)}
                                            </td>
                                        </tr>
                                    ),
                                )}
                                {(!payment_breakdown ||
                                    payment_breakdown.length === 0) && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="py-6 text-center text-slate-500"
                                        >
                                            No payments collected.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* ROW 3: COMPANY LEADERBOARD */}
            <section
                className="relative z-10 animate-fade-in-up"
                style={{ animationDelay: "250ms" }}
            >
                <div className="glass-panel p-6">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-400" /> Company
                        Performance
                    </h3>
                    <div className="space-y-3">
                        {companies_leaderboard?.map((c: any, idx: number) => (
                            <div
                                key={c.id}
                                className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400">
                                        #{idx + 1}
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-white">
                                            {c.name}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {c.invoice_count} Invoices{" "}
                                            {dateRange === "today"
                                                ? "today"
                                                : `(${selectedDateLabel})`}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-white">
                                        {formatPKR(c.net_sales)}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                        Sale:{" "}
                                        <span className="text-emerald-400">
                                            {formatPKR(c.gross_sales)}
                                        </span>{" "}
                                        | Ret:{" "}
                                        <span className="text-red-400">
                                            {formatPKR(c.return_value)}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        ))}
                        {(!companies_leaderboard ||
                            companies_leaderboard.length === 0) && (
                            <p className="text-center text-sm text-slate-500 py-4">
                                No companies assigned or no sales for this
                                period.
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {/* ROW 4: ANALYTICS TABS */}
            <section
                className="relative z-10 animate-fade-in-up"
                style={{ animationDelay: "350ms" }}
            >
                <div className="glass-panel p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
                        <div>
                            <h3 className="text-sm font-bold text-white mb-1">
                                Detailed Analytics
                            </h3>
                            <p className="text-xs text-slate-400">
                                Showing{" "}
                                {companyFilter === "all"
                                    ? "all assigned companies"
                                    : selectedCompanyName}{" "}
                                for {selectedDateLabel.toLowerCase()}.
                            </p>
                        </div>
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                            <button
                                onClick={() => setActiveTab("items")}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all",
                                    activeTab === "items"
                                        ? "bg-white/10 text-white shadow-sm"
                                        : "text-slate-400 hover:text-white",
                                )}
                            >
                                <TrendingUp className="w-4 h-4" /> Top Items
                            </button>
                            <button
                                onClick={() => setActiveTab("cashiers")}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all",
                                    activeTab === "cashiers"
                                        ? "bg-white/10 text-white shadow-sm"
                                        : "text-slate-400 hover:text-white",
                                )}
                            >
                                <Trophy className="w-4 h-4" /> Cashiers
                            </button>
                            <button
                                onClick={() => setActiveTab("shifts")}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all",
                                    activeTab === "shifts"
                                        ? "bg-white/10 text-white shadow-sm"
                                        : "text-slate-400 hover:text-white",
                                )}
                            >
                                <Clock className="w-4 h-4" /> Shifts & Closings
                            </button>
                        </div>
                    </div>

                    <div>
                        {/* TAB 1: ITEMS */}
                        {activeTab === "items" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {top_items?.map((item: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-4 rounded-xl hover:bg-white/[0.04] transition-colors border border-white/5"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-400">
                                                #{idx + 1}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-white">
                                                    {item.item_name}
                                                </p>

                                                {/* ⭐ NEW: The Breakdown text */}
                                                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                                                    <span>
                                                        Sale:{" "}
                                                        <span className="text-white font-medium">
                                                            {item.sold_qty} pcs
                                                        </span>
                                                    </span>
                                                    <span className="text-slate-600">
                                                        |
                                                    </span>
                                                    <span>
                                                        Ret:{" "}
                                                        <span className="text-red-400 font-medium">
                                                            {item.returned_qty}{" "}
                                                            pcs
                                                        </span>
                                                    </span>
                                                    <span className="text-slate-600">
                                                        |
                                                    </span>
                                                    <span>
                                                        Net:{" "}
                                                        <span className="text-emerald-400 font-bold">
                                                            {item.net_units} pcs
                                                        </span>
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-white">
                                                {formatPKR(item.total_revenue)}
                                            </p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                                                Net Revenue
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {(!top_items || top_items.length === 0) && (
                                    <p className="col-span-2 text-center text-sm text-slate-500 py-4">
                                        No items sold for this period.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* TAB 2: CASHIERS */}
                        {activeTab === "cashiers" && (
                            <div className="space-y-3">
                                {cashier_leaderboard?.map(
                                    (c: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-4 rounded-xl hover:bg-white/[0.04] transition-colors border border-white/5"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-xs font-bold text-orange-400">
                                                    #{idx + 1}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-white">
                                                        {c.cashier_name}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {c.invoice_count}{" "}
                                                        Invoices{" "}
                                                        {companyFilter ===
                                                            "all" &&
                                                            `• ${assigned_companies?.find((a: any) => a.id === c.company_id)?.name}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-white">
                                                    {formatPKR(c.net_sales)}
                                                </p>
                                                <p className="text-[10px] text-slate-400">
                                                    Sale:{" "}
                                                    <span className="text-emerald-400">
                                                        {formatPKR(
                                                            c.gross_sales,
                                                        )}
                                                    </span>{" "}
                                                    | Ret:{" "}
                                                    <span className="text-red-400">
                                                        {formatPKR(
                                                            c.total_returns,
                                                        )}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    ),
                                )}
                                {(!cashier_leaderboard ||
                                    cashier_leaderboard.length === 0) && (
                                    <p className="text-center text-sm text-slate-500 py-4">
                                        No cashier sales.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* TAB 3: SHIFTS */}
                        {activeTab === "shifts" && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                                        <p className="text-xs text-slate-400 mb-1">
                                            Total Shifts
                                        </p>
                                        <p className="text-2xl font-bold text-white">
                                            {shift_summary?.total || 0}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                                        <p className="text-xs text-blue-300 mb-1">
                                            Open Shifts
                                        </p>
                                        <p className="text-2xl font-bold text-blue-400">
                                            {shift_summary?.open || 0}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-500/10 border border-slate-500/20 text-center">
                                        <p className="text-xs text-slate-300 mb-1">
                                            Closed Shifts
                                        </p>
                                        <p className="text-2xl font-bold text-slate-400">
                                            {shift_summary?.closed || 0}
                                        </p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                        <Calculator className="w-4 h-4 text-emerald-400" />{" "}
                                        Day Closing Summary
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase">
                                                Closings
                                            </p>
                                            <p className="text-sm font-bold text-white">
                                                {day_close_summary?.total_closings ||
                                                    0}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase">
                                                Expected Cash
                                            </p>
                                            <p className="text-sm font-bold text-white">
                                                {formatPKR(
                                                    day_close_summary?.expected_cash ||
                                                        0,
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase">
                                                Actual Cash
                                            </p>
                                            <p className="text-sm font-bold text-white">
                                                {formatPKR(
                                                    day_close_summary?.actual_cash ||
                                                        0,
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase">
                                                Difference
                                            </p>
                                            <p
                                                className={cn(
                                                    "text-sm font-bold",
                                                    day_close_summary?.cash_difference <
                                                        0
                                                        ? "text-red-400"
                                                        : "text-emerald-400",
                                                )}
                                            >
                                                {formatPKR(
                                                    day_close_summary?.cash_difference ||
                                                        0,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
