import { useRef } from "react";
import { Printer, Share2 } from "lucide-react";
import type { ShiftDetail } from "../types";

export default function ShiftReceipt({ shift }: { shift: ShiftDetail }) {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    const handleWhatsApp = () => {
        const text = `*ALL IN ONE*\n*Shift Close Report*\n\n*Cash Denomination:*\n5000: ${shift.denominations?.find((d) => d.denomination_type === "CLOSING")?.d5000 || 0}\n1000: ${shift.denominations?.find((d) => d.denomination_type === "CLOSING")?.d1000 || 0}\n...\n\n*Accounts:*\nCheck system for full breakdown.`;
        window.open(
            `https://wa.me/?text=${encodeURIComponent(text)}`,
            "_blank",
        );
    };

    return (
        <div className="mt-4">
            {/* Buttons (Hidden on print) */}
            <div className="flex gap-2 no-print mb-4">
                <button
                    onClick={handlePrint}
                    className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-sm transition"
                >
                    <Printer className="h-4 w-4" /> Print / Save PDF
                </button>
                <button
                    onClick={handleWhatsApp}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 py-2 rounded-lg text-sm transition"
                >
                    <Share2 className="h-4 w-4" /> Share
                </button>
            </div>

            {/* The Actual Receipt */}
            <div className="print-area bg-white text-black p-4 rounded-lg max-w-[300px] mx-auto text-xs font-mono">
                <div className="text-center mb-4">
                    <h2 className="text-xl font-bold tracking-widest">
                        ALL IN ONE
                    </h2>
                    <p>Shift Close Report</p>
                </div>

                <h3 className="font-bold border-b border-black pb-1 mb-2">
                    Cash Denomination:
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-4">
                    <div className="flex justify-between">
                        <span>5000</span>{" "}
                        <span>
                            {shift.denominations?.find(
                                (d) => d.denomination_type === "CLOSING",
                            )?.d5000 || 0}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>1000</span>{" "}
                        <span>
                            {shift.denominations?.find(
                                (d) => d.denomination_type === "CLOSING",
                            )?.d1000 || 0}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>500</span>{" "}
                        <span>
                            {shift.denominations?.find(
                                (d) => d.denomination_type === "CLOSING",
                            )?.d500 || 0}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>100</span>{" "}
                        <span>
                            {shift.denominations?.find(
                                (d) => d.denomination_type === "CLOSING",
                            )?.d100 || 0}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>50</span>{" "}
                        <span>
                            {shift.denominations?.find(
                                (d) => d.denomination_type === "CLOSING",
                            )?.d50 || 0}
                        </span>
                    </div>
                </div>

                <h3 className="font-bold border-b border-black pb-1 mb-2">
                    Cash & Bank Account Detail:
                </h3>
                <div className="flex justify-between font-bold mb-1">
                    <span>A / C Name</span>
                    <span>Drop Amount</span>
                </div>
                {shift.account_summary?.map((acc, i) => (
                    <div key={i} className="flex justify-between mb-1">
                        <span>{acc.account_name}</span>
                        <span>{acc.total_amount}</span>
                    </div>
                ))}

                <div className="mt-8 pt-4 border-t border-black border-dashed text-center">
                    <p className="mb-6">_______________________</p>
                    <p>Signature Cashier</p>
                    <p className="mt-4 mb-6">_______________________</p>
                    <p>Signature Branch Manager</p>
                    <p className="mt-6">
                        {new Date(
                            shift.end_time || Date.now(),
                        ).toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    );
}
