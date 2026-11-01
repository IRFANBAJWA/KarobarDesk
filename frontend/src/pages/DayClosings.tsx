import { useEffect, useState } from "react";
import { listDayClosings } from "@/modules/day-closings/api";
import type { DayClosingSummary } from "@/modules/day-closings/types";
import DayClosingsTable from "@/modules/day-closings/components/DayClosingsTable";
import DayClosingDetailDrawer from "@/modules/day-closings/components/DayClosingDetailDrawer";
import { RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function DayClosings() {
    const [data, setData] = useState<DayClosingSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await listDayClosings({ date });
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [date]);

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 p-6">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        Day Closings
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        View end-of-day summaries and total cash counts.
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm transition hover:bg-white/10"
                >
                    <RefreshCw
                        className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />{" "}
                    Refresh
                </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="h-9 w-auto"
                    />
                </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
                <DayClosingsTable
                    data={data}
                    loading={loading}
                    onView={setSelectedId}
                />
            </div>

            <DayClosingDetailDrawer
                closingId={selectedId}
                onClose={() => setSelectedId(null)}
            />
        </div>
    );
}
