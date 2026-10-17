import { cn } from "@/lib/utils";

interface Props {
    active: boolean;
}

export default function ActiveStatusBadge({ active }: Props) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                active
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-white/10 bg-white/5 text-muted-foreground",
            )}
        >
            {active ? "Active" : "Inactive"}
        </span>
    );
}