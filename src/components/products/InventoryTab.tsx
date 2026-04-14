"use client";

import { useLocale, useTranslations } from "next-intl";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type { Product } from "@/types/product";
import type {
    InventoryAction,
    InventoryLog,
    InventorySummary,
    PagedInventoryLogs,
    StockAlertReport,
} from "@/types/inventory";
import {
    adjustInventory,
    getInventorySummary,
    getStockAlerts,
    listInventoryLogs,
} from "@/lib/inventoryApi";
import { listProducts } from "@/lib/productApi";

// ─── Helpers ─────────────────────────────────────────────

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

type SubTab = "alerts" | "logs" | "adjust";

interface ProductOption {
    id: string;
    name: string;
    stockQty: number;
}

// ─── Main Component ──────────────────────────────────────

interface InventoryTabProps {
    businessId: string;
}

export default function InventoryTab({ businessId }: InventoryTabProps) {
    const t = useTranslations("shop.products.inventory");
    const locale = useLocale();
    const loc = resolveLocale(locale);

    // Sub-tab
    const [activeSubTab, setActiveSubTab] = useState<SubTab>("alerts");

    // Summary
    const [summary, setSummary] = useState<InventorySummary[]>([]);
    const [summaryLoading, setSummaryLoading] = useState(true);

    // Stock Alerts
    const [alertReport, setAlertReport] = useState<StockAlertReport | null>(null);
    const [alertsLoading, setAlertsLoading] = useState(true);

    // Inventory Logs
    const [logs, setLogs] = useState<PagedInventoryLogs | null>(null);
    const [logsLoading, setLogsLoading] = useState(true);
    const [logAction, setLogAction] = useState<InventoryAction | "">("");
    const [logPage, setLogPage] = useState(0);

    // Adjust Stock form
    const [products, setProducts] = useState<ProductOption[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [adjustProductId, setAdjustProductId] = useState("");
    const [adjustAction, setAdjustAction] = useState<"RESTOCK" | "ADJUSTMENT">("RESTOCK");
    const [adjustQuantity, setAdjustQuantity] = useState("");
    const [adjustReason, setAdjustReason] = useState("");
    const [adjustSubmitting, setAdjustSubmitting] = useState(false);
    const [adjustNotice, setAdjustNotice] = useState<string | null>(null);
    const [adjustError, setAdjustError] = useState<string | null>(null);

    // Global error
    const [error, setError] = useState<string | null>(null);

    // ─── Load Summary ───────────────────────────────────
    const loadSummary = useCallback(async () => {
        setSummaryLoading(true);
        try {
            const data = await getInventorySummary(businessId);
            setSummary(data);
        } catch {
            setError(t("messages.loadError"));
        } finally {
            setSummaryLoading(false);
        }
    }, [businessId, t]);

    // ─── Load Alerts ────────────────────────────────────
    const loadAlerts = useCallback(async () => {
        setAlertsLoading(true);
        try {
            const data = await getStockAlerts(businessId);
            setAlertReport(data);
        } catch {
            setError(t("messages.loadError"));
        } finally {
            setAlertsLoading(false);
        }
    }, [businessId, t]);

    // ─── Load Logs ──────────────────────────────────────
    const loadLogs = useCallback(async () => {
        setLogsLoading(true);
        try {
            const data = await listInventoryLogs(businessId, {
                action: logAction || undefined,
                page: logPage,
                size: 15,
            });
            setLogs(data);
        } catch {
            setError(t("messages.loadError"));
        } finally {
            setLogsLoading(false);
        }
    }, [businessId, logAction, logPage, t]);

    // ─── Load Products for Adjust ───────────────────────
    const loadProducts = useCallback(async () => {
        setProductsLoading(true);
        try {
            const page = await listProducts(businessId, { page: 0, size: 200 });
            const options: ProductOption[] = page.content.map((p: Product) => ({
                id: p.id,
                name: p.name,
                stockQty: p.stockQty,
            }));
            setProducts(options);
        } catch {
            // Products are needed for adjust — show error inline
        } finally {
            setProductsLoading(false);
        }
    }, [businessId]);

    // ─── Effects ────────────────────────────────────────
    useEffect(() => {
        void loadSummary();
    }, [loadSummary]);

    useEffect(() => {
        if (activeSubTab === "alerts") void loadAlerts();
    }, [activeSubTab, loadAlerts]);

    useEffect(() => {
        if (activeSubTab === "logs") void loadLogs();
    }, [activeSubTab, loadLogs]);

    useEffect(() => {
        if (activeSubTab === "adjust" && products.length === 0) void loadProducts();
    }, [activeSubTab, loadProducts, products.length]);

    // Reset log page when filter changes
    useEffect(() => {
        setLogPage(0);
    }, [logAction]);

    // ─── Handle Adjust Submit ───────────────────────────
    async function handleAdjustSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!adjustProductId || !adjustQuantity || !adjustReason.trim()) return;

        setAdjustSubmitting(true);
        setAdjustError(null);
        setAdjustNotice(null);

        try {
            await adjustInventory(businessId, {
                productId: adjustProductId,
                quantity: Number(adjustQuantity),
                reason: adjustReason.trim(),
                action: adjustAction,
            });
            setAdjustNotice(t("messages.adjustSuccess"));
            setAdjustProductId("");
            setAdjustQuantity("");
            setAdjustReason("");
            // Reload products to reflect new stock
            await loadProducts();
            await loadSummary();
        } catch {
            setAdjustError(t("messages.adjustError"));
        } finally {
            setAdjustSubmitting(false);
        }
    }

    // ─── Formatters ─────────────────────────────────────
    const numberFormatter = new Intl.NumberFormat(loc, {
        maximumFractionDigits: 2,
    });

    function formatNum(value: number | null | undefined): string {
        return numberFormatter.format(value ?? 0);
    }

    function formatDate(dateStr: string): string {
        return new Intl.DateTimeFormat(loc, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(dateStr));
    }

    // ─── Action Badge Colors ────────────────────────────
    function actionBadge(action: InventoryAction): {
        label: string;
        className: string;
    } {
        switch (action) {
            case "SALE":
                return {
                    label: t("logs.sale"),
                    className:
                        "bg-blue-50 text-blue-700 ring-blue-600/20 ring-1 ring-inset",
                };
            case "RETURN":
                return {
                    label: t("logs.return"),
                    className:
                        "bg-amber-50 text-amber-700 ring-amber-600/20 ring-1 ring-inset",
                };
            case "RESTOCK":
                return {
                    label: t("logs.restock"),
                    className:
                        "bg-emerald-50 text-emerald-700 ring-emerald-600/20 ring-1 ring-inset",
                };
            case "ADJUSTMENT":
                return {
                    label: t("logs.adjustment"),
                    className:
                        "bg-purple-50 text-purple-700 ring-purple-600/20 ring-1 ring-inset",
                };
            case "INITIAL":
                return {
                    label: t("logs.initial"),
                    className:
                        "bg-slate-50 text-slate-700 ring-slate-600/20 ring-1 ring-inset",
                };
        }
    }

    // ─── Alert Status Badge ─────────────────────────────
    function alertStatusBadge(status: string): {
        label: string;
        className: string;
    } {
        switch (status) {
            case "OUT_OF_STOCK":
                return {
                    label: t("alerts.outOfStock"),
                    className: "bg-rose-50 text-rose-700",
                };
            case "LOW_STOCK":
                return {
                    label: t("alerts.lowStock"),
                    className: "bg-amber-50 text-amber-700",
                };
            case "REORDER_NEEDED":
                return {
                    label: t("alerts.reorderNeeded"),
                    className: "bg-blue-50 text-blue-700",
                };
            default:
                return {
                    label: status,
                    className: "bg-slate-50 text-slate-700",
                };
        }
    }

    // ─── Summary lookup helper ──────────────────────────
    function summaryByAction(action: InventoryAction): InventorySummary | undefined {
        return summary.find((s) => s.action === action);
    }

    // ─── Selected product for adjust ────────────────────
    const selectedProduct = products.find((p) => p.id === adjustProductId);

    // ─── Render ─────────────────────────────────────────
    const subTabs: { key: SubTab; label: string }[] = [
        { key: "alerts", label: t("tabs.alerts") },
        { key: "logs", label: t("tabs.logs") },
        { key: "adjust", label: t("tabs.adjust") },
    ];

    return (
        <div className="space-y-6">
            {/* Error banner */}
            {error && (
                <div className="rounded-2xl bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
                    {error}
                </div>
            )}

            {/* ─── Summary Cards ─────────────────────────── */}
            <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <SummaryCard
                    title={t("summary.totalSales")}
                    value={summaryByAction("SALE")?.totalQuantity ?? 0}
                    count={summaryByAction("SALE")?.count ?? 0}
                    loading={summaryLoading}
                    icon="📉"
                    loc={loc}
                />
                <SummaryCard
                    title={t("summary.totalReturns")}
                    value={summaryByAction("RETURN")?.totalQuantity ?? 0}
                    count={summaryByAction("RETURN")?.count ?? 0}
                    loading={summaryLoading}
                    icon="↩️"
                    loc={loc}
                />
                <SummaryCard
                    title={t("summary.totalRestocks")}
                    value={summaryByAction("RESTOCK")?.totalQuantity ?? 0}
                    count={summaryByAction("RESTOCK")?.count ?? 0}
                    loading={summaryLoading}
                    icon="📦"
                    loc={loc}
                />
                <SummaryCard
                    title={t("summary.totalAdjustments")}
                    value={summaryByAction("ADJUSTMENT")?.totalQuantity ?? 0}
                    count={summaryByAction("ADJUSTMENT")?.count ?? 0}
                    loading={summaryLoading}
                    icon="🔧"
                    loc={loc}
                />
            </section>

            {/* ─── Sub-tab Navigation ────────────────────── */}
            <div className="flex gap-2 border-b border-surface-container pb-0">
                {subTabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveSubTab(tab.key)}
                        className={`rounded-t-xl px-5 py-3 text-sm font-semibold transition ${activeSubTab === tab.key
                                ? "bg-surface-container-lowest text-primary shadow-sm"
                                : "text-on-surface-variant hover:text-on-surface"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ─── Stock Alerts Tab ──────────────────────── */}
            {activeSubTab === "alerts" && (
                <section className="space-y-4">
                    {/* Alert count badges */}
                    {alertReport && (
                        <div className="flex flex-wrap gap-3">
                            <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
                                <span className="h-2 w-2 rounded-full bg-rose-500" />
                                {t("alerts.outOfStock")}: {formatNum(alertReport.outOfStockCount)}
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
                                <span className="h-2 w-2 rounded-full bg-amber-500" />
                                {t("alerts.lowStock")}: {formatNum(alertReport.lowStockCount)}
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                                <span className="h-2 w-2 rounded-full bg-blue-500" />
                                {t("alerts.reorderNeeded")}: {formatNum(alertReport.reorderNeededCount)}
                            </span>
                        </div>
                    )}

                    {/* Alerts table */}
                    <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
                        {alertsLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        ) : !alertReport || alertReport.items.length === 0 ? (
                            <div className="px-6 py-16 text-center text-sm text-on-surface-variant">
                                {t("alerts.noAlerts")}
                            </div>
                        ) : (
                            <table className="min-w-full text-left">
                                <thead className="bg-surface-container-low text-sm font-bold text-on-surface-variant">
                                    <tr>
                                        <th className="px-6 py-4">{t("logs.product")}</th>
                                        <th className="px-6 py-4">SKU</th>
                                        <th className="px-6 py-4 text-right">
                                            {t("alerts.currentStock")}
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            {t("alerts.reorderPoint")}
                                        </th>
                                        <th className="px-6 py-4 text-center">
                                            {t("alerts.status")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-container">
                                    {alertReport.items.map((item) => {
                                        const badge = alertStatusBadge(item.status);
                                        return (
                                            <tr
                                                key={item.productId}
                                                className="hover:bg-surface-container-low transition-colors"
                                            >
                                                <td className="px-6 py-4 text-sm font-medium text-on-surface">
                                                    {item.productName}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-on-surface-variant">
                                                    {item.sku || "—"}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-semibold text-on-surface">
                                                    {formatNum(item.currentStock)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-on-surface-variant">
                                                    {item.reorderPoint != null
                                                        ? formatNum(item.reorderPoint)
                                                        : "—"}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span
                                                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                                                    >
                                                        {badge.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>
            )}

            {/* ─── Inventory Log Tab ─────────────────────── */}
            {activeSubTab === "logs" && (
                <section className="space-y-4">
                    {/* Filter */}
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <select
                            value={logAction}
                            onChange={(e) =>
                                setLogAction(e.target.value as InventoryAction | "")
                            }
                            className="rounded-full bg-surface px-4 py-3 text-sm text-on-surface-variant"
                        >
                            <option value="">{t("logs.allActions")}</option>
                            <option value="SALE">{t("logs.sale")}</option>
                            <option value="RETURN">{t("logs.return")}</option>
                            <option value="RESTOCK">{t("logs.restock")}</option>
                            <option value="ADJUSTMENT">{t("logs.adjustment")}</option>
                            <option value="INITIAL">{t("logs.initial")}</option>
                        </select>
                    </div>

                    {/* Logs table */}
                    <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
                        {logsLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        ) : !logs || logs.content.length === 0 ? (
                            <div className="px-6 py-16 text-center text-sm text-on-surface-variant">
                                {t("logs.noLogs")}
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left">
                                        <thead className="bg-surface-container-low text-sm font-bold text-on-surface-variant">
                                            <tr>
                                                <th className="px-6 py-4">{t("logs.date")}</th>
                                                <th className="px-6 py-4">{t("logs.product")}</th>
                                                <th className="px-6 py-4 text-center">
                                                    {t("logs.change")}
                                                </th>
                                                <th className="px-6 py-4 text-right">
                                                    {t("logs.before")}
                                                </th>
                                                <th className="px-6 py-4 text-right">
                                                    {t("logs.after")}
                                                </th>
                                                <th className="px-6 py-4">{t("logs.reason")}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-surface-container">
                                            {logs.content.map((log: InventoryLog) => {
                                                const badge = actionBadge(log.changeType);
                                                return (
                                                    <tr
                                                        key={log.id}
                                                        className="hover:bg-surface-container-low transition-colors"
                                                    >
                                                        <td className="px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap">
                                                            {formatDate(log.createdAt)}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-medium text-on-surface">
                                                            {log.productId.substring(0, 8)}…
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span
                                                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                                                            >
                                                                {badge.label}
                                                                <span className="font-mono">
                                                                    {log.quantityChange > 0
                                                                        ? `+${log.quantityChange}`
                                                                        : log.quantityChange}
                                                                </span>
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-sm text-on-surface-variant">
                                                            {formatNum(log.quantityBefore)}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-sm font-semibold text-on-surface">
                                                            {formatNum(log.quantityAfter)}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-on-surface-variant">
                                                            {log.reason || "—"}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {logs.totalPages > 1 && (
                                    <div className="flex items-center justify-between border-t border-surface-container px-6 py-4">
                                        <p className="text-sm text-on-surface-variant">
                                            {t("logs.showing")} {logs.number * logs.size + 1}–
                                            {Math.min(
                                                (logs.number + 1) * logs.size,
                                                logs.totalElements
                                            )}{" "}
                                            {t("logs.of")} {logs.totalElements} {t("logs.entries")}
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                disabled={logs.first}
                                                onClick={() => setLogPage((p) => Math.max(0, p - 1))}
                                                className="rounded-full bg-surface px-4 py-2 text-sm font-medium text-on-surface-variant transition hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                ←
                                            </button>
                                            <button
                                                type="button"
                                                disabled={logs.last}
                                                onClick={() => setLogPage((p) => p + 1)}
                                                className="rounded-full bg-surface px-4 py-2 text-sm font-medium text-on-surface-variant transition hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                →
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </section>
            )}

            {/* ─── Adjust Stock Tab ──────────────────────── */}
            {activeSubTab === "adjust" && (
                <section className="space-y-4">
                    {/* Notices */}
                    {adjustNotice && (
                        <div className="rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
                            {adjustNotice}
                        </div>
                    )}
                    {adjustError && (
                        <div className="rounded-2xl bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
                            {adjustError}
                        </div>
                    )}

                    <div className="overflow-hidden rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-on-surface">
                            {t("adjust.title")}
                        </h3>
                        <p className="mt-1 text-sm text-on-surface-variant">
                            {t("adjust.subtitle")}
                        </p>

                        <form
                            onSubmit={handleAdjustSubmit}
                            className="mt-6 space-y-5"
                        >
                            {/* Product select */}
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium text-on-surface-variant">
                                    {t("adjust.selectProduct")}
                                </span>
                                <select
                                    value={adjustProductId}
                                    onChange={(e) => setAdjustProductId(e.target.value)}
                                    required
                                    disabled={productsLoading}
                                    className="w-full rounded-xl border border-surface-container bg-white px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="">
                                        {productsLoading
                                            ? "Loading..."
                                            : t("adjust.searchProduct")}
                                    </option>
                                    {products.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} (Stock: {formatNum(p.stockQty)})
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {/* Current stock display */}
                            {selectedProduct && (
                                <div className="rounded-xl bg-surface-container px-4 py-3 text-sm">
                                    <span className="font-medium text-on-surface-variant">
                                        {t("adjust.currentStock")}:
                                    </span>{" "}
                                    <span className="font-bold text-on-surface">
                                        {formatNum(selectedProduct.stockQty)}
                                    </span>
                                </div>
                            )}

                            {/* Action type */}
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium text-on-surface-variant">
                                    {t("adjust.action")}
                                </span>
                                <div className="flex gap-3">
                                    {(
                                        [
                                            ["RESTOCK", t("adjust.restock")],
                                            ["ADJUSTMENT", t("adjust.adjustment")],
                                        ] as const
                                    ).map(([value, label]) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setAdjustAction(value)}
                                            className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${adjustAction === value
                                                    ? "border-primary bg-primary/5 text-primary"
                                                    : "border-surface-container bg-white text-on-surface-variant hover:border-primary/30"
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </label>

                            {/* Quantity */}
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium text-on-surface-variant">
                                    {t("adjust.quantity")}
                                </span>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={adjustQuantity}
                                    onChange={(e) => setAdjustQuantity(e.target.value)}
                                    required
                                    placeholder={t("adjust.quantityPlaceholder")}
                                    className="w-full rounded-xl border border-surface-container bg-white px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                            </label>

                            {/* Reason */}
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium text-on-surface-variant">
                                    {t("adjust.reason")}
                                </span>
                                <textarea
                                    value={adjustReason}
                                    onChange={(e) => setAdjustReason(e.target.value)}
                                    required
                                    rows={3}
                                    placeholder={t("adjust.reasonPlaceholder")}
                                    className="w-full rounded-xl border border-surface-container bg-white px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                                />
                            </label>

                            {/* Submit */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={adjustSubmitting || !adjustProductId}
                                    className="rounded-full bg-gradient-to-br from-primary to-primary-container px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(0,55,39,0.18)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {adjustSubmitting
                                        ? "..."
                                        : t("adjust.submit")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAdjustProductId("");
                                        setAdjustQuantity("");
                                        setAdjustReason("");
                                        setAdjustAction("RESTOCK");
                                        setAdjustError(null);
                                        setAdjustNotice(null);
                                    }}
                                    className="rounded-full bg-surface px-5 py-3 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-high"
                                >
                                    {t("adjust.cancel")}
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            )}
        </div>
    );
}

// ─── Summary Card ────────────────────────────────────────

function SummaryCard({
    title,
    value,
    count,
    loading,
    icon,
    loc,
}: {
    title: string;
    value: number;
    count: number;
    loading: boolean;
    icon: string;
    loc: string;
}) {
    const fmt = new Intl.NumberFormat(loc, { maximumFractionDigits: 2 });

    return (
        <article className="rounded-[24px] bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-center gap-2">
                <span className="text-lg">{icon}</span>
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    {title}
                </p>
            </div>
            {loading ? (
                <div className="mt-3 h-7 w-20 animate-pulse rounded-lg bg-surface-container" />
            ) : (
                <>
                    <p className="mt-3 text-2xl font-black text-on-surface">
                        {fmt.format(value)}
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                        {fmt.format(count)} transactions
                    </p>
                </>
            )}
        </article>
    );
}
