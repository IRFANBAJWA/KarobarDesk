import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Eye, Pencil, Power, PowerOff } from "lucide-react";

import { cn } from "@/lib/utils";
import UserRolesBadges from "./UserRolesBadges";
import UserStatusBadge from "./UserStatusBadge";
import type { User } from "../types";
import ErpNextBadge from "./ErpNextBadge";

interface Props {
    users: User[];
    loading: boolean;
    onView: (user: User) => void;
    onEdit: (user: User) => void;
    onToggleActive: (user: User) => void;
}
function isSuperAdminUser(user: User): boolean {
    return (user.roles ?? []).some((r) => r.is_super_admin === true);
}
export default function UsersTable({
    users,
    loading,
    onView,
    onEdit,
    onToggleActive,
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

    if (users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <p className="text-sm font-medium">No users found</p>
                <p className="text-xs text-muted-foreground">
                    Try adjusting your filters, or create a new user.
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
                        <th className="px-6 py-3 font-medium">Company</th>
                        <th className="px-6 py-3 font-medium">Roles</th>
                        <th className="px-6 py-3 font-medium">ERPNext</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 text-right font-medium">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u) => (
                        <tr
                            key={u.id}
                            className="border-b border-white/5 transition hover:bg-white/[0.02]"
                        >
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <span className="font-medium">
                                        {u.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        @{u.username} · {u.email}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">
                                {u.company?.name ?? (
                                    <span className="opacity-40">—</span>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                <UserRolesBadges roles={u.roles} />
                            </td>
                            <td className="px-6 py-4">
                                <ErpNextBadge erpnext={u.erpnext} />
                            </td>
                            <td className="px-6 py-4">
                                <UserStatusBadge isActive={u.is_active} />
                            </td>
                            <td className="px-6 py-4 text-right">
                                {isSuperAdminUser(u) ? (
                                    <span
                                        className="inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-300"
                                        title="Super Admin cannot be edited or deactivated"
                                    >
                                        Protected
                                    </span>
                                ) : (
                                    <RowMenu
                                        user={u}
                                        onView={onView}
                                        onEdit={onEdit}
                                        onToggleActive={onToggleActive}
                                    />
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function RowMenu({
    user,
    onView,
    onEdit,
    onToggleActive,
}: {
    user: User;
    onView: (u: User) => void;
    onEdit: (u: User) => void;
    onToggleActive: (u: User) => void;
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
                                onView(user);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
                        >
                            <Eye className="h-3.5 w-3.5" /> View details
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                onEdit(user);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
                        >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                onToggleActive(user);
                            }}
                            className={cn(
                                "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition hover:bg-white/5",
                                user.is_active
                                    ? "text-amber-400 hover:text-amber-300"
                                    : "text-emerald-400 hover:text-emerald-300",
                            )}
                        >
                            {user.is_active ? (
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
