import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Calendar, DollarSign, Wallet } from "lucide-react"; // ⭐ Added Wallet icon
import { getShift } from "../api";
import type { ShiftDetail } from "../types";
import ShiftReceipt from "./ShiftReceipt";

// Helper to calculate hours
const calculateHours = (start: string, end: string | null) => {
    if (!end) return "Active";
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    return `${(diffMs / (1000 * 60 * 60)).toFixed(2)} hrs`;
};

export default function ShiftDetailDrawer({
    shiftId,
    onClose,
}: {
    shiftId: number | null;
    onClose: () => void;
}) {
    const [shift, setShift] = useState<ShiftDetail | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (shiftId) {
            setLoading(true);
            getShift(shiftId).then((res) => {
                setShift(res.data);
                setLoading(false);
            });
        }
    }, [shiftId]);

    if (!shiftId) return null;

    const content = (
        <>
            <div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <aside className="fixed right-0 top-0 z-50 flex h-[100dvh] w-full max-w-md flex-col border-l border-white/10 bg-neutral-950/95 shadow-2xl backdrop-blur-xl">
                <header className="shrink-0 border-b border-white/10 px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-violet-400" />
                            {shift?.shift_code || `Shift #${shiftId}`}
                        </h2>
                        <p className="text-xs text-muted-foreground uppercase mt-1">
                            {shift?.shift_date} •{" "}
                            <span
                                className={
                                    shift?.shift_status === "OPEN"
                                        ? "text-amber-400"
                                        : "text-emerald-400"
                                }
                            >
                                {shift?.shift_status === "OPEN"
                                    ? "OPEN (O)"
                                    : "CLOSED (C)"}
                            </span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
                    {loading || !shift ? (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                        </div>
                    ) : (
                        <>
                            {/* Cashier & Till */}
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Cashier
                                    </span>
                                    <span className="text-foreground">
                                        {shift.user?.name || "—"}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Till
                                    </span>
                                    <span className="text-foreground">
                                        {shift.till_operation?.till_no || "—"}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Start Time
                                    </span>
                                    <span className="text-foreground">
                                        {new Date(
                                            shift.start_time,
                                        ).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        End Time
                                    </span>
                                    <span className="text-foreground">
                                        {shift.end_time
                                            ? new Date(
                                                  shift.end_time,
                                              ).toLocaleString()
                                            : "Active"}
                                    </span>
                                </div>
                            </div>

                            {/* ⭐ NEW: Net by Till Account ⭐ */}
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                                <h3 className="text-sm font-medium flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-muted-foreground" />{" "}
                                    Net by Till Account
                                </h3>

                                {!shift.account_summary ||
                                shift.account_summary.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic">
                                        No payments recorded for this shift.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {shift.account_summary.map(
                                            (acc, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex justify-between text-sm"
                                                >
                                                    <span className="text-muted-foreground">
                                                        {acc.account_name}
                                                    </span>
                                                    <span className="text-emerald-400 font-medium tabular-nums">
                                                        +{acc.total_amount}
                                                    </span>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Financials */}
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />{" "}
                                    Financials
                                </h3>

                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Working Hours
                                    </span>
                                    <span className="text-foreground font-medium">
                                        {calculateHours(
                                            shift.start_time,
                                            shift.end_time,
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Opening Balance
                                    </span>
                                    <span className="text-foreground tabular-nums">
                                        {shift.opening_balance}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Total Sales
                                    </span>
                                    <span className="text-emerald-400 tabular-nums">
                                        +{shift.total_sales}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Total Returns
                                    </span>
                                    <span className="text-red-400 tabular-nums">
                                        -{shift.total_returns}
                                    </span>
                                </div>

                                <div className="border-t border-white/10 my-2 pt-2 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Expected Cash
                                        </span>
                                        <span className="text-foreground tabular-nums">
                                            {shift.expected_cash}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Actual Cash
                                        </span>
                                        <span className="text-foreground tabular-nums">
                                            {shift.actual_cash}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm bg-white/5 p-2 rounded-lg">
                                        <span className="text-muted-foreground font-medium">
                                            Difference
                                        </span>
                                        <span
                                            className={`font-bold tabular-nums ${Number(shift.cash_difference) < 0 ? "text-red-400" : "text-emerald-400"}`}
                                        >
                                            {shift.cash_difference}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Denominations */}
                            {shift.denominations &&
                                shift.denominations.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-medium border-b border-white/10 pb-2">
                                            Cash Denominations
                                        </h3>
                                        {shift.denominations.map(
                                            (denom, idx) => (
                                                <div
                                                    key={idx}
                                                    className="bg-white/[0.02] p-3 rounded-lg border border-white/5"
                                                >
                                                    <p className="text-xs font-semibold text-violet-400 mb-2">
                                                        {
                                                            denom.denomination_type
                                                        }
                                                    </p>
                                                    <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                                                        <div>
                                                            5000:{" "}
                                                            <span className="text-foreground">
                                                                {denom.d5000}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            1000:{" "}
                                                            <span className="text-foreground">
                                                                {denom.d1000}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            500:{" "}
                                                            <span className="text-foreground">
                                                                {denom.d500}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            100:{" "}
                                                            <span className="text-foreground">
                                                                {denom.d100}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                        </>
                    )}
                    {!loading && shift && <ShiftReceipt shift={shift} />}
                </div>

                <footer className="shrink-0 border-t border-white/10 bg-white/[0.02] px-6 py-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">
                            Closing Balance
                        </span>
                        <span className="text-lg font-semibold tabular-nums text-violet-400">
                            {shift?.closing_balance || "0.00"}
                        </span>
                    </div>
                </footer>
            </aside>
        </>
    );

    return createPortal(content, document.body);
}
