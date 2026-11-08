import { cn } from "@/lib/utils";
import { Package, Layers, AlertTriangle, RotateCcw } from "lucide-react";
import InteractiveGlassCard from "@/components/glass/InteractiveGlassCard";

export default function ProductKpiCard({
    title,
    value,
    subValue,
    type,
    delay = 0,
}: any) {
    const config = {
        units: {
            icon: Package,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
            glow: "hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]",
            accent: "rgba(59, 130, 246, 0.15)",
        },
        packs: {
            icon: Layers,
            color: "text-violet-400",
            bg: "bg-violet-500/10",
            border: "border-violet-500/20",
            glow: "hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]",
            accent: "rgba(139, 92, 246, 0.15)",
        },
        defective: {
            icon: AlertTriangle,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
            glow: "hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]",
            accent: "rgba(245, 158, 11, 0.15)",
        },
        returns: {
            icon: RotateCcw,
            color: "text-rose-400",
            bg: "bg-rose-500/10",
            border: "border-rose-500/20",
            glow: "hover:shadow-[0_0_30px_rgba(244,63,94,0.15)]",
            accent: "rgba(244, 63, 94, 0.15)",
        },
    };

    const c = config[type as keyof typeof config];
    const Icon = c.icon;

    return (
        <InteractiveGlassCard
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.045] p-5 backdrop-blur-2xl shadow-[0_12px_35px_rgba(2,8,23,0.16)] transition-all duration-300 hover:border-white/[0.20] hover:bg-white/[0.065] animate-fade-in-up"
            style={{
                animationDelay: `${delay}ms`,
                animationFillMode: "forwards",
            }}
            tiltStrength={3}
            spotlightColor={c.accent}
        >
            <div
                className={cn(
                    "pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full blur-[55px] opacity-80",
                    c.bg,
                )}
            />

            <div className="relative z-10 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-300/80">
                    {title}
                </span>
                <div
                    className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-md transition-transform duration-300 group-hover:scale-110",
                        c.bg,
                        c.border,
                        c.color,
                    )}
                >
                    <Icon className="h-[18px] w-[18px]" />
                </div>
            </div>

            <div className="relative z-10 mt-5">
                <div className="flex items-baseline gap-2">
                    <span className="text-[26px] font-bold tracking-tight text-white tabular-nums">
                        {value}
                    </span>
                    {subValue && (
                        <span className="text-xs font-medium text-slate-400">
                            {subValue}
                        </span>
                    )}
                </div>
            </div>
        </InteractiveGlassCard>
    );
}
