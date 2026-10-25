import { useEffect, useState } from "react";
import { CheckCircle2, Save, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Select from "@/modules/users/components/Select";
import {
    listTills,
    getTillAccounts,
    updateTillAccounts,
} from "@/modules/accounts/api";
import { apiFetch } from "@/lib/apiFetch";
import type { Till, TillAccountData } from "@/modules/accounts/types";

// Modal to create a new account
function CreateAccountDialog({
    open,
    onClose,
    onCreated,
    companyId,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
    companyId: number | null;
}) {
    const [name, setName] = useState("");
    const [type, setType] = useState("Cash"); // Default to Cash
    const [saving, setSaving] = useState(false);

    if (!open) return null;

    async function save() {
        if (!companyId) return;
        setSaving(true);
        try {
            // UPDATED URL HERE:
            await apiFetch("/api/till-accounts", {
                method: "POST",
                body: JSON.stringify({
                    name,
                    account_type: type,
                    company_id: companyId,
                }),
            });
            onCreated();
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-950 p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">
                        Create Account
                    </h2>
                    <button onClick={onClose}>
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-xs text-muted-foreground">
                            Account Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Shipping Charges"
                            className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs text-muted-foreground">
                            Type
                        </label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none"
                        >
                            <option value="Cash">Cash</option>
                            <option value="Bank">Bank</option>
                            <option value="Shipping">Shipping</option>
                            <option value="Credit">Credit</option>
                        </select>
                    </div>
                    <Button
                        onClick={save}
                        disabled={saving || !name}
                        className="w-full bg-violet-600 hover:bg-violet-500"
                    >
                        {saving && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}{" "}
                        Create
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function TillAccounts() {
    const [tills, setTills] = useState<Till[]>([]);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [data, setData] = useState<TillAccountData | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);

    useEffect(() => {
        listTills()
            .then((res) => setTills(res.data))
            .catch(console.error);
    }, []);

    const loadData = () => {
        if (selectedUserId) {
            setLoading(true);
            getTillAccounts(Number(selectedUserId))
                .then((res) => setData(res.data))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    };

    useEffect(() => {
        loadData();
    }, [selectedUserId]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(t);
    }, [toast]);

    async function handleSave() {
        if (!data || !selectedUserId) return;
        setSaving(true);
        try {
            await updateTillAccounts(
                Number(selectedUserId),
                data.linked_account_ids,
                data.default_account_id,
            );
            setToast("Till accounts updated successfully.");
        } catch (e) {
            console.error(e);
            setToast("Failed to update accounts.");
        } finally {
            setSaving(false);
        }
    }

    function toggleAccount(id: number) {
        if (!data) return;
        const isLinked = data.linked_account_ids.includes(id);
        const newIds = isLinked
            ? data.linked_account_ids.filter((a) => a !== id)
            : [...data.linked_account_ids, id];

        setData({
            ...data,
            linked_account_ids: newIds,
            default_account_id:
                !isLinked && data.default_account_id === id
                    ? null
                    : data.default_account_id,
        });
    }

    function setDefault(id: number) {
        if (!data) return;
        setData({ ...data, default_account_id: id });
    }

    return (
        <div className="mx-auto max-w-[1200px] space-y-6 p-6">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        Till Accounts
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage which payment accounts are available for each
                        cashier.
                    </p>
                </div>
                <Button
                    onClick={() => setCreateOpen(true)}
                    disabled={!selectedUserId}
                    className="bg-violet-600 hover:bg-violet-500"
                >
                    <Plus className="mr-2 h-4 w-4" /> Create Account
                </Button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl max-w-md">
                <label className="mb-1.5 block text-xs text-muted-foreground">
                    Select Cashier
                </label>
                <Select
                    value={selectedUserId}
                    onChange={setSelectedUserId}
                    options={[
                        { value: "", label: "Select a cashier..." },
                        ...tills.map((t) => ({
                            value: String(t.id),
                            label: `${t.name} (Till ${t.till_no ?? "N/A"})`,
                        })),
                    ]}
                />
            </div>

            {loading && (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin text-violet-500" />{" "}
                    Loading accounts...
                </div>
            )}

            {!loading && data && (
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
                    <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                        <div>
                            <h2 className="text-sm font-medium text-foreground">
                                {data.user.name} — Till {data.till.till_no}
                            </h2>
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-violet-600 hover:bg-violet-500"
                        >
                            {saving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Save Changes
                        </Button>
                    </div>

                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                                <th className="px-6 py-3 font-medium">
                                    Allowed
                                </th>
                                <th className="px-6 py-3 font-medium">
                                    Account Name
                                </th>
                                <th className="px-6 py-3 font-medium">Type</th>
                                <th className="px-6 py-3 text-right font-medium">
                                    Default
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.accounts.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-6 py-8 text-center text-muted-foreground"
                                    >
                                        No cash/bank accounts found. Create one
                                        above.
                                    </td>
                                </tr>
                            ) : (
                                data.accounts.map((account) => {
                                    const isLinked =
                                        data.linked_account_ids.includes(
                                            account.id,
                                        );
                                    const isDefault =
                                        data.default_account_id === account.id;

                                    return (
                                        <tr
                                            key={account.id}
                                            className="border-b border-white/5 hover:bg-white/[0.02]"
                                        >
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={isLinked}
                                                    onChange={() =>
                                                        toggleAccount(
                                                            account.id,
                                                        )
                                                    }
                                                    className="h-4 w-4 accent-violet-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-6 py-4 font-medium text-foreground">
                                                {account.name}
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                {account.account_type || "—"}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() =>
                                                        setDefault(account.id)
                                                    }
                                                    disabled={!isLinked}
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                                                        isDefault
                                                            ? "bg-violet-500/20 text-violet-300"
                                                            : "bg-white/5 text-muted-foreground hover:bg-white/10 disabled:opacity-30"
                                                    }`}
                                                >
                                                    {isDefault ? (
                                                        <>
                                                            <CheckCircle2 className="h-3.5 w-3.5" />{" "}
                                                            Default
                                                        </>
                                                    ) : (
                                                        "Set Default"
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <CreateAccountDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={() => {
                    setToast("Account created successfully.");
                    loadData(); // Reloads the table to show the new account
                }}
                companyId={data?.user?.company_id || null}
            />

            {toast && (
                <div className="fixed bottom-6 right-6 z-[100] rounded-xl border border-white/10 bg-neutral-900/95 px-4 py-3 text-sm shadow-2xl backdrop-blur-xl">
                    {toast}
                </div>
            )}
        </div>
    );
}
