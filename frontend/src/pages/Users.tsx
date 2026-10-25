import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import UsersFilters from "@/modules/users/components/UsersFilters";
import UsersTable from "@/modules/users/components/UsersTable";
import CreateUserDialog from "@/modules/users/components/CreateUserDialog";
import EditUserDialog from "@/modules/users/components/EditUserDialog";
import UserDetailDrawer from "@/modules/users/components/UserDetailDrawer";
import * as api from "@/modules/users/api";
import { listPriceLists } from "@/modules/price-lists/api";
import type { PriceList } from "@/modules/price-lists/types";
import type {
    Company,
    CreateUserPayload,
    Role,
    UpdateUserPayload,
    User,
} from "@/modules/users/types";

export default function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [perPage] = useState(20);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [priceLists, setPriceLists] = useState<PriceList[]>([]);

    // --- filters ---
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
    const [companyFilter, setCompanyFilter] = useState<number | "all">("all");

    // --- pickers ---
    const [companies, setCompanies] = useState<Company[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);

    // --- dialogs ---
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<User | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [viewing, setViewing] = useState<User | null>(null);

    // --- toast ---
    const [toast, setToast] = useState<string | null>(null);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.listUsers({
                search: search || undefined,
                is_active: status === "all" ? undefined : status === "active",
                company_id: companyFilter === "all" ? undefined : companyFilter,
                page,
                per_page: perPage,
            });
            setUsers(res.data);
            setTotal(res.total);
            setLastPage(res.last_page);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load users.");
        } finally {
            setLoading(false);
        }
    }, [search, status, companyFilter, page, perPage]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    useEffect(() => {
        listPriceLists()
            .then((res) => setPriceLists(res.data))
            .catch(console.error);
    }, []);

    useEffect(() => {
        Promise.all([api.listCompanies(), api.listRoles()])
            .then(([c, r]) => {
                setCompanies(c.data);
                setRoles(r.data);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(t);
    }, [toast]);

    async function handleCreate(payload: CreateUserPayload) {
        await api.createUser(payload);
        setCreateOpen(false);
        setToast("User created.");
        setPage(1);
        await loadUsers();
    }

    async function handleUpdate(payload: UpdateUserPayload) {
        if (!editing) return;
        await api.updateUser(editing.id, payload);
        setEditOpen(false);
        setEditing(null);
        setToast("User updated.");
        await loadUsers();
    }

    async function handleToggleActive(user: User) {
        try {
            if (user.is_active) {
                await api.deactivateUser(user.id);
                setToast(`${user.name} deactivated.`);
            } else {
                await api.activateUser(user.id);
                setToast(`${user.name} activated.`);
            }
            await loadUsers();
        } catch (e: any) {
            setToast(e?.message ?? "Failed to update status.");
        }
    }

    function handleView(user: User) {
        setViewing(user);
        setDrawerOpen(true);
    }

    function handleEdit(user: User) {
        setEditing(user);
        setEditOpen(true);
    }

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 p-6">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        Users
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage system users, roles, and access.
                    </p>
                </div>
                <Button
                    onClick={() => setCreateOpen(true)}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500"
                >
                    <Plus className="mr-2 h-4 w-4" /> Create user
                </Button>
            </div>

            <UsersFilters
                search={search}
                status={status}
                companyId={companyFilter}
                companies={companies}
                onSearchChange={(v) => {
                    setPage(1);
                    setSearch(v);
                }}
                onStatusChange={(v) => {
                    setPage(1);
                    setStatus(v);
                }}
                onCompanyChange={(v) => {
                    setPage(1);
                    setCompanyFilter(v);
                }}
            />

            {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                    {error}
                </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
                <UsersTable
                    users={users}
                    loading={loading}
                    onView={handleView}
                    onEdit={handleEdit}
                    onToggleActive={handleToggleActive}
                />
            </div>

            {!loading && users.length > 0 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                        {total} user{total === 1 ? "" : "s"} · page {page} of{" "}
                        {lastPage}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="h-8 px-3 text-xs"
                        >
                            Previous
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() =>
                                setPage((p) => Math.min(lastPage, p + 1))
                            }
                            disabled={page >= lastPage}
                            className="h-8 px-3 text-xs"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            <CreateUserDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onSubmit={handleCreate}
                companies={companies}
                roles={roles}
            />
            <EditUserDialog
                open={editOpen}
                onClose={() => {
                    setEditOpen(false);
                    setEditing(null);
                }}
                onSubmit={handleUpdate}
                companies={companies}
                roles={roles}
                user={editing}
            />

            <UserDetailDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                user={viewing}
                onUserUpdated={(updatedUser) => {
                    setUsers((prev) =>
                        prev.map((u) =>
                            u.id === updatedUser.id ? updatedUser : u,
                        ),
                    );
                    setViewing(updatedUser);
                }}
                priceLists={priceLists}
                onToast={(msg) => setToast(msg)}
            />

            {toast && (
                <div className="fixed bottom-6 right-6 z-[100] rounded-xl border border-white/10 bg-neutral-900/95 px-4 py-3 text-sm shadow-2xl backdrop-blur-xl">
                    {toast}
                </div>
            )}
        </div>
    );
}
