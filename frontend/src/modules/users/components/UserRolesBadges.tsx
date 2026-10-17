import type { Role } from '../types';
import { cn } from '@/lib/utils';

interface Props {
  roles: Role[] | undefined;
  max?: number;
  className?: string;
}

export default function UserRolesBadges({ roles, max = 3, className }: Props) {
  if (!roles || roles.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const visible = roles.slice(0, max);
  const overflow = roles.length - visible.length;

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {visible.map((r) => (
        <span
          key={r.id}
          className={cn(
            'rounded-full border px-2 py-0.5 text-[10px]',
            r.is_super_admin
              ? 'border-violet-500/30 bg-violet-500/10 text-violet-300'
              : 'border-white/10 bg-white/5 text-muted-foreground',
          )}
        >
          {r.label}
        </span>
      ))}
      {overflow > 0 && (
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
          +{overflow}
        </span>
      )}
    </div>
  );
}