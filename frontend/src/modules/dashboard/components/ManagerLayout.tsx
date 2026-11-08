import {
    Receipt,
    ArrowUpRight,
    Package,
    RotateCcw,
    Layers,
    AlertTriangle,
    Banknote,
    Store,
    Trophy,
    Users,
    TrendingUp,
} from "lucide-react";
import KpiCard from "./KpiCard";
import type { DashboardData } from "../types";
import { cn } from "@/lib/utils";

const formatPKR = (value: number) =>
    `Rs ${Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

export default function ManagerLayout({
    data,
    activeCompany,
}: {
    data: DashboardData;
    activeCompany?: any;
}) {
    if (!data?.kpis)
        return <div className="p-8 text-center text-slate-400">Loading...</div>;

    const {
        kpis,
        product_kpis,
        payment_breakdown,
        manager_data,
        top_items,
        top_customers,
    } = data as any;

    return (
        <div className="relative min-h-screen bg-transparent p-4 md:p-6 lg:p-8 space-y-6 pb-10">
            {/* HEADER */}
            <section className="relative z-10 flex flex-col justify-between gap-5 xl:flex-row xl:items-center animate-fade-in-up">
                <div>
                    <div className="mb-2 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.7)]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">
                            Manager Dashboard
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
                        {activeCompany?.name || "Company Overview"}
                    </h1>
                </div>
            </section>

            {/* ROW 1: MAIN KPIS */}
            <section className="relative z-10">
                <div
                    className="mb-3 flex items-center justify-between animate-fade-in-up"
                    style={{ animationDelay: "50ms" }}
                >
                    <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                        Company Performance
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
                        color="blue"
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
                        color="violet"
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

            {/* ROW 2: PRODUCT FLAGS & PAYMENTS */}
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

                {/* Collections */}
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
                                {payment_breakdown?.length > 0 ? (
                                    payment_breakdown.map(
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
                                                        ? formatPKR(
                                                              acc.sale_amount,
                                                          )
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
                                    )
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="py-6 text-center text-slate-500"
                                        >
                                            No payments collected today.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* ROW 3: TILLS & CASHIER LEADERBOARD */}
            <section
                className="grid grid-cols-1 lg:grid-cols-2 gap-5 relative z-10 animate-fade-in-up"
                style={{ animationDelay: "250ms" }}
            >
                <div className="glass-panel p-6">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Store className="w-4 h-4 text-violet-400" /> Till
                        Status
                    </h3>
                    <div className="space-y-3">
                        {manager_data?.tills?.map((till: any) => (
                            <div
                                key={till.id}
                                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5"
                            >
                                <div>
                                    <p className="text-sm font-semibold text-white">
                                        {till.shop_name} (Till {till.till_no})
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {till.cashier_name || "No Cashier"}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <span
                                        className={cn(
                                            "px-2 py-1 rounded text-[10px] font-bold uppercase",
                                            till.is_online
                                                ? "bg-emerald-500/10 text-emerald-400"
                                                : "bg-red-500/10 text-red-400",
                                        )}
                                    >
                                        {till.is_online ? "Online" : "Offline"}
                                    </span>
                                    <span
                                        className={cn(
                                            "px-2 py-1 rounded text-[10px] font-bold uppercase",
                                            till.shift_status === "OPEN"
                                                ? "bg-blue-500/10 text-blue-400"
                                                : "bg-slate-500/10 text-slate-400",
                                        )}
                                    >
                                        {till.shift_status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ⭐ FIXED: Top Cashiers with Net Sales */}
                <div className="glass-panel p-6">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-orange-400" /> Top
                        Cashiers
                    </h3>
                    <div className="space-y-3">
                        {manager_data?.cashier_leaderboard?.map(
                            (c: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.04] transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs font-bold text-orange-400">
                                            #{idx + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">
                                                {c.cashier_name}
                                            </p>
                                            <p className="text-xs text-slate-400">
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
                        {(!manager_data?.cashier_leaderboard ||
                            manager_data.cashier_leaderboard.length === 0) && (
                            <p className="text-center text-sm text-slate-500 py-4">
                                No cashier sales yet.
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {/* ⭐ NEW ROW 4: TOP ITEMS & TOP CUSTOMERS ⭐ */}
            <section
                className="grid grid-cols-1 lg:grid-cols-2 gap-5 relative z-10 animate-fade-in-up"
                style={{ animationDelay: "350ms" }}
            >
                {/* Top 10 Items */}
                <div className="glass-panel p-6">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" /> Top
                        Selling Items
                    </h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                        {top_items?.map((item: any, idx: number) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.04] transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
                                        #{idx + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">
                                            {item.item_name}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {item.total_units} pcs sold
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm font-bold text-white">
                                    {formatPKR(item.total_revenue)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top 10 Customers */}
                <div className="glass-panel p-6">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" /> Top
                        Customers Today
                    </h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                        {top_customers?.map((cust: any, idx: number) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.04] transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400">
                                        #{idx + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">
                                            {cust.name}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {cust.phone || "No phone"} •{" "}
                                            {cust.invoice_count} Invoices
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm font-bold text-white">
                                    {formatPKR(cust.total_spent)}
                                </p>
                            </div>
                        ))}
                        {(!top_customers || top_customers.length === 0) && (
                            <p className="text-center text-sm text-slate-500 py-4">
                                No customer sales today.
                            </p>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
