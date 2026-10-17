import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Eye, Power, PowerOff, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import SyncStatusBadge from "@/components/badges/SyncStatusBadge";
import ActiveStatusBadge from "@/components/badges/ActiveStatusBadge";
import type { Company } from "../types";

interface Props {
    companies: Company[];
    loading: boolean;
    onView: (company: Company) => void;
    onToggleActive: (company: Company) => void;
    togglingId?: number | null;
}

function formatLastSynced(iso: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function CompaniesTable({
    companies,
    loading,
    onView,
    onToggleActive,
    togglingId = null,
}: Props) {
    if (loading) {
        return (
            <div className="space-y-2 p-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-14 animate-pulse rounded-lg border border-white/5 bg-white/[0.02]"
                    />
                ))}
            </div>
        );
    }

    if (companies.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <p className="text-sm font-medium">No companies found</p>
                <p className="text-xs text-muted-foreground">
                    Try adjusting your filters.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                        <th className="px-6 py-3 font-medium">Name</th>
                        <th className="px-6 py-3 font-medium">
                            ERPNext company
                        </th>
                        <th className="px-6 py-3 font-medium">Code</th>
                        <th className="px-6 py-3 text-right font-medium">
                            Users
                        </th>
                        <th className="px-6 py-3 font-medium">Sync status</th>
                        <th className="px-6 py-3 font-medium">Last synced</th>
                        <th className="px-6 py-3 font-medium">Active</th>
                        <th className="px-6 py-3 text-right font-medium">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {companies.map((c) => (
                        <tr
                            key={c.id}
                            className="border-b border-white/5 transition hover:bg-white/[0.02]"
                        >
                            <td className="px-6 py-4 font-medium">{c.name}</td>
                            <td className="px-6 py-4 text-muted-foreground">
                                {c.erpnext_company ?? (
                                    <span className="opacity-40">—</span>
                                )}
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                                {c.code}
                            </td>
                            <td className="px-6 py-4 text-right tabular-nums">
                                {c.users_count}
                            </td>
                            <td className="px-6 py-4">
                                <SyncStatusBadge status={c.sync_status} />
                            </td>
                            <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                                {formatLastSynced(c.last_synced_at)}
                            </td>
                            <td className="px-6 py-4">
                                <ActiveStatusBadge active={c.is_active} />
                            </td>
                            <td className="px-6 py-4 text-right">
                                <RowMenu
                                    company={c}
                                    onView={onView}
                                    onToggleActive={onToggleActive}
                                    toggling={togglingId === c.id}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Row menu — mirrors UsersTable's RowMenu exactly                     */
/* ------------------------------------------------------------------ */

function RowMenu({
    company,
    onView,
    onToggleActive,
    toggling,
}: {
    company: Company;
    onView: (c: Company) => void;
    onToggleActive: (c: Company) => void;
    toggling: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number } | null>(
        null,
    );
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open || !buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        setCoords({
            top: rect.bottom + 6,
            left: rect.right - 160,
        });
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const onDown = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                menuRef.current?.contains(target) ||
                buttonRef.current?.contains(target)
            ) {
                return;
            }
            setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };

        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
                aria-label="Row actions"
            >
                <MoreVertical className="h-4 w-4" />
            </button>

            {open &&
                coords &&
                createPortal(
                    <div
                        ref={menuRef}
                        style={{
                            position: "fixed",
                            top: coords.top,
                            left: coords.left,
                        }}
                        className={cn(
                            "z-[100] w-40 overflow-hidden rounded-xl border border-white/10 bg-neutral-900/95 shadow-2xl backdrop-blur-xl",
                        )}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                onView(company);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
                        >
                            <Eye className="h-3.5 w-3.5" /> View details
                        </button>
                        <button
                            type="button"
                            disabled={toggling}
                            onClick={() => {
                                setOpen(false);
                                onToggleActive(company);
                            }}
                            className={cn(
                                "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition hover:bg-white/5 disabled:opacity-50",
                                company.is_active
                                    ? "text-amber-400 hover:text-amber-300"
                                    : "text-emerald-400 hover:text-emerald-300",
                            )}
                        >
                            {toggling ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />{" "}
                                    Working…
                                </>
                            ) : company.is_active ? (
                                <>
                                    <PowerOff className="h-3.5 w-3.5" />{" "}
                                    Deactivate
                                </>
                            ) : (
                                <>
                                    <Power className="h-3.5 w-3.5" /> Activate
                                </>
                            )}
                        </button>
                    </div>,
                    document.body,
                )}
        </>
    );
}
