import { cn } from "@/lib/utils";
import { Package, Layers, AlertTriangle, RotateCcw } from "lucide-react";

export default function ProductKpiCard({ title, value, subValue, type }: any) {
    const icons = {
        units: <Package className="w-5 h-5 text-blue-400" />,
        packs: <Layers className="w-5 h-5 text-violet-400" />,
        defective: <AlertTriangle className="w-5 h-5 text-amber-400" />,
        returns: <RotateCcw className="w-5 h-5 text-rose-400" />,
    };

    const glows = {
        units: "from-blue-500/10",
        packs: "from-violet-500/10",
        defective: "from-amber-500/10",
        returns: "from-rose-500/10",
    };

    return (
        <div className="relative bg-glass-gradient border border-white/10 backdrop-blur-2xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] p-5 overflow-hidden hover:-translate-y-1 transition-transform duration-300">
            {/* Top Edge Highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent z-10" />

            {/* Background Glow */}
            <div
                className={cn(
                    "absolute inset-0 bg-gradient-to-br to-transparent opacity-50 rounded-2xl",
                    glows[type as keyof typeof glows],
                )}
            />

            <div className="relative z-10 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-400">
                        {title}
                    </span>
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                        {icons[type as keyof typeof icons]}
                    </div>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold tabular-nums tracking-tight text-white">
                        {value}
                    </span>
                    {subValue && (
                        <span className="text-sm text-neutral-400 font-medium">
                            {subValue}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
