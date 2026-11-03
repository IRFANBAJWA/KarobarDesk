import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/apiFetch";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import {
    TrendingUp,
    TrendingDown,
    Building2,
    Users,
    Clock,
    DollarSign,
    Receipt,
} from "lucide-react";
import ProductKpiCard from "@/modules/dashboard/components/ProductKpiCard";
import TopDesignsPanel from "@/modules/dashboard/components/TopDesignsPanel";

export default function Dashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState("today");
    const [companyFilter, setCompanyFilter] = useState("all");

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const res = await apiFetch(
                    `/api/dashboard?date_range=${dateRange}&company_id=${companyFilter}`,
                );
                setData(res);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [dateRange, companyFilter]);

    if (loading || !data)
        return (
            <div className="p-8 text-center text-neutral-400 animate-pulse">
                Loading Command Center...
            </div>
        );

    const chartData = data.chartData.map((d: any) => ({
        name: d.date,
        ...d.series,
    }));

    const companyKeys = data.companies.map((c: any) => ({
        id: c.id.toString(),
        name: c.name,
    }));

    // Reusable Glass Classes for cleaner JSX
    const glassCard =
        "relative bg-glass-gradient border border-white/10 backdrop-blur-2xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden";
    const topHighlight =
        "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent z-10 pointer-events-none";

    return (
        <div className="min-h-screen bg-obsidian relative overflow-hidden p-6 md:p-8">
            {/* Ambient Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/10 blur-[150px] pointer-events-none" />

            <div className="relative z-10 max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">
                            Command Center
                        </h1>
                        <p className="text-neutral-400 mt-1">
                            Global operations overview across all active
                            companies.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 backdrop-blur-md"
                        >
                            <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="last_7_days">Last 7 Days</option>
                            <option value="this_month">This Month</option>
                        </select>
                        <select
                            value={companyFilter}
                            onChange={(e) => setCompanyFilter(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 backdrop-blur-md"
                        >
                            <option value="all">All Companies</option>
                            {data.companies.map((c: any) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Row 1: Main KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className={`${glassCard} p-5`}>
                        <div className={topHighlight} />
                        <div className="flex justify-between items-start">
                            <span className="text-sm text-neutral-400">
                                Today's Sales
                            </span>
                            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
                                <DollarSign className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold mt-2 text-white tabular-nums">
                            Rs {data.kpis.today_sales.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-xs">
                            {data.kpis.sales_trend_percent >= 0 ? (
                                <TrendingUp className="w-3 h-3 text-emerald-400" />
                            ) : (
                                <TrendingDown className="w-3 h-3 text-rose-400" />
                            )}
                            <span
                                className={
                                    data.kpis.sales_trend_percent >= 0
                                        ? "text-emerald-400"
                                        : "text-rose-400"
                                }
                            >
                                {Math.abs(data.kpis.sales_trend_percent)}%
                            </span>
                            <span className="text-neutral-500 ml-1">
                                vs prev
                            </span>
                        </div>
                    </div>

                    <div className={`${glassCard} p-5`}>
                        <div className={topHighlight} />
                        <div className="flex justify-between items-start">
                            <span className="text-sm text-neutral-400">
                                Invoices
                            </span>
                            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400">
                                <Receipt className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold mt-2 text-white tabular-nums">
                            {data.kpis.today_invoices.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-xs">
                            {data.kpis.invoice_trend_percent >= 0 ? (
                                <TrendingUp className="w-3 h-3 text-emerald-400" />
                            ) : (
                                <TrendingDown className="w-3 h-3 text-rose-400" />
                            )}
                            <span
                                className={
                                    data.kpis.invoice_trend_percent >= 0
                                        ? "text-emerald-400"
                                        : "text-rose-400"
                                }
                            >
                                {Math.abs(data.kpis.invoice_trend_percent)}%
                            </span>
                        </div>
                    </div>

                    <div className={`${glassCard} p-5`}>
                        <div className={topHighlight} />
                        <div className="flex justify-between items-start">
                            <span className="text-sm text-neutral-400">
                                Active Companies
                            </span>
                            <div className="p-1.5 rounded-md bg-violet-500/10 text-violet-400">
                                <Building2 className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold mt-2 text-white tabular-nums">
                            {data.kpis.active_companies}
                        </p>
                    </div>

                    <div className={`${glassCard} p-5`}>
                        <div className={topHighlight} />
                        <div className="flex justify-between items-start">
                            <span className="text-sm text-neutral-400">
                                Active Cashiers
                            </span>
                            <div className="p-1.5 rounded-md bg-orange-500/10 text-orange-400">
                                <Users className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold mt-2 text-white tabular-nums">
                            {data.kpis.active_cashiers}
                        </p>
                    </div>

                    <div className={`${glassCard} p-5`}>
                        <div className={topHighlight} />
                        <div className="flex justify-between items-start">
                            <span className="text-sm text-neutral-400">
                                Open Shifts
                            </span>
                            <div className="p-1.5 rounded-md bg-teal-500/10 text-teal-400">
                                <Clock className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold mt-2 text-white tabular-nums">
                            {data.kpis.open_shifts}
                        </p>
                    </div>
                </div>

                {/* Row 2: Product Insights */}
                <div>
                    <h2 className="text-lg font-semibold tracking-tight mb-4 text-white">
                        Product & Sales Insights
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <ProductKpiCard
                            type="units"
                            title="Total Units Sold"
                            value={data.product_kpis.units_sold}
                        />
                        <ProductKpiCard
                            type="packs"
                            title="Pack Rate Sales"
                            value={data.product_kpis.pack_transactions}
                            subValue="txns"
                        />
                        <ProductKpiCard
                            type="defective"
                            title="Defective Sold (B)"
                            value={data.product_kpis.defective_units}
                            subValue={`Rs ${data.product_kpis.defective_value.toLocaleString()}`}
                        />
                        <ProductKpiCard
                            type="returns"
                            title="Returns"
                            value={data.product_kpis.return_units}
                            subValue={`Rs ${data.product_kpis.return_value.toLocaleString()}`}
                        />
                    </div>
                </div>

                {/* Row 3: Analytics & Health */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className={`${glassCard} p-6 lg:col-span-2`}>
                        <div className={topHighlight} />
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold tracking-tight text-white">
                                Sales Analytics
                            </h3>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        {companyKeys.map(
                                            (c: any, i: number) => {
                                                const colors = [
                                                    "#8b5cf6",
                                                    "#3b82f6",
                                                    "#f97316",
                                                    "#10b981",
                                                ];
                                                return (
                                                    <linearGradient
                                                        key={c.id}
                                                        id={`color-${c.id}`}
                                                        x1="0"
                                                        y1="0"
                                                        x2="0"
                                                        y2="1"
                                                    >
                                                        <stop
                                                            offset="5%"
                                                            stopColor={
                                                                colors[
                                                                    i %
                                                                        colors.length
                                                                ]
                                                            }
                                                            stopOpacity={0.3}
                                                        />
                                                        <stop
                                                            offset="95%"
                                                            stopColor={
                                                                colors[
                                                                    i %
                                                                        colors.length
                                                                ]
                                                            }
                                                            stopOpacity={0}
                                                        />
                                                    </linearGradient>
                                                );
                                            },
                                        )}
                                    </defs>
                                    <XAxis
                                        dataKey="name"
                                        stroke="#52525b"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#52525b"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) =>
                                            `Rs ${val / 1000}k`
                                        }
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#18181b",
                                            borderColor: "#27272a",
                                            borderRadius: "8px",
                                            color: "#fff",
                                        }}
                                        itemStyle={{ color: "#fff" }}
                                    />
                                    {companyKeys.map((c: any, i: number) => {
                                        const colors = [
                                            "#8b5cf6",
                                            "#3b82f6",
                                            "#f97316",
                                            "#10b981",
                                        ];
                                        return (
                                            <Area
                                                key={c.id}
                                                type="monotone"
                                                dataKey={c.id}
                                                name={c.name}
                                                stroke={
                                                    colors[i % colors.length]
                                                }
                                                fillOpacity={1}
                                                fill={`url(#color-${c.id})`}
                                                strokeWidth={2}
                                            />
                                        );
                                    })}
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className={`${glassCard} p-6`}>
                        <div className={topHighlight} />
                        <h3 className="text-lg font-semibold tracking-tight text-white mb-6">
                            System Health
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-2 h-2 rounded-full ${data.systemHealth.erp_status === "healthy" ? "bg-emerald-500" : "bg-amber-500"}`}
                                    />
                                    <span className="text-sm font-medium text-white">
                                        ERPNext API
                                    </span>
                                </div>
                                <span className="text-xs text-neutral-400">
                                    {data.systemHealth.last_sync}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-2 h-2 rounded-full ${data.systemHealth.failed_jobs > 0 ? "bg-rose-500" : "bg-emerald-500"}`}
                                    />
                                    <span className="text-sm font-medium text-white">
                                        Queue Jobs
                                    </span>
                                </div>
                                <span className="text-xs text-neutral-400">
                                    {data.systemHealth.failed_jobs} Failed /{" "}
                                    {data.systemHealth.pending_jobs} Pending
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-2 h-2 rounded-full ${data.systemHealth.stuck_invoices > 0 ? "bg-amber-500" : "bg-emerald-500"}`}
                                    />
                                    <span className="text-sm font-medium text-white">
                                        Stuck Invoices
                                    </span>
                                </div>
                                <span className="text-xs text-neutral-400">
                                    {data.systemHealth.stuck_invoices} awaiting
                                    sync
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 4: Bottom Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className={`${glassCard} p-6`}>
                        <div className={topHighlight} />
                        <h3 className="text-lg font-semibold tracking-tight text-white mb-4">
                            Company Performance
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-neutral-400 uppercase border-b border-white/10">
                                    <tr>
                                        <th className="pb-3 font-medium">
                                            Company
                                        </th>
                                        <th className="pb-3 font-medium text-right">
                                            Sales
                                        </th>
                                        <th className="pb-3 font-medium text-right">
                                            Invoices
                                        </th>
                                        <th className="pb-3 font-medium text-right">
                                            Open Shifts
                                        </th>
                                        <th className="pb-3 font-medium text-right">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {data.companies.map((c: any) => (
                                        <tr
                                            key={c.id}
                                            className="hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="py-3 font-medium text-white">
                                                {c.name}
                                            </td>
                                            <td className="py-3 text-right tabular-nums text-neutral-300">
                                                Rs {c.sales.toLocaleString()}
                                            </td>
                                            <td className="py-3 text-right tabular-nums text-neutral-300">
                                                {c.invoices}
                                            </td>
                                            <td className="py-3 text-right tabular-nums text-neutral-300">
                                                {c.open_shifts}
                                            </td>
                                            <td className="py-3 text-right">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${c.is_live ? "bg-emerald-500/10 text-emerald-400" : "bg-neutral-500/10 text-neutral-400"}`}
                                                >
                                                    {c.is_live
                                                        ? "Live"
                                                        : "Idle"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <TopDesignsPanel designs={data.top_designs} />
                </div>
            </div>
        </div>
    );
}
