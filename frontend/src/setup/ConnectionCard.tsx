import { useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { testErpNextConnection } from '@/api/sync';
import type { ErpNextCredentials } from '@/types/sync';

interface Props {
  credentials: ErpNextCredentials;
  onChange: (next: ErpNextCredentials) => void;
  onTestSuccess: () => void;
}

type TestState =
  | { kind: 'idle' }
  | { kind: 'testing' }
  | { kind: 'ok'; user: string }
  | { kind: 'error'; message: string };

export function ConnectionCard({ credentials, onChange, onTestSuccess }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [testState, setTestState] = useState<TestState>({ kind: 'idle' });

  const user = credentials?.username ?? '';
  const pass = credentials?.password ?? '';

  const canTest = user.trim() !== '' && pass !== '';

  async function handleTest() {
    setTestState({ kind: 'testing' });
    try {
      const res = await testErpNextConnection({
        username: user,
        password: pass,
      });
      if (res.ok) {
        setTestState({ kind: 'ok', user: res.user ?? 'unknown' });
        onTestSuccess();
      } else {
        setTestState({
          kind: 'error',
          message: res.error ?? 'Connection failed.',
        });
      }
    } catch (err) {
      setTestState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Connection failed.',
      });
    }
  }

  return (
    <GlassCard className="p-6">
      <h2 className="text-sm font-semibold tracking-tight">ERPNext Credentials</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Used once per request and never stored.
      </p>

      <div className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
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
                name="password"
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
            disabled={!canTest || testState.kind === 'testing'}
            onClick={handleTest}
            className="border-white/10"
          >
            {testState.kind === 'testing' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing…
              </>
            ) : (
              'Test connection'
            )}
          </Button>

          {testState.kind === 'ok' && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Connected as {testState.user}
            </span>
          )}

          {testState.kind === 'error' && (
            <span className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="h-4 w-4" />
              {testState.message}
            </span>
          )}
        </div>
      </div>
    </GlassCard>
  );
}