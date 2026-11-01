import type { JournalEntry } from "../types";
import { Eye } from "lucide-react";

interface Props {
    data: JournalEntry[];
    loading: boolean;
    onView: (id: number) => void;
}

export default function JournalEntriesTable({ data, loading, onView }: Props) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                        <th className="px-6 py-3 font-medium">Entry #</th>
                        <th className="px-6 py-3 font-medium">Date</th>
                        <th className="px-6 py-3 font-medium">Title</th>
                        <th className="px-6 py-3 font-medium">Amount</th>
                        <th className="px-6 py-3 font-medium">ERPNext Sync</th>
                        <th className="px-6 py-3 text-right font-medium">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} className="border-b border-white/5">
                                <td colSpan={6} className="px-6 py-4">
                                    <div className="h-6 animate-pulse rounded bg-white/5 w-full" />
                                </td>
                            </tr>
                        ))
                    ) : data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={6}
                                className="px-6 py-16 text-center text-muted-foreground"
                            >
                                No expenses found for this date.
                            </td>
                        </tr>
                    ) : (
                        data.map((entry) => (
                            <tr
                                key={entry.id}
                                className="border-b border-white/5 transition hover:bg-white/[0.02]"
                            >
                                <td className="px-6 py-4 font-medium">
                                    {entry.entry_number}
                                </td>
                                <td className="px-6 py-4">
                                    {entry.posting_date}
                                </td>
                                <td className="px-6 py-4">{entry.title}</td>
                                <td className="px-6 py-4 tabular-nums text-red-400">
                                    {entry.total_debit}
                                </td>
                                <td className="px-6 py-4">
                                    <span
                                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                            entry.sync_status === "synced"
                                                ? "bg-emerald-500/10 text-emerald-400"
                                                : "bg-amber-500/10 text-amber-400"
                                        }`}
                                    >
                                        {entry.sync_status.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => onView(entry.id)}
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
