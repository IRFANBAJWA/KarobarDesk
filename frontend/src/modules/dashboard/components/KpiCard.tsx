import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    title: string;
    value: string | number;
    trend?: string;
    comparisonLabel?: string;
    trendDirection?: "positive" | "negative" | "neutral";
    icon?: LucideIcon;
    color?: "orange" | "emerald" | "blue" | "violet" | "red";
    delay?: number; // Stagger animation
}

const colorThemes: Record<
    string,
    { bg: string; border: string; iconBg: string; glow: string }
> = {
    orange: {
        bg: "bg-gradient-to-br from-orange-500/[0.08] to-transparent",
        border: "border-white/[0.06] hover:border-orange-500/30",
        iconBg: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        glow: "hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]",
    },
    emerald: {
        bg: "bg-gradient-to-br from-emerald-500/[0.08] to-transparent",
        border: "border-white/[0.06] hover:border-emerald-500/30",
        iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        glow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]",
    },
    blue: {
        bg: "bg-gradient-to-br from-blue-500/[0.08] to-transparent",
        border: "border-white/[0.06] hover:border-blue-500/30",
        iconBg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        glow: "hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]",
    },
    violet: {
        bg: "bg-gradient-to-br from-violet-500/[0.08] to-transparent",
        border: "border-white/[0.06] hover:border-violet-500/30",
        iconBg: "bg-violet-500/10 text-violet-400 border-violet-500/20",
        glow: "hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]",
    },
    red: {
        bg: "bg-gradient-to-br from-red-500/[0.08] to-transparent",
        border: "border-white/[0.06] hover:border-red-500/30",
        iconBg: "bg-red-500/10 text-red-400 border-red-500/20",
        glow: "hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]",
    },
};

const trendColorMap = {
    positive: "text-emerald-400 bg-emerald-400/10",
    negative: "text-red-400 bg-red-400/10",
    neutral: "text-neutral-400 bg-white/5",
};

// Simple count-up animation for numbers
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
        if (isNaN(numericValue) || numericValue === 0) {
            setDisplayValue(String(value));
            return;
        }

        let start = 0;
        const duration = 1000; // 1 second
        const increment = numericValue / (duration / 16); // 60fps

        const timer = setInterval(() => {
            start += increment;
            if (start >= numericValue) {
                setDisplayValue(String(value));
                clearInterval(timer);
            } else {
                setDisplayValue(
                    `${prefix}${Math.floor(start).toLocaleString()}${suffix}`,
                );
            }
        }, 16);

        return () => clearInterval(timer);
    }, [numericValue, value, prefix, suffix]);

    return <span>{displayValue}</span>;
}

export default function KpiCard({
    title,
    value,
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
    const theme = colorThemes[color] || colorThemes.orange;

    // Format the value for the counter
    const isCurrency = String(value).includes("Rs");
    const prefix = isCurrency ? "Rs " : "";
    const cleanValue = isCurrency ? String(value).replace("Rs ", "") : value;

    return (
        <div
            className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1",
                theme.border,
                theme.bg,
                theme.glow,
                "animate-fade-in-up opacity-0", // Start hidden for animation
            )}
            style={{
                animationDelay: `${delay}ms`,
                animationFillMode: "forwards",
            }}
        >
            {/* Top Glass Edge Highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10 flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    {title}
                </span>
                {Icon && (
                    <div
                        className={cn(
                            "p-2 rounded-xl border transition-transform duration-300 group-hover:scale-110",
                            theme.iconBg,
                        )}
                    >
                        <Icon className="h-4 w-4" />
                    </div>
                )}
            </div>

            <div className="relative z-10">
                <h4 className="text-2xl font-bold tracking-tight text-white mb-1 tabular-nums">
                    <AnimatedValue value={cleanValue} prefix={prefix} />
                </h4>

                <div className="flex items-center gap-2 mt-1">
                    {trend && direction && (
                        <span
                            className={cn(
                                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold",
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
                        <span className="text-[10px] font-medium text-neutral-500">
                            {comparisonLabel}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
