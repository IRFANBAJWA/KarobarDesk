import type { Shift } from "../types";
import { Eye } from "lucide-react";

// Helper to calculate hours
const calculateHours = (start: string, end: string | null) => {
    if (!end) return "—";
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    return `${(diffMs / (1000 * 60 * 60)).toFixed(2)} hrs`;
};

interface Props {
    data: Shift[];
    loading: boolean;
    onView: (id: number) => void;
}

export default function ShiftsTable({ data, loading, onView }: Props) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                        <th className="px-6 py-3 font-medium">Shift #</th>
                        <th className="px-6 py-3 font-medium">Date</th>
                        <th className="px-6 py-3 font-medium">Cashier</th>
                        <th className="px-6 py-3 font-medium">Sales</th>
                        <th className="px-6 py-3 font-medium">Returns</th>
                        <th className="px-6 py-3 font-medium">Hours</th>
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
                                <td colSpan={8} className="px-6 py-4">
                                    <div className="h-6 animate-pulse rounded bg-white/5 w-full" />
                                </td>
                            </tr>
                        ))
                    ) : data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={8}
                                className="px-6 py-16 text-center text-muted-foreground"
                            >
                                No shifts found.
                            </td>
                        </tr>
                    ) : (
                        data.map((shift) => (
                            <tr
                                key={shift.id}
                                className="border-b border-white/5 transition hover:bg-white/[0.02]"
                            >
                                <td className="px-6 py-4 font-medium">
                                    {shift.shift_code || `#${shift.id}`}
                                </td>
                                <td className="px-6 py-4">
                                    {shift.shift_date}
                                </td>
                                <td className="px-6 py-4">
                                    {shift.user?.name || "—"}
                                </td>
                                <td className="px-6 py-4 tabular-nums text-emerald-400">
                                    {shift.total_sales}
                                </td>
                                <td className="px-6 py-4 tabular-nums text-red-400">
                                    {shift.total_returns}
                                </td>
                                <td className="px-6 py-4 tabular-nums text-muted-foreground">
                                    {calculateHours(
                                        shift.start_time,
                                        shift.end_time,
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {/* ⭐ Status mapped to O / C ⭐ */}
                                    <span
                                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                            shift.shift_status === "OPEN"
                                                ? "bg-amber-500/10 text-amber-400"
                                                : "bg-emerald-500/10 text-emerald-400"
                                        }`}
                                    >
                                        {shift.shift_status === "OPEN"
                                            ? "O"
                                            : "C"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => onView(shift.id)}
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
