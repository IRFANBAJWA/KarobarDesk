import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";
import { updateItem } from "../api";
import type { Item, UpdateItemPayload } from "../types";

interface Props {
    item: Item | null;
    onClose: () => void;
    onSaved: (updated: Item) => void;
}

interface FormState {
    item_name: string;
    alias: string;
    barcode: string;
    description: string;
    item_group: string;
    brand: string;
    weight: string;
    weight_uom: string;
    cost_price: string;
    standard_rate: string;
    tax_rate: string;
    is_taxable: boolean;
    is_active: boolean;
}

function toForm(item: Item): FormState {
    return {
        item_name: item.item_name ?? "",
        alias: item.alias ?? "",
        barcode: item.barcode ?? "",
        description: item.description ?? "",
        item_group: item.item_group ?? "",
        brand: item.brand ?? "",
        weight: item.weight ?? "",
        weight_uom: item.weight_uom ?? "",
        cost_price: item.cost_price ?? "",
        standard_rate: item.standard_rate ?? "",
        tax_rate: item.tax_rate ?? "",
        is_taxable: item.is_taxable,
        is_active: item.is_active,
    };
}

function toPayload(form: FormState, original: Item): UpdateItemPayload {
    const p: UpdateItemPayload = {};

    const trimOrNull = (s: string) => (s.trim() === "" ? null : s.trim());
    const numOrNull = (s: string) => {
        const t = s.trim();
        if (t === "") return null;
        const n = Number(t);
        return Number.isNaN(n) ? null : n;
    };

    if (form.item_name !== original.item_name)
        p.item_name = form.item_name.trim();
    if (trimOrNull(form.alias) !== original.alias)
        p.alias = trimOrNull(form.alias);
    if (trimOrNull(form.barcode) !== original.barcode)
        p.barcode = trimOrNull(form.barcode);
    if (trimOrNull(form.description) !== original.description)
        p.description = trimOrNull(form.description);
    if (trimOrNull(form.item_group) !== original.item_group)
        p.item_group = trimOrNull(form.item_group);
    if (trimOrNull(form.brand) !== original.brand)
        p.brand = trimOrNull(form.brand);

    const origWeight =
        original.weight === null ? null : Number(original.weight);
    if (numOrNull(form.weight) !== origWeight)
        p.weight = numOrNull(form.weight);
    if (trimOrNull(form.weight_uom) !== original.weight_uom)
        p.weight_uom = trimOrNull(form.weight_uom);

    const origCost =
        original.cost_price === null ? null : Number(original.cost_price);
    if (numOrNull(form.cost_price) !== origCost)
        p.cost_price = numOrNull(form.cost_price);
    const origStd =
        original.standard_rate === null ? null : Number(original.standard_rate);
    if (numOrNull(form.standard_rate) !== origStd)
        p.standard_rate = numOrNull(form.standard_rate);
    const origTax =
        original.tax_rate === null ? null : Number(original.tax_rate);
    if (numOrNull(form.tax_rate) !== origTax)
        p.tax_rate = numOrNull(form.tax_rate);

    if (form.is_taxable !== original.is_taxable) p.is_taxable = form.is_taxable;
    if (form.is_active !== original.is_active) p.is_active = form.is_active;

    return p;
}

