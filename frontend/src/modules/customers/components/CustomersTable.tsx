import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, MoreVertical, Pencil } from "lucide-react";
import ActiveStatusBadge from "@/components/badges/ActiveStatusBadge";
import SyncStatusBadge from "@/components/badges/SyncStatusBadge";
import type { Customer } from "../types";

interface Props {
    customers: Customer[];
    loading: boolean;
    onView: (c: Customer) => void;
    onEdit: (c: Customer) => void;
}

function formatCurrency(v: string | null): string {
    if (v === null || v === undefined || v === "") return "—";
    const n = Number(v);
    if (Number.isNaN(n)) return String(v);
    return n.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

interface RowMenuProps {
    onView: () => void;
    onEdit: () => void;
}

function RowMenu({ onView, onEdit }: RowMenuProps) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number } | null>(
        null,
    );
    const btnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;
        function onDocMouseDown(e: MouseEvent) {
            const target = e.target as Node;
            if (btnRef.current?.contains(target)) return;
            const panel = document.getElementById("row-menu-panel");
            if (panel?.contains(target)) return;
            setOpen(false);
        }
        function onEsc(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", onDocMouseDown);
        document.addEventListener("keydown", onEsc);
        return () => {
            document.removeEventListener("mousedown", onDocMouseDown);
            document.removeEventListener("keydown", onEsc);
        };
    }, [open]);

    function handleToggle(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setCoords({ top: rect.bottom + 6, left: rect.right - 160 });
        }
        setOpen((v) => !v);
    }

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                onClick={handleToggle}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
                aria-label="Row actions"
            >
                <MoreVertical className="h-4 w-4" />
            </button>
            {open &&
                coords &&
                createPortal(
                    <div
                        id="row-menu-panel"
                        style={{
                            top: coords.top,
                            left: coords.left,
                            position: "fixed",
                        }}
                        className="z-[100] w-40 overflow-hidden rounded-xl border border-white/10 bg-neutral-900/95 shadow-2xl backdrop-blur-xl"
                    >
                        <button
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                onView();
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
                        >
                            <Eye className="h-3.5 w-3.5" /> View details
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                onEdit();
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
                        >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                    </div>,
                    document.body,
                )}
        </>
    );
}

export default function CustomersTable({
    customers,
    loading,
    onView,
    onEdit,
}: Props) {
    if (loading) {
        return (
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-medium">Customer</th>
                            <th className="px-6 py-3 font-medium">Phone</th>
                            <th className="px-6 py-3 font-medium">City</th>
                            <th className="px-6 py-3 font-medium">Balance</th>
                            <th className="px-6 py-3 font-medium">Invoices</th>
                            <th className="px-6 py-3 font-medium">Active</th>
                            <th className="px-6 py-3 text-right font-medium">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <tr key={i} className="border-b border-white/5">
                                <td colSpan={7} className="px-6 py-4">
                                    <div className="h-14 animate-pulse rounded-lg border border-white/5 bg-white/[0.02]" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (customers.length === 0) {
        return (
            <div className="overflow-x-auto">
                <div className="py-16 text-center">
                    <p className="text-sm text-foreground">
                        No customers found
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Try adjusting your filters.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                        <th className="px-6 py-3 font-medium">Customer</th>
                        <th className="px-6 py-3 font-medium">Phone</th>
                        <th className="px-6 py-3 font-medium">City</th>
                        <th className="px-6 py-3 font-medium">Balance</th>
                        <th className="px-6 py-3 font-medium">Invoices</th>
                        <th className="px-6 py-3 font-medium">Active</th>
                        <th className="px-6 py-3 text-right font-medium">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {customers.map((c) => (
                        <tr
                            key={c.id}
                            className="border-b border-white/5 transition hover:bg-white/[0.02]"
                        >
                            <td className="px-6 py-4">
                                <div className="font-medium text-foreground">
                                    {c.customer_name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {c.customer_type ?? "Individual"}
                                </div>
                            </td>
                            <td className="px-6 py-4 tabular-nums text-muted-foreground">
                                {c.phone ?? "—"}
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">
                                {c.city ?? "—"}
                            </td>
                            <td className="px-6 py-4 tabular-nums text-foreground">
                                {formatCurrency(c.current_balance)}
                            </td>
                            <td className="px-6 py-4 tabular-nums text-muted-foreground">
                                {c.sales_invoices_count ?? 0}
                            </td>
                            <td className="px-6 py-4">
                                <ActiveStatusBadge active={c.is_active} />
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end">
                                    <RowMenu
                                        onView={() => onView(c)}
                                        onEdit={() => onEdit(c)}
                                    />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
