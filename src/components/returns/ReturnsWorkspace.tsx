"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createSaleReturn, getReturnStats, listSaleReturns } from "@/lib/saleReturnApi";
import { useSales } from "@/hooks/useSales";
import type { Sale, SaleItem } from "@/types/sale";
import type { ReturnStatsResponse, ReturnType, SaleReturn } from "@/types/saleReturn";

const RETURN_TYPES: ReturnType[] = ["PARTIAL", "DEFECTIVE", "FULL"];

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

export default function ReturnsWorkspace({ businessId }: { businessId: string }) {
    const t = useTranslations("shop.sales.returns");
    const locale = useLocale();
    const loc = resolveLocale(locale);
    const moneyFmt = new Intl.NumberFormat(loc, { maximumFractionDigits: 0 });

    const { sales, isLoading: salesLoading, mutate: mutateSales } = useSales(businessId, {
        page: 0,
        size: 20,
    });

    const [returns, setReturns] = useState<SaleReturn[]>([]);
    const [stats, setStats] = useState<ReturnStatsResponse | null>(null);
    const [selectedSaleId, setSelectedSaleId] = useState("");
    const [selectedItemId, setSelectedItemId] = useState("");
    const [returnType, setReturnType] = useState<ReturnType>("PARTIAL");
    const [quantity, setQuantity] = useState("1");
    const [reason, setReason] = useState("");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingReturns, setIsLoadingReturns] = useState(true);
    const [toast, setToast] = useState<string | null>(null);

    const selectedSale = useMemo(
        () => sales.find((sale) => sale.id === selectedSaleId) ?? null,
        [sales, selectedSaleId],
    );

    const selectedItem = useMemo(
        () => selectedSale?.items?.find((item) => item.id === selectedItemId) ?? null,
        [selectedSale, selectedItemId],
    );

    const refundPreview = useMemo(() => {
        if (returnType === "FULL") return selectedSale?.totalAmount ?? 0;
        const qty = Number(quantity);
        if (!selectedItem || Number.isNaN(qty) || qty <= 0) return 0;
        return selectedItem.unitPrice * Math.min(qty, selectedItem.quantity);
    }, [quantity, returnType, selectedItem, selectedSale]);

    const loadReturnData = useCallback(async () => {
        setIsLoadingReturns(true);
        try {
            const [returnList, returnStats] = await Promise.all([
                listSaleReturns(businessId, { page: 0, size: 20 }),
                getReturnStats(businessId),
            ]);
            setReturns(returnList.content);
            setStats(returnStats);
        } catch {
            setToast(t("messages.error"));
        } finally {
            setIsLoadingReturns(false);
        }
    }, [businessId, t]);

    useEffect(() => {
        void loadReturnData();
    }, [loadReturnData]);

    useEffect(() => {
        if (!selectedSaleId && sales.length > 0) {
            setSelectedSaleId(sales[0].id);
        }
    }, [sales, selectedSaleId]);

    useEffect(() => {
        const firstItem = selectedSale?.items?.[0];
        setSelectedItemId(firstItem?.id ?? "");
        setQuantity(firstItem ? String(Math.min(1, firstItem.quantity)) : "1");
    }, [selectedSaleId, selectedSale]);

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
        return new Intl.DateTimeFormat(loc, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
            .format(new Date(value));
    }

    function saleLabel(sale: Sale): string {
        const customer = sale.customerId ? sale.customerId.slice(0, 8) : t("walkInCustomer");
        return `${sale.invoiceNumber} - ${customer} - ৳${formatMoney(sale.totalAmount)}`;
    }

    function itemLabel(item: SaleItem): string {
        return `${item.productNameSnapshot} (${item.quantity} x ৳${formatMoney(item.unitPrice)})`;
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (!selectedSale) return;
        setIsSubmitting(true);
        try {
            const qty = Number(quantity);
            await createSaleReturn(businessId, {
                saleId: selectedSale.id,
                returnType,
                reason: reason.trim() || undefined,
                notes: notes.trim() || undefined,
                items: returnType === "FULL" || !selectedItem
                    ? undefined
                    : [{
                        saleItemId: selectedItem.id,
                        productId: selectedItem.productId ?? "",
                        quantity: Math.min(qty, selectedItem.quantity),
                        refundAmount: refundPreview,
                    }],
            });
            setToast(t("messages.created"));
            setReason("");
            setNotes("");
            await Promise.all([loadReturnData(), mutateSales()]);
        } catch {
            setToast(t("messages.error"));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="space-y-6">
            {toast && (
                <div className="fixed right-4 top-4 z-50 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg">
                    {toast}
                </div>
            )}

            <header className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-primary">{t("workspace.title")}</h1>
                <p className="text-sm text-on-surface-variant">{t("workspace.subtitle")}</p>
            </header>

            <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label={t("stats.totalReturns")} value={String(stats?.totalReturns ?? 0)} />
                <StatCard label={t("stats.totalRefund")} value={`৳${formatMoney(stats?.totalRefundAmount)}`} />
                <StatCard label={t("stats.defectiveReturns")} value={String(stats?.defectiveReturns ?? 0)} />
                <StatCard label={t("stats.stockRestored")} value={formatMoney(stats?.totalStockRestored)} />
            </section>

            {(stats?.abuseAlerts?.length ?? 0) > 0 && (
                <section className="rounded-2xl bg-error-container p-5 text-on-error-container">
                    <div className="mb-3 flex items-center gap-2 font-bold">
                        <span className="material-symbols-outlined">warning</span>
                        {t("abuse.title")}
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                        {stats?.abuseAlerts?.map((alert) => (
                            <div key={`${alert.type}-${alert.referenceId}`} className="rounded-xl bg-white/50 p-3 text-sm">
                                <p className="font-bold">{alert.label}</p>
                                <p>{t("abuse.detail", { count: alert.returnCount, amount: formatMoney(alert.refundAmount), severity: alert.severity })}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
                <form onSubmit={handleSubmit} className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm space-y-5">
                    <div>
                        <h2 className="text-lg font-bold text-on-surface">{t("title")}</h2>
                        <p className="text-sm text-on-surface-variant">{t("subtitle")}</p>
                    </div>

                    <label className="block">
                        <span className="mb-1 block text-xs font-bold text-on-surface-variant">{t("form.sale")}</span>
                        <select
                            value={selectedSaleId}
                            onChange={(event) => setSelectedSaleId(event.target.value)}
                            className="w-full rounded-xl bg-surface-container px-4 py-3 text-sm"
                            disabled={salesLoading || sales.length === 0}
                            required
                        >
                            {sales.map((sale) => (
                                <option key={sale.id} value={sale.id}>{saleLabel(sale)}</option>
                            ))}
                        </select>
                    </label>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {RETURN_TYPES.map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setReturnType(type)}
                                className={`rounded-xl px-4 py-3 text-sm font-bold transition-colors ${returnType === type
                                    ? "bg-primary text-white"
                                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                                    }`}
                            >
                                {t(`returnType.${type}`)}
                            </button>
                        ))}
                    </div>

                    {returnType !== "FULL" && (
                        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_10rem]">
                            <label className="block">
                                <span className="mb-1 block text-xs font-bold text-on-surface-variant">{t("form.item")}</span>
                                <select
                                    value={selectedItemId}
                                    onChange={(event) => setSelectedItemId(event.target.value)}
                                    className="w-full rounded-xl bg-surface-container px-4 py-3 text-sm"
                                    required
                                >
                                    {selectedSale?.items?.map((item) => (
                                        <option key={item.id} value={item.id}>{itemLabel(item)}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-xs font-bold text-on-surface-variant">{t("table.quantity")}</span>
                                <input
                                    type="number"
                                    min="0.001"
                                    max={selectedItem?.quantity ?? 1}
                                    step="0.001"
                                    value={quantity}
                                    onChange={(event) => setQuantity(event.target.value)}
                                    className="w-full rounded-xl bg-surface-container px-4 py-3 text-sm"
                                    required
                                />
                            </label>
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="block">
                            <span className="mb-1 block text-xs font-bold text-on-surface-variant">{t("form.reason")}</span>
                            <input
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                                placeholder={t("form.reasonPlaceholder")}
                                className="w-full rounded-xl bg-surface-container px-4 py-3 text-sm"
                            />
                        </label>
                        <label className="block">
                            <span className="mb-1 block text-xs font-bold text-on-surface-variant">{t("form.notes")}</span>
                            <input
                                value={notes}
                                onChange={(event) => setNotes(event.target.value)}
                                placeholder={t("form.notesPlaceholder")}
                                className="w-full rounded-xl bg-surface-container px-4 py-3 text-sm"
                            />
                        </label>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-surface-container px-4 py-3">
                        <span className="text-sm font-bold text-on-surface-variant">{t("form.refundPreview")}</span>
                        <span className="text-xl font-black text-primary">৳{formatMoney(refundPreview)}</span>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !selectedSale || (returnType !== "FULL" && !selectedItem)}
                        className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                        {isSubmitting ? t("form.submitting") : t("form.submit")}
                    </button>
                </form>

                <aside className="space-y-4">
                    <SummaryList title={t("analytics.topProducts")}>
                        {(stats?.topReturnedProducts ?? []).length === 0 ? (
                            <EmptyLine label={t("analytics.noProductData")} />
                        ) : stats?.topReturnedProducts?.map((product) => (
                            <MetricLine key={product.productId} label={product.productName} value={`${product.returnCount} / ৳${formatMoney(product.refundAmount)}`} />
                        ))}
                    </SummaryList>
                    <SummaryList title={t("analytics.topCustomers")}>
                        {(stats?.topReturningCustomers ?? []).length === 0 ? (
                            <EmptyLine label={t("analytics.noCustomerData")} />
                        ) : stats?.topReturningCustomers?.map((customer) => (
                            <MetricLine key={customer.customerId} label={customer.customerName} value={`${customer.returnCount} / ৳${formatMoney(customer.refundAmount)}`} />
                        ))}
                    </SummaryList>
                </aside>
            </section>

            <section className="rounded-2xl bg-surface-container-lowest shadow-sm">
                <div className="border-b border-surface-container p-5">
                    <h2 className="text-lg font-bold text-on-surface">{t("workspace.recent")}</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-surface-container text-on-surface-variant">
                            <tr>
                                <th className="px-5 py-3">{t("table.date")}</th>
                                <th className="px-5 py-3">{t("table.sale")}</th>
                                <th className="px-5 py-3">{t("table.type")}</th>
                                <th className="px-5 py-3">{t("table.quantity")}</th>
                                <th className="px-5 py-3">{t("table.refund")}</th>
                                <th className="px-5 py-3">{t("table.reason")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container">
                            {isLoadingReturns ? (
                                <tr><td className="px-5 py-8 text-center text-on-surface-variant" colSpan={6}>Loading...</td></tr>
                            ) : returns.length === 0 ? (
                                <tr><td className="px-5 py-8 text-center text-on-surface-variant" colSpan={6}>{t("pagination.noResults")}</td></tr>
                            ) : returns.map((ret) => (
                                <tr key={ret.id}>
                                    <td className="px-5 py-3">{formatDate(ret.returnDate)}</td>
                                    <td className="px-5 py-3 font-mono text-xs">{ret.saleId.slice(0, 8)}</td>
                                    <td className="px-5 py-3">{t(`returnType.${ret.returnType}`)}</td>
                                    <td className="px-5 py-3">{formatMoney(ret.quantity)}</td>
                                    <td className="px-5 py-3 font-bold">৳{formatMoney(ret.refundAmount)}</td>
                                    <td className="px-5 py-3 max-w-[18rem] truncate">{ret.reason || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
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

function SummaryList({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-on-surface">{title}</h3>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

function MetricLine({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-container px-3 py-2">
            <span className="truncate text-sm text-on-surface">{label}</span>
            <span className="whitespace-nowrap text-xs font-bold text-primary">{value}</span>
        </div>
    );
}

function EmptyLine({ label }: { label: string }) {
    return <p className="rounded-xl bg-surface-container px-3 py-3 text-sm text-on-surface-variant">{label}</p>;
}
