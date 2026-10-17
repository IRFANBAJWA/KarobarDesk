import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

import {
    LayoutDashboard,
    Users,
    ChevronLeft,
    ChevronRight,
    Building2,
    Package,
    Tags,
    DollarSign,
} from "lucide-react";

import { useAuth } from "@/auth/useAuth";
import { cn } from "@/lib/utils";

type NavItem = {
    label: string;
    icon: typeof LayoutDashboard;
    path: string;
    /** Role names that may see this item. Empty/undefined = everyone. */
    roles?: string[];
};

const NAV_ITEMS: NavItem[] = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Users", icon: Users, path: "/users", roles: ["super_admin"] },
    {
        label: "Companies",
        icon: Building2,
        path: "companies",
        roles: ["super_admin"],
    },
    {
        label: "Items",
        icon: Package,
        path: "items",
        roles: ["super_admin", "admin", "manager"],
    },
    {
        label: "Price Lists",
        icon: Tags,
        path: "price-lists",
        roles: ["super_admin"],
    },
    {
        label: "Item Prices",
        icon: DollarSign,
        path: "item-prices",
        roles: ["super_admin", "admin"],
    },
];

const STORAGE_KEY = "karobardesk.sidebar.collapsed";

export default function AppSidebar() {
    const { roles } = useAuth();
    const roleNames = roles.map((r) => r.name);

    const [collapsed, setCollapsed] = useState<boolean>(() => {
        if (typeof window === "undefined") return false;
        return window.localStorage.getItem(STORAGE_KEY) === "true";
    });

    useEffect(() => {
        window.localStorage.setItem(STORAGE_KEY, String(collapsed));
    }, [collapsed]);

    const visibleItems = NAV_ITEMS.filter((item) => {
        if (!item.roles || item.roles.length === 0) return true;
        return item.roles.some((r) => roleNames.includes(r));
    });

    return (
        <aside
            className={cn(
                "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-white/10 bg-white/5 backdrop-blur-xl transition-[width] duration-200 md:flex",
                collapsed ? "w-16" : "w-60",
            )}
        >
            {/* Header: collapse toggle */}
            <div className="flex h-14 items-center justify-end border-b border-white/10 px-2">
                <button
                    type="button"
                    onClick={() => setCollapsed((v) => !v)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
                    aria-label={
                        collapsed ? "Expand sidebar" : "Collapse sidebar"
                    }
                >
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </button>
            </div>

            {/* MENU label */}
            {!collapsed && (
                <div className="px-4 pb-2 pt-4 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Menu
                </div>
            )}

            {/* Nav items */}
            <nav className="flex-1 space-y-1 px-2 py-2">
                {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            title={collapsed ? item.label : undefined}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                                    collapsed && "justify-center px-0",
                                    isActive
                                        ? "bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-foreground ring-1 ring-inset ring-white/10"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                                )
                            }
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                            {!collapsed && (
                                <span className="truncate">{item.label}</span>
                            )}
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
}
