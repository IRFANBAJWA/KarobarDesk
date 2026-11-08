import { useState } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import type { DashboardData } from "../types";

const CHART_COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ec4899"];

export default function SalesAnalyticsChart({
    chartData,
    chartInvoiceData = [], // ⭐ New Prop
    companies = [],
}: {
    chartData: DashboardData["chartData"];
    chartInvoiceData?: any[];
    companies?: { id: number; name: string }[];
}) {
    const [mode, setMode] = useState<"sales" | "invoices">("sales");

    // ⭐ Select the correct data source based on the toggle
    const activeData = mode === "sales" ? chartData : chartInvoiceData;

    if (!activeData || activeData.length === 0) {
        return (
            <div className="flex h-[320px] w-full items-center justify-center text-sm text-slate-500">
                No chart data available for {mode}.
            </div>
        );
    }

    // ⭐ Flatten the series object for Recharts
    const formattedData = activeData.map((d: any) => {
        const flatData: any = { date: d.date };
        Object.keys(d.series || {}).forEach((companyId) => {
            flatData[companyId] = d.series[companyId];
        });
        return flatData;
    });

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-xl border border-white/10 bg-[#151722]/95 p-3 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
                    <p className="text-sm font-semibold mb-2 text-white">
                        {label}
                    </p>
                    {payload.map((entry: any) => (
                        <div
                            key={entry.dataKey}
                            className="flex items-center justify-between gap-6 text-xs mb-1.5"
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className="h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]"
                                    style={{
                                        backgroundColor: entry.color,
                                        color: entry.color,
                                    }}
                                />
                                <span className="text-slate-300">
                                    {entry.name}
                                </span>
                            </div>
                            <span className="font-semibold text-white">
                                {mode === "sales"
                                    ? `Rs ${Number(entry.value).toLocaleString()}`
                                    : `${entry.value} inv`}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="relative w-full h-full p-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-4 pt-2">
                <div>
                    <h3 className="text-lg font-semibold tracking-tight text-white">
                        Sales Analytics
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] uppercase tracking-wider font-medium text-slate-400">
                        {companies.map((c, i) => (
                            <div
                                key={c.id}
                                className="flex items-center gap-1.5"
                            >
                                <span
                                    className="h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]"
                                    style={{
                                        backgroundColor:
                                            CHART_COLORS[
                                                i % CHART_COLORS.length
                                            ],
                                        color: CHART_COLORS[
                                            i % CHART_COLORS.length
                                        ],
                                    }}
                                />
                                {c.name}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex rounded-xl border border-white/10 bg-black/40 p-1 shadow-inner backdrop-blur-md">
                    <button
                        onClick={() => setMode("sales")}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${mode === "sales" ? "bg-white/10 text-white shadow-sm ring-1 ring-white/20" : "text-slate-400 hover:text-white"}`}
                    >
                        Sales
                    </button>
                    <button
                        onClick={() => setMode("invoices")}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${mode === "invoices" ? "bg-white/10 text-white shadow-sm ring-1 ring-white/20" : "text-slate-400 hover:text-white"}`}
                    >
                        Invoices
                    </button>
                </div>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={formattedData}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                        <defs>
                            {companies.map((c, i) => (
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
                                            CHART_COLORS[
                                                i % CHART_COLORS.length
                                            ]
                                        }
                                        stopOpacity={0.4}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor={
                                            CHART_COLORS[
                                                i % CHART_COLORS.length
                                            ]
                                        }
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            ))}
                        </defs>
                        <XAxis
                            dataKey="date"
                            stroke="#52525b"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />

                        <YAxis
                            stroke="#52525b"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => {
                                if (mode === "invoices") return String(val);
                                return val >= 1000
                                    ? `${(val / 1000).toFixed(1)}k`
                                    : val;
                            }}
                            width={45}
                        />

                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#27272a"
                            vertical={false}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{
                                stroke: "#52525b",
                                strokeWidth: 1,
                                strokeDasharray: "3 3",
                            }}
                        />

                        {companies.map((c, i) => (
                            <Area
                                key={c.id}
                                name={c.name}
                                type="monotone"
                                dataKey={String(c.id)}
                                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                                strokeWidth={3}
                                fillOpacity={1}
                                fill={`url(#color-${c.id})`}
                                dot={{
                                    r: 4,
                                    fill: CHART_COLORS[i % CHART_COLORS.length],
                                    strokeWidth: 0,
                                }}
                                activeDot={{
                                    r: 6,
                                    fill: "#fff",
                                    stroke: CHART_COLORS[
                                        i % CHART_COLORS.length
                                    ],
                                    strokeWidth: 2,
                                }}
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
