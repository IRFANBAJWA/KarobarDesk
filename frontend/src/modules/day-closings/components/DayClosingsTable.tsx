import type { DayClosingSummary } from "../types";
import { Eye } from "lucide-react";

interface Props {
    data: DayClosingSummary[];
    loading: boolean;
    onView: (id: string) => void;
}

export default function DayClosingsTable({ data, loading, onView }: Props) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                        <th className="px-6 py-3 font-medium">Date</th>
                        <th className="px-6 py-3 font-medium">Company</th>
                        <th className="px-6 py-3 font-medium">Shifts</th>
                        <th className="px-6 py-3 font-medium">Total Sales</th>
                        <th className="px-6 py-3 font-medium">Difference</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 text-right font-medium">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} className="border-b border-white/5">
                                <td colSpan={7} className="px-6 py-4">
                                    <div className="h-6 animate-pulse rounded bg-white/5 w-full" />
                                </td>
                            </tr>
                        ))
                    ) : data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={7}
                                className="px-6 py-16 text-center text-muted-foreground"
                            >
                                No day closings found for this date.
                            </td>
                        </tr>
                    ) : (
                        data.map((dc) => (
                            <tr
                                key={dc.id}
                                className="border-b border-white/5 transition hover:bg-white/[0.02]"
                            >
                                <td className="px-6 py-4 font-medium">
                                    {dc.business_date}
                                </td>
                                <td className="px-6 py-4">{dc.company_name}</td>
                                <td className="px-6 py-4">{dc.shift_count}</td>
                                <td className="px-6 py-4 tabular-nums text-emerald-400">
                                    {dc.total_sales}
                                </td>
                                <td className="px-6 py-4 tabular-nums">
                                    <span
                                        className={
                                            Number(dc.cash_difference) < 0
                                                ? "text-red-400"
                                                : "text-emerald-400"
                                        }
                                    >
                                        {dc.cash_difference}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400">
                                        {dc.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => onView(dc.id)}
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
