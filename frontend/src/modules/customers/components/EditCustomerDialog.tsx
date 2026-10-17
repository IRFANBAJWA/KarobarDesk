import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";
import { updateCustomer } from "../api";
import type { Customer, UpdateCustomerPayload } from "../types";

interface Props {
    customer: Customer | null;
    onClose: () => void;
    onSaved: (updated: Customer) => void;
}

interface FormState {
    phone: string;
    email: string;
    address: string;
    city: string;
    country: string;
    tax_number: string;
    is_active: boolean;
}

function toForm(c: Customer): FormState {
    return {
        phone: c.phone ?? "",
        email: c.email ?? "",
        address: c.address ?? "",
        city: c.city ?? "",
        country: c.country ?? "",
        tax_number: c.tax_number ?? "",
        is_active: c.is_active,
    };
}

export default function EditCustomerDialog({
    customer,
    onClose,
    onSaved,
}: Props) {
    const [form, setForm] = useState<FormState | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (customer) {
            setForm(toForm(customer));
            setError(null);
            setFieldErrors({});
        }
    }, [customer]);

    if (!customer || !form) return null;

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((f) => (f ? { ...f, [key]: value } : f));
    }

    async function save() {
        if (!form || !customer) return;
        setSaving(true);
        setError(null);
        setFieldErrors({});

        const payload: UpdateCustomerPayload = {};
        const trimOrNull = (s: string) => (s.trim() === "" ? null : s.trim());

        if (trimOrNull(form.phone) !== customer.phone)
            payload.phone = trimOrNull(form.phone);
        if (trimOrNull(form.email) !== customer.email)
            payload.email = trimOrNull(form.email);
        if (trimOrNull(form.address) !== customer.address)
            payload.address = trimOrNull(form.address);
        if (trimOrNull(form.city) !== customer.city)
            payload.city = trimOrNull(form.city);
        if (trimOrNull(form.country) !== customer.country)
            payload.country = trimOrNull(form.country);
        if (trimOrNull(form.tax_number) !== customer.tax_number)
            payload.tax_number = trimOrNull(form.tax_number);
        if (form.is_active !== customer.is_active)
            payload.is_active = form.is_active;

        if (Object.keys(payload).length === 0) {
            setError("No changes to save.");
            setSaving(false);
            return;
        }

        try {
            const res = await updateCustomer(customer.id, payload);
            onSaved(res.data);
            onClose();
        } catch (e: unknown) {
            const err = e as {
                message?: string;
                errors?: Record<string, string[]>;
            };
            if (err?.errors) {
                const flat: Record<string, string> = {};
                for (const [k, v] of Object.entries(err.errors)) {
                    if (Array.isArray(v) && v.length > 0) flat[k] = v[0];
                }
                setFieldErrors(flat);
                setError("Please fix the highlighted fields.");
            } else {
                setError(err?.message ?? "Failed to save customer.");
            }
        } finally {
            setSaving(false);
        }
    }

    const content = (
        <>
            <div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={() => !saving && onClose()}
                aria-hidden="true"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="flex max-h-[90dvh] w-full max-w-lg flex-col rounded-2xl border border-white/10 bg-neutral-950/95 shadow-2xl backdrop-blur-xl">
                    <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-4">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight">
                                Edit customer
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                {customer.customer_name}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => !saving && onClose()}
                            disabled={saving}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-white/10 hover:text-foreground disabled:opacity-50"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </header>

                    <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar px-6 py-4">
                        {error && (
                            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-xs text-muted-foreground">
                                        Phone
                                    </label>
                                    <input
                                        type="text"
                                        value={form.phone}
                                        onChange={(e) =>
                                            set("phone", e.target.value)
                                        }
                                        className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none transition focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
                                    />
                                    {fieldErrors.phone && (
                                        <p className="mt-1 text-xs text-red-400">
                                            {fieldErrors.phone}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs text-muted-foreground">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) =>
                                            set("email", e.target.value)
                                        }
                                        className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none transition focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
                                    />
                                    {fieldErrors.email && (
                                        <p className="mt-1 text-xs text-red-400">
                                            {fieldErrors.email}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs text-muted-foreground">
                                    Address
                                </label>
                                <textarea
                                    value={form.address}
                                    onChange={(e) =>
                                        set("address", e.target.value)
                                    }
                                    rows={2}
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none transition focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
                                />
                                {fieldErrors.address && (
                                    <p className="mt-1 text-xs text-red-400">
                                        {fieldErrors.address}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-xs text-muted-foreground">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        value={form.city}
                                        onChange={(e) =>
                                            set("city", e.target.value)
                                        }
                                        className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none transition focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
                                    />
                                    {fieldErrors.city && (
                                        <p className="mt-1 text-xs text-red-400">
                                            {fieldErrors.city}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs text-muted-foreground">
                                        Country
                                    </label>
                                    <input
                                        type="text"
                                        value={form.country}
                                        onChange={(e) =>
                                            set("country", e.target.value)
                                        }
                                        className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none transition focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
                                    />
                                    {fieldErrors.country && (
                                        <p className="mt-1 text-xs text-red-400">
                                            {fieldErrors.country}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs text-muted-foreground">
                                    Tax number
                                </label>
                                <input
                                    type="text"
                                    value={form.tax_number}
                                    onChange={(e) =>
                                        set("tax_number", e.target.value)
                                    }
                                    className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none transition focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
                                />
                                {fieldErrors.tax_number && (
                                    <p className="mt-1 text-xs text-red-400">
                                        {fieldErrors.tax_number}
                                    </p>
                                )}
                            </div>

                            <label className="inline-flex cursor-pointer items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        set("is_active", !form.is_active)
                                    }
                                    className={`relative h-5 w-9 rounded-full transition ${form.is_active ? "bg-violet-600" : "bg-white/10"}`}
                                    aria-pressed={form.is_active}
                                >
                                    <span
                                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${form.is_active ? "left-[18px]" : "left-0.5"}`}
                                    />
                                </button>
                                <span className="text-sm text-foreground">
                                    Active
                                </span>
                            </label>
                        </div>
                    </div>

                    <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-white/10 px-6 py-4">
                        <button
                            type="button"
                            onClick={() => !saving && onClose()}
                            disabled={saving}
                            className="inline-flex h-9 items-center rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-foreground disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={save}
                            disabled={saving}
                            className="inline-flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-3 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
                        >
                            {saving && (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            )}{" "}
                            Save changes
                        </button>
                    </footer>
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
}
