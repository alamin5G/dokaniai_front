"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Product, ProductStatsResponse } from "@/types/product";

interface ProductSidebarProps {
    stats: ProductStatsResponse | null;
    reorderProducts: Product[];
}

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

export default function ProductSidebar({
    stats,
    reorderProducts,
}: ProductSidebarProps) {
    const t = useTranslations("shop.products");
    const locale = useLocale();
    const loc = resolveLocale(locale);

    const qtyFormatter = new Intl.NumberFormat(loc, {
        maximumFractionDigits: 3,
    });

    function formatQty(value: number | null | undefined): string {
        return qtyFormatter.format(value ?? 0);
    }

    return (
        <section className="rounded-[28px] bg-surface-container-low p-6">
            <p className="text-sm font-semibold text-secondary">
                {t("sidebar.inventoryStatus")}
            </p>
            <div className="mt-5 space-y-3">
                <div className="rounded-[20px] bg-white px-4 py-4">
                    <p className="text-sm font-medium text-on-surface-variant">
                        {t("sidebar.activeProducts")}
                    </p>
                    <p className="mt-2 text-2xl font-black text-on-surface">
                        {formatQty(stats?.activeProducts)}
                    </p>
                </div>
                <div className="rounded-[20px] bg-white px-4 py-4">
                    <p className="text-sm font-medium text-on-surface-variant">
                        {t("sidebar.archivedProducts")}
                    </p>
                    <p className="mt-2 text-2xl font-black text-on-surface">
                        {formatQty(stats?.archivedProducts)}
                    </p>
                </div>
                <div className="rounded-[20px] bg-white px-4 py-4">
                    <p className="text-sm font-medium text-on-surface-variant">
                        {t("sidebar.lowStockRule")}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                        {t("sidebar.lowStockRuleDesc")}
                    </p>
                </div>
                <div className="rounded-[20px] bg-white px-4 py-4">
                    <p className="text-sm font-medium text-on-surface-variant">
                        {t("sidebar.reorderNeeded")}
                    </p>
                    <p className="mt-2 text-2xl font-black text-on-surface">
                        {formatQty(reorderProducts.length)}
                    </p>
                </div>
            </div>
        </section>
    );
}
