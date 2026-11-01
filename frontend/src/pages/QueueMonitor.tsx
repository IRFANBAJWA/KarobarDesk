import { useEffect, useState } from "react";
import {
    getQueueStats,
    retryFailedJob,
    retryInvoice,
} from "@/modules/queue/api";
import type { Job, FailedJob, StuckInvoice } from "@/modules/queue/types";
import {
    RefreshCw,
    AlertTriangle,
    PlayCircle,
    ServerCrash,
} from "lucide-react";

export default function QueueMonitor() {
    const [data, setData] = useState<{
        pending_jobs: Job[];
        failed_jobs: FailedJob[];
        stuck_invoices: StuckInvoice[];
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retrying, setRetrying] = useState<string | number | null>(null);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await getQueueStats();
            setData(res);
            setError(null);
        } catch (err: any) {
            setError(err.message || "Failed to load queue stats.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        // Auto-refresh every 10 seconds
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleRetryJob = async (uuid: string) => {
        setRetrying(uuid);
        try {
            await retryFailedJob(uuid);
            await fetchStats();
        } catch (e) {
            alert("Failed to retry job");
        } finally {
            setRetrying(null);
        }
    };

    const handleRetryInvoice = async (id: number) => {
        setRetrying(id);
        try {
            await retryInvoice(id);
            await fetchStats();
        } catch (e) {
            alert("Failed to retry invoice");
        } finally {
            setRetrying(null);
        }
    };

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 p-6">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        Queue Monitor
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Monitor background jobs, ERPNext sync failures, and
                        retry safely.
                    </p>
                </div>
                <button
                    onClick={fetchStats}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm transition hover:bg-white/10"
                >
                    <RefreshCw
                        className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />{" "}
                    Refresh
                </button>
            </div>

            {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                    {error}
                </div>
            )}

            {/* Stuck Invoices Section */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
                <div className="border-b border-white/10 px-6 py-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    <h2 className="text-lg font-medium">
                        Stuck Invoices (ERPNext)
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm text-left">
                        <thead>
                            <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-muted-foreground">
                                <th className="px-6 py-3 font-medium">
                                    Invoice #
                                </th>
                                <th className="px-6 py-3 font-medium">
                                    Status
                                </th>
                                <th className="px-6 py-3 font-medium">
                                    Attempts
                                </th>
                                <th className="px-6 py-3 font-medium">Error</th>
                                <th className="px-6 py-3 text-right font-medium">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.stuck_invoices.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-6 py-8 text-center text-muted-foreground"
                                    >
                                        No stuck invoices. All clear!
                                    </td>
                                </tr>
                            )}
                            {data?.stuck_invoices.map((inv) => (
                                <tr
                                    key={inv.id}
                                    className="border-b border-white/5 hover:bg-white/[0.02]"
                                >
                                    <td className="px-6 py-4 font-medium">
                                        {inv.invoice_number}
                                    </td>
                                    <td className="px-6 py-4 capitalize text-red-400">
                                        {inv.sync_status}
                                    </td>
                                    <td className="px-6 py-4">
                                        {inv.sync_attempts}
                                    </td>
                                    <td
                                        className="px-6 py-4 text-xs text-red-400 max-w-xs truncate"
                                        title={inv.sync_error || ""}
                                    >
                                        {inv.sync_error || "—"}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() =>
                                                handleRetryInvoice(inv.id)
                                            }
                                            disabled={retrying === inv.id}
                                            className="inline-flex items-center gap-1 rounded bg-violet-600 px-3 py-1.5 text-xs text-white hover:bg-violet-700 disabled:opacity-50"
                                        >
                                            {retrying === inv.id ? (
                                                <RefreshCw className="h-3 w-3 animate-spin" />
                                            ) : (
                                                "Retry"
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Failed Jobs Section */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
                <div className="border-b border-white/10 px-6 py-4 flex items-center gap-2">
                    <ServerCrash className="h-5 w-5 text-red-400" />
                    <h2 className="text-lg font-medium">
                        Failed Jobs (Laravel)
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm text-left">
                        <thead>
                            <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-muted-foreground">
                                <th className="px-6 py-3 font-medium">Queue</th>
                                <th className="px-6 py-3 font-medium">
                                    Exception
                                </th>
                                <th className="px-6 py-3 font-medium">
                                    Failed At
                                </th>
                                <th className="px-6 py-3 text-right font-medium">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.failed_jobs.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-6 py-8 text-center text-muted-foreground"
                                    >
                                        No failed jobs. Queue is healthy!
                                    </td>
                                </tr>
                            )}
                            {data?.failed_jobs.map((job) => (
                                <tr
                                    key={job.uuid}
                                    className="border-b border-white/5 hover:bg-white/[0.02]"
                                >
                                    <td className="px-6 py-4 font-mono text-xs">
                                        {job.queue}
                                    </td>
                                    <td
                                        className="px-6 py-4 text-xs text-red-400 max-w-md truncate"
                                        title={job.exception}
                                    >
                                        {job.exception.split("\n")[0]}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-muted-foreground">
                                        {job.failed_at}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() =>
                                                handleRetryJob(job.uuid)
                                            }
                                            disabled={retrying === job.uuid}
                                            className="inline-flex items-center gap-1 rounded bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20 disabled:opacity-50"
                                        >
                                            {retrying === job.uuid ? (
                                                <RefreshCw className="h-3 w-3 animate-spin" />
                                            ) : (
                                                "Retry"
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pending Jobs Section */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
                <div className="border-b border-white/10 px-6 py-4 flex items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-blue-400" />
                    <h2 className="text-lg font-medium">
                        Pending Jobs (Queue)
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm text-left">
                        <thead>
                            <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-muted-foreground">
                                <th className="px-6 py-3 font-medium">ID</th>
                                <th className="px-6 py-3 font-medium">Queue</th>
                                <th className="px-6 py-3 font-medium">
                                    Attempts
                                </th>
                                <th className="px-6 py-3 font-medium">
                                    Created At
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.pending_jobs.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-6 py-8 text-center text-muted-foreground"
                                    >
                                        Queue is empty.
                                    </td>
                                </tr>
                            )}
                            {data?.pending_jobs.map((job) => (
                                <tr
                                    key={job.id}
                                    className="border-b border-white/5 hover:bg-white/[0.02]"
                                >
                                    <td className="px-6 py-4 font-mono text-xs">
                                        {job.id}
                                    </td>
                                    <td className="px-6 py-4 text-xs">
                                        {job.queue}
                                    </td>
                                    <td className="px-6 py-4 text-xs">
                                        {job.attempts}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-muted-foreground">
                                        {job.created_at}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
