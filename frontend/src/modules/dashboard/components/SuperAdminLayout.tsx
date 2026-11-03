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

    if (!data?.kpis)
        return <div className="p-8 text-center text-slate-400">Loading...</div>;

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
            : companies.find((c) => String(c.id) === companyFilter)?.name ||
              "Company";
    const selectedDateLabel =
        dateRanges.find((item) => item.value === dateRange)?.label ||
        "Select Range";

    const salesTrend = Number(kpis.sales_trend_percent || 0);
    const invoiceTrend = Number(kpis.invoice_trend_percent || 0);

    return (
        <div className="relative min-h-screen bg-background p-4 md:p-6 lg:p-8 space-y-6 pb-10">
            {/* Rich Ambient Glows */}
            <div className="pointer-events-none absolute -top-20 left-1/3 -z-10 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[150px] animate-pulse-glow" />
            <div className="pointer-events-none absolute right-0 top-60 -z-10 h-[400px] w-[400px] rounded-full bg-blue-500/[0.08] blur-[120px] animate-pulse-glow" />

            {/* HEADER */}
            <section
                className="relative z-10 flex flex-col justify-between gap-5 xl:flex-row xl:items-center animate-fade-in-up opacity-0"
                style={{ animationDelay: "0ms", animationFillMode: "forwards" }}
            >
                <div>
                    <div className="mb-2 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                            Business Overview
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        Command Center
                    </h1>
                    <p className="mt-1 text-sm text-neutral-400">
                        Monitor your companies and business operations from one
                        place.
                    </p>
                </div>
                {/* Filters skipped for brevity, keep your existing ones here */}
            </section>

            {/* KPI CARDS */}
            <section className="relative z-10">
                <div
                    className="mb-3 flex items-center justify-between animate-fade-in-up opacity-0"
                    style={{
                        animationDelay: "100ms",
                        animationFillMode: "forwards",
                    }}
                >
                    <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">
                        Business Performance
                    </h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <KpiCard
                        delay={100}
                        title="Today's Sales"
                        value={formatPKR(Number(kpis.today_sales))}
                        trend={`${salesTrend > 0 ? "+" : ""}${salesTrend}%`}
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
                        delay={200}
                        title="Invoices"
                        value={Number(kpis.today_invoices).toLocaleString()}
                        trend={`${invoiceTrend > 0 ? "+" : ""}${invoiceTrend}%`}
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
                        delay={300}
                        title="Companies"
                        value={Number(kpis.active_companies).toLocaleString()}
                        icon={Building2}
                        color="blue"
                    />
                    <KpiCard
                        delay={400}
                        title="Active Cashiers"
                        value={Number(kpis.active_cashiers).toLocaleString()}
                        icon={Users}
                        color="violet"
                    />
                    <KpiCard
                        delay={500}
                        title="Open Shifts"
                        value={Number(kpis.open_shifts).toLocaleString()}
                        icon={Activity}
                        color="red"
                    />
                </div>
            </section>

            {/* PRODUCT INSIGHTS */}
            <section className="relative z-10">
                <div
                    className="mb-3 flex items-center justify-between animate-fade-in-up opacity-0"
                    style={{
                        animationDelay: "200ms",
                        animationFillMode: "forwards",
                    }}
                >
                    <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">
                        Product & Sales Insights
                    </h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        delay={200}
                        title="Total Units Sold"
                        value={Number(
                            product_kpis?.units_sold || 0,
                        ).toLocaleString()}
                        icon={Package}
                        color="blue"
                    />
                    <KpiCard
                        delay={300}
                        title="Pack Rate Sales"
                        value={`${Number(product_kpis?.pack_transactions || 0).toLocaleString()} txns`}
                        icon={Layers}
                        color="violet"
                    />
                    <KpiCard
                        delay={400}
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
                        delay={500}
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
            <section
                className="grid grid-cols-1 gap-5 xl:grid-cols-3 relative z-10 animate-fade-in-up opacity-0"
                style={{
                    animationDelay: "300ms",
                    animationFillMode: "forwards",
                }}
            >
                <div className="min-w-0 xl:col-span-2 glass-panel p-2">
                    <SalesAnalyticsChart
                        chartData={chartData}
                        companies={companies}
                    />
                </div>
                <div className="min-w-0 glass-panel p-4">
                    <SystemHealthWidget health={systemHealth} />
                </div>
            </section>

            {/* COMPANY PERFORMANCE */}
            <section
                className="glass-panel relative z-10 animate-fade-in-up opacity-0"
                style={{
                    animationDelay: "400ms",
                    animationFillMode: "forwards",
                }}
            >
                {/* ... Keep your existing table code here, it's perfect ... */}
            </section>
        </div>
    );
}
