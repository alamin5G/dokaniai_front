"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Product } from "@/types/product";

interface ProductInsightPanelProps {
    lowStockProducts: Product[];
    onEdit: (product: Product) => void;
}

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

export default function ProductInsightPanel({
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

    const topLowStock = lowStockProducts.slice(0, 3);

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
                    {t("insight.totalAlerts", { count: formatQty(lowStockProducts.length) })}
                </div>
            </div>

            <div className="relative z-10 mt-6 grid gap-3 md:grid-cols-3">
                {topLowStock.length > 0 ? (
                    topLowStock.map((product) => (
                        <button
                            key={product.id}
                            type="button"
                            onClick={() => onEdit(product)}
                            className="rounded-[22px] bg-white px-4 py-4 text-left transition hover:bg-primary-fixed"
                        >
                            <p className="text-sm font-semibold text-on-surface">
                                {product.name}
                            </p>
                            <p className="mt-1 text-xs text-on-surface-variant">
                                SKU {product.sku} • {t("table.stock")}{" "}
                                {formatQty(product.stockQty)} {product.unit}
                            </p>
                            <p className="mt-3 text-xs font-semibold text-rose-600">
                                {t("insight.threshold", {
                                    count: formatQty(product.reorderPoint),
                                })}
                            </p>
                        </button>
                    ))
                ) : (
                    <div className="rounded-[22px] bg-white px-4 py-4 text-sm text-on-surface-variant md:col-span-3">
                        {t("insight.noLowStock")}
                    </div>
                )}
            </div>
        </div>
    );
}
