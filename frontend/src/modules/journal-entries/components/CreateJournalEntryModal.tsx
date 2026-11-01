import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Plus, Trash2 } from "lucide-react";
import Combobox from "@/components/ui/Combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/apiFetch";
import { useAuth } from "@/auth/useAuth";

interface Props {
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateJournalEntryModal({ onClose, onSuccess }: Props) {
    // ⭐ Get roles and isSuperAdmin from Auth
    const {
        activeCompany,
        companies: userCompanies,
        roles,
        isSuperAdmin,
    } = useAuth();

    const [loading, setLoading] = useState(false);
    const [fetchingAccounts, setFetchingAccounts] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ⭐ State for all companies fetched from API
    const [allCompanies, setAllCompanies] = useState<
        { value: string; label: string }[]
    >([]);

    const [accounts, setAccounts] = useState<
        { id: number; name: string; account_type: string }[]
    >([]);

    const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
        activeCompany?.id ? String(activeCompany.id) : "",
    );

    const [postingDate, setPostingDate] = useState(
        new Date().toISOString().split("T")[0],
    );
    const [title, setTitle] = useState("");
    const [userRemark, setUserRemark] = useState("");

    const [lines, setLines] = useState([
        { account_id: "", debit: "", credit: "" },
        { account_id: "", debit: "", credit: "" },
    ]);

    // ⭐ Fetch ALL companies if Super Admin or Admin
    useEffect(() => {
        const isAdminOrSA =
            isSuperAdmin || roles.some((r: any) => r.name === "admin");

        if (isAdminOrSA) {
            apiFetch<any>("/api/companies")
                .then((res) => {
                    const companyData = res.data?.data || res.data || [];
                    setAllCompanies(
                        companyData.map((c: any) => ({
                            value: String(c.id),
                            label: c.name,
                        })),
                    );
                })
                .catch((err) =>
                    console.error("Failed to load all companies", err),
                );
        }
    }, [isSuperAdmin, roles]);

    // ⭐ Determine which companies to show in the dropdown
    // If Admin/SA, use the fetched allCompanies. Otherwise use their assigned userCompanies.
    const isAdminOrSA =
        isSuperAdmin || roles.some((r: any) => r.name === "admin");
    const availableCompanies = isAdminOrSA
        ? allCompanies
        : userCompanies?.map((c) => ({ value: String(c.id), label: c.name })) ||
          [];

    // ⭐ Fetch accounts when company changes
    useEffect(() => {
        if (!selectedCompanyId) return;
        let isMounted = true;
        setFetchingAccounts(true);

        apiFetch<any>(`/api/accounts?company_id=${selectedCompanyId}`)
            .then((res) => {
                if (isMounted) {
                    const fetchedAccounts =
                        res?.data?.data || res?.data || res || [];
                    setAccounts(fetchedAccounts);
                    setLines([
                        { account_id: "", debit: "", credit: "" },
                        { account_id: "", debit: "", credit: "" },
                    ]);
                }
            })
            .catch((err) => {
                if (isMounted) setError("Failed to load accounts.");
            })
            .finally(() => {
                if (isMounted) setFetchingAccounts(false);
            });

        return () => {
            isMounted = false;
        };
    }, [selectedCompanyId]);

    // Calculate Totals
    const totalDebit = lines.reduce(
        (sum, line) => sum + (Number(line.debit) || 0),
        0,
    );
    const totalCredit = lines.reduce(
        (sum, line) => sum + (Number(line.credit) || 0),
        0,
    );
    const isBalanced =
        Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

    const handleLineChange = (index: number, field: string, value: string) => {
        const newLines = [...lines];
        if (field === "debit" || field === "credit") {
            if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;
        }
        if (field === "debit" && value !== "") newLines[index].credit = "";
        if (field === "credit" && value !== "") newLines[index].debit = "";
        newLines[index] = { ...newLines[index], [field]: value };
        setLines(newLines);
    };

