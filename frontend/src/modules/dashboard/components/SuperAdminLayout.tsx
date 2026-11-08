import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
    Building2,
    Receipt,
    Activity,
    Users,
    ChevronDown,
    ArrowUpRight,
    CalendarDays,
    Store,
    Check,
    Package,
    Layers,
    AlertTriangle,
    RotateCcw,
    TrendingUp,
    Clock,
    Calculator,
    Trophy,
} from "lucide-react";
import KpiCard from "./KpiCard";
import SalesAnalyticsChart from "./SalesAnalyticsChart";
import SystemHealthWidget from "./SystemHealthWidget";
import type { DashboardData } from "../types";
import { cn } from "@/lib/utils";

interface Props {
    data: DashboardData;
    dateRange: string;
    setDateRange: (val: string) => void;
    companyFilter: string;
    setCompanyFilter: (val: string) => void;
    companies?: { id: number; name: string }[];
}

const dateRanges = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 Days", value: "last_7_days" },
    { label: "This Month", value: "this_month" },
];

const formatPKR = (value: number) =>
    `Rs ${Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

export default function SuperAdminLayout({
    data,
    dateRange,
    setDateRange,
    companyFilter,
    setCompanyFilter,
    companies = [],
}: Props) {
    const [dateOpen, setDateOpen] = useState(false);
    const [companyOpen, setCompanyOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"items" | "ops">("items");

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
        companies: companyPerformance = [],
        chartData = [],
        systemHealth,
        product_kpis,
        top_designs,
        item_breakdown,
        shift_summary,
        day_close_summary,
    } = data as any;

    const selectedCompanyName =
        companyFilter === "all"
            ? "All Companies"
            : companies.find((c) => String(c.id) === companyFilter)?.name ||
              "Company";
    const selectedDateLabel =
        dateRanges.find((item) => item.value === dateRange)?.label ||
        "Select Range";

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
            {/* HEADER */}
            <section className="relative z-50 flex flex-col justify-between gap-5 xl:flex-row xl:items-center animate-fade-in-up">
                <div>
                    <div className="mb-2 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                            Business Overview
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
                        Command Center
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Global operations overview across all active companies.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 relative z-50">
                    {/* Company Filter */}
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
                                        onClick={() => setCompanyOpen(false)}
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
                                            All Companies{" "}
                                            {companyFilter === "all" && (
                                                <Check className="h-3.5 w-3.5 text-violet-400" />
                                            )}
                                        </button>
                                        {companies.map((company) => (
                                            <button
                                                key={company.id}
                                                onClick={() => {
                                                    setCompanyFilter(
                                                        String(company.id),
                                                    );
                                                    setCompanyOpen(false);
                                                }}
                                                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                                            >
                                                {company.name}{" "}
                                                {companyFilter ===
                                                    String(company.id) && (
                                                    <Check className="h-3.5 w-3.5 text-violet-400" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </>,
                                document.body,
                            )}
                    </div>

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

            {/* 1. GLOBAL KPIs */}
            <section className="relative z-10">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
                        title="Invoices"
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
                        title="Active Companies"
                        value={Number(kpis.active_companies).toLocaleString()}
                        icon={Building2}
                        color="emerald"
                    />
                    <KpiCard
                        delay={400}
                        title="Active Cashiers"
                        value={Number(kpis.active_cashiers).toLocaleString()}
                        icon={Users}
                        color="orange"
                    />
                    <KpiCard
                        delay={500}
                        title="Open Shifts"
                        value={Number(kpis.open_shifts).toLocaleString()}
                        icon={Activity}
                        color="teal"
                    />
                </div>
            </section>

            {/* 2. COMPANY COMPARISON */}
            <section
                className="relative z-10 animate-fade-in-up"
                style={{ animationDelay: "150ms" }}
            >
                <div className="glass-panel p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Store className="w-4 h-4 text-blue-400" /> Company
                            Comparison
                        </h3>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium bg-white/5 px-2 py-1 rounded-md">
                            Ranked by Net Sales
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/10">
                                <tr>
                                    <th className="pb-3 font-semibold">
                                        Company
                                    </th>
                                    <th className="pb-3 font-semibold text-right">
                                        Net Sales
                                    </th>
                                    <th className="pb-3 text-right font-semibold">
                                        Gross
                                    </th>
                                    <th className="pb-3 text-right font-semibold">
                                        Returns
                                    </th>
                                    <th className="pb-3 text-center font-semibold">
                                        Invoices
                                    </th>
                                    <th className="pb-3 text-center font-semibold">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {companyPerformance.map(
                                    (c: any, idx: number) => (
                                        <tr
                                            key={c.id}
                                            className="hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="py-4 font-medium text-white flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400">
                                                    #{idx + 1}
                                                </div>
                                                {c.name}
                                            </td>
                                            <td className="py-4 text-right font-bold text-white">
                                                {formatPKR(c.sales)}
                                            </td>
                                            <td className="py-4 text-right text-slate-300">
                                                {formatPKR(c.gross_sales)}
                                            </td>
                                            <td className="py-4 text-right text-red-400">
                                                {formatPKR(c.return_value)}
                                            </td>
                                            <td className="py-4 text-center text-slate-300 font-medium">
                                                {c.invoices}
                                            </td>
                                            <td className="py-4 text-center">
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold",
                                                        c.is_live
                                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                            : "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
                                                    )}
                                                >
                                                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                    {c.is_live
                                                        ? "Live"
                                                        : "Idle"}
                                                </span>
                                            </td>
                                        </tr>
                                    ),
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* 3. DETAILED ANALYTICS TABS */}
            <section
                className="relative z-10 animate-fade-in-up"
                style={{ animationDelay: "200ms" }}
            >
                <div className="glass-panel p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
                        <div>
                            <h3 className="text-sm font-bold text-white mb-1">
                                Detailed Breakdown
                            </h3>
                            <p className="text-xs text-slate-400">
                                Item-wise & Operational data for{" "}
                                {selectedDateLabel.toLowerCase()}.
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
                                <Package className="w-4 h-4" /> Item Breakdown
                            </button>
                            <button
                                onClick={() => setActiveTab("ops")}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all",
                                    activeTab === "ops"
                                        ? "bg-white/10 text-white shadow-sm"
                                        : "text-slate-400 hover:text-white",
                                )}
                            >
                                <Clock className="w-4 h-4" /> Shift & Closings
                            </button>
                        </div>
                    </div>

                    <div>
                        {/* TAB 1: ITEM BREAKDOWN */}
                        {activeTab === "items" && (
                            <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/10 sticky top-0 bg-[#151722] z-10">
                                        <tr>
                                            <th className="pb-3 pt-2 font-semibold pl-2">
                                                Item
                                            </th>
                                            <th className="pb-3 pt-2 font-semibold">
                                                Company
                                            </th>
                                            <th className="pb-3 pt-2 font-semibold">
                                                Cashier
                                            </th>
                                            <th className="pb-3 pt-2 text-center font-semibold">
                                                Sold
                                            </th>
                                            <th className="pb-3 pt-2 text-center font-semibold">
                                                Ret
                                            </th>
                                            <th className="pb-3 pt-2 text-center font-semibold">
                                                Net
                                            </th>
                                            <th className="pb-3 pt-2 text-right font-semibold pr-2">
                                                Net Rev
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.04]">
                                        {item_breakdown?.map(
                                            (item: any, idx: number) => (
                                                <tr
                                                    key={idx}
                                                    className="hover:bg-white/[0.02] transition-colors"
                                                >
                                                    <td className="py-3 font-medium text-white pl-2">
                                                        {item.item_name}
                                                    </td>
                                                    <td className="py-3 text-xs text-slate-400">
                                                        {item.company_name}
                                                    </td>
                                                    <td className="py-3 text-xs text-slate-400">
                                                        {item.cashier_name}
                                                    </td>
                                                    <td className="py-3 text-center text-slate-300 font-medium">
                                                        {Math.round(
                                                            item.sold_qty,
                                                        )}
                                                    </td>
                                                    <td className="py-3 text-center text-red-400 font-medium">
                                                        {Math.round(
                                                            item.returned_qty,
                                                        )}
                                                    </td>
                                                    <td className="py-3 text-center text-emerald-400 font-bold">
                                                        {Math.round(
                                                            item.net_units,
                                                        )}
                                                    </td>
                                                    <td className="py-3 text-right font-bold text-white pr-2">
                                                        {formatPKR(
                                                            item.net_revenue,
                                                        )}
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                        {(!item_breakdown ||
                                            item_breakdown.length === 0) && (
                                            <tr>
                                                <td
                                                    colSpan={7}
                                                    className="py-8 text-center text-slate-500"
                                                >
                                                    No item data for this
                                                    period.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* TAB 2: OPERATIONS (SHIFTS) */}
                        {activeTab === "ops" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-orange-400" />{" "}
                                        Shift Summary
                                    </h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                                            <p className="text-[10px] text-slate-400 uppercase mb-1">
                                                Total
                                            </p>
                                            <p className="text-xl font-bold text-white">
                                                {shift_summary?.total || 0}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                                            <p className="text-[10px] text-blue-300 uppercase mb-1">
                                                Open
                                            </p>
                                            <p className="text-xl font-bold text-blue-400">
                                                {shift_summary?.open || 0}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-500/10 border border-slate-500/20 text-center">
                                            <p className="text-[10px] text-slate-300 uppercase mb-1">
                                                Closed
                                            </p>
                                            <p className="text-xl font-bold text-slate-400">
                                                {shift_summary?.closed || 0}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                        <Calculator className="w-4 h-4 text-emerald-400" />{" "}
                                        Day Closings
                                    </h4>
                                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">
                                                Total Closings
                                            </span>
                                            <span className="text-white font-medium">
                                                {day_close_summary?.total_closings ||
                                                    0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">
                                                Expected Cash
                                            </span>
                                            <span className="text-white font-medium">
                                                {formatPKR(
                                                    day_close_summary?.expected_cash ||
                                                        0,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">
                                                Actual Cash
                                            </span>
                                            <span className="text-white font-medium">
                                                {formatPKR(
                                                    day_close_summary?.actual_cash ||
                                                        0,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm border-t border-white/10 pt-3 mt-1">
                                            <span className="text-slate-400">
                                                Difference
                                            </span>
                                            <span
                                                className={cn(
                                                    "font-bold",
                                                    (day_close_summary?.cash_difference ||
                                                        0) < 0
                                                        ? "text-red-400"
                                                        : "text-emerald-400",
                                                )}
                                            >
                                                {formatPKR(
                                                    day_close_summary?.cash_difference ||
                                                        0,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* 4. CHART, HEALTH & TOP CASHIERS */}
            <section
                className="grid grid-cols-1 xl:grid-cols-3 gap-5 relative z-10 animate-fade-in-up"
                style={{ animationDelay: "300ms" }}
            >
                <div className="xl:col-span-2 glass-panel p-2">
                    <SalesAnalyticsChart
                        chartData={chartData}
                        chartInvoiceData={data.chartInvoiceData}
                        companies={companies}
                    />
                </div>
                <div className="glass-panel p-4">
                    <SystemHealthWidget health={systemHealth} />
                </div>
            </section>

            {/* 5. TOP DESIGNS & CASHIERS */}
            <section
                className="grid grid-cols-1 lg:grid-cols-2 gap-5 relative z-10 animate-fade-in-up"
                style={{ animationDelay: "350ms" }}
            >
                <div className="glass-panel p-6">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" /> Top
                        Selling Designs
                    </h3>
                    <div className="space-y-3">
                        {top_designs?.map((item: any, idx: number) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.04] transition-colors border border-white/5"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-400">
                                        #{idx + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">
                                            {item.item_name}
                                        </p>
                                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                                            <span>
                                                Sale:{" "}
                                                <span className="text-white font-medium">
                                                    {Math.round(item.sold_qty)}{" "}
                                                    pcs
                                                </span>
                                            </span>
                                            <span className="text-slate-600">
                                                |
                                            </span>
                                            <span>
                                                Ret:{" "}
                                                <span className="text-red-400 font-medium">
                                                    {Math.round(
                                                        item.returned_qty,
                                                    )}{" "}
                                                    pcs
                                                </span>
                                            </span>
                                            <span className="text-slate-600">
                                                |
                                            </span>
                                            <span>
                                                Net:{" "}
                                                <span className="text-emerald-400 font-bold">
                                                    {Math.round(item.net_units)}{" "}
                                                    pcs
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
                                        Rate:{" "}
                                        {formatPKR(
                                            item.sold_qty > 0
                                                ? item.total_revenue /
                                                      item.sold_qty
                                                : 0,
                                        )}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-panel p-6">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-orange-400" /> Top
                        Cashiers (Global)
                    </h3>
                    <div className="space-y-3">
                        {data.cashier_leaderboard?.map(
                            (c: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.04] transition-colors border border-white/5"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-xs font-bold text-orange-400">
                                            #{idx + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">
                                                {c.cashier_name}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {c.company_name} •{" "}
                                                {c.invoice_count} Invoices
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
                                                {formatPKR(c.gross_sales)}
                                            </span>{" "}
                                            | Ret:{" "}
                                            <span className="text-red-400">
                                                {formatPKR(c.total_returns)}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
