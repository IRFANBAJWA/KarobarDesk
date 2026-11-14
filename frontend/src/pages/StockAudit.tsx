import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { apiFetch } from "@/lib/apiFetch";
import { useAuth } from "@/auth/useAuth";
import {
    Search,
    ShieldCheck,
    CheckCircle2,
    ArrowLeft,
    Calculator,
    Loader2,
    ChevronDown,
    Check,
    UserCircle,
    Building2,
    AlertTriangle,
    X,
    Save,
    ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ⭐ Custom Dropdown (Reusable)
function CustomDropdown({
    value,
    options,
    onChange,
    disabled,
    widthClass = "w-48",
    icon: Icon,
}: {
    value: string;
    options: { label: string; value: string }[];
    onChange: (val: string) => void;
    disabled: boolean;
    widthClass?: string;
    icon?: any;
}) {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

    const handleOpen = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        if (!open && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
            });
        }
        setOpen(!open);
    };

    const selectedLabel =
        options.find((o) => o.value === value)?.label || value || "Select...";

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                disabled={disabled}
                onClick={handleOpen}
                className={cn(
                    "shrink-0 flex items-center justify-between bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm font-medium text-white focus:outline-none hover:bg-white/5 disabled:opacity-50",
                    widthClass,
                )}
            >
                <div className="flex items-center gap-2 truncate">
                    {Icon && (
                        <Icon className="h-4 w-4 text-violet-400 shrink-0" />
                    )}
                    <span className="capitalize truncate">{selectedLabel}</span>
                </div>
                <ChevronDown className="h-3 w-3 text-slate-400 shrink-0 ml-2" />
            </button>

            {open &&
                createPortal(
                    <>
                        <div
                            className="fixed inset-0 z-[90]"
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpen(false);
                            }}
                        />
                        <div
                            className="fixed z-[100] bg-[#151722] border border-white/10 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto"
                            style={{
                                top: position.top,
                                left: position.left,
                                width: "max-content",
                                minWidth: position.width,
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {options.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChange(opt.value);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        "w-full text-left px-3 py-2 text-sm capitalize hover:bg-white/10 transition-colors flex items-center justify-between gap-4",
                                        value === opt.value
                                            ? "text-violet-400 font-bold bg-white/5"
                                            : "text-slate-300",
                                    )}
                                >
                                    {opt.label}{" "}
                                    {value === opt.value && (
                                        <Check className="h-3 w-3" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </>,
                    document.body,
                )}
        </>
    );
}

