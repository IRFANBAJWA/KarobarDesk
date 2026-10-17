import { useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginToErpNext } from '@/api/sync';
import type { ErpNextCredentials } from '@/types/sync';

interface Props {
  credentials: ErpNextCredentials;
  onChange: (next: ErpNextCredentials) => void;
  onConnected: (token: string, user: string) => void;
}

type ConnectionState =
  | { kind: 'idle' }
  | { kind: 'connecting' }
  | { kind: 'ok'; user: string }
  | { kind: 'error'; message: string };

export function ConnectionCard({
  credentials,
  onChange,
  onConnected,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    kind: 'idle',
  });

  const user = credentials?.username ?? '';
  const pass = credentials?.password ?? '';
  const canConnect = user.trim() !== '' && pass !== '';

  async function handleConnect() {
    setConnectionState({ kind: 'connecting' });
    try {
      const res = await loginToErpNext({
        username: user,
        password: pass,
      });

      if (res.ok && res.token) {
        const displayUser = res.user ?? 'unknown';
        setConnectionState({ kind: 'ok', user: displayUser });
        onConnected(res.token, displayUser);
      } else {
        setConnectionState({
          kind: 'error',
          message: res.error ?? 'Connection failed.',
        });
      }
    } catch (err) {
      setConnectionState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Connection failed.',
      });
    }
  }

  return (
    <GlassCard className="p-6">
      <h2 className="text-sm font-semibold tracking-tight">
        ERPNext Credentials
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Used once per session. Never stored on the server or in the browser.
      </p>

      <div className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              autoComplete="off"
              value={user}
              onChange={(e) =>
                onChange({ ...credentials, username: e.target.value })
              }
              placeholder="administrator"
              className="border-white/10 bg-white/5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="off"
                value={pass}
                onChange={(e) =>
                  onChange({ ...credentials, password: e.target.value })
                }
                placeholder="••••••••"
                className="border-white/10 bg-white/5 pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={!canConnect || connectionState.kind === 'connecting'}
            onClick={handleConnect}
            className="border-white/10"
          >
            {connectionState.kind === 'connecting' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting…
              </>
            ) : (
              'Connect'
            )}
          </Button>

          {connectionState.kind === 'ok' && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Connected as {connectionState.user}
            </span>
          )}

          {connectionState.kind === 'error' && (
            <span className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="h-4 w-4" />
              {connectionState.message}
            </span>
          )}
        </div>
      </div>
    </GlassCard>
  );
}