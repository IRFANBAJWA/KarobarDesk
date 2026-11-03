import { useState } from "react";
import {
    Building2,
    Receipt,
    Activity,
    Users,
    ChevronDown,
    ArrowUpRight,
    Search,
    Bell,
    Plus,
    CalendarDays,
    TrendingUp,
    Store,
    Clock3,
    ExternalLink,
    Check,
    Package,
    Layers,
    AlertTriangle,
    RotateCcw,
} from "lucide-react";
import { Link } from "react-router-dom";

import KpiCard from "./KpiCard";
import SalesAnalyticsChart from "./SalesAnalyticsChart";
import SystemHealthWidget from "./SystemHealthWidget";
import type { DashboardData } from "../types";

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
    { label: "Last Month", value: "last_month" },
];

const formatPKR = (value: number) =>
    `Rs ${Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

const getStatusStyle = (status: string) => {
    const normalized = String(status || "").toLowerCase();
    if (
        normalized.includes("active") ||
        normalized.includes("online") ||
        normalized.includes("success")
    ) {
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
    if (
        normalized.includes("inactive") ||
        normalized.includes("offline") ||
        normalized.includes("failed")
    ) {
        return "bg-red-500/10 text-red-400 border-red-500/20";
    }
    return "bg-white/5 text-slate-400 border-white/10";
};

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

    if (!data?.kpis) {
        return (
            <div className="flex min-h-[300px] items-center justify-center text-slate-400">
                Dashboard data is unavailable.
            </div>
        );
    }

    const {
        kpis,
        companies: companyPerformance = [],
        chartData = [],
        systemHealth,
        product_kpis,
    } = data as any;

    const selectedCompanyName =
        companyFilter === "all"
            ? "All Companies"
            : companies.find((company) => String(company.id) === companyFilter)
                  ?.name || "Company";
    const selectedDateLabel =
        dateRanges.find((item) => item.value === dateRange)?.label ||
        "Select Range";

    const salesTrend = Number(kpis.sales_trend_percent || 0);
    const invoiceTrend = Number(kpis.invoice_trend_percent || 0);

    const closeMenus = () => {
        setDateOpen(false);
        setCompanyOpen(false);
    };

    return (
        <div className="relative min-h-screen bg-[#050508] p-4 md:p-6 lg:p-8 space-y-6 pb-10">
            {/* Background ambient glow */}
            <div className="pointer-events-none absolute -top-20 left-1/3 -z-10 h-96 w-96 rounded-full bg-violet-600/[0.08] blur-[120px]" />
            <div className="pointer-events-none absolute right-0 top-60 -z-10 h-96 w-96 rounded-full bg-blue-500/[0.06] blur-[120px]" />

            {/* HEADER */}
            <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center relative z-10">
                <div>
                    <div className="mb-2 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                            Business Overview
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl drop-shadow-md">
                        Command Center
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Monitor your companies and business operations from one
                        place.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="hidden items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2.5 text-slate-400 sm:flex">
                        <Search className="h-4 w-4" />
                        <span className="text-xs">Command Center</span>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-slate-400">
                        <Bell className="h-4 w-4" />
                    </div>
                    <Link
                        to="/companies"
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 text-xs font-semibold text-white shadow-lg shadow-violet-900/20 transition hover:-translate-y-0.5 hover:from-violet-500 hover:to-indigo-500"
                    >
                        <Plus className="h-4 w-4" /> Manage Companies
                    </Link>
                </div>
            </section>

            {/* FILTERS */}
            <section className="flex flex-wrap items-center justify-between gap-3 relative z-10">
                <div className="flex flex-wrap items-center gap-2">
                    {/* Company Filter */}
                    <div className="relative">
                        <button
                            type="button"
                            aria-expanded={companyOpen}
                            onClick={() => {
                                setCompanyOpen(!companyOpen);
                                setDateOpen(false);
                            }}
                            className="flex h-10 items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.045] px-4 text-xs font-semibold text-white backdrop-blur-xl transition hover:border-violet-400/30 hover:bg-white/[0.07]"
                        >
                            <Building2 className="h-3.5 w-3.5 text-violet-400" />
                            {selectedCompanyName}
                            <ChevronDown
                                className={`h-3.5 w-3.5 text-slate-500 transition-transform ${companyOpen ? "rotate-180" : ""}`}
                            />
                        </button>
                        {companyOpen && (
                            <>
                                <button
                                    aria-label="Close"
                                    className="fixed inset-0 z-40 cursor-default"
                                    onClick={closeMenus}
                                />
                                <div className="absolute left-0 top-12 z-50 max-h-72 w-56 overflow-y-auto rounded-xl border border-white/10 bg-[#151722]/95 p-1.5 shadow-2xl backdrop-blur-2xl">
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
                                            {company.name}
                                            {companyFilter ===
                                                String(company.id) && (
                                                <Check className="h-3.5 w-3.5 text-violet-400" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Date Filter */}
                    <div className="relative">
                        <button
                            type="button"
                            aria-expanded={dateOpen}
                            onClick={() => {
                                setDateOpen(!dateOpen);
                                setCompanyOpen(false);
                            }}
                            className="flex h-10 items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.045] px-4 text-xs font-semibold text-white backdrop-blur-xl transition hover:border-violet-400/30 hover:bg-white/[0.07]"
                        >
                            <CalendarDays className="h-3.5 w-3.5 text-blue-400" />
                            {selectedDateLabel}
                            <ChevronDown
                                className={`h-3.5 w-3.5 text-slate-500 transition-transform ${dateOpen ? "rotate-180" : ""}`}
                            />
                        </button>
                        {dateOpen && (
                            <>
                                <button
                                    aria-label="Close"
                                    className="fixed inset-0 z-40 cursor-default"
                                    onClick={closeMenus}
                                />
                                <div className="absolute left-0 top-12 z-50 w-48 rounded-xl border border-white/10 bg-[#151722]/95 p-1.5 shadow-2xl backdrop-blur-2xl">
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
                            </>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <Clock3 className="h-3.5 w-3.5" />
                    <span>Business reporting period</span>
                </div>
            </section>

            {/* KPI CARDS */}
            <section className="relative z-10">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                        Business Performance
                    </h2>
                    <span className="text-[10px] text-slate-500">
                        {selectedDateLabel}
                    </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <KpiCard
                        title="Today's Sales"
                        value={formatPKR(Number(kpis.today_sales))}
                        trend={`${salesTrend > 0 ? "+" : ""}${salesTrend}%`}
                        comparisonLabel="vs yesterday"
                        trendDirection={
                            salesTrend > 0
                                ? "positive"
                                : salesTrend < 0
                                  ? "negative"
                                  : "neutral"
                        }
                        icon={ArrowUpRight}
                        color="orange"
                    />
                    <KpiCard
                        title="Invoices"
                        value={Number(kpis.today_invoices).toLocaleString()}
                        trend={`${invoiceTrend > 0 ? "+" : ""}${invoiceTrend}%`}
                        comparisonLabel="vs yesterday"
                        trendDirection={
                            invoiceTrend > 0
                                ? "positive"
                                : invoiceTrend < 0
                                  ? "negative"
                                  : "neutral"
                        }
                        icon={Receipt}
                        color="emerald"
                    />
                    <KpiCard
                        title="Companies"
                        value={Number(kpis.active_companies).toLocaleString()}
                        icon={Building2}
                        color="blue"
                    />
                    <KpiCard
                        title="Active Cashiers"
                        value={Number(kpis.active_cashiers).toLocaleString()}
                        icon={Users}
                        color="violet"
                    />
                    <KpiCard
                        title="Open Shifts"
                        value={Number(kpis.open_shifts).toLocaleString()}
                        icon={Activity}
                        color="red"
                    />
                </div>
            </section>

            {/* PRODUCT INSIGHTS (NEW SECTION) */}
            <section className="relative z-10">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                        Product & Sales Insights
                    </h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        title="Total Units Sold"
                        value={Number(
                            product_kpis?.units_sold || 0,
                        ).toLocaleString()}
                        icon={Package}
                        color="blue"
                    />
                    <KpiCard
                        title="Pack Rate Sales"
                        value={`${Number(product_kpis?.pack_transactions || 0).toLocaleString()} txns`}
                        icon={Layers}
                        color="violet"
                    />
                    <KpiCard
                        title="Defective (B)"
                        value={`${Number(product_kpis?.defective_units || 0).toLocaleString()} pcs`}
                        trend={formatPKR(
                            Number(product_kpis?.defective_value || 0),
                        )}
                        comparisonLabel="value"
                        icon={AlertTriangle}
                        color="orange"
                    />
                    <KpiCard
                        title="Returns"
                        value={`${Number(product_kpis?.return_units || 0).toLocaleString()} pcs`}
                        trend={formatPKR(
                            Number(product_kpis?.return_value || 0),
                        )}
                        comparisonLabel="value"
                        icon={RotateCcw}
                        color="red"
                    />
                </div>
            </section>

            {/* ANALYTICS AND SYSTEM HEALTH */}
            <section className="grid grid-cols-1 gap-5 xl:grid-cols-3 relative z-10">
                <div className="min-w-0 xl:col-span-2">
                    <div className="h-full overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#171923]/95 to-[#10121a]/95 p-1 shadow-xl shadow-black/10 backdrop-blur-2xl">
                        <div className="p-3">
                            <SalesAnalyticsChart
                                chartData={chartData}
                                companies={companies}
                            />
                        </div>
                    </div>
                </div>
                <div className="min-w-0">
                    <div className="h-full rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#171923]/95 to-[#10121a]/95 p-4 shadow-xl shadow-black/10 backdrop-blur-2xl">
                        <SystemHealthWidget health={systemHealth} />
                    </div>
                </div>
            </section>

            {/* COMPANY PERFORMANCE */}
            <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#171923]/95 to-[#10121a]/95 shadow-xl shadow-black/10 backdrop-blur-2xl relative z-10">
                <div className="flex flex-col justify-between gap-3 border-b border-white/[0.07] p-5 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
                            <Store className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">
                                Company Performance
                            </h3>
                            <p className="text-[11px] text-slate-500">
                                Sales and operational overview by company
                            </p>
                        </div>
                    </div>
                    <Link
                        to="/companies"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-violet-400 transition hover:text-violet-300"
                    >
                        View All Companies{" "}
                        <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-xs">
                        <thead>
                            <tr className="border-b border-white/[0.06] bg-white/[0.015] text-[10px] uppercase tracking-wider text-slate-500">
                                <th className="px-5 py-4 font-semibold">
                                    Company
                                </th>
                                <th className="px-5 py-4 text-right font-semibold">
                                    Sales
                                </th>
                                <th className="px-5 py-4 text-center font-semibold">
                                    Invoices
                                </th>
                                <th className="px-5 py-4 text-center font-semibold">
                                    Open Shifts
                                </th>
                                <th className="px-5 py-4 text-center font-semibold">
                                    Status
                                </th>
                                <th className="px-5 py-4 text-right font-semibold">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.045]">
                            {companyPerformance.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-5 py-12 text-center text-slate-500"
                                    >
                                        <Building2 className="mx-auto mb-2 h-8 w-8 opacity-30" />
                                        No company performance data available.
                                    </td>
                                </tr>
                            ) : (
                                companyPerformance.map((company: any) => (
                                    <tr
                                        key={company.id}
                                        className="group transition-colors hover:bg-white/[0.025]"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] transition group-hover:border-violet-500/20 group-hover:bg-violet-500/10">
                                                    <Building2 className="h-4 w-4 text-slate-400 group-hover:text-violet-400" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-white">
                                                        {company.name}
                                                    </p>
                                                    <p className="mt-1 text-[10px] text-slate-500">
                                                        {company.invoices}{" "}
                                                        invoices
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right font-bold tabular-nums text-white">
                                            {formatPKR(Number(company.sales))}
                                        </td>
                                        <td className="px-5 py-4 text-center tabular-nums text-slate-300">
                                            {company.invoices}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span
                                                className={`inline-flex min-w-8 justify-center rounded-lg px-2.5 py-1.5 font-bold tabular-nums ${company.open_shifts > 0 ? "border border-orange-500/20 bg-orange-500/10 text-orange-400" : "bg-white/[0.035] text-slate-500"}`}
                                            >
                                                {company.open_shifts}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getStatusStyle(company.status)}`}
                                            >
                                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                {company.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <Link
                                                to={`/dashboard?company_id=${company.id}`}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-[10px] font-semibold text-slate-300 transition hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-300"
                                            >
                                                View{" "}
                                                <ArrowUpRight className="h-3 w-3" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
