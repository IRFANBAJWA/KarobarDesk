import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, MoreVertical } from "lucide-react";
import ActiveStatusBadge from "@/components/badges/ActiveStatusBadge";
import SyncStatusBadge from "@/components/badges/SyncStatusBadge";
import type { PriceList } from "../types";

interface Props {
    priceLists: PriceList[];
    loading: boolean;
    onView: (pl: PriceList) => void;
}

interface RowMenuProps {
    onView: () => void;
}

function RowMenu({ onView }: RowMenuProps) {
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
                    </div>,
                    document.body,
                )}
        </>
    );
}

export default function PriceListsTable({
    priceLists,
    loading,
    onView,
}: Props) {
    if (loading) {
        return (
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-medium">Name</th>
                            <th className="px-6 py-3 font-medium">
                                ERPNext name
                            </th>
                            <th className="px-6 py-3 font-medium">Type</th>
                            <th className="px-6 py-3 font-medium">Items</th>
                            <th className="px-6 py-3 font-medium">Tills</th>
                            <th className="px-6 py-3 font-medium">Sync</th>
                            <th className="px-6 py-3 font-medium">Active</th>
                            <th className="px-6 py-3 text-right font-medium">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <tr key={i} className="border-b border-white/5">
                                <td colSpan={8} className="px-6 py-4">
                                    <div className="h-14 animate-pulse rounded-lg border border-white/5 bg-white/[0.02]" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (priceLists.length === 0) {
        return (
            <div className="overflow-x-auto">
                <div className="py-16 text-center">
                    <p className="text-sm text-foreground">
                        No price lists found
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
                        <th className="px-6 py-3 font-medium">Name</th>
                        <th className="px-6 py-3 font-medium">ERPNext name</th>
                        <th className="px-6 py-3 font-medium">Type</th>
                        <th className="px-6 py-3 font-medium">Items</th>
                        <th className="px-6 py-3 font-medium">Tills</th>
                        <th className="px-6 py-3 font-medium">Sync</th>
                        <th className="px-6 py-3 font-medium">Active</th>
                        <th className="px-6 py-3 text-right font-medium">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {priceLists.map((pl) => (
                        <tr
                            key={pl.id}
                            className="border-b border-white/5 transition hover:bg-white/[0.02]"
                        >
                            <td className="px-6 py-4 font-medium text-foreground">
                                {pl.name}
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">
                                {pl.erpnext_name}
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-xs text-muted-foreground">
                                    {pl.is_selling ? "Selling" : "Buying"}
                                </span>
                            </td>
                            <td className="px-6 py-4 tabular-nums text-muted-foreground">
                                {pl.item_prices_count ?? 0}
                            </td>
                            <td className="px-6 py-4 tabular-nums text-muted-foreground">
                                {pl.till_operations_count ?? 0}
                            </td>
                            <td className="px-6 py-4">
                                <SyncStatusBadge status={pl.sync_status} />
                            </td>
                            <td className="px-6 py-4">
                                <ActiveStatusBadge active={pl.is_active} />
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end">
                                    <RowMenu onView={() => onView(pl)} />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
