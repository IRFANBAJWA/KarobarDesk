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
} from "lucide-react";
import { useAuth } from "@/auth/useAuth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
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
                {/* Top Edge Highlight */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />

                {/* Sidebar Header */}
                <div
                    className={cn(
                        "flex h-16 shrink-0 items-center border-b border-white/[0.06] px-4",
                        isCollapsed ? "justify-center" : "justify-between",
                    )}
                >
                    {!isCollapsed && (
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet-600 to-indigo-600 shadow-[0_0_20px_rgba(139,92,246,0.22)]">
                                <Store className="h-[18px] w-[18px] text-white" />
                            </div>
                            <div className="min-w-0 leading-tight">
                                <p className="truncate text-sm font-bold tracking-tight text-white">
                                    KarobarDesk
                                </p>
                                <p className="mt-0.5 text-[10px] text-neutral-400">
                                    Command Center
                                </p>
                            </div>
                        </div>
                    )}

                    {isMobile ? (
                        <button
                            type="button"
                            onClick={onMobileClose}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-white/10 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setCollapsed(!collapsed)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-white/10 hover:text-white"
                        >
                            {collapsed ? (
                                <ChevronRight className="h-4 w-4" />
                            ) : (
                                <ChevronLeft className="h-4 w-4" />
                            )}
                        </button>
                    )}
                </div>

                {/* Nav Items */}
                <nav
                    className={cn(
                        "custom-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-16 pt-4",
                        isCollapsed && "px-2",
                    )}
                >
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
                                        "group relative flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                        isCollapsed && "justify-center px-0",
                                        isActive
                                            ? "border-violet-500/30 bg-violet-500/10 text-white shadow-[0_0_20px_rgba(139,92,246,0.15)]"
                                            : "text-neutral-400 hover:bg-white/[0.04] hover:text-white",
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && (
                                            <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                                        )}
                                        <Icon
                                            className={cn(
                                                "h-[18px] w-[18px] shrink-0 transition-all duration-200",
                                                isActive
                                                    ? "text-violet-300 drop-shadow-[0_0_8px_rgba(167,139,250,0.6)]"
                                                    : "text-neutral-500 group-hover:text-white",
                                            )}
                                        />
                                        {!isCollapsed && (
                                            <span className="truncate">
                                                {item.label}
                                            </span>
                                        )}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Fade at bottom */}
                <div className="pointer-events-none absolute bottom-0 h-16 w-full bg-gradient-to-t from-[#09090b]/90 to-transparent" />
            </div>
        );
    }

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "sticky top-4 m-4 hidden h-[calc(100vh-2rem)] shrink-0 flex-col rounded-2xl border border-white/[0.08] bg-[#09090b]/80 shadow-2xl backdrop-blur-2xl transition-[width] duration-300 md:flex",
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
                        onClick={onMobileClose}
                        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
                    />
                    <aside className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col rounded-r-2xl border-r border-white/10 bg-[#0c0c10]/95 shadow-2xl backdrop-blur-3xl">
                        {renderNavigation(true)}
                    </aside>
                </div>
            )}
        </>
    );
}
