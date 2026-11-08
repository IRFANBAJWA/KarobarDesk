import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

import { cn } from "@/lib/utils";
import InteractiveGlassCard from "@/components/glass/InteractiveGlassCard";

interface Props {
    title: string;
    value: string | number;
    breakdown?: {
        gross: string | number;
        returns: string | number;
        returnsColor?: "red" | "orange";
    };
    trend?: string;
    comparisonLabel?: string;
    trendDirection?: "positive" | "negative" | "neutral";
    icon?: LucideIcon;
    color?: "orange" | "emerald" | "blue" | "violet" | "red";
    delay?: number;
}

const colorThemes = {
    orange: {
        icon: "bg-orange-400/10 text-orange-300 border-orange-300/20",
        glow: "hover:shadow-orange-500/[0.10]",
        accent: "rgba(251, 146, 60, 0.15)",
    },
    emerald: {
        icon: "bg-emerald-400/10 text-emerald-300 border-emerald-300/20",
        glow: "hover:shadow-emerald-500/[0.10]",
        accent: "rgba(52, 211, 153, 0.15)",
    },
    blue: {
        icon: "bg-blue-400/10 text-blue-300 border-blue-300/20",
        glow: "hover:shadow-blue-500/[0.10]",
        accent: "rgba(96, 165, 250, 0.16)",
    },
    violet: {
        icon: "bg-violet-400/10 text-violet-300 border-violet-300/20",
        glow: "hover:shadow-violet-500/[0.10]",
        accent: "rgba(167, 139, 250, 0.17)",
    },
    red: {
        icon: "bg-red-400/10 text-red-300 border-red-300/20",
        glow: "hover:shadow-red-500/[0.10]",
        accent: "rgba(248, 113, 113, 0.15)",
    },
};

const trendColorMap = {
    positive: "text-emerald-300 bg-emerald-400/[0.10] border-emerald-300/15",
    negative: "text-red-300 bg-red-400/[0.10] border-red-300/15",
    neutral: "text-slate-300 bg-white/[0.05] border-white/[0.08]",
};

function AnimatedValue({
    value,
    prefix = "",
    suffix = "",
}: {
    value: string | number;
    prefix?: string;
    suffix?: string;
}) {
    const [displayValue, setDisplayValue] = useState(prefix + "0" + suffix);
    const numericValue =
        typeof value === "number"
            ? value
            : Number(String(value).replace(/[^0-9.]/g, ""));

    useEffect(() => {
        if (!Number.isFinite(numericValue) || numericValue === 0) {
            setDisplayValue(String(value));
            return;
        }
        let start = 0;
        const duration = 1000;
        const frameDuration = 16;
        const increment = numericValue / (duration / frameDuration);

        const timer = window.setInterval(() => {
            start += increment;
            if (start >= numericValue) {
                setDisplayValue(String(value));
                window.clearInterval(timer);
            } else {
                setDisplayValue(
                    `${prefix}${Math.floor(start).toLocaleString()}${suffix}`,
                );
            }
        }, frameDuration);

        return () => window.clearInterval(timer);
    }, [numericValue, value, prefix, suffix]);

    return <span>{displayValue}</span>;
}

export default function KpiCard({
    title,
    value,
    breakdown,
    trend,
    comparisonLabel,
    trendDirection,
    icon: Icon,
    color = "orange",
    delay = 0,
}: Props) {
    const direction =
        trendDirection ??
        (trend?.trim().startsWith("+")
            ? "positive"
            : trend?.trim().startsWith("-")
              ? "negative"
              : "neutral");
    const theme = colorThemes[color] ?? colorThemes.orange;

    const isCurrency = String(value).includes("Rs");
    const prefix = isCurrency ? "Rs " : "";
    const cleanValue = isCurrency ? String(value).replace("Rs ", "") : value;

    return (
        <InteractiveGlassCard
            className={cn(
                "group relative flex min-h-[160px] flex-col", // Increased height for breakdown
                "justify-between overflow-hidden rounded-2xl",
                "border border-white/[0.12]",
                "bg-white/[0.045] p-5",
                "backdrop-blur-2xl",
                "shadow-[0_12px_35px_rgba(2,8,23,0.16)]",
                "transition-all duration-300",
                "hover:border-white/[0.20]",
                "hover:bg-white/[0.065]",
                "hover:shadow-[0_18px_45px_rgba(2,8,23,0.25)]",
                theme.glow,
                "animate-fade-in-up opacity-0",
            )}
            style={{
                animationDelay: `${delay}ms`,
                animationFillMode: "forwards",
                ["--spotlight-color" as string]: theme.accent,
            }}
            tiltStrength={3}
            spotlightColor={theme.accent}
        >
            {/* Soft color ambience */}
            <div
                className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full blur-[55px] opacity-80 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: theme.accent }}
            />
            <div className="pointer-events-none absolute -bottom-20 -left-12 h-36 w-36 rounded-full bg-blue-400/[0.07] blur-[55px]" />
            <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            <div className="relative z-10 flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-300/80">
                    {title}
                </span>
                {Icon && (
                    <div
                        className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center",
                            "rounded-xl border backdrop-blur-md",
                            "shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
                            "transition-transform duration-300",
                            "group-hover:scale-110",
                            theme.icon,
                        )}
                    >
                        <Icon className="h-[18px] w-[18px]" />
                    </div>
                )}
            </div>

            <div className="relative z-10 mt-4">
                <h4 className="mb-1 text-[26px] font-bold tracking-tight text-white tabular-nums sm:text-[30px]">
                    <AnimatedValue value={cleanValue} prefix={prefix} />
                </h4>

                {/* ⭐ BREAKDOWN LOGIC ⭐ */}
                {breakdown ? (
                    <div className="flex items-center gap-2 mt-2 text-[10px] font-medium border-t border-white/10 pt-2">
                        <span className="text-slate-400">
                            Sale:{" "}
                            <span className="text-white font-bold">
                                {breakdown.gross}
                            </span>
                        </span>
                        <span className="text-slate-600">|</span>
                        <span className="text-slate-400">
                            Ret:{" "}
                            <span
                                className={
                                    breakdown.returnsColor === "orange"
                                        ? "text-orange-400"
                                        : "text-red-400"
                                }
                            >
                                {breakdown.returns}
                            </span>
                        </span>
                    </div>
                ) : trend || comparisonLabel ? (
                    <div className="flex min-h-6 flex-wrap items-center gap-2 mt-2">
                        {trend && (
                            <span
                                className={cn(
                                    "inline-flex items-center gap-1 rounded-lg border px-2 py-1",
                                    "text-[10px] font-semibold backdrop-blur-md",
                                    trendColorMap[direction],
                                )}
                            >
                                {direction === "positive" ? (
                                    <ArrowUpRight className="h-3 w-3" />
                                ) : direction === "negative" ? (
                                    <ArrowDownRight className="h-3 w-3" />
                                ) : (
                                    <Minus className="h-3 w-3" />
                                )}
                                {trend}
                            </span>
                        )}
                        {comparisonLabel && (
                            <span className="text-[10px] font-medium text-slate-400">
                                {comparisonLabel}
                            </span>
                        )}
                    </div>
                ) : null}
            </div>
        </InteractiveGlassCard>
    );
}
