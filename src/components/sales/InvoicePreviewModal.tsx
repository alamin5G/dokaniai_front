"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { downloadInvoice } from "@/lib/saleApi";
import type { Sale } from "@/types/sale";

interface InvoicePreviewModalProps {
    businessId: string;
    sale: Sale;
    onClose: () => void;
}

export default function InvoicePreviewModal({ businessId, sale, onClose }: InvoicePreviewModalProps) {
    const t = useTranslations("shop.sales.history");
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch PDF on mount
    useEffect(() => {
        let revoked = false;
        setIsLoading(true);
        setError(null);

        downloadInvoice(businessId, sale.id)
            .then((blob) => {
                if (revoked) return;
                const url = URL.createObjectURL(blob);
                setPdfUrl(url);
            })
            .catch(() => {
                if (revoked) return;
                setError(t("messages.invoiceError", { defaultValue: "Failed to load invoice." }));
            })
            .finally(() => {
                if (!revoked) setIsLoading(false);
            });

        return () => {
            revoked = true;
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [businessId, sale.id]);

    // Close on Escape
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [onClose]);

    function handleDownload() {
        if (!pdfUrl) return;
        const a = document.createElement("a");
        a.href = pdfUrl;
        a.download = `${sale.invoiceNumber || "invoice"}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    async function handleShare() {
        const shareData = {
            title: `Invoice ${sale.invoiceNumber}`,
            text: [
                `Invoice: ${sale.invoiceNumber}`,
                `Date: ${sale.saleDate ? new Date(sale.saleDate).toLocaleString() : ""}`,
                `Customer: ${sale.customerName || "Walk-in"}`,
                `Total: ৳${sale.totalAmount ?? 0}`,
                `Payment: ${sale.paymentMethod}`,
                `Status: ${sale.paymentStatus}`,
            ].join("\n"),
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch {
                // User cancelled or share failed — ignore
            }
        } else {
            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(shareData.text);
                alert("Invoice details copied to clipboard!");
            } catch {
                // Fallback failed — ignore
            }
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div>
                        <h3 className="text-lg font-bold text-on-surface">
                            {t("invoicePreview.title", { defaultValue: "Invoice Preview" })}
                        </h3>
                        <p className="text-xs text-on-surface-variant font-mono">{sale.invoiceNumber}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* PDF Preview */}
                <div className="flex-1 overflow-hidden p-4">
                    {isLoading ? (
                        <div className="flex h-64 items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                <p className="text-sm text-on-surface-variant">
                                    {t("invoicePreview.loading", { defaultValue: "Loading invoice..." })}
                                </p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex h-64 items-center justify-center">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    ) : (
                        <iframe
                            src={pdfUrl ?? undefined}
                            className="h-[60vh] w-full rounded-lg border bg-gray-100"
                            title={`Invoice ${sale.invoiceNumber}`}
                        />
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center gap-3 border-t px-6 py-4">
                    <button
                        type="button"
                        onClick={handleDownload}
                        disabled={!pdfUrl}
                        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                        📥 {t("invoicePreview.download", { defaultValue: "Download" })}
                    </button>
                    <button
                        type="button"
                        onClick={handleShare}
                        className="flex items-center gap-2 rounded-xl bg-surface-container px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                    >
                        📤 {t("invoicePreview.share", { defaultValue: "Share" })}
                    </button>
                    <div className="flex-1" />
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
                    >
                        {t("invoicePreview.close", { defaultValue: "Close" })}
                    </button>
                </div>
            </div>
        </div>
    );
}