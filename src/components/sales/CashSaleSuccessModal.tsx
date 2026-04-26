"use client";

import { useState } from "react";
import type { SaleCreatedResponse } from "@/types/sale";

interface CashSaleSuccessModalProps {
    result: SaleCreatedResponse;
    onClose: () => void;
}

export default function CashSaleSuccessModal({
    result,
    onClose,
}: CashSaleSuccessModalProps) {
    const [closing, setClosing] = useState(false);

    const handleClose = () => {
        setClosing(true);
        setTimeout(onClose, 200); // fade-out animation
    };

    const formatTk = (n: number) =>
        `৳ ${n.toLocaleString("bn-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 transition-opacity duration-200 ${closing ? "opacity-0" : "opacity-100"}`}
            onClick={handleClose}
        >
            <div
                className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Success Header ── */}
                <div className="mb-4 text-center">
                    <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                        <svg
                            className="h-8 w-8 text-green-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">
                        বিক্রি সফল!
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                        ইনভয়েস: {result.invoiceNumber}
                    </p>
                </div>

                {/* ── Sale Details ── */}
                <div className="space-y-2 rounded-xl bg-gray-50 p-4 text-sm">
                    <Row label="সাবটোটাল" value={formatTk(result.subtotal)} />
                    {result.totalDiscount > 0 && (
                        <Row
                            label="ডিসকাউন্ট"
                            value={`−${formatTk(result.totalDiscount)}`}
                            className="text-red-600"
                        />
                    )}
                    <div className="border-t border-gray-200 pt-2">
                        <Row
                            label="মোট"
                            value={formatTk(result.totalAmount)}
                            className="font-bold text-base"
                        />
                    </div>
                    <Row
                        label="লাভ"
                        value={formatTk(result.profit)}
                        className={result.profit >= 0 ? "text-green-700" : "text-red-600"}
                    />
                </div>

                {/* ── Today's Summary ── */}
                {result.todaySummary && (
                    <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs">
                        <p className="mb-1.5 font-semibold text-blue-800">
                            📊 আজকের সারসংক্ষেপ
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-blue-900">
                            <span>মোট বিক্রি:</span>
                            <span className="text-left font-medium">
                                {result.todaySummary.salesCount} টি
                            </span>
                            <span>আয়:</span>
                            <span className="text-left font-medium">
                                {formatTk(result.todaySummary.totalRevenue)}
                            </span>
                            <span>লাভ:</span>
                            <span className="text-left font-medium">
                                {formatTk(result.todaySummary.totalProfit)}
                            </span>
                        </div>
                    </div>
                )}

                {/* ── Close Button ── */}
                <button
                    onClick={handleClose}
                    className="mt-4 w-full rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 active:scale-[0.98]"
                >
                    ঠিক আছে
                </button>
            </div>
        </div>
    );
}

/* ── Helper ── */
function Row({
    label,
    value,
    className = "",
}: {
    label: string;
    value: string;
    className?: string;
}) {
    return (
        <div className={`flex items-center justify-between ${className}`}>
            <span className="text-gray-600">{label}</span>
            <span>{value}</span>
        </div>
    );
}