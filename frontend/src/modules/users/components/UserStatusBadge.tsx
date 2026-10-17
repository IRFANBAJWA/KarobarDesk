import { cn } from '@/lib/utils';

interface Props {
  isActive: boolean;
  className?: string;
}

export default function UserStatusBadge({ isActive, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
        isActive
          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
          : 'border-white/10 bg-white/5 text-muted-foreground',
        className,
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          isActive ? 'bg-emerald-400' : 'bg-neutral-500',
        )}
      />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}