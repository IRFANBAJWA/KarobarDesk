import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ConnectionCard } from "@/setup/ConnectionCard";
import { SyncCard } from "@/setup/SyncCard";
import { ActivityPanel } from "@/setup/ActivityPanel";
import { SYNC_STEPS } from "@/setup/syncSteps";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { getSyncActivity, getSyncStatus, syncStep } from "@/api/sync";
import type {
    ErpNextCredentials,
    SyncActivityRow,
    SyncResult,
    SyncStatusRow,
    SyncStep,
} from "@/types/sync";

type CardState = { kind: "idle" } | { kind: "syncing" } | SyncResult;

const EMPTY_CREDENTIALS: ErpNextCredentials = { username: "", password: "" };

// 1. Added item_stocks to ZERO_COUNTS
const ZERO_COUNTS: Record<SyncStep, number> = {
    companies: 0,
    accounts: 0,
    price_lists: 0,
    items: 0,
    item_prices: 0,
    item_stocks: 0,
    customers: 0,
};

// 2. Added item_stocks to IDLE_STATES
const IDLE_STATES: Record<SyncStep, CardState> = {
    companies: { kind: "idle" },
    accounts: { kind: "idle" },
    price_lists: { kind: "idle" },
    items: { kind: "idle" },
    item_prices: { kind: "idle" },
    item_stocks: { kind: "idle" },
    customers: { kind: "idle" },
};

export default function Setup() {
    const navigate = useNavigate();

    const [credentials, setCredentials] =
        useState<ErpNextCredentials>(EMPTY_CREDENTIALS);
    const [erpnextToken, setErpnextToken] = useState<string | null>(null);
    const [connectedUser, setConnectedUser] = useState<string | null>(null);
    const [counts, setCounts] = useState<Record<SyncStep, number>>(ZERO_COUNTS);
    const [cardStates, setCardStates] =
        useState<Record<SyncStep, CardState>>(IDLE_STATES);
    const [activity, setActivity] = useState<SyncActivityRow[]>([]);
    const [activityLoading, setActivityLoading] = useState(true);

    const refreshStatus = useCallback(async () => {
        try {
            const res = await getSyncStatus();
            const next: Record<SyncStep, number> = { ...ZERO_COUNTS };
            res.steps.forEach((row: SyncStatusRow) => {
                next[row.step] = row.count;
            });
            setCounts(next);
        } catch {
            // ignore
        }
    }, []);

    const refreshActivity = useCallback(async () => {
        try {
            const rows = await getSyncActivity();
            setActivity(rows);
        } catch {
            // ignore
        } finally {
            setActivityLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            await refreshStatus();
            if (cancelled) return;
            await refreshActivity();
        })();
        return () => {
            cancelled = true;
        };
    }, [refreshStatus, refreshActivity]);

    async function handleSync(step: SyncStep) {
        if (!erpnextToken) return;

        setCardStates((s) => ({ ...s, [step]: { kind: "syncing" } }));
        try {
            const result = await syncStep(step, erpnextToken);
            setCardStates((s) => ({ ...s, [step]: result }));
            await refreshStatus();
            await refreshActivity();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Sync failed.";
            setCardStates((s) => ({
                ...s,
                [step]: { step, status: "failed", error: message },
            }));
        }
    }

    const isConnected = erpnextToken !== null;

    return (
        <div className="mx-auto max-w-[1200px] space-y-6 p-6">
            <header className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                    ⚙ Setup &amp; Sync
                </h1>
                <p className="text-sm text-muted-foreground">
                    Pull master data from ERPNext. Credentials are used once and
                    never stored.
                </p>
            </header>

            <ConnectionCard
                credentials={credentials}
                onChange={setCredentials}
                onConnected={(token, user) => {
                    setErpnextToken(token);
                    setConnectedUser(user);
                }}
            />

            <GlassCard className="p-6">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-semibold tracking-tight">
                            Master Data
                        </h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Click any card to sync just that dataset from
                            ERPNext.
                        </p>
                    </div>
                    {!isConnected && (
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] text-amber-300">
                            Connect to ERPNext first
                        </span>
                    )}
                    {isConnected && connectedUser && (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] text-emerald-300">
                            Connected · {connectedUser}
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {SYNC_STEPS.map((meta) => (
                        <SyncCard
                            key={meta.step}
                            meta={meta}
                            // 3. Use cardStates instead of the undefined 'results'
                            result={
                                cardStates[meta.step]?.kind === "idle" ||
                                cardStates[meta.step]?.kind === "syncing"
                                    ? undefined
                                    : cardStates[meta.step]
                            }
                            // 4. Disable if not connected OR if this specific card is syncing
                            disabled={
                                !isConnected ||
                                cardStates[meta.step]?.kind === "syncing"
                            }
                            // 5. Call the handleSync function we defined
                            onSync={handleSync}
                        />
                    ))}
                </div>
            </GlassCard>

            <ActivityPanel rows={activity} loading={activityLoading} />

            <div className="flex justify-end">
                <Button
                    onClick={() => navigate("/")}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
                >
                    Continue to dashboard →
                </Button>
            </div>
        </div>
    );
}
