import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type GlassVariant = 'default' | 'solid' | 'subtle';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: GlassVariant;
}

const variantClasses: Record<GlassVariant, string> = {
  default:
    'bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl',
  solid: 'bg-card border border-border',
  subtle: 'bg-white/[0.03] backdrop-blur-md border border-white/5',
};

export function GlassCard({
  variant = 'default',
  className,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn('rounded-2xl', variantClasses[variant], className)}
      {...props}
    />
  );
}