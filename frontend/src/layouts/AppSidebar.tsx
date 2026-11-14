import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    UsersRound,
    ChevronLeft,
    ChevronRight,
    Building2,
    Package,
    Tags,
    DollarSign,
    Warehouse,
    CreditCard,
    Receipt,
    Activity,
    Clock,
    CalendarDays,
    FileText,
    Store,
    X,
    ShieldCheck,
    History as HistoryIcon,
} from "lucide-react";

import { useAuth } from "@/auth/useAuth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Users", icon: Users, path: "/users", roles: ["super_admin"] },
    {
        label: "Companies",
        icon: Building2,
        path: "/companies",
        roles: ["super_admin"],
    },
    {
        label: "Items",
        icon: Package,
        path: "/items",
        roles: ["super_admin", "admin", "manager"],
    },
    {
        label: "Price Lists",
        icon: Tags,
        path: "/price-lists",
        roles: ["super_admin"],
    },
    {
        label: "Item Prices",
        icon: DollarSign,
        path: "/item-prices",
        roles: ["super_admin", "admin"],
    },
    {
        label: "Sales",
        icon: Receipt,
        path: "/sales",
        roles: ["super_admin", "admin", "manager"],
    },
    { label: "Customers", icon: UsersRound, path: "/customers" },
    {
        label: "Stock",
        icon: Warehouse,
        path: "/stock",
        roles: ["super_admin", "admin", "manager"],
    },
    {
        label: "Till Accounts",
        icon: CreditCard,
        path: "/till-accounts",
        roles: ["super_admin", "admin"],
    },
    {
        label: "Queue Monitor",
        icon: Activity,
        path: "/queue-monitor",
        roles: ["super_admin"],
    },
    {
        label: "Shifts",
        icon: Clock,
        path: "/shifts",
        roles: ["super_admin", "admin", "manager"],
    },
    { label: "Day Closings", icon: CalendarDays, path: "/day-closings" },
    { label: "Expenses", icon: FileText, path: "/journal-entries" },
    {
        label: "Stock Audit",
        icon: ShieldCheck,
        path: "/stock-audit",
        roles: ["super_admin", "admin", "manager", "cashier", "sales_person"],
    },
    { label: "Audit History", icon: HistoryIcon, path: "/stock-audit/history" },
];

const STORAGE_KEY = "karobardesk.sidebar.collapsed";

interface AppSidebarProps {
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}

export default function AppSidebar({
    mobileOpen = false,
    onMobileClose,
}: AppSidebarProps) {
    const { roles } = useAuth();
    const roleNames = roles.map((role) => role.name);

    const [collapsed, setCollapsed] = useState<boolean>(() => {
        if (typeof window === "undefined") return false;
        return window.localStorage.getItem(STORAGE_KEY) === "true";
    });

    useEffect(() => {
        window.localStorage.setItem(STORAGE_KEY, String(collapsed));
    }, [collapsed]);

    useEffect(() => {
        if (!mobileOpen) return;

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") onMobileClose?.();
        }

        window.addEventListener("keydown", handleEscape);

        return () => window.removeEventListener("keydown", handleEscape);
    }, [mobileOpen, onMobileClose]);

    const visibleItems = NAV_ITEMS.filter((item) => {
        if (!item.roles) return true;
        return item.roles.some((role) => roleNames.includes(role));
    });

    function renderNavigation(isMobile = false) {
        const isCollapsed = collapsed && !isMobile;

        return (
            <div className="relative flex h-full flex-col overflow-hidden">
                {/* Top Highlight */}
                <div className="absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />

                {/* Brand Header */}
                <div
                    className={cn(
                        "flex h-[76px] shrink-0 items-center border-b border-white/[0.07] px-4",
                        isCollapsed ? "justify-center" : "justify-between",
                    )}
                >
                    {!isCollapsed && (
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet-600 to-indigo-600 shadow-[0_0_25px_rgba(139,92,246,0.25)]">
                                <Store className="h-5 w-5 text-white" />
                            </div>

                            <div className="min-w-0">
                                <p className="truncate text-[15px] font-bold tracking-tight text-white">
                                    KarobarDesk
                                </p>

                                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                                    Command Center
                                </p>
                            </div>
                        </div>
                    )}

                    {isMobile ? (
                        <button
                            type="button"
                            onClick={onMobileClose}
                            aria-label="Close navigation"
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/10 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setCollapsed(!collapsed)}
                            aria-label={
                                collapsed
                                    ? "Expand sidebar"
                                    : "Collapse sidebar"
                            }
                            title={
                                collapsed
                                    ? "Expand sidebar"
                                    : "Collapse sidebar"
                            }
                            className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/[0.07] hover:text-white",
                                isCollapsed && "absolute right-0 top-6",
                            )}
                        >
                            {collapsed ? (
                                <ChevronRight className="h-4 w-4" />
                            ) : (
                                <ChevronLeft className="h-4 w-4" />
                            )}
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav
                    aria-label="Main navigation"
                    className={cn(
                        "custom-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-8 pt-5",
                        isCollapsed && "px-2",
                    )}
                >
                    {!isCollapsed && (
                        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                            Workspace
                        </p>
                    )}

                    {visibleItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                title={isCollapsed ? item.label : undefined}
                                onClick={isMobile ? onMobileClose : undefined}
                                className={({ isActive }) =>
                                    cn(
                                        "sidebar-item group",
                                        isCollapsed && "justify-center px-0",
                                        isActive
                                            ? "sidebar-active"
                                            : "border border-transparent text-zinc-400 hover:bg-white/[0.045] hover:text-white",
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <Icon
                                            className={cn(
                                                "h-[18px] w-[18px] shrink-0 transition-all duration-200",
                                                isActive
                                                    ? "text-violet-300 drop-shadow-[0_0_8px_rgba(167,139,250,0.55)]"
                                                    : "text-zinc-500 group-hover:text-zinc-200",
                                            )}
                                        />

                                        {!isCollapsed && (
                                            <span className="truncate">
                                                {item.label}
                                            </span>
                                        )}

                                        {!isCollapsed && isActive && (
                                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Bottom fade */}
                <div className="pointer-events-none absolute bottom-0 h-10 w-full bg-gradient-to-t from-[#09090f]/90 to-transparent" />
            </div>
        );
    }

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "glass-sidebar sticky top-4 m-4 hidden h-[calc(100vh-2rem)] shrink-0 flex-col overflow-hidden rounded-2xl shadow-2xl transition-[width] duration-300 ease-in-out md:flex",
                    collapsed ? "w-[76px]" : "w-[260px]",
                )}
            >
                {renderNavigation()}
            </aside>

            {/* Mobile Sidebar */}
            {mobileOpen && (
                <div className="fixed inset-0 z-[100] md:hidden">
                    <button
                        type="button"
                        aria-label="Close navigation backdrop"
                        onClick={onMobileClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />

                    <aside className="glass-sidebar absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col rounded-r-2xl shadow-2xl">
                        {renderNavigation(true)}
                    </aside>
                </div>
            )}
        </>
    );
}
