import { cn } from '@/lib/utils';
import type { ErpNextLink } from '../types';

interface Props {
  erpnext?: ErpNextLink;
  className?: string;
}

export default function ErpNextBadge({ erpnext, className }: Props) {
  const linked = erpnext?.linked === true;
  const failed = !linked && !!erpnext?.last_error;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
        linked
          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
          : failed
            ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
            : 'border-white/10 bg-white/5 text-muted-foreground',
        className,
      )}
      title={failed ? (erpnext?.last_error ?? undefined) : undefined}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          linked
            ? 'bg-emerald-400'
            : failed
              ? 'bg-amber-400'
              : 'bg-neutral-500',
        )}
      />
      {linked ? 'Linked' : failed ? 'Link failed' : 'Not linked'}
    </span>
  );
}