import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SyncStepMeta } from './syncSteps';
import type { SyncResult } from '@/types/sync';

type CardState =
  | { kind: 'idle' }
  | { kind: 'syncing' }
  | SyncResult;

interface Props {
  meta: SyncStepMeta;
  count: number;
  disabled: boolean;
  state: CardState;
  onSync: () => void;
}

export function SyncCard({ meta, count, disabled, state, onSync }: Props) {
  const Icon = meta.icon;

  const isIdle = 'kind' in state && state.kind === 'idle';
  const isSyncing = 'kind' in state && state.kind === 'syncing';
  const result: SyncResult | null =
    !('kind' in state) ? (state as SyncResult) : null;

  return (
    <button
      type="button"
      disabled={disabled || isSyncing}
      onClick={onSync}
      className={cn(
        'group relative flex flex-col items-start gap-3 rounded-2xl',
        'border border-white/10 bg-white/5 p-5 text-left',
        'backdrop-blur-xl transition',
        'hover:-translate-y-0.5 hover:bg-white/10',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'disabled:hover:translate-y-0 disabled:hover:bg-white/5',
        isSyncing && 'border-violet-500/50 ring-2 ring-violet-500/30',
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-medium">{meta.label}</span>
        </div>
        {isSyncing && (
          <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
        )}
      </div>

      <div className="space-y-1">
        <p className="text-2xl font-semibold tabular-nums">{count}</p>
        <p className="text-xs text-muted-foreground">in DB</p>
      </div>

      <div className="w-full border-t border-white/5 pt-3">
        {isSyncing ? (
          <p className="text-xs text-violet-300">Syncing…</p>
        ) : result?.status === 'ok' ? (
          <p className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            +{result.inserted ?? 0} new
            {result.updated ? ` · ${result.updated} updated` : ''}
            {result.duration_ms ? ` · ${result.duration_ms}ms` : ''}
          </p>
        ) : result?.status === 'failed' ? (
          <p className="flex items-start gap-1.5 text-xs text-red-400">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-2">{result.error ?? 'Failed'}</span>
          </p>
        ) : isIdle ? (
          <p className="text-xs text-muted-foreground group-hover:text-foreground">
            Click to sync
          </p>
        ) : null}
      </div>
    </button>
  );
}