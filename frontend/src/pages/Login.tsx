import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertCircle,
    ArrowRight,
    Eye,
    EyeOff,
    Loader2,
    Store,
    ShieldCheck,
} from "lucide-react";

import { useAuth } from "@/auth/useAuth";
import { ThemeToggle } from "@/theme/ThemeToggle";

export default function Login() {
    const navigate = useNavigate();
    const { user, login, loading } = useAuth();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!loading && user) {
            navigate("/", { replace: true });
        }
    }, [user, loading, navigate]);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        if (!username.trim() || !password) {
            setError("Username and password are required.");
            return;
        }

        setSubmitting(true);
        try {
            await login(username.trim(), password);
            navigate("/", { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed.");
            setPassword("");
            setSubmitting(false);
        }
    }

    return (
        <div className="relative flex h-screen w-full items-center justify-center overflow-y-auto bg-slate-50 px-4 py-8 dark:bg-[#050508] transition-colors duration-300 custom-scrollbar">
            {/* AMBIENT GLOWS */}
            <div className="pointer-events-none fixed top-[-20%] left-[-10%] h-[60vw] w-[60vw] rounded-full bg-violet-300/30 blur-[150px] dark:bg-violet-900/20" />
            <div className="pointer-events-none fixed bottom-[-20%] right-[-10%] h-[50vw] w-[50vw] rounded-full bg-indigo-300/30 blur-[150px] dark:bg-indigo-900/20" />

            {/* THEME TOGGLE */}
            <div className="fixed right-6 top-6 z-50">
                <ThemeToggle />
            </div>

            {/* LOGIN CARD */}
            <div className="relative z-10 w-full max-w-[380px] my-auto">
                {/* Glass Panel */}
                <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-3xl transition-colors duration-300 sm:p-8 dark:border-white/[0.08] dark:bg-[#0a0a0f]/80 dark:shadow-[0_30px_100px_-20px_rgba(0,0,0,0.9)]">
                    {/* Top Glass Edge Highlight */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-white/20" />

                    {/* Brand Header */}
                    <div className="mb-6 flex flex-col items-center text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-violet-500/20 dark:bg-[#18181b] dark:shadow-[0_0_30px_rgba(139,92,246,0.15)]">
                            <Store className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            KarobarDesk
                        </h1>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            Command Center
                        </p>
                    </div>

                    {/* Welcome Text */}
                    <div className="mb-5 text-center">
                        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                            Sign in to your desk
                        </h2>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            Enter your credentials to access your workspace.
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 flex items-center gap-2 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-3">
                        {/* Username */}
                        <div className="space-y-1">
                            <label
                                className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500"
                                htmlFor="username"
                            >
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                autoComplete="username"
                                autoFocus
                                disabled={submitting}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50 disabled:opacity-50 dark:border-white/[0.08] dark:bg-black/50 dark:text-white dark:placeholder-slate-600"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <label
                                className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500"
                                htmlFor="password"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    disabled={submitting}
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="••••••••"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50 disabled:opacity-50 dark:border-white/[0.08] dark:bg-black/50 dark:text-white dark:placeholder-slate-600"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-white"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* ⭐ SUBMIT BUTTON (Solid Gradient in Light, Dark Glass in Dark) */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="group relative mt-5 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 
              /* Light Mode Styles */
              bg-gradient-to-r from-violet-600 to-indigo-600 shadow-[0_4px_20px_rgba(139,92,246,0.3)] hover:shadow-[0_6px_25px_rgba(139,92,246,0.4)]
              /* Dark Mode Styles */
              dark:border dark:border-violet-500/30 dark:bg-[#1a1525] dark:text-violet-200 dark:shadow-[0_0_20px_rgba(139,92,246,0.1)] dark:hover:bg-[#221b30] dark:hover:border-violet-500/50 dark:hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]"
                        >
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-violet-400/50" />

                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign in
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer Security Badge */}
                    <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-600">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-500/70" />
                        Secure Enterprise Connection
                    </div>
                </div>

                {/* Page Footer */}
                <div className="mt-4 text-center text-[10px] text-slate-400 dark:text-slate-600">
                    <p>KarobarDesk v1.0 • Asia/Karachi • PKR</p>
                </div>
            </div>
        </div>
    );
}
