/**
 * Restock Intelligence Hooks — SWR-backed
 * Migrated from deprecated RestockIntelligenceService to AIInsightService.
 * All data now comes from DB-persisted ai_insights table via aiInsightsApi.
 */

import useSWR from "swr";
import type { StockPrediction } from "@/types/restockIntelligence";
import type { AIInsight } from "@/types/aiInsight";
import type { RestockInsight } from "@/types/restockIntelligence";
import {
    getProductsWithPredictions,
    getProductPrediction,
    getProductInsights,
} from "@/lib/aiInsightsApi";

// ─── Helpers ─────────────────────────────────────────────

/**
 * Convert an AIInsight (DB-persisted STOCK_PREDICTION) to the
 * StockPrediction shape expected by UI components.
 */
function aiInsightToStockPrediction(insight: AIInsight): StockPrediction {
    const ad = insight.actionData ?? {};
    return {
        productId: insight.entityId,
        productName: insight.title ?? "Unknown Product",
        currentStock: ad.currentStock ?? 0,
        dailyAvgSales: ad.dailyAvgSales ?? 0,
        estimatedDaysRemaining: ad.estimatedDaysRemaining ?? 999,
        suggestedOrderQty: ad.suggestedOrderQty ?? 0,
        suggestedOrderDate: ad.suggestedOrderDate ?? "",
        confidenceLevel: ad.confidenceLevel ?? "LOW",
        aiReasoning: ad.aiReasoning ?? insight.message ?? "",
    };
}

// ─── Hooks ────────────────────────────────────────────────

/**
 * Get urgent stock predictions for a business.
 * Migrated: now fetches from DB-persisted AI insights instead of Redis cache.
 */
export function useUrgentPredictions(businessId: string | null | undefined) {
    const key = businessId ? `/urgent-predictions/${businessId}` : null;

    const { data, error, isLoading, mutate } = useSWR(
        key,
        async () => {
            if (!businessId) return [];
            // Fetch product IDs that have predictions, then fetch each prediction
            const productIds = await getProductsWithPredictions(businessId);
            const insights = await Promise.all(
                productIds.map((pid) =>
                    getProductPrediction(businessId, pid).catch(() => null),
                ),
            );
            return insights
                .filter((i): i is AIInsight => i !== null)
                .map(aiInsightToStockPrediction);
        },
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000,
        },
    );

    return {
        predictions: data ?? [],
        isLoading,
        error,
        mutate,
    };
}

/**
 * Get stock prediction for a specific product.
 * Migrated: now fetches from DB-persisted AI insights.
 */
export function useStockPrediction(
    businessId: string | null | undefined,
    productId: string | null | undefined,
) {
    const key =
        businessId && productId
            ? `/stock-prediction/${businessId}/${productId}`
            : null;

    const { data, error, isLoading, mutate } = useSWR(
        key,
        async () => {
            if (!businessId || !productId) return null;
            const insight = await getProductPrediction(businessId, productId).catch(
                () => null,
            );
            return insight ? aiInsightToStockPrediction(insight) : null;
        },
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000,
        },
    );

    return {
        prediction: data ?? null,
        isLoading,
        error,
        mutate,
    };
}

/**
 * Get restock insight for a specific product.
 * Migrated: now fetches from DB-persisted AI insights.
 */
/** Convert AIInsight → RestockInsight for RestockInsightCard */
function toRestockInsight(i: AIInsight): RestockInsight {
    const ad = (i.actionData ?? {}) as Record<string, unknown>;
    return {
        productId: i.entityId,
        productName: i.title.replace(/^🔮\s*স্টক পূর্বাভাস:\s*/, ""),
        insightType: (ad.insightType as RestockInsight["insightType"]) ?? "PATTERN",
        insightText: i.message,
        suggestedAction: (ad.suggestedAction as string) ?? "MONITOR",
        confidenceScore: (ad.confidenceScore as number) ?? 50,
        generatedAt: i.createdAt,
        expiresAt: i.createdAt, // use createdAt as fallback
    };
}

export function useRestockInsight(
    businessId: string | null | undefined,
    productId: string | null | undefined,
) {
    const key =
        businessId && productId
            ? `/restock-insight/${businessId}/${productId}`
            : null;

    const { data, error, isLoading, mutate } = useSWR(
        key,
        async () => {
            if (!businessId || !productId) return null;
            const insights = await getProductInsights(
                businessId,
                productId,
            ).catch(() => []);
            const restockInsight = insights.find(
                (i) => i.type === "RESTOCK_INSIGHT",
            );
            return restockInsight ? toRestockInsight(restockInsight) : null;
        },
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000,
        },
    );

    return {
        insight: data ?? null,
        isLoading,
        error,
        mutate,
    };
}

/**
 * Get all notable restock insights for a business.
 * Migrated: now fetches from DB-persisted AI insights.
 */
export function useRestockInsights(businessId: string | null | undefined) {
    const key = businessId ? `/restock-insights/${businessId}` : null;

    const { data, error, isLoading, mutate } = useSWR(
        key,
        async () => {
            if (!businessId) return [];
            const productIds = await getProductsWithPredictions(businessId);
            const allInsights = await Promise.all(
                productIds.map((pid) =>
                    getProductInsights(businessId, pid).catch(() => []),
                ),
            );
            return allInsights
                .flat()
                .filter((i) => i.type === "RESTOCK_INSIGHT")
                .map(toRestockInsight);
        },
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000,
        },
    );

    return {
        insights: data ?? [],
        isLoading,
        error,
        mutate,
    };
}