export default function EditItemDialog({ item, onClose, onSaved }: Props) {
    const [form, setForm] = useState<FormState | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (item) {
            setForm(toForm(item));
            setError(null);
            setFieldErrors({});
        }
    }, [item]);

    useEffect(() => {
        function onEsc(e: KeyboardEvent) {
            if (e.key === "Escape" && !saving) onClose();
        }
        if (item) {
            document.addEventListener("keydown", onEsc);
            return () => document.removeEventListener("keydown", onEsc);
        }
    }, [item, onClose, saving]);

    if (!item || !form) return null;

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((f) => (f ? { ...f, [key]: value } : f));
    }

    async function save() {
        if (!form || !item) return;
        setSaving(true);
        setError(null);
        setFieldErrors({});

        try {
            const payload = toPayload(form, item);

            if (Object.keys(payload).length === 0) {
                setError("No changes to save.");
                setSaving(false);
                return;
            }

            const res = await updateItem(item.id, payload);
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
                setError(err?.message ?? "Failed to save item.");
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
                <div className="flex max-h-[90dvh] w-full max-w-2xl flex-col rounded-2xl border border-white/10 bg-neutral-950/95 shadow-2xl backdrop-blur-xl">
                    <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-4">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight">
                                Edit item
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                {item.erpnext_item_code}
                            </p>
                        </div>
                        <button
                            onClick={() => !saving && onClose()}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-white/10 hover:text-foreground disabled:opacity-50"
                            disabled={saving}
                            aria-label="Close"
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
                            <Field
                                label="Item name"
                                value={form.item_name}
                                onChange={(v) => set("item_name", v)}
                                error={fieldErrors.item_name}
                            />
                            <Field
                                label="Alias"
                                value={form.alias}
                                onChange={(v) => set("alias", v)}
                                error={fieldErrors.alias}
                            />
                            <Field
                                label="Barcode"
                                value={form.barcode}
                                onChange={(v) => set("barcode", v)}
                                error={fieldErrors.barcode}
                            />
                            <Field
                                label="Item group"
                                value={form.item_group}
                                onChange={(v) => set("item_group", v)}
                                error={fieldErrors.item_group}
                            />
                            <Field
                                label="Brand"
                                value={form.brand}
                                onChange={(v) => set("brand", v)}
                                error={fieldErrors.brand}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    label="Weight"
                                    value={form.weight}
                                    onChange={(v) => set("weight", v)}
                                    error={fieldErrors.weight}
                                />
                                <Field
                                    label="Weight UOM"
                                    value={form.weight_uom}
                                    onChange={(v) => set("weight_uom", v)}
                                    error={fieldErrors.weight_uom}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <Field
                                    label="Cost price"
                                    value={form.cost_price}
                                    onChange={(v) => set("cost_price", v)}
                                    error={fieldErrors.cost_price}
                                />
                                <Field
                                    label="Standard rate"
                                    value={form.standard_rate}
                                    onChange={(v) => set("standard_rate", v)}
                                    error={fieldErrors.standard_rate}
                                />
                                <Field
                                    label="Tax rate"
                                    value={form.tax_rate}
                                    onChange={(v) => set("tax_rate", v)}
                                    error={fieldErrors.tax_rate}
                                />
                            </div>

                            <div className="flex items-center gap-6 pt-2">
                                <Toggle
                                    label="Taxable"
                                    value={form.is_taxable}
                                    onChange={(v) => set("is_taxable", v)}
                                />
                                <Toggle
                                    label="Active"
                                    value={form.is_active}
                                    onChange={(v) => set("is_active", v)}
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs text-muted-foreground">
                                    Description
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) =>
                                        set("description", e.target.value)
                                    }
                                    rows={4}
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none transition focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
                                />
                                {fieldErrors.description && (
                                    <p className="mt-1 text-xs text-red-400">
                                        {fieldErrors.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-white/10 px-6 py-4">
                        <button
                            onClick={() => !saving && onClose()}
                            disabled={saving}
                            className="inline-flex h-9 items-center rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-foreground disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={save}
                            disabled={saving}
                            className="inline-flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-3 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
                        >
                            {saving && (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            )}
                            Save changes
                        </button>
                    </footer>
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
}

function Field({
    label,
    value,
    onChange,
    error,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
}) {
    return (
        <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">
                {label}
            </label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none transition focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
            />
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
    );
}

function Toggle({
    label,
    value,
    onChange,
}: {
    label: string;
    value: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <label className="inline-flex cursor-pointer items-center gap-2">
            <button
                type="button"
                onClick={() => onChange(!value)}
                className={`relative h-5 w-9 rounded-full transition ${
                    value ? "bg-violet-600" : "bg-white/10"
                }`}
                aria-pressed={value}
            >
                <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
                        value ? "left-[18px]" : "left-0.5"
                    }`}
                />
            </button>
            <span className="text-sm text-foreground">{label}</span>
        </label>
    );
}