    const addLine = () =>
        setLines([...lines, { account_id: "", debit: "", credit: "" }]);
    const removeLine = (index: number) =>
        setLines(lines.filter((_, i) => i !== index));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCompanyId) return setError("Please select a company.");
        if (!isBalanced)
            return setError("Total Debit must equal Total Credit.");

        const validLines = lines.filter(
            (l) => Number(l.debit) > 0 || Number(l.credit) > 0,
        );
        if (validLines.some((l) => !l.account_id)) {
            return setError(
                "Please select an account for all lines with amounts.",
            );
        }

        setLoading(true);
        setError(null);

        try {
            await apiFetch("/api/journal-entries", {
                method: "POST",
                body: JSON.stringify({
                    company_id: Number(selectedCompanyId),
                    posting_date: postingDate,
                    title,
                    user_remark: userRemark,
                    accounts: validLines.map((l) => ({
                        account_id: Number(l.account_id),
                        debit: Number(l.debit) || 0,
                        credit: Number(l.credit) || 0,
                    })),
                }),
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to create entry.");
        } finally {
            setLoading(false);
        }
    };

    const accountOptions = accounts.map((a) => ({
        value: String(a.id),
        label: a.name,
    }));

    const content = (
        <>
            <div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-neutral-950 p-6 shadow-2xl backdrop-blur-xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">
                        Record Journal Entry
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
                        {error}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2 pb-10"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Company</Label>
                            <Combobox
                                options={availableCompanies} // ⭐ Use available companies
                                value={selectedCompanyId}
                                onChange={setSelectedCompanyId}
                                placeholder="Select company..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input
                                type="date"
                                required
                                value={postingDate}
                                onChange={(e) => setPostingDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Entry Title</Label>
                        <Input
                            type="text"
                            required
                            placeholder="e.g. Shop Rent, Expense"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    {fetchingAccounts ? (
                        <div className="h-32 flex flex-col items-center justify-center border border-white/10 rounded-xl bg-white/5">
                            <Loader2 className="h-6 w-6 animate-spin text-violet-500 mb-2" />
                            <span className="text-xs text-muted-foreground">
                                Loading accounts...
                            </span>
                        </div>
                    ) : (
                        <>
                            <div className="mt-6 border border-white/10 rounded-xl overflow-visible">
                                <table className="w-full text-sm">
                                    <thead className="bg-white/5 border-b border-white/10">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[50%]">
                                                Account
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium text-muted-foreground w-[25%]">
                                                Debit (Dr)
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium text-muted-foreground w-[25%]">
                                                Credit (Cr)
                                            </th>
                                            <th className="w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lines.map((line, index) => (
                                            <tr
                                                key={index}
                                                className="border-b border-white/5 last:border-0 relative"
                                            >
                                                <td className="p-2 relative z-10">
                                                    <Combobox
                                                        options={accountOptions}
                                                        value={String(
                                                            line.account_id ||
                                                                "",
                                                        )}
                                                        onChange={(val) =>
                                                            handleLineChange(
                                                                index,
                                                                "account_id",
                                                                val,
                                                            )
                                                        }
                                                        placeholder="Search account..."
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={line.debit}
                                                        onChange={(e) =>
                                                            handleLineChange(
                                                                index,
                                                                "debit",
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="0.00"
                                                        className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-right text-red-400 outline-none transition focus:border-violet-500/40"
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={line.credit}
                                                        onChange={(e) =>
                                                            handleLineChange(
                                                                index,
                                                                "credit",
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="0.00"
                                                        className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-right text-emerald-400 outline-none transition focus:border-violet-500/40"
                                                    />
                                                </td>
                                                <td className="p-2 text-center">
                                                    {lines.length > 2 && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeLine(
                                                                    index,
                                                                )
                                                            }
                                                            className="text-muted-foreground hover:text-red-400"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={addLine}
                                className="mt-2 text-xs h-8"
                            >
                                <Plus className="h-3 w-3 mr-1" /> Add Row
                            </Button>
                        </>
                    )}

                    <div className="space-y-2 mt-4">
                        <Label>Remarks (Optional)</Label>
                        <Input
                            type="text"
                            placeholder="Notes..."
                            value={userRemark}
                            onChange={(e) => setUserRemark(e.target.value)}
                        />
                    </div>
                </form>

                <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-4">
                    <div className="flex justify-between items-center font-bold">
                        <span>Total:</span>
                        <div className="flex gap-8">
                            <span className="text-red-400">
                                Dr {totalDebit.toFixed(2)}
                            </span>
                            <span
                                className={
                                    totalDebit !== totalCredit
                                        ? "text-red-400"
                                        : "text-emerald-400"
                                }
                            >
                                Cr {totalCredit.toFixed(2)}
                            </span>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={
                                loading || fetchingAccounts || !isBalanced
                            }
                            className="bg-violet-600 hover:bg-violet-700 text-white"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Save Entry
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
}
