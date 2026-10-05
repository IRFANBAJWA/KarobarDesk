import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ChevronDown, LogOut, Store } from 'lucide-react';

import { useAuth } from '@/auth/useAuth';
import { ThemeToggle } from '@/theme/ThemeToggle';
import { Button } from '@/components/ui/button';

export default function AppLayout() {
  const { user, roles, activeCompany, isSuperAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = user?.name || user?.username || 'User';
  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  async function handleSignOut() {
    setMenuOpen(false);
    await logout();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
              <Store className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              KarobarDesk
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-sm transition hover:bg-white/10"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-[10px] font-semibold text-white">
                  {initials}
                </span>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {user?.username}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-10 z-50 w-64 overflow-hidden rounded-xl border border-white/10 bg-neutral-900/95 shadow-2xl backdrop-blur-xl">
                    <div className="px-4 py-3">
                      <p className="text-sm font-medium">{displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        @{user?.username} · {user?.email}
                      </p>
                    </div>

                    {roles.length > 0 && (
                      <div className="flex flex-wrap gap-1 px-4 pb-3">
                        {roles.map((r) => (
                          <span
                            key={r.name}
                            className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {r.label}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="border-t border-white/5 px-4 py-2 text-xs text-muted-foreground">
                      {isSuperAdmin
                        ? 'Super Admin · all companies'
                        : activeCompany
                          ? `Active · ${activeCompany.name}`
                          : 'No active company'}
                    </div>

                    <div className="border-t border-white/5">
                      <Button
                        variant="ghost"
                        onClick={handleSignOut}
                        className="w-full justify-start rounded-none text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}