/**
 * Restock Intelligence API Client
 * Purpose: API functions for AI-powered restock insights and stock predictions
 */

import apiClient from "@/lib/api";
import type { RestockInsight, StockPrediction } from "@/types/restockIntelligence";

// ─── Helper ──────────────────────────────────────────────

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    message?: string;
}

function unwrap<T>(response: { data: ApiSuccess<T> }): T {
    return response.data.data;
}

// ─── Restock Insight API ─────────────────────────────────

export async function getRestockInsight(
    businessId: string,
    productId: string,
): Promise<RestockInsight> {
    const response = await apiClient.get<ApiSuccess<RestockInsight>>(
        `/businesses/${businessId}/products/${productId}/restock-insight`,
    );
    return unwrap(response);
}

export async function getRestockInsights(
    businessId: string,
): Promise<RestockInsight[]> {
    const response = await apiClient.get<ApiSuccess<RestockInsight[]>>(
        `/businesses/${businessId}/restock-insights`,
    );
    return unwrap(response);
}

export async function getStockPrediction(
    businessId: string,
    productId: string,
): Promise<StockPrediction> {
    const response = await apiClient.get<ApiSuccess<StockPrediction>>(
        `/businesses/${businessId}/products/${productId}/stock-prediction`,
    );
    return unwrap(response);
}

export async function getUrgentPredictions(
    businessId: string,
): Promise<StockPrediction[]> {
    const response = await apiClient.get<ApiSuccess<StockPrediction[]>>(
        `/businesses/${businessId}/stock-predictions`,
    );
    return unwrap(response);
}
