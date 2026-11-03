import { useState } from "react";
import { cn } from "@/lib/utils";

export default function TopDesignsPanel({ designs }: { designs: any[] }) {
    const [activeTab, setActiveTab] = useState<"revenue" | "units">("revenue");

    return (
        <div className="relative bg-glass-gradient border border-white/10 backdrop-blur-2xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] p-6 overflow-hidden flex flex-col h-full">
            {/* Top Edge Highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent z-10" />

            <div className="relative z-10 flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold tracking-tight text-white">
                    Top Selling Designs
                </h3>
                <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                    <button
                        onClick={() => setActiveTab("revenue")}
                        className={cn(
                            "px-3 py-1 text-xs font-medium rounded-md transition-all",
                            activeTab === "revenue"
                                ? "bg-white/10 text-white shadow-sm"
                                : "text-neutral-400 hover:text-white",
                        )}
                    >
                        By Revenue
                    </button>
                    <button
                        onClick={() => setActiveTab("units")}
                        className={cn(
                            "px-3 py-1 text-xs font-medium rounded-md transition-all",
                            activeTab === "units"
                                ? "bg-white/10 text-white shadow-sm"
                                : "text-neutral-400 hover:text-white",
                        )}
                    >
                        By Units
                    </button>
                </div>
            </div>

            <div className="relative z-10 flex-1 space-y-4">
                {designs?.map((item, idx) => (
                    <div
                        key={idx}
                        className="flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-400">
                                #{idx + 1}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white group-hover:text-violet-400 transition-colors">
                                    {item.item_name}
                                </p>
                                <p className="text-xs text-neutral-400">
                                    {item.total_units} Units Sold
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold tabular-nums text-white">
                                {activeTab === "revenue"
                                    ? `Rs ${Number(item.total_revenue).toLocaleString()}`
                                    : item.total_units}
                            </p>
                            {item.pack_transactions > 0 && (
                                <p className="text-[10px] text-amber-400 font-medium">
                                    {item.pack_transactions} Pack Txns
                                </p>
                            )}
                        </div>
                    </div>
                ))}
                {(!designs || designs.length === 0) && (
                    <p className="text-sm text-neutral-500 text-center py-4">
                        No designs sold yet.
                    </p>
                )}
            </div>
        </div>
    );
}
