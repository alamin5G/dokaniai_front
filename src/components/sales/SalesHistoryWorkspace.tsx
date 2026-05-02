"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cancelSale, listSales } from "@/lib/saleApi";
import type { Sale, PaymentMethod, PaymentStatus } from "@/types/sale";

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

const PAGE_SIZE = 20;

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    CASH: "Cash",
    CREDIT: "Credit",
    BKASH: "bKash",
    NAGAD: "Nagad",
    ROCKET: "Rocket",
    CARD: "Card",
    BANK: "Bank",
    MANUAL: "Manual",
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
    PAID: { label: "Paid", cls: "bg-green-100 text-green-800" },
    PARTIAL: { label: "Partial", cls: "bg-yellow-100 text-yellow-800" },
    DUE: { label: "Due", cls: "bg-orange-100 text-orange-800" },
    CANCELLED: { label: "Cancelled", cls: "bg-red-100 text-red-800" },
};

export default function SalesHistoryWorkspace({ businessId }: { businessId: string }) {
    const t = useTranslations("shop.sales.history");
    const locale = useLocale();
    const loc = resolveLocale(locale);
    const moneyFmt = new Intl.NumberFormat(loc, { maximumFractionDigits: 0 });

    const [sales, setSales] = useState<Sale[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [page, setPage] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<string | null>(null);

    // Cancel overlay state
    const [cancelTarget, setCancelTarget] = useState<Sale | null>(null);
    const [cancelReason, setCancelReason] = useState("");
    const [isCancelling, setIsCancelling] = useState(false);

    const loadSales = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await listSales(businessId, { page, size: PAGE_SIZE });
            setSales(result.content);
            setTotalPages(result.totalPages);
            setTotalElements(result.totalElements);
        } catch {
            setToast(t("messages.loadError", { defaultValue: "Failed to load sales." }));
        } finally {
            setIsLoading(false);
        }
    }, [businessId, page, t]);

    useEffect(() => {
        void loadSales();
    }, [loadSales]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(timer);
    }, [toast]);

    function formatMoney(value: number | null | undefined): string {
        return moneyFmt.format(value ?? 0);
    }

    function formatDate(value: string | null | undefined): string {
        if (!value) return "-";
        return new Intl.DateTimeFormat(loc, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        }).format(new Date(value));
    }

    function getPaymentLabel(method: PaymentMethod): string {
        try {
            return t(`payment.${method}`);
        } catch {
            return PAYMENT_METHOD_LABELS[method] ?? method;
        }
    }

    function getStatusBadge(status: PaymentStatus) {
        const badge = STATUS_BADGE[status];
        if (!badge) return { label: status, cls: "bg-gray-100 text-gray-800" };
        try {
            return { label: t(`status.${status}`, { defaultValue: badge.label }), cls: badge.cls };
        } catch {
            return badge;
        }
    }

    // ── Cancel handler ──
    async function handleCancelSale() {
        if (!cancelTarget) return;
        setIsCancelling(true);
        try {
            await cancelSale(businessId, cancelTarget.id, cancelReason.trim() || undefined);
            setToast(t("messages.cancelSuccess", { defaultValue: "Sale cancelled successfully." }));
            setCancelTarget(null);
            setCancelReason("");
            await loadSales();
        } catch {
            setToast(t("messages.cancelError", { defaultValue: "Failed to cancel sale." }));
        } finally {
            setIsCancelling(false);
        }
    }

    const canGoPrev = page > 0;
    const canGoNext = page < totalPages - 1;

    return (
        <div className="space-y-6">
            {toast && (
                <div className="fixed right-4 top-4 z-50 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg">
                    {toast}
                </div>
            )}

            <header className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-primary">
                    {t("title", { defaultValue: "Sales History" })}
                </h1>
                <p className="text-sm text-on-surface-variant">
                    {t("subtitle", { defaultValue: "View past sales and cancel if needed." })}
                </p>
            </header>

            {/* Stats */}
            <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    label={t("stats.totalSales", { defaultValue: "Total Sales" })}
                    value={String(totalElements)}
                />
                <StatCard
                    label={t("stats.currentPage", { defaultValue: "Page" })}
                    value={`${page + 1} / ${Math.max(totalPages, 1)}`}
                />
            </section>

            {/* Sales Table */}
            <section className="rounded-2xl bg-surface-container-lowest shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-surface-container text-on-surface-variant">
                            <tr>
                                <th className="px-5 py-3">{t("table.date", { defaultValue: "Date" })}</th>
                                <th className="px-5 py-3">{t("table.invoice", { defaultValue: "Invoice" })}</th>
                                <th className="px-5 py-3">{t("table.total", { defaultValue: "Total" })}</th>
                                <th className="px-5 py-3">{t("table.payment", { defaultValue: "Payment" })}</th>
                                <th className="px-5 py-3">{t("table.status", { defaultValue: "Status" })}</th>
                                <th className="px-5 py-3">{t("table.items", { defaultValue: "Items" })}</th>
                                <th className="px-5 py-3">{t("table.action", { defaultValue: "Action" })}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container">
                            {isLoading ? (
                                <tr>
                                    <td className="px-5 py-8 text-center text-on-surface-variant" colSpan={7}>
                                        Loading...
                                    </td>
                                </tr>
                            ) : sales.length === 0 ? (
                                <tr>
                                    <td className="px-5 py-8 text-center text-on-surface-variant" colSpan={7}>
                                        {t("table.empty", { defaultValue: "No sales found." })}
                                    </td>
                                </tr>
                            ) : (
                                sales.map((sale) => {
                                    const badge = getStatusBadge(sale.paymentStatus);
                                    const isCancelled = sale.paymentStatus === "CANCELLED";
                                    return (
                                        <tr
                                            key={sale.id}
                                            className={isCancelled ? "opacity-50 line-through" : ""}
                                        >
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                {formatDate(sale.saleDate)}
                                            </td>
                                            <td className="px-5 py-3 font-mono text-xs">
                                                {sale.invoiceNumber}
                                            </td>
                                            <td className="px-5 py-3 font-bold">৳{formatMoney(sale.totalAmount)}</td>
                                            <td className="px-5 py-3">{getPaymentLabel(sale.paymentMethod)}</td>
                                            <td className="px-5 py-3">
                                                <span
                                                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${badge.cls}`}
                                                >
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-on-surface-variant">
                                                {sale.items?.length ?? 0}
                                            </td>
                                            <td className="px-5 py-3">
                                                {!isCancelled ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setCancelTarget(sale)}
                                                        className="rounded-lg px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        {t("actions.cancel", { defaultValue: "Cancel" })}
                                                    </button>
                                                ) : (
                                                    <span className="text-xs font-bold text-on-surface-variant">
                                                        {t("actions.cancelled", { defaultValue: "Cancelled" })}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-surface-container px-5 py-3">
                        <span className="text-xs text-on-surface-variant">
                            {t("pagination.showing", { defaultValue: "Showing {from}–{to} of {total}" })
                                .replace("{from}", String(page * PAGE_SIZE + 1))
                                .replace("{to}", String(Math.min((page + 1) * PAGE_SIZE, totalElements)))
                                .replace("{total}", String(totalElements))}
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={!canGoPrev}
                                className="rounded-xl px-3 py-1.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container disabled:opacity-40 transition-colors"
                            >
                                {t("pagination.previous", { defaultValue: "Previous" })}
                            </button>
                            <button
                                type="button"
                                onClick={() => setPage((p) => p + 1)}
                                disabled={!canGoNext}
                                className="rounded-xl px-3 py-1.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container disabled:opacity-40 transition-colors"
                            >
                                {t("pagination.next", { defaultValue: "Next" })}
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {/* Cancel Sale Confirmation Overlay */}
            {cancelTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-on-surface">
                            ⚠️ {t("cancelOverlay.title", { defaultValue: "Cancel this sale?" })}
                        </h3>
                        <p className="mt-2 text-sm text-on-surface-variant">
                            {t("cancelOverlay.message", {
                                defaultValue:
                                    "Invoice {invoice} for ৳{amount} will be cancelled. Stock will be restored. This cannot be undone.",
                            })
                                .replace("{invoice}", cancelTarget.invoiceNumber)
                                .replace("{amount}", formatMoney(cancelTarget.totalAmount))}
                        </p>
                        <label className="mt-4 block">
                            <span className="mb-1 block text-xs font-bold text-on-surface-variant">
                                {t("cancelOverlay.reason", { defaultValue: "Reason" })}
                            </span>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder={t("cancelOverlay.reasonPlaceholder", {
                                    defaultValue: "Enter reason for cancellation...",
                                })}
                                rows={3}
                                className="w-full rounded-xl bg-surface-container px-4 py-3 text-sm resize-none"
                            />
                        </label>
                        <div className="mt-5 flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setCancelTarget(null);
                                    setCancelReason("");
                                }}
                                className="rounded-xl px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
                            >
                                {t("cancelOverlay.close", { defaultValue: "Go Back" })}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancelSale}
                                disabled={isCancelling}
                                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {isCancelling
                                    ? t("cancelOverlay.cancelling", { defaultValue: "Cancelling..." })
                                    : t("cancelOverlay.confirm", { defaultValue: "Yes, Cancel Sale" })}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-on-surface-variant">{label}</p>
            <p className="mt-1 text-2xl font-black text-primary">{value}</p>
        </div>
    );
}