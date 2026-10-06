import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ConnectionCard } from '@/setup/ConnectionCard';
import { SyncCard } from '@/setup/SyncCard';
import { ActivityPanel } from '@/setup/ActivityPanel';
import { SYNC_STEPS } from '@/setup/syncSteps';
import { GlassCard } from '@/components/glass/GlassCard';
import { Button } from '@/components/ui/button';
import {
  getSyncActivity,
  getSyncStatus,
  runSyncStep,
} from '@/api/sync';
import type {
  ErpNextCredentials,
  SyncActivityRow,
  SyncResult,
  SyncStatusRow,
  SyncStep,
} from '@/types/sync';

type CardState = { kind: 'idle' } | { kind: 'syncing' } | SyncResult;

export default function Setup() {
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState<ErpNextCredentials>({
    username: '',
  password: '',
  });

  const [connectionVerified, setConnectionVerified] = useState(false);
  const [counts, setCounts] = useState<Record<SyncStep, number>>({
    companies: 0,
    accounts: 0,
    price_lists: 0,
    items: 0,
    item_prices: 0,
    customers: 0,
  });
  const [cardStates, setCardStates] = useState<Record<SyncStep, CardState>>({
    companies: { kind: 'idle' },
    accounts: { kind: 'idle' },
    price_lists: { kind: 'idle' },
    items: { kind: 'idle' },
    item_prices: { kind: 'idle' },
    customers: { kind: 'idle' },
  });
  const [activity, setActivity] = useState<SyncActivityRow[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  const refreshStatus = useCallback(async () => {
    try {
      const res = await getSyncStatus();
      const next: Record<SyncStep, number> = {
        companies: 0,
        accounts: 0,
        price_lists: 0,
        items: 0,
        item_prices: 0,
        customers: 0,
      };
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
    setCardStates((s) => ({ ...s, [step]: { kind: 'syncing' } }));
    try {
      const result = await runSyncStep(step, credentials);
      setCardStates((s) => ({ ...s, [step]: result }));
      await refreshStatus();
      await refreshActivity();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Sync failed.';
      setCardStates((s) => ({
        ...s,
        [step]: { step, status: 'failed', error: message },
      }));
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          ⚙ Setup & Sync
        </h1>
        <p className="text-sm text-muted-foreground">
          Pull master data from ERPNext. Credentials are used once and never
          stored.
        </p>
      </header>

      <ConnectionCard
        credentials={credentials}
        onChange={setCredentials}
        onTestSuccess={() => setConnectionVerified(true)}
      />

      <GlassCard className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">
              Master Data
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Click any card to sync just that dataset from ERPNext.
            </p>
          </div>
          {!connectionVerified && (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] text-amber-300">
              Test connection first
            </span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SYNC_STEPS.map((meta) => (
            <SyncCard
              key={meta.step}
              meta={meta}
              count={counts[meta.step]}
              disabled={!connectionVerified}
              state={cardStates[meta.step]}
              onSync={() => handleSync(meta.step)}
            />
          ))}
        </div>
      </GlassCard>

      <ActivityPanel rows={activity} loading={activityLoading} />

      <div className="flex justify-end">
        <Button
          onClick={() => navigate('/')}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
        >
          Continue to dashboard →
        </Button>
      </div>
    </div>
  );
}