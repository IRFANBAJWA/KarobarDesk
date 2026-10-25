import { useEffect, useState } from "react";
import {
    X,
    Mail,
    User as UserIcon,
    Building2,
    Shield,
    Clock,
    Warehouse,
    Store,
    Tag,
    RefreshCw,
    Unlink,
    Pencil,
    Phone,
    MapPin,
    KeyRound,
    Wifi,
    WifiOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import UserRolesBadges from "./UserRolesBadges";
import UserStatusBadge from "./UserStatusBadge";
import ErpNextBadge from "./ErpNextBadge";
import LinkErpNextDialog from "./LinkErpNextDialog";
import EditTillDialog from "./EditTillDialog";
import * as api from "../api";
import type { User, PriceList } from "../types";

interface Props {
    open: boolean;
    onClose: () => void;
    user: User | null;
    onUserUpdated?: (user: User) => void;
    priceLists?: PriceList[];
    onToast?: (message: string) => void;
}

export default function UserDetailDrawer({
    open,
    onClose,
    user,
    onUserUpdated,
    priceLists = [],
    onToast,
}: Props) {
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [editTillOpen, setEditTillOpen] = useState(false);
    const [current, setCurrent] = useState<User | null>(user);
    const [unlinking, setUnlinking] = useState(false);
    const [unlinkError, setUnlinkError] = useState<string | null>(null);

    useEffect(() => {
        setCurrent(user);
        setUnlinkError(null);
    }, [user]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    if (!open || !current) return null;

    const linked = current.erpnext?.linked === true;
    const failed = !linked && !!current.erpnext?.last_error;
    const till = current.till_operation;

    function handleLinkSuccess(updated: User) {
        setCurrent(updated);
        onUserUpdated?.(updated);
    }

    function handleTillSaved(updated: User) {
        setCurrent(updated);
        onUserUpdated?.(updated);
        setEditTillOpen(false);

        if (onToast) {
            onToast("Till operation updated successfully.");
        }
    }

    async function handleUnlink() {
        if (!current) return;

        const confirmed = window.confirm(
            `Remove ERPNext link for ${current.name}? Their till operation and account assignments will be deleted.`,
        );
        if (!confirmed) return;

        setUnlinkError(null);
        setUnlinking(true);

        try {
            const res = await api.unlinkErpNext(current.id);
            setCurrent(res.data);
            onUserUpdated?.(res.data);
        } catch (err: any) {
            setUnlinkError(err?.message ?? "Unlink failed.");
        } finally {
            setUnlinking(false);
        }
    }

    return (
        <>
            <div className="fixed inset-0 z-50">
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />
                <div className="absolute right-0 top-0 z-10 h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-neutral-950/95 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-start justify-between border-b border-white/10 px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-semibold text-white">
                                {current.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-semibold tracking-tight">
                                    {current.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    @{current.username}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="space-y-6 p-6">
                        <Row
                            icon={<UserIcon className="h-4 w-4" />}
                            label="Status"
                        >
                            <UserStatusBadge isActive={current.is_active} />
                        </Row>

                        <Row icon={<Mail className="h-4 w-4" />} label="Email">
                            <span className="text-sm">{current.email}</span>
                        </Row>

                        <Row
                            icon={<Building2 className="h-4 w-4" />}
                            label="Primary company"
                        >
                            <span className="text-sm">
                                {current.company?.name ?? (
                                    <span className="text-muted-foreground">
                                        —
                                    </span>
                                )}
                            </span>
                        </Row>

                        <Row
                            icon={<Shield className="h-4 w-4" />}
                            label="Roles"
                        >
                            <UserRolesBadges roles={current.roles} max={10} />
                        </Row>

                        <Row
                            icon={<Clock className="h-4 w-4" />}
                            label="Last login"
                        >
                            <span className="text-sm text-muted-foreground">
                                {current.last_login_at
                                    ? new Date(
                                          current.last_login_at,
                                      ).toLocaleString()
                                    : "Never"}
                            </span>
                        </Row>

                        {/* ERPNext link */}
                        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                            <div className="mb-2 flex items-center justify-between">
                                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    ERPNext Link
                                </p>
                                <ErpNextBadge erpnext={current.erpnext} />
                            </div>

                            {linked ? (
                                <>
                                    <p className="text-sm">
                                        Linked as{" "}
                                        <span className="font-medium">
                                            {current.erpnext?.user}
                                        </span>
                                    </p>
                                    {current.erpnext?.last_tested_at && (
                                        <p className="mt-1 text-[11px] text-muted-foreground">
                                            Last tested:{" "}
                                            {new Date(
                                                current.erpnext.last_tested_at,
                                            ).toLocaleString()}
                                        </p>
                                    )}

                                    <div className="mt-3 flex gap-2">
                                        <Button
                                            variant="ghost"
                                            onClick={() =>
                                                setLinkDialogOpen(true)
                                            }
                                            disabled={unlinking}
                                            className="flex-1 border border-white/10 hover:bg-white/5"
                                        >
                                            <RefreshCw className="mr-2 h-3.5 w-3.5" />
                                            Re-link
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={handleUnlink}
                                            disabled={unlinking}
                                            className="flex-1 border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                        >
                                            <Unlink className="mr-2 h-3.5 w-3.5" />
                                            {unlinking
                                                ? "Unlinking..."
                                                : "Unlink"}
                                        </Button>
                                    </div>

                                    {unlinkError && (
                                        <p className="mt-2 text-[11px] text-red-400">
                                            {unlinkError}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <>
                                    {failed ? (
                                        <p className="text-sm text-amber-400">
                                            {current.erpnext?.last_error}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            Not linked to ERPNext yet.
                                        </p>
                                    )}
                                    <Button
                                        onClick={() => setLinkDialogOpen(true)}
                                        className="mt-3 w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500"
                                    >
                                        {failed
                                            ? "Retry linking"
                                            : "Link to ERPNext"}
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Till operation card */}
                        {linked && till && (
                            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Till Operation
                                    </p>
                                    <button
                                        onClick={() => setEditTillOpen(true)}
                                        className="inline-flex h-6 items-center gap-1 rounded bg-violet-500/10 px-2 text-[10px] font-medium text-violet-400 hover:bg-violet-500/20"
                                    >
                                        <Pencil className="h-3 w-3" /> Edit
                                    </button>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <InfoLine
                                        icon={<Store className="h-3.5 w-3.5" />}
                                        label="Shop"
                                        value={till.shop_name}
                                    />
                                    <InfoLine
                                        icon={<Tag className="h-3.5 w-3.5" />}
                                        label="Till no."
                                        value={
                                            till.till_no !== null
                                                ? String(till.till_no)
                                                : null
                                        }
                                    />
                                    <InfoLine
                                        icon={
                                            <Warehouse className="h-3.5 w-3.5" />
                                        }
                                        label="Warehouse"
                                        value={till.warehouse}
                                    />
                                    <InfoLine
                                        icon={<Tag className="h-3.5 w-3.5" />}
                                        label="Price list"
                                        value={
                                            typeof till.price_list ===
                                                "object" &&
                                            till.price_list !== null
                                                ? (till.price_list as any).name
                                                : till.price_list
                                        }
                                    />
                                    <InfoLine
                                        icon={<Phone className="h-3.5 w-3.5" />}
                                        label="Phone"
                                        value={till.phone}
                                    />
                                    <InfoLine
                                        icon={
                                            <MapPin className="h-3.5 w-3.5" />
                                        }
                                        label="Address"
                                        value={till.address}
                                    />
                                    <InfoLine
                                        icon={
                                            <KeyRound className="h-3.5 w-3.5" />
                                        }
                                        label="Return PIN"
                                        value={
                                            till.return_pin !== null
                                                ? String(till.return_pin)
                                                : null
                                        }
                                    />

                                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/5">
                                        <span className="flex items-center gap-1.5 text-muted-foreground">
                                            {till.is_online ? (
                                                <Wifi className="h-3.5 w-3.5" />
                                            ) : (
                                                <WifiOff className="h-3.5 w-3.5" />
                                            )}
                                            <span className="text-[11px] uppercase tracking-wider">
                                                Status
                                            </span>
                                        </span>
                                        <span
                                            className={cn(
                                                "text-xs font-medium",
                                                till.is_online
                                                    ? "text-emerald-400"
                                                    : "text-red-400",
                                            )}
                                        >
                                            {till.is_online
                                                ? "Online"
                                                : "Offline"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="flex items-center gap-1.5 text-muted-foreground">
                                            <Tag className="h-3.5 w-3.5" />
                                            <span className="text-[11px] uppercase tracking-wider">
                                                Allow Rate
                                            </span>
                                        </span>
                                        <span
                                            className={cn(
                                                "text-xs font-medium",
                                                till.allow_rate
                                                    ? "text-emerald-400"
                                                    : "text-muted-foreground",
                                            )}
                                        >
                                            {till.allow_rate
                                                ? "Allowed"
                                                : "Locked"}
                                        </span>
                                    </div>
                                </div>

                                {till.accounts && till.accounts.length > 0 && (
                                    <div className="mt-4 border-t border-white/5 pt-3">
                                        <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                                            Accounts
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {till.accounts.map((a) => (
                                                <span
                                                    key={a.id}
                                                    className={cn(
                                                        "rounded-full border px-2.5 py-0.5 text-[10px]",
                                                        a.is_default
                                                            ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                                                            : "border-white/10 bg-white/5 text-muted-foreground",
                                                    )}
                                                    title={a.erpnext_account}
                                                >
                                                    {a.name}
                                                    {a.is_default &&
                                                        " · default"}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <LinkErpNextDialog
                open={linkDialogOpen}
                onClose={() => setLinkDialogOpen(false)}
                onSuccess={handleLinkSuccess}
                user={current}
            />

            <EditTillDialog
                open={editTillOpen}
                user={current}
                priceLists={priceLists}
                onClose={() => setEditTillOpen(false)}
                onSaved={handleTillSaved}
            />
        </>
    );
}

function Row({
    icon,
    label,
    children,
}: {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground">
                {icon}
            </div>
            <div className="flex-1">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {label}
                </p>
                <div className="mt-1">{children}</div>
            </div>
        </div>
    );
}

function InfoLine({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | null;
}) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-muted-foreground">
                {icon}
                <span className="text-[11px] uppercase tracking-wider">
                    {label}
                </span>
            </span>
            <span className="truncate text-right">{value ?? "—"}</span>
        </div>
    );
}
