import { ServerCrash, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { DashboardData } from "../types";

export default function SystemHealthWidget({
    health,
}: {
    health: DashboardData["systemHealth"];
}) {
    // Fallback in case the backend doesn't return this data perfectly
    const safeHealth = health || {
        erp_status: "Unknown",
        pending_jobs: 0,
        failed_jobs: 0,
        stuck_invoices: 0,
        last_sync: "Never",
    };

    return (
        <div className="relative flex h-full flex-col justify-between p-2">
            <div>
                <h3 className="text-lg font-semibold tracking-tight text-white mb-5 flex items-center gap-2">
                    System Health
                    <span className="flex h-2.5 w-2.5 relative">
                        <span
                            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${safeHealth.erp_status === "healthy" ? "bg-emerald-400" : "bg-amber-400"}`}
                        ></span>
                        <span
                            className={`relative inline-flex rounded-full h-2.5 w-2.5 shadow-[0_0_8px_rgba(16,185,129,0.8)] ${safeHealth.erp_status === "healthy" ? "bg-emerald-500" : "bg-amber-500"}`}
                        ></span>
                    </span>
                </h3>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                            ERPNext Status
                        </span>
                        <span
                            className={`text-xs font-bold flex items-center gap-1.5 ${safeHealth.erp_status === "healthy" ? "text-emerald-400" : "text-amber-400"}`}
                        >
                            {safeHealth.erp_status}
                        </span>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Pending Jobs
                        </span>
                        <span className="text-sm font-bold text-white">
                            {safeHealth.pending_jobs}
                        </span>
                    </div>

                    <div
                        className={`flex items-center justify-between p-3.5 rounded-xl border ${safeHealth.failed_jobs > 0 ? "bg-red-500/5 border-red-500/10" : "bg-white/[0.02] border-white/5"}`}
                    >
                        <span
                            className={`text-xs font-bold flex items-center gap-2 uppercase tracking-wider ${safeHealth.failed_jobs > 0 ? "text-red-400" : "text-slate-400"}`}
                        >
                            <ServerCrash className="h-4 w-4" /> Failed Jobs
                        </span>
                        <span
                            className={`text-sm font-bold ${safeHealth.failed_jobs > 0 ? "text-red-400" : "text-white"}`}
                        >
                            {safeHealth.failed_jobs}
                        </span>
                    </div>

                    <div
                        className={`flex items-center justify-between p-3.5 rounded-xl border ${safeHealth.stuck_invoices > 0 ? "bg-amber-500/5 border-amber-500/10" : "bg-white/[0.02] border-white/5"}`}
                    >
                        <span
                            className={`text-xs font-bold flex items-center gap-2 uppercase tracking-wider ${safeHealth.stuck_invoices > 0 ? "text-amber-400" : "text-slate-400"}`}
                        >
                            <AlertTriangle className="h-4 w-4" /> Stuck Invoices
                        </span>
                        <span
                            className={`text-sm font-bold ${safeHealth.stuck_invoices > 0 ? "text-amber-400" : "text-white"}`}
                        >
                            {safeHealth.stuck_invoices}
                        </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 px-1">
                        <span className="text-[11px] text-slate-400 uppercase tracking-wider">
                            Last successful sync
                        </span>
                        <span className="text-xs font-medium text-white">
                            {safeHealth.last_sync}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10">
                <Link
                    to="/queue-monitor"
                    className="flex items-center justify-center w-full gap-2 rounded-xl bg-white/5 hover:bg-white/10 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 border border-white/10 group"
                >
                    Go to Queue Monitor{" "}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