export default function StockAudit() {
    const { roles } = useAuth();
    const isSuperAdmin = roles.some((r) => r.name === "super_admin");
    const isManager = roles.some(
        (r) => r.name === "manager" || r.name === "admin" || isSuperAdmin,
    );

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isReviewMode, setIsReviewMode] = useState(false);

    // ⭐ Modal State
    const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
    const [finalizing, setFinalizing] = useState(false);

    const [companies, setCompanies] = useState<any[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
    const [targetUserId, setTargetUserId] = useState<string>("");

    const [saving, setSaving] = useState(false);
    const [areaSelections, setAreaSelections] = useState<
        Record<number, "shop" | "online">
    >({});
    const [localChanges, setLocalChanges] = useState<Record<number, string>>(
        {},
    );

    const [discrepancyReasons, setDiscrepancyReasons] = useState<
        Record<number, { reason: string; decision: string }>
    >({});

    const [toast, setToast] = useState<{
        message: string;
        type: "success" | "error";
    } | null>(null);

    const showToast = (
        message: string,
        type: "success" | "error" = "success",
    ) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        if (isManager) {
            apiFetch("/api/companies").then((res) => {
                const list = res.data || [];
                setCompanies(list);
                if (list.length > 0) setSelectedCompanyId(String(list[0].id));
                else setLoading(false);
            });
        }
    }, [isManager]);

    const fetchAuditData = async () => {
        if (isManager && !selectedCompanyId) return;
        setLoading(true);
        try {
            const url = selectedCompanyId
                ? `/api/stock-audits/today?company_id=${selectedCompanyId}`
                : "/api/stock-audits/today";

            const res = await apiFetch(url);
            setData(res);
        } catch (err: any) {
            console.error("Audit load error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuditData();
    }, [selectedCompanyId]);

    const handleBatchSave = async () => {
        if (Object.keys(localChanges).length === 0) return;
        if (isManager && !targetUserId) {
            showToast("Please select a Salesperson first.", "error");
            return;
        }

        setSaving(true);
        try {
            const payloadCounts = Object.entries(localChanges).map(
                ([itemId, qty]) => ({
                    item_id: Number(itemId),
                    physical_qty: Number(qty),
                    role_area: areaSelections[Number(itemId)] || "shop",
                }),
            );

            await apiFetch("/api/stock-audits/batch-count", {
                method: "POST",
                body: JSON.stringify({
                    counts: payloadCounts,
                    company_id: selectedCompanyId,
                    target_user_id: isManager ? targetUserId : undefined,
                }),
            });

            setLocalChanges({});
            showToast("All counts saved successfully", "success");
            fetchAuditData();
        } catch (err) {
            showToast("Failed to save counts", "error");
        } finally {
            setSaving(false);
        }
    };

    // ⭐ Open the Confirm Modal
    const confirmFinalize = () => {
        setIsFinalizeModalOpen(true);
    };

    // ⭐ Execute Finalize
    const executeFinalize = async () => {
        setFinalizing(true);
        const itemReasons = Object.entries(discrepancyReasons).map(
            ([id, data]) => ({
                id: Number(id),
                discrepancy_reason: data.reason,
                decision: data.decision,
            }),
        );

        try {
            await apiFetch(`/api/stock-audits/${data.audit.id}/finalize`, {
                method: "POST",
                body: JSON.stringify({ items: itemReasons }),
            });
            setIsFinalizeModalOpen(false);
            setIsReviewMode(false);
            fetchAuditData();
            showToast("Audit finalized and locked", "success");
        } catch (err: any) {
            showToast(err.message || "Failed to finalize", "error");
        } finally {
            setFinalizing(false);
        }
    };

    if (loading)
        return (
            <div className="p-8 text-center text-white">Loading Audit...</div>
        );
    if (!data)
        return (
            <div className="p-8 text-center text-red-400">
                Failed to load audit.
            </div>
        );

    const isFinalized = data.audit?.status === "finalized";
    const filteredItems =
        data.items?.filter((item: any) =>
            item.item_name.toLowerCase().includes(search.toLowerCase()),
        ) || [];

    const reviewItems =
        data.items?.map((item: any) => {
            const itemCounts = data.counts.filter((c: any) => {
                const auditItem = c.stock_audit_item || c.stockAuditItem;
                return auditItem?.item_id === item.id;
            });

            const totalPhysical = itemCounts.reduce(
                (sum: number, c: any) => sum + Number(c.physical_qty),
                0,
            );
            const shopCount = itemCounts
                .filter((c: any) => c.role_area === "shop")
                .reduce(
                    (sum: number, c: any) => sum + Number(c.physical_qty),
                    0,
                );
            const onlineCount = itemCounts
                .filter((c: any) => c.role_area === "online")
                .reduce(
                    (sum: number, c: any) => sum + Number(c.physical_qty),
                    0,
                );

            const auditItemRecord =
                itemCounts[0]?.stock_audit_item ||
                itemCounts[0]?.stockAuditItem;

            return {
                ...item,
                shopCount,
                onlineCount,
                totalPhysical,
                system_qty: Number(item.system_qty || 0),
                audit_item_id: auditItemRecord?.id,
                discrepancy_reason: auditItemRecord?.discrepancy_reason,
                decision: auditItemRecord?.decision,
            };
        }) || [];

    const totalDiscrepancies = reviewItems.filter(
        (i: any) => i.totalPhysical - i.system_qty !== 0,
    ).length;

    return (
        <div className="mx-auto max-w-[1400px] p-6 space-y-6 pb-24">
            {/* TOAST */}
            {toast && (
                <div
                    className={cn(
                        "fixed bottom-6 right-6 z-[200] flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-2xl backdrop-blur-md animate-fade-in-up",
                        toast.type === "success"
                            ? "bg-emerald-500/90 border border-emerald-400"
                            : "bg-red-500/90 border border-red-400",
                    )}
                >
                    {toast.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4" />
                    ) : (
                        <AlertTriangle className="h-4 w-4" />
                    )}
                    {toast.message}
                    <button
                        onClick={() => setToast(null)}
                        className="ml-2 hover:opacity-75"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}

            {/* HEADER */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-violet-400" />{" "}
                        Daily Stock Audit
                    </h1>
                    <p className="text-sm text-slate-400">
                        Date: {data.today} | Status:{" "}
                        <span className="uppercase text-violet-400 font-bold">
                            {data.audit.status}
                        </span>
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {isManager && companies.length > 0 && (
                        <CustomDropdown
                            value={selectedCompanyId}
                            options={companies.map((c) => ({
                                label: c.name,
                                value: String(c.id),
                            }))}
                            onChange={(val) => setSelectedCompanyId(val)}
                            disabled={isFinalized}
                            icon={Building2}
                        />
                    )}

                    {isManager && data.salespersons?.length > 0 && (
                        <div className="relative">
                            <CustomDropdown
                                value={targetUserId}
                                options={data.salespersons.map((s: any) => ({
                                    label: s.name,
                                    value: String(s.id),
                                }))}
                                onChange={(val) => setTargetUserId(val)}
                                disabled={isFinalized}
                                icon={UserCircle}
                            />
                            {!targetUserId && (
                                <span className="absolute -bottom-5 left-0 text-[10px] font-bold text-amber-400 flex items-center gap-1 animate-pulse">
                                    <AlertTriangle className="h-3 w-3" /> Select
                                    a user
                                </span>
                            )}
                        </div>
                    )}

                    {isManager &&
                        (isReviewMode ? (
                            <button
                                onClick={() => setIsReviewMode(false)}
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition mt-4 xl:mt-0"
                            >
                                <ArrowLeft className="h-4 w-4" /> Back
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    fetchAuditData();
                                    setIsReviewMode(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition mt-4 xl:mt-0"
                            >
                                <Calculator className="h-4 w-4" /> Review
                            </button>
                        ))}
                    {isManager && isReviewMode && !isFinalized && (
                        <button
                            onClick={confirmFinalize}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition mt-4 xl:mt-0"
                        >
                            <ShieldAlert className="h-4 w-4" /> Finalize
                        </button>
                    )}
                </div>
            </div>

            {isFinalized && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 flex items-center gap-2 text-sm font-bold">
                    <CheckCircle2 className="h-5 w-5" /> This audit has been
                    finalized and locked.
                </div>
            )}

            {/* REVIEW MODE */}
            {isReviewMode ? (
                <div className="glass-panel overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/10 bg-white/[0.02]">
                            <tr>
                                <th className="px-6 py-4">Item Name</th>
                                <th className="px-6 py-4 text-center">
                                    System Qty
                                </th>
                                <th className="px-6 py-4 text-center">
                                    Shop Count
                                </th>
                                <th className="px-6 py-4 text-center">
                                    Online Count
                                </th>
                                <th className="px-6 py-4 text-center">
                                    Total Physical
                                </th>
                                <th className="px-6 py-4 text-center">
                                    Difference
                                </th>
                                <th className="px-6 py-4 text-left w-1/4">
                                    Discrepancy Reason
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {reviewItems.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="p-12 text-center text-slate-400"
                                    >
                                        <CheckCircle2 className="h-8 w-8 mx-auto mb-3 opacity-20" />
                                        <p className="text-lg font-medium text-white">
                                            No items to review
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                reviewItems.map((item: any) => {
                                    const diff =
                                        item.totalPhysical - item.system_qty;
                                    return (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-white/[0.02]"
                                        >
                                            <td className="px-6 py-4 font-medium text-white">
                                                {item.item_name}
                                            </td>
                                            <td className="px-6 py-4 text-center text-slate-300">
                                                {item.system_qty}
                                            </td>
                                            <td className="px-6 py-4 text-center text-blue-400 font-medium">
                                                {item.shopCount || "-"}
                                            </td>
                                            <td className="px-6 py-4 text-center text-orange-400 font-medium">
                                                {item.onlineCount || "-"}
                                            </td>
                                            <td className="px-6 py-4 text-center text-emerald-400 font-bold">
                                                {item.totalPhysical || "-"}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {item.totalPhysical > 0 ? (
                                                    <span
                                                        className={cn(
                                                            "px-2.5 py-1 rounded-md text-xs font-bold",
                                                            diff === 0
                                                                ? "bg-emerald-500/10 text-emerald-400"
                                                                : "bg-red-500/10 text-red-400",
                                                        )}
                                                    >
                                                        {diff > 0
                                                            ? `+${diff}`
                                                            : diff}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-600">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {diff !== 0 && !isFinalized && (
                                                    <input
                                                        type="text"
                                                        placeholder="Enter reason..."
                                                        value={
                                                            discrepancyReasons[
                                                                item
                                                                    .audit_item_id
                                                            ]?.reason || ""
                                                        }
                                                        onChange={(e) => {
                                                            setDiscrepancyReasons(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    [item.audit_item_id]:
                                                                        {
                                                                            ...prev[
                                                                                item
                                                                                    .audit_item_id
                                                                            ],
                                                                            reason: e
                                                                                .target
                                                                                .value,
                                                                            decision:
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                                    ? "adjusted"
                                                                                    : "",
                                                                        },
                                                                }),
                                                            );
                                                        }}
                                                        className="w-full bg-[#0a0a0f] border border-red-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                                                    />
                                                )}
                                                {isFinalized && (
                                                    <span className="text-sm text-slate-300">
                                                        {item.discrepancy_reason ||
                                                            "-"}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* COUNTING MODE ... */
                <div className="space-y-6 relative">
                    {isManager && !targetUserId && (
                        <div className="absolute inset-0 z-20 bg-[#0a0a0f]/50 backdrop-blur-sm cursor-not-allowed rounded-2xl" />
                    )}

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search item to count..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-violet-500/50"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredItems.map((item: any) => {
                            const itemCounts = data.counts.filter((c: any) => {
                                const auditItem =
                                    c.stock_audit_item || c.stockAuditItem;
                                return (
                                    auditItem?.item_id === item.id &&
                                    (!isManager ||
                                        c.user_id === Number(targetUserId))
                                );
                            });
                            const totalCount = itemCounts.reduce(
                                (sum: number, c: any) =>
                                    sum + Number(c.physical_qty),
                                0,
                            );

                            const currentArea =
                                areaSelections[item.id] || "shop";
                            const inputValue =
                                localChanges[item.id] !== undefined
                                    ? localChanges[item.id]
                                    : totalCount > 0
                                      ? totalCount.toString()
                                      : "";
                            const hasUnsavedChange =
                                localChanges[item.id] !== undefined;

                            return (
                                <div
                                    key={item.id}
                                    className={cn(
                                        "glass-panel p-4 flex flex-col gap-3 transition-colors",
                                        hasUnsavedChange
                                            ? "border-violet-500/50 bg-violet-500/5"
                                            : "",
                                    )}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-white">
                                                {item.item_name}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {item.erpnext_item_code}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 items-center">
                                        <CustomDropdown
                                            value={currentArea}
                                            options={[
                                                {
                                                    label: "Shop",
                                                    value: "shop",
                                                },
                                                {
                                                    label: "Online",
                                                    value: "online",
                                                },
                                            ]}
                                            disabled={isFinalized || saving}
                                            onChange={(val) =>
                                                setAreaSelections((prev) => ({
                                                    ...prev,
                                                    [item.id]: val as
                                                        | "shop"
                                                        | "online",
                                                }))
                                            }
                                            widthClass="w-24"
                                        />

                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            value={inputValue}
                                            disabled={isFinalized || saving}
                                            onChange={(e) =>
                                                setLocalChanges((prev) => ({
                                                    ...prev,
                                                    [item.id]: e.target.value,
                                                }))
                                            }
                                            className="flex-1 bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-violet-500/50 tabular-nums"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ⭐ STICKY BATCH SAVE BUTTON ⭐ */}
            {!isReviewMode && Object.keys(localChanges).length > 0 && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[150] animate-fade-in-up">
                    <button
                        onClick={handleBatchSave}
                        disabled={saving}
                        className="group relative flex items-center gap-3 rounded-full bg-[#18181b]/90 px-8 py-4 text-sm font-bold text-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-[#27272a]/90 disabled:opacity-50 border border-white/10"
                    >
                        <div className="absolute inset-0 rounded-full border border-violet-500/50 group-hover:border-violet-400 transition-colors" />
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                        <div className="absolute inset-0 rounded-full bg-violet-600/20 blur-md group-hover:bg-violet-600/40 transition-all -z-10" />

                        {saving ? (
                            <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                        ) : (
                            <Save className="h-5 w-5 text-violet-400 group-hover:scale-110 transition-transform" />
                        )}
                        <span className="relative z-10 tracking-wide">
                            {saving
                                ? "Saving..."
                                : `Save ${Object.keys(localChanges).length} Changes`}
                        </span>
                        {!saving && (
                            <span className="relative flex h-2.5 w-2.5 ml-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500"></span>
                            </span>
                        )}
                    </button>
                </div>
            )}

            {/* ⭐ FINALIZE CONFIRMATION MODAL ⭐ */}
            {isFinalizeModalOpen &&
                createPortal(
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-[#151722] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 mx-auto mb-4">
                                <ShieldAlert className="h-6 w-6 text-amber-400" />
                            </div>

                            <h2 className="text-xl font-bold text-white text-center mb-2">
                                Finalize Audit?
                            </h2>
                            <p className="text-sm text-slate-400 text-center mb-6">
                                You are about to finalize this stock audit. Once
                                locked,{" "}
                                <strong className="text-white">
                                    no one can edit
                                </strong>{" "}
                                these counts or reasons.
                            </p>

                            {totalDiscrepancies > 0 && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                                    <p className="text-sm text-red-400 font-medium text-center">
                                        There are{" "}
                                        <strong className="text-white">
                                            {totalDiscrepancies}
                                        </strong>{" "}
                                        items with discrepancies. Ensure you
                                        have entered reasons for all of them.
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() =>
                                        setIsFinalizeModalOpen(false)
                                    }
                                    className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-300 text-sm font-bold hover:bg-white/10 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeFinalize}
                                    disabled={finalizing}
                                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition flex items-center justify-center gap-2"
                                >
                                    {finalizing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="h-4 w-4" />
                                    )}
                                    {finalizing
                                        ? "Locking..."
                                        : "Yes, Finalize"}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}
