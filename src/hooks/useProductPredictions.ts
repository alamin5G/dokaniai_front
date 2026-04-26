/**
 * Product Predictions Hooks — SWR-backed with shared cache
 * Purpose: Hooks for DB-persisted AI stock prediction insights
 */

import useSWR from "swr";
import type { AIInsight } from "@/types/aiInsight";
import {
    getProductsWithPredictions,
    getProductPrediction,
    getBusinessStockPredictions,
} from "@/lib/aiInsightsApi";

// ─── Fetchers ─────────────────────────────────────────────

async function fetchProductsWithPredictions(key: string): Promise<string[]> {
    // key = "/ai-insights/predictions/products/{businessId}"
    const businessId = key.split("/").pop()!;
    return getProductsWithPredictions(businessId);
}

async function fetchProductPrediction(key: string): Promise<AIInsight> {
    // key = "/ai-insights/predictions/{businessId}/{productId}"
    const parts = key.split("/");
    const businessId = parts[3];
    const productId = parts[4];
    return getProductPrediction(businessId, productId);
}

async function fetchBusinessStockPredictions(key: string): Promise<AIInsight[]> {
    // key = "/ai-insights/predictions/business/{businessId}"
    const businessId = key.split("/").pop()!;
    return getBusinessStockPredictions(businessId);
}

// ─── Hooks ────────────────────────────────────────────────

/** Get the set of product IDs that have active stock predictions */
export function useProductPredictions(businessId: string | null) {
    const key = businessId
        ? `/ai-insights/predictions/products/${businessId}`
        : null;
    const { data, error, isLoading, mutate } = useSWR(key, fetchProductsWithPredictions, {
        revalidateOnFocus: false,
        dedupingInterval: 60000,
    });

    return {
        productIds: new Set<string>(data ?? []),
        loading: isLoading,
        error,
        mutate,
    };
}

/** Get the stock prediction insight for a specific product */
export function useProductPrediction(
    businessId: string | null,
    productId: string | null,
) {
    const key = businessId && productId
        ? `/ai-insights/predictions/${businessId}/${productId}`
        : null;
    const { data, error, isLoading, mutate } = useSWR(key, fetchProductPrediction, {
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

/** Get all STOCK_PREDICTION insights for a business (for sidebar) */
export function useBusinessStockPredictions(businessId: string | null) {
    const key = businessId
        ? `/ai-insights/predictions/business/${businessId}`
        : null;
    const { data, error, isLoading, mutate } = useSWR(key, fetchBusinessStockPredictions, {
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
