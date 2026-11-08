import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { useAuth } from "@/auth/useAuth";
import SuperAdminLayout from "@/modules/dashboard/components/SuperAdminLayout";
import AdminLayout from "@/modules/dashboard/components/AdminLayout";
import ManagerLayout from "@/modules/dashboard/components/ManagerLayout";
import CashierLayout from "@/modules/dashboard/components/CashierLayout";
import DashboardSkeleton from "@/modules/dashboard/components/DashboardSkeleton"; // ⭐ Import Skeleton

export default function Dashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState("today");
    const [companyFilter, setCompanyFilter] = useState("all");

    const { roles, activeCompany } = useAuth();

    const roleNames = roles.map((r) => r.name);
    const isSuperAdmin = roleNames.includes("super_admin");
    const isAdmin = roleNames.includes("admin");
    const isManager = roleNames.includes("manager");

    const isCashier =
        (roleNames.includes("cashier") || roleNames.includes("sales_person")) &&
        !isSuperAdmin &&
        !isAdmin &&
        !isManager;

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const url =
                    isSuperAdmin || isAdmin
                        ? `/api/dashboard?date_range=${dateRange}&company_id=${companyFilter}`
                        : `/api/dashboard`;

                const res = await apiFetch(url);
                setData(res);
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [dateRange, companyFilter, isSuperAdmin, isAdmin]);

    // ⭐ Show Skeleton UI while loading
    if (loading) {
        return <DashboardSkeleton />;
    }

    if (!data)
        return (
            <div className="p-8 text-center text-red-400">
                Error loading data.
            </div>
        );

    if (isCashier) {
        return <CashierLayout data={data} />;
    }

    if (isManager && !isAdmin && !isSuperAdmin) {
        return <ManagerLayout data={data} activeCompany={activeCompany} />;
    }

    if (isAdmin && !isSuperAdmin) {
        return (
            <AdminLayout
                data={data}
                dateRange={dateRange}
                setDateRange={setDateRange}
                companyFilter={companyFilter}
                setCompanyFilter={setCompanyFilter}
            />
        );
    }

    if (isSuperAdmin) {
        return (
            <SuperAdminLayout
                data={data}
                dateRange={dateRange}
                setDateRange={setDateRange}
                companyFilter={companyFilter}
                setCompanyFilter={setCompanyFilter}
                companies={data.companies || []}
                isSuperAdmin={true}
            />
        );
    }
}
