import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { SyncStepMeta } from "./syncSteps";
import type { SyncStepResult } from "@/types/sync";

interface Props {
    meta: SyncStepMeta;
    result?: SyncStepResult;
    disabled?: boolean;
    onSync: (step: string) => Promise<void>;
}

export function SyncCard({ meta, result, disabled, onSync }: Props) {
    if (!meta) return null;

    const Icon = meta.icon;
    const isLoading = result?.status === "syncing"; // We will pass "syncing" as a status from Setup.tsx
    const isSuccess = result?.status === "ok";
    const isError = result?.status === "failed";

    // Entire card is a button. Disable if already syncing or globally disabled.
    return (
        <button
            onClick={() => !isLoading && !disabled && onSync(meta.step)}
            disabled={disabled || isLoading}
            className="group flex flex-col text-left rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition hover:bg-white/[0.07] disabled:opacity-60 disabled:cursor-not-allowed"
        >
            <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20 transition">
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-foreground">
                        {meta.label}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                        {meta.description}
                    </p>
                </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs">
                {isLoading && (
                    <span className="flex items-center gap-1.5 text-violet-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Syncing...
                    </span>
                )}
                {isSuccess && (
                    <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {result.inserted || 0} in, {result.updated || 0} up
                    </span>
                )}
                {isError && (
                    <span
                        className="flex items-center gap-1 text-red-400 truncate"
                        title={result.error}
                    >
                        <AlertCircle className="h-3.5 w-3.5" />
                        {result.error || "Failed"}
                    </span>
                )}
                {!isLoading && !isSuccess && !isError && (
                    <span className="text-muted-foreground group-hover:text-foreground transition">
                        Not synced
                    </span>
                )}
            </div>
        </button>
    );
}
