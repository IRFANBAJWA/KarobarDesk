import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";
import { updateItemPrice } from "../api";
import type { ItemPrice, UpdateItemPricePayload } from "../types";

interface Props {
    itemPrice: ItemPrice | null;
    onClose: () => void;
    onSaved: (updated: ItemPrice) => void;
}

interface FormState {
    rate: string;
    pack_rate: string;
    is_active: boolean;
}

function toForm(ip: ItemPrice): FormState {
    return {
        rate: ip.rate ?? "",
        pack_rate: ip.pack_rate ?? "",
        is_active: ip.is_active,
    };
}

function toPayload(
    form: FormState,
    original: ItemPrice,
): UpdateItemPricePayload {
    const p: UpdateItemPricePayload = {};

    const origRate = original.rate === null ? null : Number(original.rate);
    const newRate = form.rate.trim() === "" ? null : Number(form.rate);
    if (newRate !== origRate) {
        if (newRate !== null) p.rate = newRate;
    }

    const origPack =
        original.pack_rate === null ? null : Number(original.pack_rate);
    const newPack =
        form.pack_rate.trim() === "" ? null : Number(form.pack_rate);
    if (newPack !== origPack) {
        p.pack_rate = newPack;
    }

    if (form.is_active !== original.is_active) p.is_active = form.is_active;

    return p;
}

export default function EditItemPriceDialog({
    itemPrice,
    onClose,
    onSaved,
}: Props) {
    const [form, setForm] = useState<FormState | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (itemPrice) {
            setForm(toForm(itemPrice));
            setError(null);
            setFieldErrors({});
        }
    }, [itemPrice]);

    useEffect(() => {
        function onEsc(e: KeyboardEvent) {
            if (e.key === "Escape" && !saving) onClose();
        }
        if (itemPrice) {
            document.addEventListener("keydown", onEsc);
            return () => document.removeEventListener("keydown", onEsc);
        }
    }, [itemPrice, onClose, saving]);

    if (!itemPrice || !form) return null;

    async function save() {
        if (!form || !itemPrice) return;
        setSaving(true);
        setError(null);
        setFieldErrors({});

        try {
            const payload = toPayload(form, itemPrice);
            if (Object.keys(payload).length === 0) {
                setError("No changes to save.");
                setSaving(false);
                return;
            }

            const res = await updateItemPrice(itemPrice.id, payload);
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
                setError(err?.message ?? "Failed to save item price.");
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
                        <div className="min-w-0">
                            <h2 className="truncate text-lg font-semibold tracking-tight">
                                Edit price
                            </h2>
                            <p className="truncate text-xs text-muted-foreground">
                                {itemPrice.item_name ?? "Item"} ·{" "}
                                {itemPrice.price_list_name ?? "Price list"}
                            </p>
                        </div>
                        <button
                            type="button"
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
                            <div>
                                <label className="mb-1.5 block text-xs text-muted-foreground">
                                    Rate <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={form.rate}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            rate: e.target.value,
                                        })
                                    }
                                    className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none transition focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
                                />
                                {fieldErrors.rate && (
                                    <p className="mt-1 text-xs text-red-400">
                                        {fieldErrors.rate}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs text-muted-foreground">
                                    Pack rate
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={form.pack_rate}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            pack_rate: e.target.value,
                                        })
                                    }
                                    placeholder="Optional"
                                    className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none transition focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
                                />
                                {fieldErrors.pack_rate && (
                                    <p className="mt-1 text-xs text-red-400">
                                        {fieldErrors.pack_rate}
                                    </p>
                                )}
                            </div>

                            <label className="inline-flex cursor-pointer items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setForm({
                                            ...form,
                                            is_active: !form.is_active,
                                        })
                                    }
                                    className={`relative h-5 w-9 rounded-full transition ${
                                        form.is_active
                                            ? "bg-violet-600"
                                            : "bg-white/10"
                                    }`}
                                    aria-pressed={form.is_active}
                                >
                                    <span
                                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
                                            form.is_active
                                                ? "left-[18px]"
                                                : "left-0.5"
                                        }`}
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
