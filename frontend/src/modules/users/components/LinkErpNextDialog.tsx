import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Modal from "./Modal";
import * as api from "../api";
import type { LinkErpNextPayload, User } from "../types";

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: (user: User) => void;
    user: User | null;
}

export default function LinkErpNextDialog({
    open,
    onClose,
    onSuccess,
    user,
}: Props) {
    const [erpUser, setErpUser] = useState("");
    const [erpPass, setErpPass] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
        {},
    );

    useEffect(() => {
        if (open) {
            setErpUser(user?.erpnext?.user ?? "");
            setErpPass("");
            setError(null);
            setFieldErrors({});
        }
    }, [open, user]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!user) return;

        setError(null);
        setFieldErrors({});
        setSubmitting(true);

        try {
            const payload: LinkErpNextPayload = {
                erpnext_user: erpUser.trim(),
                erpnext_password: erpPass,
            };
            const res = await api.linkErpNext(user.id, payload);
            onSuccess(res.data);
            onClose();
        } catch (err: any) {
            setError(err?.message ?? "Link failed.");
            if (err?.errors) setFieldErrors(err.errors);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Link to ERPNext"
            description="Enter this user's ERPNext credentials. We'll fetch their till operation, warehouse, price list, and accounts."
            className="max-w-md"
            footer={
                <>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500"
                    >
                        {submitting ? "Linking..." : "Link to ERPNext"}
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
                        {error}
                    </div>
                )}

                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                        ERPNext username
                    </Label>
                    <Input
                        value={erpUser}
                        onChange={(e) => setErpUser(e.target.value)}
                        autoComplete="off"
                        required
                    />
                    {fieldErrors.erpnext_user &&
                        fieldErrors.erpnext_user.length > 0 && (
                            <p className="text-[11px] text-red-400">
                                {fieldErrors.erpnext_user[0]}
                            </p>
                        )}
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                        ERPNext password
                    </Label>
                    <Input
                        type="password"
                        value={erpPass}
                        onChange={(e) => setErpPass(e.target.value)}
                        autoComplete="new-password"
                        required
                    />
                    {fieldErrors.erpnext_password &&
                        fieldErrors.erpnext_password.length > 0 && (
                            <p className="text-[11px] text-red-400">
                                {fieldErrors.erpnext_password[0]}
                            </p>
                        )}
                </div>

                <p className="text-[11px] text-muted-foreground">
                    If linking fails, nothing is saved. The user remains
                    local-only and you can retry any time.
                </p>
            </form>
        </Modal>
    );
}
