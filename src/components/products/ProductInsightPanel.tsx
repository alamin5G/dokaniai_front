"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { getStockAlerts } from "@/lib/inventoryApi";
import { generateAIInsights, getAIInsights, type AIInsight } from "@/lib/productAnalyticsApi";
import type { StockAlertItem, StockAlertReport } from "@/types/inventory";
import type { Product } from "@/types/product";

interface ProductInsightPanelProps {
    businessId: string;
    products: Product[];
    lowStockProducts: Product[];
    onEdit: (product: Product) => void;
}

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

export default function ProductInsightPanel({
    businessId,
    products,
    lowStockProducts,
    onEdit,
}: ProductInsightPanelProps) {
    const t = useTranslations("shop.products");
    const locale = useLocale();
    const loc = resolveLocale(locale);

    const qtyFormatter = new Intl.NumberFormat(loc, {
        maximumFractionDigits: 3,
    });

    function formatQty(value: number | null | undefined): string {
        return qtyFormatter.format(value ?? 0);
    }

    const [alertReport, setAlertReport] = useState<StockAlertReport | null>(null);
    const [stockoutInsights, setStockoutInsights] = useState<AIInsight[]>([]);

    useEffect(() => {
        let cancelled = false;

        async function loadAlerts() {
            try {
                await generateAIInsights(businessId);
                const [report, insights] = await Promise.all([
                    getStockAlerts(businessId),
                    getAIInsights(businessId, { type: "STOCKOUT_WARNING", unread: true }),
                ]);
                if (!cancelled) {
                    setAlertReport(report);
                    setStockoutInsights(insights);
                }
            } catch {
                if (!cancelled) {
                    setAlertReport(null);
                    setStockoutInsights([]);
                }
            }
        }

        void loadAlerts();
        return () => {
            cancelled = true;
        };
    }, [businessId, lowStockProducts.length]);

    const alertItems = useMemo(() => {
        const items = alertReport?.items ?? [];
        return [...items].sort((a, b) => {
            if (a.status === b.status) return a.currentStock - b.currentStock;
            if (a.status === "OUT_OF_STOCK") return -1;
            if (b.status === "OUT_OF_STOCK") return 1;
            return 0;
        });
    }, [alertReport]);

    const totalAlerts = alertReport
        ? Math.max(
            stockoutInsights.length,
            alertReport.lowStockCount + alertReport.outOfStockCount + alertReport.reorderNeededCount,
        )
        : lowStockProducts.length;
    const topAlerts = alertItems.slice(0, 3);
    const topInsights = stockoutInsights.slice(0, 3);
    const productById = useMemo(() => {
        const map = new Map<string, Product>();
        for (const product of [...products, ...lowStockProducts]) {
            map.set(product.id, product);
        }
        return map;
    }, [products, lowStockProducts]);

    function insightMessage(item: StockAlertItem): string {
        if (item.status === "OUT_OF_STOCK") {
            return locale.toLowerCase().startsWith("bn")
                ? "স্টক শেষ। বিক্রি চালু রাখতে এখনই রিস্টক করুন।"
                : "Out of stock. Restock now to keep selling.";
        }

        return locale.toLowerCase().startsWith("bn")
            ? `রিঅর্ডার পয়েন্ট ${formatQty(item.reorderPoint)}। স্টক কমে গেছে।`
            : `Reorder point ${formatQty(item.reorderPoint)}. Stock is running low.`;
    }

    return (
        <div className="rounded-[28px] bg-[rgba(225,227,223,0.6)] p-6 backdrop-blur-xl border-l-4 border-primary relative overflow-hidden">
            {/* Decorative background icon */}
            <div className="absolute -right-12 -top-12 opacity-10">
                <span
                    className="material-symbols-outlined text-[120px] text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                >
                    auto_awesome
                </span>
            </div>

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                    <div className="rounded-full bg-primary/10 p-3 text-primary">
                        <span
                            className="material-symbols-outlined"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                            lightbulb
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-primary">
                            {t("insight.title")}
                        </p>
                        <h3 className="mt-1 text-xl font-bold text-primary">
                            {t("insight.subtitle")}
                        </h3>
                    </div>
                </div>
                <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm">
                    {t("insight.totalAlerts", { count: formatQty(totalAlerts) })}
                </div>
            </div>

            <div className="relative z-10 mt-6 grid gap-3 md:grid-cols-3">
                {topInsights.length > 0 ? (
                    topInsights.map((insight) => {
                        const product = insight.entityId ? productById.get(insight.entityId) : null;
                        return (
                            <button
                                key={insight.id}
                                type="button"
                                disabled={!product}
                                onClick={() => {
                                    if (product) onEdit(product);
                                }}
                                className="rounded-[22px] bg-white px-4 py-4 text-left transition hover:bg-primary-fixed disabled:cursor-default disabled:hover:bg-white"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <p className="text-sm font-semibold text-on-surface">
                                        {insight.title}
                                    </p>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${insight.severity === "CRITICAL"
                                            ? "bg-rose-100 text-rose-700"
                                            : "bg-amber-100 text-amber-700"
                                        }`}>
                                        {insight.severity}
                                    </span>
                                </div>
                                <p className="mt-3 text-xs font-semibold text-rose-600">
                                    {insight.message}
                                </p>
                            </button>
                        );
                    })
                ) : topAlerts.length > 0 ? (
                    topAlerts.map((item) => {
                        const product = productById.get(item.productId);
                        return (
                        <button
                            key={`${item.status}-${item.productId}`}
                            type="button"
                            disabled={!product}
                            onClick={() => {
                                if (product) onEdit(product);
                            }}
                            className="rounded-[22px] bg-white px-4 py-4 text-left transition hover:bg-primary-fixed disabled:cursor-default disabled:hover:bg-white"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-semibold text-on-surface">
                                    {item.productName}
                                </p>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.status === "OUT_OF_STOCK"
                                        ? "bg-rose-100 text-rose-700"
                                        : "bg-amber-100 text-amber-700"
                                    }`}>
                                    {t(`status.${item.status === "OUT_OF_STOCK" ? "OUT_OF_STOCK" : "LOW_STOCK"}`)}
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-on-surface-variant">
                                SKU {item.sku} • {t("table.stock")}{" "}
                                {formatQty(item.currentStock)}
                            </p>
                            <p className="mt-3 text-xs font-semibold text-rose-600">
                                {insightMessage(item)}
                            </p>
                        </button>
                    );
                    })
                ) : (
                    <div className="rounded-[22px] bg-white px-4 py-4 text-sm text-on-surface-variant md:col-span-3">
                        {t("insight.noLowStock")}
                    </div>
                )}
            </div>
        </div>
    );
}
