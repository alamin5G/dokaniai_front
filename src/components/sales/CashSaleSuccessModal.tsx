"use client";

import { useMemo, useState } from "react";
import type { CartItem, SaleCreatedResponse } from "@/types/sale";
import type { InvoiceBusinessInfo } from "@/lib/invoiceShare";
import { formatInvoiceText, buildWhatsAppInvoiceLink } from "@/lib/invoiceShare";
import { downloadInvoice } from "@/lib/saleApi";

interface CashSaleSuccessModalProps {
    result: SaleCreatedResponse;
    cartItems: CartItem[];
    businessInfo: InvoiceBusinessInfo;
    businessId: string;
    onClose: () => void;
}

export default function CashSaleSuccessModal({
    result,
    cartItems,
    businessInfo,
    businessId,
    onClose,
}: CashSaleSuccessModalProps) {
    const [closing, setClosing] = useState(false);

    const handleClose = () => {
        setClosing(true);
        setTimeout(onClose, 200); // fade-out animation
    };

    const formatTk = (n: number) =>
        `৳ ${n.toLocaleString("bn-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

    // Invoice sharing
    const invoiceText = useMemo(
        () => formatInvoiceText(result, cartItems, businessInfo),
        [result, cartItems, businessInfo],
    );
    const whatsappLink = useMemo(
        () => buildWhatsAppInvoiceLink(invoiceText, result.customerPhone),
        [invoiceText, result.customerPhone],
    );
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    async function handlePdfDownload() {
        setDownloadingPdf(true);
        try {
            const blob = await downloadInvoice(businessId, result.id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `invoice-${result.invoiceNumber || result.id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("[CashSaleModal] PDF download failed:", err);
        } finally {
            setDownloadingPdf(false);
        }
    }

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

                {/* ── Share / Download Actions ── */}
                <div className="mt-3 space-y-2">
                    <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2 text-sm font-semibold text-white transition hover:bg-[#1da851] active:scale-[0.98]"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        ইনভয়েস শেয়ার করুন
                    </a>
                    <button
                        onClick={handlePdfDownload}
                        disabled={downloadingPdf}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {downloadingPdf ? "ডাউনলোড হচ্ছে..." : "PDF ডাউনলোড"}
                    </button>
                </div>

                {/* ── Close Button ── */}
                <button
                    onClick={handleClose}
                    className="mt-3 w-full rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 active:scale-[0.98]"
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