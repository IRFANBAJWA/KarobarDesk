import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
    Building2,
    ChevronDown,
    LogOut,
    Menu,
    Settings,
    Store,
} from "lucide-react";

import { useAuth } from "@/auth/useAuth";
import { ThemeToggle } from "@/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import AppSidebar from "@/layouts/AppSidebar";

export default function AppLayout() {
    const { user, roles, activeCompany, isSuperAdmin, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();

    const displayName = user?.name || user?.username || "User";
    const initials = displayName
        .split(" ")
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();

    async function handleSignOut() {
        setMenuOpen(false);
        await logout();
    }

    return (
        // ⭐ 1. Root Wrapper: h-screen and overflow-hidden ⭐
        <div className="relative flex h-screen overflow-hidden bg-[#070709] text-foreground">
            {/* Background Orbs (Fixed) */}
            <div className="pointer-events-none fixed -left-[15%] -top-[15%] h-[550px] w-[550px] rounded-full bg-violet-600/[0.08] blur-[140px]" />
            <div className="pointer-events-none fixed -bottom-[15%] -right-[10%] h-[550px] w-[550px] rounded-full bg-blue-600/[0.07] blur-[140px]" />
            <div className="pointer-events-none fixed left-[45%] top-[35%] h-[350px] w-[350px] rounded-full bg-indigo-500/[0.025] blur-[120px]" />

            <AppSidebar
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
            />

            {/* ⭐ 2. Main Content Wrapper: flex-col and h-full ⭐ */}
            <div className="relative z-10 flex h-full min-w-0 flex-1 flex-col">
                {/* Header (Sticky within the flex column) */}
                <header className="shrink-0 border-b border-white/[0.07] bg-[#09090b]/75 shadow-[0_4px_24px_rgba(0,0,0,0.12)] backdrop-blur-2xl z-40">
                    <div className="flex h-16 items-center justify-between px-4 sm:px-6">
                        {/* Mobile Brand & Hamburger */}
                        <div className="flex items-center gap-3 md:hidden">
                            <button
                                onClick={() => setMobileOpen(true)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet-600 to-indigo-600 shadow-[0_0_20px_rgba(139,92,246,0.25)]">
                                    <Store className="h-[18px] w-[18px] text-white" />
                                </div>
                                <div className="leading-tight">
                                    <p className="text-sm font-bold tracking-tight text-white">
                                        KarobarDesk
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="ml-auto flex items-center gap-3 sm:gap-4">
                            <ThemeToggle />

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setMenuOpen((v) => !v)}
                                    className="group flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] py-1 pl-1 pr-2.5 shadow-sm backdrop-blur-xl transition-all duration-200 hover:border-violet-400/25 hover:bg-white/[0.08] sm:gap-3 sm:pr-3"
                                >
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-violet-300/20 bg-gradient-to-br from-violet-600 to-indigo-600 text-[11px] font-bold text-white shadow-[0_0_14px_rgba(139,92,246,0.2)]">
                                        {initials}
                                    </span>
                                    <span className="hidden text-xs font-semibold text-white/80 transition-colors group-hover:text-white sm:inline">
                                        {user?.username || displayName}
                                    </span>
                                    <ChevronDown
                                        className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
                                    />
                                </button>

                                {/* Dropdown Panel... keep your existing dropdown code here */}
                            </div>
                        </div>
                    </div>
                </header>

                {/* ⭐ 3. The ONLY scrollable area: main with overflow-y-auto ⭐ */}
                <main className="flex-1 overflow-y-auto custom-scrollbar">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
