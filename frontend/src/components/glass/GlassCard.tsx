import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type GlassVariant = "default" | "solid" | "subtle";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: GlassVariant;
}

const variantClasses: Record<GlassVariant, string> = {
    default: ["glass-panel", "glass-hover", "shadow-xl"].join(" "),

    solid: [
        "rounded-2xl",
        "border",
        "border-white/10",
        "bg-[#101019]",
        "shadow-lg",
    ].join(" "),

    subtle: [
        "rounded-2xl",
        "border",
        "border-white/[0.06]",
        "bg-white/[0.025]",
        "backdrop-blur-md",
        "transition-colors",
        "duration-300",
    ].join(" "),
};

export function GlassCard({
    variant = "default",
    className,
    ...props
}: GlassCardProps) {
    return (
        <div
            className={cn(
                "relative rounded-2xl",
                variantClasses[variant],
                className,
            )}
            {...props}
        />
    );
}
