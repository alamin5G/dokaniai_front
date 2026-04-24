/**
 * Restock Intelligence Hooks — SWR-backed with shared cache
 */

import useSWR from "swr";
import type { RestockInsight, StockPrediction } from "@/types/restockIntelligence";
import {
    getRestockInsight,
    getRestockInsights,
    getStockPrediction,
    getUrgentPredictions,
} from "@/lib/restockIntelligenceApi";

// ─── Fetchers ─────────────────────────────────────────────

async function fetchInsight(key: string): Promise<RestockInsight> {
    // key = "/restock-insight/{businessId}/{productId}"
    const parts = key.split("/");
    const businessId = parts[2];
    const productId = parts[3];
    return getRestockInsight(businessId, productId);
}

async function fetchInsights(key: string): Promise<RestockInsight[]> {
    const businessId = key.split("/")[2];
    return getRestockInsights(businessId);
}

async function fetchPrediction(key: string): Promise<StockPrediction> {
    // key = "/stock-prediction/{businessId}/{productId}"
    const parts = key.split("/");
    const businessId = parts[2];
    const productId = parts[3];
    return getStockPrediction(businessId, productId);
}

async function fetchUrgentPredictions(key: string): Promise<StockPrediction[]> {
    const businessId = key.split("/")[2];
    return getUrgentPredictions(businessId);
}

// ─── Hooks ────────────────────────────────────────────────

/** Get restock insight for a specific product */
export function useRestockInsight(
    businessId: string | null | undefined,
    productId: string | null | undefined,
) {
    const key = businessId && productId
        ? `/restock-insight/${businessId}/${productId}`
        : null;
    const { data, error, isLoading, mutate } = useSWR(key, fetchInsight, {
        revalidateOnFocus: false,
        dedupingInterval: 60000, // 1 minute dedup
    });

    return {
        insight: data ?? null,
        isLoading,
        error,
        mutate,
    };
}

/** Get all notable restock insights for a business */
export function useRestockInsights(businessId: string | null | undefined) {
    const key = businessId ? `/restock-insights/${businessId}` : null;
    const { data, error, isLoading, mutate } = useSWR(key, fetchInsights, {
        revalidateOnFocus: false,
        dedupingInterval: 60000,
    });

    return {
        insights: data ?? [],
        isLoading,
        error,
        mutate,
    };
}

/** Get stock prediction for a specific product */
export function useStockPrediction(
    businessId: string | null | undefined,
    productId: string | null | undefined,
) {
    const key = businessId && productId
        ? `/stock-prediction/${businessId}/${productId}`
        : null;
    const { data, error, isLoading, mutate } = useSWR(key, fetchPrediction, {
        revalidateOnFocus: false,
        dedupingInterval: 60000,
    });

    return {
        prediction: data ?? null,
        isLoading,
        error,
        mutate,
    };
}

/** Get urgent stock predictions for a business */
export function useUrgentPredictions(businessId: string | null | undefined) {
    const key = businessId ? `/urgent-predictions/${businessId}` : null;
    const { data, error, isLoading, mutate } = useSWR(key, fetchUrgentPredictions, {
        revalidateOnFocus: false,
        dedupingInterval: 60000,
    });

    return {
        predictions: data ?? [],
        isLoading,
        error,
        mutate,
    };
}
