import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Receipt, CreditCard, User } from "lucide-react";
import { getSale } from "../api";
import type { SaleDetail } from "../types";

export default function SaleDetailDrawer({
    saleId,
    onClose,
}: {
    saleId: number | null;
    onClose: () => void;
}) {
    const [sale, setSale] = useState<SaleDetail | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (saleId) {
            setLoading(true);
            getSale(saleId).then((res) => {
                setSale(res.data);
                setLoading(false);
            });
        }
    }, [saleId]);

    if (!saleId) return null;

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
                            <Receipt className="h-5 w-5 text-violet-400" />
                            {sale?.invoice_number || "Loading..."}
                        </h2>
                        <p className="text-xs text-muted-foreground uppercase mt-1">
                            {sale?.invoice_type} • {sale?.status}
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
                    {loading || !sale ? (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                        </div>
                    ) : (
                        <>
                            {/* Customer Info */}
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />{" "}
                                    Customer
                                </h3>
                                <p className="text-sm text-foreground">
                                    {sale.customer?.customer_name ||
                                        "Walk-in Customer"}
                                </p>
                                {sale.customer?.phone && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {sale.customer.phone}
                                    </p>
                                )}
                            </div>

                            {/* Cashier Info */}
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />{" "}
                                    Cashier
                                </h3>
                                <p className="text-sm text-foreground">
                                    {sale.user?.name || "System/Manager"}
                                </p>
                            </div>

                            {/* Items List */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium border-b border-white/10 pb-2">
                                    Items
                                </h3>
                                {sale.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex justify-between text-sm"
                                    >
                                        <div>
                                            <p className="text-foreground">
                                                {item.item_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.qty} x {item.sale_price}
                                            </p>
                                        </div>
                                        <p className="font-medium tabular-nums">
                                            {(
                                                Number(item.qty) *
                                                Number(item.sale_price)
                                            ).toFixed(2)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Payments List */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium border-b border-white/10 pb-2 flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />{" "}
                                    Payments
                                </h3>
                                {sale.payments.map((pmt) => (
                                    <div
                                        key={pmt.id}
                                        className="flex justify-between text-sm"
                                    >
                                        <div>
                                            <p className="text-foreground capitalize">
                                                {pmt.payment_method}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {pmt.account?.name}
                                            </p>
                                        </div>
                                        <p className="font-medium tabular-nums">
                                            {pmt.payment_amount}
                                        </p>
                                    </div>
                                ))}
                                {sale.payments.length === 0 && (
                                    <p className="text-xs text-muted-foreground italic">
                                        No payments recorded.
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <footer className="shrink-0 border-t border-white/10 bg-white/[0.02] px-6 py-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">
                            Grand Total
                        </span>
                        <span className="text-lg font-semibold tabular-nums text-violet-400">
                            {sale?.grand_total || "0.00"}
                        </span>
                    </div>
                </footer>
            </aside>
        </>
    );

    return createPortal(content, document.body);
}
