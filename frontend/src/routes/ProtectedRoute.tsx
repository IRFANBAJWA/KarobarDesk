import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
    allowedRoles?: string[];
    children?: ReactNode;
}

export default function ProtectedRoute({
    allowedRoles,
    children,
}: ProtectedRouteProps) {
    const { user, roles, isLoading } = useAuth();
    const location = useLocation();

    // 1. Wait for Auth to load (if your context supports it)
    if (isLoading) {
        return <div className="p-8 text-center text-slate-400">Loading...</div>;
    }

    // 2. Not logged in -> Redirect to login
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. Logged in, but checking roles
    if (allowedRoles && allowedRoles.length > 0) {
        const roleNames = roles.map((r) => r.name);
        const hasAccess = allowedRoles.some((role) => roleNames.includes(role));

        if (!hasAccess) {
            // If they are already at the root "/", don't redirect again (prevents loop)
            if (location.pathname === "/") {
                return (
                    <div className="flex h-[80vh] flex-col items-center justify-center p-8 text-center">
                        <h1 className="text-2xl font-bold text-red-400 mb-2">
                            Access Denied
                        </h1>
                        <p className="text-slate-400">
                            You do not have permission to view this page.
                        </p>
                    </div>
                );
            }

            // Kick them back to the Dashboard
            return <Navigate to="/" replace />;
        }
    }

    // 4. Render children if provided, otherwise render the nested Outlet
    return children ? <>{children}</> : <Outlet />;
}
