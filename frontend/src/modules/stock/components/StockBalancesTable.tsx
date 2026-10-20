import type { StockBalance } from "../types";
import { Layers } from "lucide-react";

interface Props {
    balances: StockBalance[];
    loading: boolean;
    onViewLedger: (itemId: number, itemName: string) => void;
}

export default function StockBalancesTable({
    balances,
    loading,
    onViewLedger,
}: Props) {
    if (loading) {
        return (
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-medium">Item</th>
                            <th className="px-6 py-3 text-right font-medium">
                                Opening
                            </th>
                            <th className="px-6 py-3 text-right font-medium text-emerald-400/70">
                                In
                            </th>
                            <th className="px-6 py-3 text-right font-medium text-red-400/70">
                                Out
                            </th>
                            <th className="px-6 py-3 text-right font-medium">
                                Closing
                            </th>
                            <th className="px-6 py-3 text-right font-medium">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <tr key={i} className="border-b border-white/5">
                                <td colSpan={6} className="px-6 py-4">
                                    <div className="h-12 animate-pulse rounded-lg border border-white/5 bg-white/[0.02]" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (balances.length === 0) {
        return (
            <div className="py-16 text-center">
                <p className="text-sm text-foreground">No stock found</p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Try adjusting your filters.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                        <th className="px-6 py-3 font-medium">Item</th>
                        <th className="px-6 py-3 text-right font-medium">
                            Opening
                        </th>
                        <th className="px-6 py-3 text-right font-medium text-emerald-400/70">
                            In
                        </th>
                        <th className="px-6 py-3 text-right font-medium text-red-400/70">
                            Out
                        </th>
                        <th className="px-6 py-3 text-right font-medium">
                            Closing
                        </th>
                        <th className="px-6 py-3 text-right font-medium">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {balances.map((b) => (
                        <tr
                            key={b.id}
                            className="border-b border-white/5 transition hover:bg-white/[0.02]"
                        >
                            <td className="px-6 py-4">
                                <div className="font-medium text-foreground">
                                    {b.item?.item_name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {b.item?.erpnext_item_code}
                                </div>
                            </td>

                            <td className="px-6 py-4 text-right tabular-nums text-muted-foreground">
                                {b.opening_qty.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right tabular-nums text-emerald-400">
                                {b.in_qty > 0
                                    ? `+${b.in_qty.toFixed(2)}`
                                    : "0.00"}
                            </td>
                            <td className="px-6 py-4 text-right tabular-nums text-red-400">
                                {b.out_qty > 0
                                    ? `-${b.out_qty.toFixed(2)}`
                                    : "0.00"}
                            </td>
                            <td className="px-6 py-4 text-right tabular-nums font-medium text-foreground">
                                {b.closing_qty.toFixed(2)}
                            </td>

                            <td className="px-6 py-4 text-right">
                                <button
                                    onClick={() =>
                                        onViewLedger(
                                            b.item_id,
                                            b.item.item_name,
                                        )
                                    }
                                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-muted-foreground hover:bg-white/10 hover:text-foreground"
                                >
                                    <Layers className="h-3.5 w-3.5" /> Ledger
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
