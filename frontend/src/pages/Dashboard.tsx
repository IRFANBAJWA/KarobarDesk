import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { GlassCard } from '@/components/glass/GlassCard';

export default function Dashboard() {
  const { user, roles, activeCompany, isSuperAdmin, permissions } = useAuth();
  const displayName = user?.name || user?.username || 'there';

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-6">
      <GlassCard className="w-full max-w-lg space-y-5 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
          <CheckCircle2 className="h-6 w-6 text-white" />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {displayName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSuperAdmin
              ? 'Signed in as Super Admin'
              : activeCompany
                ? `Active company · ${activeCompany.name}`
                : 'No active company'}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {roles.map((r) => (
            <span
              key={r.name}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-muted-foreground"
            >
              {r.label}
            </span>
          ))}
        </div>

        <div className="border-t border-white/5 pt-4">
          <p className="text-xs text-muted-foreground/70">
            Authentication working · {permissions.length} permissions loaded
          </p>
          <p className="mt-1 text-xs text-muted-foreground/50">
            Modules will appear here as they are built.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}