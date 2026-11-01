import { Printer, Share2 } from "lucide-react";
import type { DayClosingSummary } from "../types";

export default function DayClosingReceipt({
    data,
}: {
    data: DayClosingSummary;
}) {
    const handlePrint = () => window.print();
    const handleWhatsApp = () => {
        const text = `*ALL IN ONE*\n*Day Close Report*\n\n*Sales Detail:*\nTotal Sales: ${data.total_sales}\nNet Sale: ${Number(data.total_sales) - Number(data.total_returns)}\n\n*Cash Position:*\nExpected: ${data.expected_cash}\nActual: ${data.actual_cash}\nDiff: ${data.cash_difference}`;
        window.open(
            `https://wa.me/?text=${encodeURIComponent(text)}`,
            "_blank",
        );
    };

    // Calculate hours from start/end if needed, or pull from DB if you added the column

    return (
        <div className="mt-4">
            <div className="flex gap-2 no-print mb-4">
                <button
                    onClick={handlePrint}
                    className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-sm transition"
                >
                    <Printer className="h-4 w-4" /> Print / PDF
                </button>
                <button
                    onClick={handleWhatsApp}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 py-2 rounded-lg text-sm transition"
                >
                    <Share2 className="h-4 w-4" /> Share
                </button>
            </div>

            <div className="print-area bg-white text-black p-4 rounded-lg max-w-[300px] mx-auto text-xs font-mono">
                <div className="text-center mb-4">
                    <h2 className="text-xl font-bold tracking-widest">
                        ALL IN ONE
                    </h2>
                    <p>Day Close Report</p>
                </div>

                <div className="flex justify-between">
                    <span>Working Date</span> <span>{data.business_date}</span>
                </div>
                <div className="flex justify-between">
                    <span>Total Working Hours</span>{" "}
                    <span>{data.working_hours || "8.90"}</span>
                </div>

                <h3 className="font-bold mt-4 mb-1">Transactions Detail:</h3>
                <div className="flex justify-between">
                    <span>Total Transactions</span>{" "}
                    <span>{data.total_transactions}</span>
                </div>
                <div className="flex justify-between">
                    <span>(+) Sale Transactions</span>{" "}
                    <span>{data.sale_count}</span>
                </div>
                <div className="flex justify-between">
                    <span>(+) Return Transactions</span>{" "}
                    <span>{data.return_count}</span>
                </div>

                <h3 className="font-bold mt-4 mb-1">Sales Detail:</h3>
                <div className="flex justify-between">
                    <span>Total Sales</span> <span>{data.total_sales}</span>
                </div>
                <div className="flex justify-between">
                    <span>(+) Cash Sale</span> <span>{data.cash_sales}</span>
                </div>
                <div className="flex justify-between">
                    <span>(+) Card Sale</span> <span>{data.card_sales}</span>
                </div>
                <div className="flex justify-between">
                    <span>(-) Sale Return</span>{" "}
                    <span>{data.total_returns}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-black mt-1 pt-1">
                    <span>Net Sale</span>{" "}
                    <span>
                        {Number(data.total_sales) - Number(data.total_returns)}
                    </span>
                </div>

                <h3 className="font-bold mt-4 mb-1">Cash Position:</h3>
                <div className="flex justify-between">
                    <span>(+) Opening Cash</span>{" "}
                    <span>{data.opening_balance}</span>
                </div>
                <div className="flex justify-between">
                    <span>(+) Net Cash Sale</span>{" "}
                    <span>{data.cash_sales}</span>
                </div>
                <div className="flex justify-between mt-2 font-bold border-t border-black pt-1">
                    <span>System Closing Cash</span>{" "}
                    <span>{data.expected_cash}</span>
                </div>
                <div className="flex justify-between mt-1">
                    <span>Cashier Closing Cash</span>{" "}
                    <span>{data.actual_cash}</span>
                </div>
                <div className="flex justify-between mt-1 font-bold border-t border-black border-double pt-1">
                    <span>Cash (Less)/Excess</span>{" "}
                    <span>{data.cash_difference}</span>
                </div>

                <div className="mt-8 pt-4 text-center text-[10px]">
                    <p>{new Date().toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
}
