"use client";

import { useLocale, useTranslations } from "next-intl";
import type { ProductStatsResponse } from "@/types/product";

interface ProductStatsCardsProps {
    stats: ProductStatsResponse | null;
}

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

export default function ProductStatsCards({ stats }: ProductStatsCardsProps) {
    const t = useTranslations("shop.products");
    const locale = useLocale();
    const loc = resolveLocale(locale);

    const currencyFormatter = new Intl.NumberFormat(loc, {
        maximumFractionDigits: 0,
    });

    const qtyFormatter = new Intl.NumberFormat(loc, {
        maximumFractionDigits: 3,
    });

    function formatMoney(value: number | null | undefined): string {
        return currencyFormatter.format(value ?? 0);
    }

    function formatQty(value: number | null | undefined): string {
        return qtyFormatter.format(value ?? 0);
    }

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
            {/* Total Products */}
            <article className="rounded-[24px] bg-surface-container-lowest p-6 shadow-sm transition-colors group hover:bg-primary-fixed">
                <p className="text-sm font-medium text-on-surface-variant">
                    {t("stats.totalProducts")}
                </p>
                <div className="mt-4 flex items-start justify-between">
                    <div>
                        <h2 className="text-3xl font-black text-on-surface">
                            {formatQty(stats?.totalProducts)}
                        </h2>
                        <p className="mt-2 text-xs font-semibold text-primary">
                            {t("stats.active", { count: formatQty(stats?.activeProducts) })}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-surface-container p-3 text-primary transition-colors group-hover:bg-white/50">
                        <span className="material-symbols-outlined">inventory_2</span>
                    </div>
                </div>
            </article>

            {/* Total Inventory Value */}
            <article className="rounded-[24px] bg-surface-container-lowest p-6 shadow-sm transition-colors group hover:bg-secondary-fixed">
                <p className="text-sm font-medium text-on-surface-variant">
                    {t("stats.inventoryValue")}
                </p>
                <div className="mt-4 flex items-start justify-between">
                    <div>
                        <h2 className="text-3xl font-black text-on-surface">
                            ৳{formatMoney(stats?.totalInventoryValue)}
                        </h2>
                        <p className="mt-2 text-xs font-semibold text-secondary">
                            {t("stats.costBased")}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-surface-container p-3 text-secondary transition-colors group-hover:bg-white/50">
                        <span className="material-symbols-outlined">account_balance_wallet</span>
                    </div>
                </div>
            </article>

            {/* Stock Alerts */}
            <article className="rounded-[24px] bg-surface-container-lowest p-6 shadow-sm transition-colors group hover:bg-error-container">
                <p className="text-sm font-medium text-on-surface-variant">
                    {t("stats.stockAlerts")}
                </p>
                <div className="mt-4 flex items-start justify-between">
                    <div>
                        <h2 className="text-3xl font-black text-on-surface">
                            {formatQty((stats?.lowStockCount ?? 0) + (stats?.outOfStockCount ?? 0))}
                        </h2>
                        <p className="mt-2 text-xs font-semibold text-rose-600">
                            {t("stats.stockOut", { count: formatQty(stats?.outOfStockCount) })}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-rose-50 p-3 text-rose-600 transition-colors group-hover:bg-white/50">
                        <span className="material-symbols-outlined">warning</span>
                    </div>
                </div>
            </article>
        </div>
    );
}
