/**
 * AI Insights API Client
 * Purpose: API functions for DB-persisted AI insights (stock predictions, etc.)
 */

import apiClient from "@/lib/api";
import type { AIInsight } from "@/types/aiInsight";

// ─── Helper ──────────────────────────────────────────────

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    message?: string;
}

function unwrap<T>(response: { data: ApiSuccess<T> }): T {
    return response.data.data;
}

// ─── Product Prediction Endpoints ────────────────────────

/** Fetch product IDs that have active STOCK_PREDICTION insights */
export async function getProductsWithPredictions(
    businessId: string,
): Promise<string[]> {
    const response = await apiClient.get<ApiSuccess<string[]>>(
        `/businesses/${businessId}/ai/insights/products-with-predictions`,
    );
    return unwrap(response);
}

/** Fetch the latest STOCK_PREDICTION insight for a specific product */
export async function getProductPrediction(
    businessId: string,
    productId: string,
): Promise<AIInsight> {
    const response = await apiClient.get<ApiSuccess<AIInsight>>(
        `/businesses/${businessId}/ai/insights/products/${productId}/prediction`,
    );
    return unwrap(response);
}

/** Fetch all active insights for a specific product */
export async function getProductInsights(
    businessId: string,
    productId: string,
): Promise<AIInsight[]> {
    const response = await apiClient.get<ApiSuccess<AIInsight[]>>(
        `/businesses/${businessId}/ai/insights/products/${productId}/insights`,
    );
    return unwrap(response);
}

/** Fetch all STOCK_PREDICTION insights for a business */
export async function getBusinessStockPredictions(
    businessId: string,
): Promise<AIInsight[]> {
    const response = await apiClient.get<ApiSuccess<AIInsight[]>>(
        `/businesses/${businessId}/ai/insights`,
        { params: { type: "STOCK_PREDICTION" } },
    );
    return unwrap(response);
}
