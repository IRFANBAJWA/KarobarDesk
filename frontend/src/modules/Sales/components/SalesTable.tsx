import type { SaleInvoice } from "../types";
import { Eye, RotateCcw, ArrowUpRight, Calendar } from "lucide-react";
import SyncStatusBadge from "@/components/badges/SyncStatusBadge";

interface Props {
    data: SaleInvoice[];
    loading: boolean;
    onView: (id: number) => void;
}

const formatPKR = (value: number) =>
    `Rs ${Number(value || 0).toLocaleString("en-PK", {
        maximumFractionDigits: 0,
    })}`;

export default function SalesTable({ data, loading, onView }: Props) {
    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[950px] border-collapse text-sm">
                {/* TABLE HEADER */}
                <thead className="sticky top-0 z-10">
                    <tr className="border-b border-white/10 bg-white/[0.02] text-left text-[11px] uppercase tracking-wider text-slate-400 whitespace-nowrap">
                        <th className="px-5 py-4 font-semibold">Invoice #</th>
                        <th className="px-4 py-4 font-semibold">Date</th>
                        <th className="px-4 py-4 font-semibold">Customer</th>
                        <th className="px-4 py-4 font-semibold">Cashier</th>
                        <th className="px-4 py-4 text-right font-semibold">
                            Total
                        </th>
                        <th className="px-4 py-4 text-center font-semibold">
                            Status
                        </th>
                        <th className="px-4 py-4 text-center font-semibold">
                            ERPNext Sync
                        </th>
                        <th className="px-5 py-4 text-center font-semibold">
                            Actions
                        </th>
                    </tr>
                </thead>

                {/* TABLE BODY */}
                <tbody>
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} className="border-b border-white/5">
                                <td colSpan={8} className="px-5 py-5">
                                    <div className="h-7 w-full animate-pulse rounded-lg bg-white/5" />
                                </td>
                            </tr>
                        ))
                    ) : data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={8}
                                className="px-4 py-16 text-center text-sm text-slate-400"
                            >
                                No transactions found for this filter.
                            </td>
                        </tr>
                    ) : (
                        data.map((sale) => {
                            const isReturn = sale.invoice_type === "return";

                            return (
                                <tr
                                    key={sale.id}
                                    className="group border-b border-white/5 transition-colors duration-200 hover:bg-white/[0.035]"
                                >
                                    {/* INVOICE NUMBER + TYPE ICON */}
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                                                    isReturn
                                                        ? "border-red-500/20 bg-red-500/10 text-red-400"
                                                        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                                }`}
                                                title={
                                                    isReturn ? "Return" : "Sale"
                                                }
                                            >
                                                {isReturn ? (
                                                    <RotateCcw className="h-4 w-4" />
                                                ) : (
                                                    <ArrowUpRight className="h-4 w-4" />
                                                )}
                                            </div>

                                            <div className="flex min-w-0 flex-col">
                                                <span className="font-semibold text-white">
                                                    {sale.invoice_number}
                                                </span>
                                                {isReturn &&
                                                    (sale as any)
                                                        .original_invoice && (
                                                        <span className="mt-1 text-[10px] text-violet-400">
                                                            Ref:{" "}
                                                            {
                                                                (sale as any)
                                                                    .original_invoice
                                                                    .invoice_number
                                                            }
                                                        </span>
                                                    )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* DATE */}
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                                            <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                                            {new Date(
                                                sale.invoice_date ||
                                                    sale.created_at,
                                            ).toLocaleDateString("en-PK", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </div>
                                    </td>

                                    {/* CUSTOMER */}
                                    <td className="px-4 py-4 whitespace-nowrap text-slate-300">
                                        {sale.customer?.customer_name ||
                                            "Walk-in"}
                                    </td>

                                    {/* CASHIER */}
                                    <td className="px-4 py-4 whitespace-nowrap text-slate-300">
                                        {sale.user?.name || "System"}
                                    </td>

                                    {/* TOTAL */}
                                    <td className="px-4 py-4 text-right font-bold text-white tabular-nums whitespace-nowrap">
                                        {formatPKR(Number(sale.grand_total))}
                                    </td>

                                    {/* PAYMENT STATUS */}
                                    <td className="px-4 py-4 text-center whitespace-nowrap">
                                        <span
                                            className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                                sale.status === "paid"
                                                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                                    : sale.status === "partial"
                                                      ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                                                      : "border-red-500/20 bg-red-500/10 text-red-400"
                                            }`}
                                        >
                                            {sale.status}
                                        </span>
                                    </td>

                                    {/* ERPNEXT SYNC */}
                                    <td className="px-4 py-4 text-center whitespace-nowrap">
                                        <SyncStatusBadge
                                            status={sale.sync_status}
                                        />
                                    </td>

                                    {/* ACTIONS */}
                                    <td className="px-5 py-4 text-center whitespace-nowrap">
                                        <button
                                            type="button"
                                            onClick={() => onView(sale.id)}
                                            title="View invoice"
                                            aria-label={`View invoice ${sale.invoice_number}`}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-all duration-200 hover:border-white/10 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}
