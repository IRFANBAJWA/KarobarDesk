import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
    Building2,
    ChevronDown,
    LogOut,
    Menu,
    Settings,
    Store,
    UserCircle,
} from "lucide-react";

import { useAuth } from "@/auth/useAuth";
import { ThemeToggle } from "@/theme/ThemeToggle";
import AppSidebar from "@/layouts/AppSidebar";
import { cn } from "@/lib/utils";

export default function AppLayout() {
    const { user, roles, activeCompany, isSuperAdmin, logout } = useAuth();

    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const navigate = useNavigate();
    const menuRef = useRef<HTMLDivElement>(null);

    const displayName = user?.name || user?.username || "User";

    const initials = displayName
        .split(" ")
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();

    const roleLabel = roles
        .map((role) => role.name.replaceAll("_", " "))
        .join(", ");

    useEffect(() => {
        function handleOutsideClick(event: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setMenuOpen(false);
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    async function handleSignOut() {
        setMenuOpen(false);
        await logout();
    }

    function handleSettings() {
        setMenuOpen(false);
        navigate("/settings");
    }

    return (
        <div className="app-background relative flex h-screen overflow-hidden text-foreground">
            {/* Ambient Background Effects */}
            <div className="ambient-glow-1 fixed" />
            <div className="ambient-glow-2 fixed" />

            <div className="pointer-events-none fixed left-[45%] top-[35%] h-[350px] w-[350px] rounded-full bg-indigo-500/[0.025] blur-[120px]" />

            {/* Sidebar */}
            <AppSidebar
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
            />

            {/* Main Application */}
            <div className="relative z-10 flex h-full min-w-0 flex-1 flex-col">
                {/* Top Header */}
                <header className="z-40 shrink-0 border-b border-white/[0.09] bg-white/[0.035] shadow-[0_8px_30px_rgba(2,8,23,0.12)] backdrop-blur-2xl">
                    {" "}
                    <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                        {/* Mobile Brand */}
                        <div className="flex items-center gap-3 md:hidden">
                            <button
                                type="button"
                                onClick={() => setMobileOpen(true)}
                                aria-label="Open navigation"
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-zinc-400 transition hover:bg-white/[0.09] hover:text-white"
                            >
                                <Menu className="h-5 w-5" />
                            </button>

                            <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet-600 to-indigo-600 shadow-[0_0_20px_rgba(139,92,246,0.25)]">
                                    <Store className="h-[18px] w-[18px] text-white" />
                                </div>

                                <div className="leading-tight">
                                    <p className="text-sm font-bold tracking-tight text-white">
                                        KarobarDesk
                                    </p>
                                    <p className="text-[9px] uppercase tracking-widest text-zinc-500">
                                        Command Center
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Context */}
                        <div className="hidden min-w-0 items-center gap-3 md:flex">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035]">
                                <Building2 className="h-4 w-4 text-violet-300" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-500">
                                    Active Company
                                </p>
                                <p className="truncate text-sm font-semibold text-zinc-200">
                                    {activeCompany?.name ||
                                        "No company selected"}
                                </p>
                            </div>
                        </div>

                        {/* Header Actions */}
                        <div className="ml-auto flex items-center gap-3 sm:gap-4">
                            <ThemeToggle />

                            {/* User Dropdown */}
                            <div className="relative" ref={menuRef}>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setMenuOpen((value) => !value)
                                    }
                                    aria-expanded={menuOpen}
                                    aria-haspopup="menu"
                                    className={cn(
                                        "group flex items-center gap-2 rounded-full border py-1 pl-1 pr-2.5 shadow-sm backdrop-blur-xl transition-all duration-200 sm:gap-3 sm:pr-3",
                                        menuOpen
                                            ? "border-violet-400/30 bg-white/[0.09]"
                                            : "border-white/[0.08] bg-white/[0.04] hover:border-violet-400/25 hover:bg-white/[0.08]",
                                    )}
                                >
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-violet-300/20 bg-gradient-to-br from-violet-600 to-indigo-600 text-[11px] font-bold text-white shadow-[0_0_14px_rgba(139,92,246,0.2)]">
                                        {initials}
                                    </span>

                                    <span className="hidden text-xs font-semibold text-white/80 transition-colors group-hover:text-white sm:inline">
                                        {user?.username || displayName}
                                    </span>

                                    <ChevronDown
                                        className={cn(
                                            "h-3.5 w-3.5 text-zinc-500 transition-transform duration-200",
                                            menuOpen && "rotate-180",
                                        )}
                                    />
                                </button>

                                {/* Dropdown */}
                                {menuOpen && (
                                    <div className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-white/[0.14] bg-slate-900/75 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
                                        <div className="border-b border-white/10 px-4 py-4">
                                            <p className="truncate text-sm font-semibold text-white">
                                                {displayName}
                                            </p>
                                            <p className="mt-1 text-xs capitalize text-white/50">
                                                {roleLabel}
                                            </p>
                                        </div>

                                        <div className="p-2">
                                            <button
                                                onClick={() => {
                                                    setMenuOpen(false);
                                                    navigate("/profile");
                                                }}
                                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
                                            >
                                                <UserCircle size={17} />
                                                My Profile
                                            </button>

                                            {isSuperAdmin && (
                                                <button
                                                    onClick={() => {
                                                        setMenuOpen(false);
                                                        navigate("/settings");
                                                    }}
                                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
                                                >
                                                    <Settings size={17} />
                                                    Settings
                                                </button>
                                            )}

                                            <div className="my-2 border-t border-white/10" />

                                            <button
                                                onClick={handleSignOut}
                                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 transition hover:bg-red-500/10"
                                            >
                                                <LogOut size={17} />
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="custom-scrollbar relative min-h-0 flex-1 overflow-y-auto overscroll-contain bg-transparent">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
