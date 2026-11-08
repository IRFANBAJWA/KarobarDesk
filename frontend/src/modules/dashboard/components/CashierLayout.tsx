import {
    Receipt,
    Clock,
    ArrowUpRight,
    Package,
    CreditCard,
    ChevronRight,
    RotateCcw,
    Layers,
    AlertTriangle,
    Banknote,
} from "lucide-react";
import { Link } from "react-router-dom";
import KpiCard from "./KpiCard";
import type { DashboardData } from "../types";
import { cn } from "@/lib/utils";

const formatPKR = (value: number) =>
    `Rs ${Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

export default function CashierLayout({ data }: { data: DashboardData }) {
    if (!data?.kpis)
        return <div className="p-8 text-center text-slate-400">Loading...</div>;

    const { kpis, cashier_data, product_kpis, payment_breakdown } = data as any;

    return (
        <div className="relative min-h-screen bg-transparent p-4 md:p-6 lg:p-8 space-y-6 pb-10">
            {/* HEADER */}
            {/* HEADER */}
            <section className="relative z-10 flex flex-col justify-between gap-5 xl:flex-row xl:items-center animate-fade-in-up">
                <div>
                    <div className="mb-2 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.7)]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400">
                            My Dashboard
                        </span>
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
                        {cashier_data?.till_name || "Cashier Station"}
                    </h1>

                    {/* ⭐ ADDED DATE AND DAY HERE ⭐ */}
                    <div className="flex items-center gap-3 mt-2">
                        <p className="text-sm text-slate-400 font-medium">
                            {new Date().toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </p>
                        <span className="text-slate-600">•</span>
                        <p className="text-sm text-slate-400 font-medium">
                            Your personal sales overview
                        </p>
                    </div>
                </div>
            </section>

            {/* ROW 1: MAIN PERFORMANCE */}
            <section className="relative z-10">
                <div
                    className="mb-3 flex items-center justify-between animate-fade-in-up"
                    style={{ animationDelay: "50ms" }}
                >
                    <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                        My Performance
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

            {/* ROW 2: PRODUCT FLAGS */}
            <section className="relative z-10">
                <div
                    className="mb-3 flex items-center justify-between animate-fade-in-up"
                    style={{ animationDelay: "150ms" }}
                >
                    <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                        Product Types
                    </h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            </section>

            {/* ⭐ ROW 3: PAYMENT BREAKDOWN ⭐ */}
            <section
                className="glass-panel p-6 relative z-10 animate-fade-in-up"
                style={{ animationDelay: "200ms" }}
            >
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-emerald-400" />{" "}
                    Collections (By Account)
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/10">
                            <tr>
                                <th className="pb-3 font-semibold">Account</th>
                                <th className="pb-3 font-semibold text-right">
                                    Sale (+)
                                </th>
                                <th className="pb-3 font-semibold text-right">
                                    Return (-)
                                </th>
                                <th className="pb-3 font-semibold text-right">
                                    Net Received
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
                                            <td className="py-3 text-right text-slate-300 font-medium">
                                                {acc.sale_amount > 0
                                                    ? formatPKR(acc.sale_amount)
                                                    : "-"}
                                            </td>
                                            <td className="py-3 text-right text-red-400 font-medium">
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
            </section>

            {/* SHIFT & RECENT INVOICES */}
            <section
                className="grid grid-cols-1 gap-5 xl:grid-cols-2 relative z-10 animate-fade-in-up"
                style={{ animationDelay: "250ms" }}
            >
                <div className="glass-panel p-6 flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-400" />{" "}
                            Current Shift
                        </h3>
                        {cashier_data?.shift_status === "OPEN" ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                    <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                                        Shift Open
                                    </span>
                                    <span className="text-xs text-white font-medium">
                                        Started {cashier_data.shift_start_time}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">
                                            Opening Balance
                                        </span>
                                        <span className="text-white font-medium">
                                            {formatPKR(
                                                cashier_data.opening_balance,
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">
                                            Expected Cash
                                        </span>
                                        <span className="text-white font-medium">
                                            {formatPKR(
                                                cashier_data.expected_cash,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                <div className="h-12 w-12 rounded-full bg-slate-500/10 flex items-center justify-center mb-3">
                                    <Clock className="h-5 w-5 text-slate-400" />
                                </div>
                                <p className="text-slate-300 font-medium">
                                    No Open Shift
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Open a shift in the POS to start selling.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* My Recent Invoices */}
                <div className="glass-panel p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-blue-400" /> My
                            Recent Invoices
                        </h3>
                        <Link
                            to="/sales"
                            className="text-[10px] font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1"
                        >
                            View All <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {cashier_data?.recent_invoices?.length > 0 ? (
                            cashier_data.recent_invoices.map((inv: any) => (
                                <div
                                    key={inv.id}
                                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.04] transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={cn(
                                                "h-8 w-8 rounded-lg flex items-center justify-center border",
                                                inv.invoice_type === "return"
                                                    ? "bg-red-500/10 border-red-500/20"
                                                    : "bg-blue-500/10 border-blue-500/20",
                                            )}
                                        >
                                            {inv.invoice_type === "return" ? (
                                                <RotateCcw className="h-3.5 w-3.5 text-red-400" />
                                            ) : (
                                                <CreditCard className="h-3.5 w-3.5 text-blue-400" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-semibold text-white">
                                                    {inv.invoice_number}
                                                </p>
                                                <span
                                                    className={cn(
                                                        "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded",
                                                        inv.invoice_type ===
                                                            "return"
                                                            ? "bg-red-500/10 text-red-400"
                                                            : "bg-blue-500/10 text-blue-400",
                                                    )}
                                                >
                                                    {inv.invoice_type || "sale"}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500">
                                                {inv.time}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={cn(
                                                "text-xs font-bold",
                                                inv.invoice_type === "return"
                                                    ? "text-red-400"
                                                    : "text-white",
                                            )}
                                        >
                                            {formatPKR(inv.grand_total)}
                                        </span>
                                        <Link
                                            to={`/sales?search=${inv.invoice_number}`}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/10"
                                        >
                                            <ArrowUpRight className="h-4 text-slate-400" />
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-xs text-slate-500 py-4">
                                No recent invoices.
                            </p>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
