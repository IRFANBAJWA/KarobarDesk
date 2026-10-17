import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Modal from './Modal';
import { cn } from '@/lib/utils';
import type { Company, CreateUserPayload, Role } from '../types';
import Select from './Select';
interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateUserPayload) => Promise<void>;
  companies: Company[];
  roles: Role[];
}

interface FormState {
  name: string;
  username: string;
  email: string;
  password: string;
  is_active: boolean;
  company_id: number | '';
  company_access: number[];
  role_names: string[];
}

const EMPTY: FormState = {
  name: '',
  username: '',
  email: '',
  password: '',
  is_active: true,
  company_id: '',
  company_access: [],
  role_names: [],
};

export default function CreateUserDialog({
  open,
  onClose,
  onSubmit,
  companies,
  roles,
}: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setError(null);
      setFieldErrors({});
    }
  }, [open]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleArrayValue(key: 'company_access' | 'role_names', value: number | string) {
    setForm((f) => {
      const current = f[key] as Array<number | string>;
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...f, [key]: next } as FormState;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      const payload: CreateUserPayload = {
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        company_id: Number(form.company_id),
        company_access: form.company_access,
        roles: form.role_names,
        is_active: form.is_active,
      };
      await onSubmit(payload);
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong.');
      if (err?.errors) setFieldErrors(err.errors);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create user"
      description="Add a new user and assign their access."
      className="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500"
          >
            {submitting ? 'Creating...' : 'Create user'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Account */}
        <section className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Account
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name" error={fieldErrors.name}>
              <Input value={form.name} onChange={(e) => update('name', e.target.value)} required />
            </Field>
            <Field label="Username" error={fieldErrors.username}>
              <Input
                value={form.username}
                onChange={(e) => update('username', e.target.value)}
                required
              />
            </Field>
          </div>

          <Field label="Email" error={fieldErrors.email}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              required
            />
          </Field>

          <Field label="Password" error={fieldErrors.password}>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required
              minLength={8}
            />
          </Field>
        </section>

        {/* Access */}
        <section className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Access
          </h3>

       <Field label="Primary company" error={fieldErrors.company_id}>
        <Select
          value={form.company_id}
          onChange={(v) => update('company_id', v)}
          placeholder="Select a company..."
          className="w-full"
          triggerClassName="w-full"
          options={companies.map((c) => ({ value: c.id, label: c.name }))}
        />
      </Field>

          <Field label="Additional company access">
            <CheckboxPills
              options={companies.map((c) => ({ value: c.id, label: c.name }))}
              selected={form.company_access}
              onToggle={(v) => toggleArrayValue('company_access', v)}
            />
          </Field>

          <Field label="Roles" error={fieldErrors.roles}>
            <CheckboxPills
              options={roles.map((r) => ({ value: r.name, label: r.label }))}
              selected={form.role_names}
              onToggle={(v) => toggleArrayValue('role_names', v)}
            />
          </Field>
        </section>

        {/* Status */}
        <section className="space-y-3">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => update('is_active', e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-violet-600"
            />
            Active
          </label>
        </section>
      </form>
    </Modal>
  );
}

// ---- small helpers ----

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {error && error.length > 0 && (
        <p className="text-[11px] text-red-400">{error[0]}</p>
      )}
    </div>
  );
}

function CheckboxPills<T extends string | number>({
  options,
  selected,
  onToggle,
}: {
  options: Array<{ value: T; label: string }>;
  selected: T[];
  onToggle: (value: T) => void;
}) {
  if (options.length === 0) {
    return <p className="text-xs text-muted-foreground">Nothing available.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.value);
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onToggle(opt.value)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition',
              isSelected
                ? 'border-violet-500/40 bg-violet-500/15 text-violet-200'
                : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}