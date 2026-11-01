import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    X,
    Loader2,
    CalendarDays,
    DollarSign,
    Layers,
    Receipt,
    Wallet,
} from "lucide-react";
import { getDayClosing } from "../api";
import type { DayClosingDetail } from "../types";

export default function DayClosingDetailDrawer({
    closingId,
    onClose,
}: {
    closingId: number | null;
    onClose: () => void;
}) {
    const [data, setData] = useState<DayClosingDetail | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (closingId) {
            setLoading(true);
            getDayClosing(closingId).then((res) => {
                setData(res);
                setLoading(false);
            });
        }
    }, [closingId]);

    if (!closingId) return null;

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
                            <CalendarDays className="h-5 w-5 text-violet-400" />
                            Day Closing
                        </h2>
                        <p className="text-xs text-muted-foreground uppercase mt-1">
                            {data?.data.business_date} •{" "}
                            {data?.data.user?.name || "Cashier"}
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
                    {loading || !data ? (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                        </div>
                    ) : (
                        <>
                            {/* 1. Transactions Detail */}
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <Receipt className="h-4 w-4 text-muted-foreground" />{" "}
                                    Transactions Detail
                                </h3>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Total Transactions
                                    </span>
                                    <span className="text-foreground font-medium">
                                        {data.data.total_transactions}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Sale Invoices
                                    </span>
                                    <span className="text-foreground tabular-nums">
                                        {data.data.sale_count}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Return Invoices
                                    </span>
                                    <span className="text-foreground tabular-nums">
                                        {data.data.return_count}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Void Transactions
                                    </span>
                                    <span className="text-foreground tabular-nums">
                                        {data.data.void_count}
                                    </span>
                                </div>
                            </div>

                            {/* 2. Sales Detail */}
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />{" "}
                                    Sales Detail
                                </h3>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Total Sales
                                    </span>
                                    <span className="text-emerald-400 tabular-nums font-medium">
                                        {data.data.total_sales}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Cash Sales
                                    </span>
                                    <span className="text-foreground tabular-nums">
                                        {data.data.cash_sales}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Card Sales
                                    </span>
                                    <span className="text-foreground tabular-nums">
                                        {data.data.card_sales}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Other Sales
                                    </span>
                                    <span className="text-foreground tabular-nums">
                                        {data.data.other_sales}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Total Discount
                                    </span>
                                    <span className="text-amber-400 tabular-nums">
                                        {data.data.total_discount}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Total Returns
                                    </span>
                                    <span className="text-red-400 tabular-nums">
                                        -{data.data.total_returns}
                                    </span>
                                </div>
                                <div className="border-t border-white/10 mt-2 pt-2 flex justify-between text-sm font-medium">
                                    <span className="text-foreground">
                                        Net Sale
                                    </span>
                                    <span className="text-emerald-400 tabular-nums">
                                        {(
                                            Number(data.data.total_sales) -
                                            Number(data.data.total_returns)
                                        ).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* 3. Cash Position */}
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-muted-foreground" />{" "}
                                    Cash Position
                                </h3>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Opening Cash
                                    </span>
                                    <span className="text-foreground tabular-nums">
                                        {data.data.opening_balance}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Total Expenses
                                    </span>
                                    <span className="text-foreground tabular-nums">
                                        -{data.data.total_expenses}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm border-t border-white/10 mt-2 pt-2">
                                    <span className="text-muted-foreground">
                                        Expected System Cash
                                    </span>
                                    <span className="text-foreground tabular-nums font-medium">
                                        {data.data.expected_cash}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Actual Cashier Cash
                                    </span>
                                    <span className="text-foreground tabular-nums font-medium">
                                        {data.data.actual_cash}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm bg-white/5 p-2 rounded-lg mt-1">
                                    <span className="text-muted-foreground font-medium">
                                        Cash Difference
                                    </span>
                                    <span
                                        className={`font-bold tabular-nums ${Number(data.data.cash_difference) < 0 ? "text-red-400" : "text-emerald-400"}`}
                                    >
                                        {data.data.cash_difference}
                                    </span>
                                </div>
                            </div>

                            {/* 4. Cash Denominations */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-muted-foreground" />{" "}
                                    Cash Denominations
                                </h3>
                                <div className="bg-white/[0.02] p-4 rounded-lg border border-white/5">
                                    <div className="grid grid-cols-4 gap-3 text-xs text-muted-foreground">
                                        <div className="flex flex-col">
                                            5000{" "}
                                            <span className="text-foreground text-sm font-medium mt-1">
                                                {data.denominations?.d5000 || 0}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            1000{" "}
                                            <span className="text-foreground text-sm font-medium mt-1">
                                                {data.denominations?.d1000 || 0}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            500{" "}
                                            <span className="text-foreground text-sm font-medium mt-1">
                                                {data.denominations?.d500 || 0}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            100{" "}
                                            <span className="text-foreground text-sm font-medium mt-1">
                                                {data.denominations?.d100 || 0}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            50{" "}
                                            <span className="text-foreground text-sm font-medium mt-1">
                                                {data.denominations?.d50 || 0}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            20{" "}
                                            <span className="text-foreground text-sm font-medium mt-1">
                                                {data.denominations?.d20 || 0}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            10{" "}
                                            <span className="text-foreground text-sm font-medium mt-1">
                                                {data.denominations?.d10 || 0}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            5{" "}
                                            <span className="text-foreground text-sm font-medium mt-1">
                                                {data.denominations?.d5 || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </aside>
        </>
    );

    return createPortal(content, document.body);
}
