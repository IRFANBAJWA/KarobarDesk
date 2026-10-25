import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";
import Select from "./Select";
import { apiFetch } from "@/lib/apiFetch";
import type { User, PriceList } from "../types";

interface Props {
    open: boolean;
    user: User;
    priceLists: PriceList[];
    onClose: () => void;
    onSaved: (updatedUser: User) => void;
}

export default function EditTillDialog({
    open,
    user,
    priceLists,
    onClose,
    onSaved,
}: Props) {
    const [tillNo, setTillNo] = useState<string>("");
    const [priceListId, setPriceListId] = useState("");
    const [shopName, setShopName] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [isOnline, setIsOnline] = useState(false);
    const [allowRate, setAllowRate] = useState(false); // NEW
    const [returnPin, setReturnPin] = useState<string>(""); // NEW

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && user.till_operation) {
            setTillNo(String(user.till_operation.till_no || ""));
            setPriceListId(String(user.till_operation.price_list_id || ""));
            setShopName(user.till_operation.shop_name || "");
            setAddress(user.till_operation.address || "");
            setPhone(user.till_operation.phone || "");
            setIsOnline(user.till_operation.is_online || false);
            setAllowRate(user.till_operation.allow_rate || false);
            // If return_pin is sent from backend, we show it. Otherwise blank.
            setReturnPin(
                user.till_operation.return_pin
                    ? String(user.till_operation.return_pin)
                    : "",
            );
            setError(null);
        }
    }, [open, user]);

    if (!open) return null;

    async function save() {
        if (!tillNo || !priceListId) {
            setError("Till No and Price List are required.");
            return;
        }

        const numTill = Number(tillNo);
        if (numTill < 1 || numTill > 100) {
            setError("Till number must be between 1 and 100.");
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const res = await apiFetch<{ data: User }>(
                `/api/users/${user.id}/till`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        till_no: numTill,
                        price_list_id: Number(priceListId),
                        shop_name: shopName,
                        address,
                        phone,
                        is_online: isOnline,
                        allow_rate: allowRate,
                        return_pin: returnPin ? Number(returnPin) : null,
                    }),
                },
            );
            onSaved(res.data);
            onClose();
        } catch (e: any) {
            setError(e.message || "Failed to update till operation.");
        } finally {
            setSaving(false);
        }
    }

    const content = (
        <>
            <div
                className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                onClick={() => !saving && onClose()}
            />
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950/95 shadow-2xl backdrop-blur-xl">
                    <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">
                                Edit Till Operation
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                User: {user.name}
                            </p>
                        </div>
                        <button
                            onClick={() => !saving && onClose()}
                            className="rounded-lg p-2 hover:bg-white/10"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </header>

                    <div className="max-h-[70vh] overflow-y-auto p-6 space-y-4">
                        {error && (
                            <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="mb-1.5 block text-xs text-muted-foreground">
                                Till Number (1-100)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={tillNo}
                                onChange={(e) => setTillNo(e.target.value)}
                                className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-violet-500/40"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs text-muted-foreground">
                                Warehouse (Locked)
                            </label>
                            <input
                                type="text"
                                value={user.till_operation?.warehouse || "N/A"}
                                disabled
                                className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-muted-foreground outline-none opacity-70 cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs text-muted-foreground">
                                Price List
                            </label>
                            <Select
                                value={priceListId}
                                onChange={setPriceListId}
                                options={[
                                    {
                                        value: "",
                                        label: "Select price list...",
                                    },
                                    ...priceLists.map((pl) => ({
                                        value: String(pl.id),
                                        label: pl.name,
                                    })),
                                ]}
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs text-muted-foreground">
                                Shop Name
                            </label>
                            <input
                                type="text"
                                value={shopName}
                                onChange={(e) => setShopName(e.target.value)}
                                className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-violet-500/40"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1.5 block text-xs text-muted-foreground">
                                    Phone
                                </label>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-violet-500/40"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs text-muted-foreground">
                                    Return PIN (4-digit)
                                </label>
                                <input
                                    type="text"
                                    maxLength={4}
                                    value={returnPin}
                                    onChange={(e) =>
                                        setReturnPin(
                                            e.target.value.replace(/\D/g, ""),
                                        )
                                    }
                                    placeholder="e.g. 1234"
                                    className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-violet-500/40"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs text-muted-foreground">
                                Address
                            </label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-violet-500/40"
                            />
                        </div>

                        <div className="flex flex-col gap-3 pt-2">
                            <label className="inline-flex cursor-pointer items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsOnline(!isOnline)}
                                    className={`relative h-5 w-9 rounded-full transition ${isOnline ? "bg-violet-600" : "bg-white/10"}`}
                                    aria-pressed={isOnline}
                                >
                                    <span
                                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${isOnline ? "left-[18px]" : "left-0.5"}`}
                                    />
                                </button>
                                <span className="text-sm text-foreground">
                                    Handles Online Orders
                                </span>
                            </label>

                            <label className="inline-flex cursor-pointer items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setAllowRate(!allowRate)}
                                    className={`relative h-5 w-9 rounded-full transition ${allowRate ? "bg-violet-600" : "bg-white/10"}`}
                                    aria-pressed={allowRate}
                                >
                                    <span
                                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${allowRate ? "left-[18px]" : "left-0.5"}`}
                                    />
                                </button>
                                <span className="text-sm text-foreground">
                                    Allow Cashier to Change Rate
                                </span>
                            </label>
                        </div>
                    </div>

                    <footer className="flex justify-end gap-2 border-t border-white/10 px-6 py-4">
                        <button
                            onClick={() => !saving && onClose()}
                            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={save}
                            disabled={saving}
                            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
                        >
                            {saving && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            Save Changes
                        </button>
                    </footer>
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
}
