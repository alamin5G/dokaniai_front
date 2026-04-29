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

// ─── Advanced AI Insight Endpoints ────────────────────────

/** Generate or get cached weekly business summary */
export async function generateWeeklySummary(
    businessId: string,
): Promise<AIInsight> {
    const response = await apiClient.post<ApiSuccess<AIInsight>>(
        `/businesses/${businessId}/ai/insights/weekly`,
    );
    return unwrap(response);
}

/** Generate stock predictions for all products */
export async function generateStockPredictions(
    businessId: string,
): Promise<void> {
    await apiClient.post(
        `/businesses/${businessId}/ai/insights/stock-prediction`,
    );
}

/** Generate expense intelligence analysis */
export async function generateExpenseIntelligence(
    businessId: string,
): Promise<AIInsight> {
    const response = await apiClient.post<ApiSuccess<AIInsight>>(
        `/businesses/${businessId}/ai/insights/expense-intelligence`,
    );
    return unwrap(response);
}

/** Generate due collection intelligence */
export async function generateDueIntelligence(
    businessId: string,
): Promise<AIInsight> {
    const response = await apiClient.post<ApiSuccess<AIInsight>>(
        `/businesses/${businessId}/ai/insights/due-intelligence`,
    );
    return unwrap(response);
}

/** Generate daily business summary */
export async function generateDailySummary(
    businessId: string,
): Promise<AIInsight> {
    const response = await apiClient.post<ApiSuccess<AIInsight>>(
        `/businesses/${businessId}/ai/insights/daily-summary`,
    );
    return unwrap(response);
}

/** Generate customer analytics (PRO) */
export async function generateCustomerAnalytics(
    businessId: string,
): Promise<AIInsight> {
    const response = await apiClient.post<ApiSuccess<AIInsight>>(
        `/businesses/${businessId}/ai/insights/customer-analytics`,
    );
    return unwrap(response);
}

/** Generate sales forecast (PLUS) */
export async function generateSalesForecast(
    businessId: string,
): Promise<AIInsight> {
    const response = await apiClient.post<ApiSuccess<AIInsight>>(
        `/businesses/${businessId}/ai/insights/sales-forecast`,
    );
    return unwrap(response);
}

/** Generate profit optimization recommendations (PLUS) */
export async function generateProfitOptimization(
    businessId: string,
): Promise<AIInsight> {
    const response = await apiClient.post<ApiSuccess<AIInsight>>(
        `/businesses/${businessId}/ai/insights/profit-optimization`,
    );
    return unwrap(response);
}

/** Generate seasonal trend analysis (PLUS) */
export async function generateSeasonalTrends(
    businessId: string,
): Promise<AIInsight> {
    const response = await apiClient.post<ApiSuccess<AIInsight>>(
        `/businesses/${businessId}/ai/insights/seasonal-trends`,
    );
    return unwrap(response);
}

/** Generate morning briefing with action items */
export async function generateMorningBriefing(
    businessId: string,
): Promise<AIInsight> {
    const response = await apiClient.post<ApiSuccess<AIInsight>>(
        `/businesses/${businessId}/ai/insights/morning-briefing`,
    );
    return unwrap(response);
}

/** Generate monthly return analysis with AI */
export async function generateReturnAnalysis(
    businessId: string,
): Promise<AIInsight> {
    const response = await apiClient.post<ApiSuccess<AIInsight>>(
        `/businesses/${businessId}/ai/insights/return-analysis`,
    );
    return unwrap(response);
}

/** Fetch insights filtered by type */
export async function getInsightsByType(
    businessId: string,
    type: string,
): Promise<AIInsight[]> {
    const response = await apiClient.get<ApiSuccess<AIInsight[]>>(
        `/businesses/${businessId}/ai/insights`,
        { params: { type } },
    );
    return unwrap(response);
}
