import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";
import Combobox from "@/components/ui/Combobox";
import { createItemPrice } from "../api";
import type { CreateItemPricePayload, ItemPrice } from "../types";

interface Props {
    open: boolean;
    priceLists: { id: number; name: string }[];
    items: { id: number; name: string; code?: string }[];
    defaultPriceListId?: string;
    defaultItemId?: string;
    onClose: () => void;
    onCreated: (created: ItemPrice) => void;
}

export default function CreateItemPriceDialog({
    open,
    priceLists,
    items,
    defaultPriceListId,
    defaultItemId,
    onClose,
    onCreated,
}: Props) {
    const [priceListId, setPriceListId] = useState<string>("");
    const [itemId, setItemId] = useState<string>("");
    const [rate, setRate] = useState<string>("");
    const [packRate, setPackRate] = useState<string>("");
    const [isActive, setIsActive] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            // Use defaults if provided (from Unpriced modal), otherwise clear
            setPriceListId(defaultPriceListId || "");
            setItemId(defaultItemId || "");
            setRate("");
            setPackRate("");
            setIsActive(true);
            setError(null);
            setFieldErrors({});
        }
    }, [open, defaultPriceListId, defaultItemId]);

    useEffect(() => {
        function onEsc(e: KeyboardEvent) {
            if (e.key === "Escape" && !saving) onClose();
        }
        if (open) {
            document.addEventListener("keydown", onEsc);
            return () => document.removeEventListener("keydown", onEsc);
        }
    }, [open, onClose, saving]);

    if (!open) return null;

    async function save() {
        setSaving(true);
        setError(null);
        setFieldErrors({});

        if (!priceListId) {
            setFieldErrors({ price_list_id: "Price list is required." });
            setSaving(false);
            return;
        }
        if (!itemId) {
            setFieldErrors({ item_id: "Item is required." });
            setSaving(false);
            return;
        }
        if (rate.trim() === "") {
            setFieldErrors({ rate: "Rate is required." });
            setSaving(false);
            return;
        }

        const payload: CreateItemPricePayload = {
            price_list_id: Number(priceListId),
            item_id: Number(itemId),
            rate: Number(rate),
            pack_rate: packRate.trim() === "" ? null : Number(packRate),
            is_active: isActive,
        };

        try {
            const res = await createItemPrice(payload);
            onCreated(res.data);
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
                setError(err?.message ?? "Failed to create item price.");
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
                                Add item price
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Set a rate for an item on a price list.
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
                                    Price list{" "}
                                    <span className="text-red-400">*</span>
                                </label>
                                <Combobox
                                    value={priceListId}
                                    onChange={setPriceListId}
                                    placeholder="Select price list..."
                                    searchPlaceholder="Search price lists..."
                                    options={priceLists.map((pl) => ({
                                        value: String(pl.id),
                                        label: pl.name,
                                    }))}
                                />
                                {fieldErrors.price_list_id && (
                                    <p className="mt-1 text-xs text-red-400">
                                        {fieldErrors.price_list_id}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs text-muted-foreground">
                                    Item <span className="text-red-400">*</span>
                                </label>
                                <Combobox
                                    value={itemId}
                                    onChange={setItemId}
                                    placeholder="Select item..."
                                    searchPlaceholder="Search by name or code..."
                                    options={items.map((it) => ({
                                        value: String(it.id),
                                        label: it.name,
                                        sublabel: it.code,
                                    }))}
                                />
                                {fieldErrors.item_id && (
                                    <p className="mt-1 text-xs text-red-400">
                                        {fieldErrors.item_id}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-xs text-muted-foreground">
                                        Rate{" "}
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={rate}
                                        onChange={(e) =>
                                            setRate(e.target.value)
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
                                        value={packRate}
                                        onChange={(e) =>
                                            setPackRate(e.target.value)
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
                            </div>

                            <label className="inline-flex cursor-pointer items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsActive(!isActive)}
                                    className={`relative h-5 w-9 rounded-full transition ${
                                        isActive
                                            ? "bg-violet-600"
                                            : "bg-white/10"
                                    }`}
                                    aria-pressed={isActive}
                                >
                                    <span
                                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
                                            isActive
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
                            Create
                        </button>
                    </footer>
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
}
