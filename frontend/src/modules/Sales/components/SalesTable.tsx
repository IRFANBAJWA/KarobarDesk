import type { SaleInvoice } from "../types";
import { Eye } from "lucide-react";
import SyncStatusBadge from "@/components/badges/SyncStatusBadge"; // ⭐ Import the generic badge

interface Props {
    data: SaleInvoice[];
    loading: boolean;
    onView: (id: number) => void;
}

export default function SalesTable({ data, loading, onView }: Props) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                        <th className="px-6 py-3 font-medium">Invoice #</th>
                        <th className="px-6 py-3 font-medium">Type</th>
                        <th className="px-6 py-3 font-medium">Customer</th>
                        <th className="px-6 py-3 font-medium">Cashier</th>
                        <th className="px-6 py-3 font-medium">Total</th>
                        <th className="px-6 py-3 font-medium">Status</th>

                        {/* ⭐ NEW COLUMNS ⭐ */}
                        <th className="px-6 py-3 font-medium">ERPNext Sync</th>
                        <th className="px-6 py-3 font-medium">ERPNext Ref</th>

                        <th className="px-6 py-3 text-right font-medium">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        // ⭐ LOADING SKELETON ROWS ⭐
                        Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} className="border-b border-white/5">
                                {/* Updated colSpan from 7 to 9 to match new columns */}
                                <td colSpan={9} className="px-6 py-4">
                                    <div className="h-6 animate-pulse rounded bg-white/5 w-full" />
                                </td>
                            </tr>
                        ))
                    ) : data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={9} // Updated colSpan from 7 to 9
                                className="px-6 py-16 text-center text-muted-foreground"
                            >
                                No transactions found for this filter.
                            </td>
                        </tr>
                    ) : (
                        data.map((sale) => (
                            <tr
                                key={sale.id}
                                className="border-b border-white/5 transition hover:bg-white/[0.02]"
                            >
                                <td className="px-6 py-4 font-medium">
                                    {sale.invoice_number}
                                </td>
                                <td className="px-6 py-4 capitalize">
                                    {sale.invoice_type}
                                </td>
                                <td className="px-6 py-4">
                                    {sale.customer?.customer_name || "Walk-in"}
                                </td>
                                <td className="px-6 py-4">
                                    {sale.user?.name || "System"}
                                </td>
                                <td className="px-6 py-4 tabular-nums">
                                    {sale.grand_total}
                                </td>
                                <td className="px-6 py-4">
                                    <span
                                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                            sale.status === "paid"
                                                ? "bg-emerald-500/10 text-emerald-400"
                                                : sale.status === "partial"
                                                  ? "bg-amber-500/10 text-amber-400"
                                                  : "bg-red-500/10 text-red-400"
                                        }`}
                                    >
                                        {sale.status.toUpperCase()}
                                    </span>
                                </td>

                                {/* ⭐ ERPNext Sync Badge ⭐ */}
                                <td className="px-6 py-4">
                                    <SyncStatusBadge
                                        status={sale.sync_status}
                                    />
                                </td>

                                {/* ⭐ ERPNext Reference ⭐ */}
                                <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                                    {sale.erpnext_invoice_reference || "—"}
                                </td>

                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => onView(sale.id)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-white/10 hover:text-foreground ml-auto"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
