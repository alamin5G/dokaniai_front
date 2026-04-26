"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Product, ProductStatsResponse } from "@/types/product";
import type { StockPrediction } from "@/types/restockIntelligence";
import type { AIInsight } from "@/types/aiInsight";
import { useUrgentPredictions } from "@/hooks/useRestockIntelligence";
import { useBusinessStockPredictions } from "@/hooks/useProductPredictions";
import StockPredictionBanner from "./StockPredictionBanner";

interface ProductSidebarProps {
    stats: ProductStatsResponse | null;
    reorderProducts: Product[];
    businessId?: string;
}

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

/**
 * Convert an AIInsight (DB-persisted) to the StockPrediction format
 * expected by StockPredictionBanner.
 */
function aiInsightToStockPrediction(insight: AIInsight): StockPrediction {
    const ad = insight.actionData;
    return {
        productId: insight.entityId,
        productName: insight.title.replace(/^🔮\s*স্টক পূর্বাভাস:\s*/, ""),
        currentStock: ad?.currentStock ?? 0,
        dailyAvgSales: ad?.dailyAvgSales ?? 0,
        estimatedDaysRemaining: ad?.estimatedDaysRemaining ?? 0,
        suggestedOrderQty: ad?.suggestedOrderQty ?? 0,
        suggestedOrderDate: ad?.suggestedOrderDate ?? "",
        confidenceLevel: ad?.confidenceLevel ?? "LOW",
        aiReasoning: ad?.aiReasoning ?? insight.message,
    };
}

export default function ProductSidebar({
    stats,
    reorderProducts,
    businessId,
}: ProductSidebarProps) {
    const t = useTranslations("shop.products");
    const locale = useLocale();
    const loc = resolveLocale(locale);

    // Legacy Redis-backed predictions (kept for backward compatibility)
    const { predictions: legacyPredictions } = useUrgentPredictions(businessId ?? null);

    // New DB-persisted AI insights
    const { predictions: dbPredictions } = useBusinessStockPredictions(businessId ?? null);

    // Merge: prefer DB predictions, fall back to legacy
    const mergedPredictions = useMemo<StockPrediction[]>(() => {
        const dbConverted = dbPredictions.map(aiInsightToStockPrediction);
        if (dbConverted.length > 0) return dbConverted;
        return legacyPredictions;
    }, [dbPredictions, legacyPredictions]);

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

            {/* AI Stock Predictions */}
            {mergedPredictions.length > 0 && (
                <div className="mt-5 space-y-3">
                    <p className="text-sm font-semibold text-secondary">
                        🔮 AI স্টক পূর্বাভাস
                    </p>
                    {mergedPredictions.slice(0, 3).map((prediction) => (
                        <StockPredictionBanner
                            key={prediction.productId}
                            prediction={prediction}
                            onDismiss={() => { }}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
