import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import type { SyncActivityRow } from '@/types/sync';

interface Props {
  rows: SyncActivityRow[];
  loading?: boolean;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function ActivityPanel({ rows, loading }: Props) {
  return (
    <GlassCard className="p-6">
      <h2 className="text-sm font-semibold tracking-tight">Recent Activity</h2>

      {loading ? (
        <p className="mt-3 text-xs text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          No sync activity yet.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((row) => {
            const ok = row.status === 'ok';
            return (
              <li
                key={row.id}
                className="flex items-center justify-between border-b border-white/5 pb-2 last:border-b-0 last:pb-0"
              >
                <div className="flex items-center gap-2">
                  {ok ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                  )}
                  <span className="text-xs font-medium capitalize">
                    {row.doctype.replace(/_/g, ' ')}
                  </span>
                  {!ok && row.error && (
                    <span className="text-[10px] text-red-400">
                      · {row.error.slice(0, 40)}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {timeAgo(row.created_at)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </GlassCard>
  );
}