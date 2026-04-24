/**
 * Product Analytics API Client
 * Purpose: API functions for product analytics and AI insights
 */

import apiClient from "@/lib/api";

// ─── Types ───────────────────────────────────────────────

export interface ProductVelocityReport {
    productId: string;
    productName: string;
    dailyVelocity: number;
    weeklyVelocity: number;
    daysUntilOutOfStock: number;
    urgencyLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

export interface RestockPatternReport {
    productId: string;
    productName: string;
    avgDaysBetweenRestocks: number;
    avgRestockQuantity: number;
    lastRestockDate: string | null;
    daysSinceLastRestock: number | null;
    isOverdueForRestock: boolean;
}

export interface SmartReorderSuggestion {
    productId: string;
    productName: string;
    currentStock: number;
    dailyVelocity: number;
    daysUntilOutOfStock: number;
    suggestedOrderQty: number;
    estimatedCost: number;
    reason: string;
}

export interface ProductPerformanceItem {
    productId: string;
    productName: string;
    totalSold: number;
    totalRevenue: number;
    totalProfit: number;
    profitMargin: number;
    avgDailySales: number;
}

export interface ProductPerformanceReport {
    startDate: string;
    endDate: string;
    products: ProductPerformanceItem[];
    fastestMoving: ProductVelocityReport[];
    slowestMoving: ProductVelocityReport[];
    reorderSuggestions: SmartReorderSuggestion[];
}

export interface AIInsight {
    id: string;
    businessId: string;
    type: string;
    title: string;
    message: string;
    severity: "INFO" | "WARNING" | "CRITICAL";
    entityType: string | null;
    entityId: string | null;
    confidence: number;
    actionSuggested: string | null;
    actionData: Record<string, unknown> | null;
    isRead: boolean;
    isActedUpon: boolean;
    userFeedback: string | null;
    validUntil: string | null;
    createdAt: string;
}

// ─── Helper ──────────────────────────────────────────────

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    message?: string;
}

function unwrap<T>(response: { data: ApiSuccess<T> }): T {
    return response.data.data;
}

// ─── Analytics API ───────────────────────────────────────

export async function getFastestMovingProducts(
    businessId: string,
    limit = 10,
): Promise<ProductVelocityReport[]> {
    const response = await apiClient.get<ApiSuccess<ProductVelocityReport[]>>(
        `/businesses/${businessId}/products/analytics/fastest-moving`,
        { params: { limit } },
    );
    return unwrap(response);
}

export async function getSlowestMovingProducts(
    businessId: string,
    limit = 10,
): Promise<ProductPerformanceItem[]> {
    const response = await apiClient.get<ApiSuccess<ProductPerformanceItem[]>>(
        `/businesses/${businessId}/products/analytics/slowest-moving`,
        { params: { limit } },
    );
    return unwrap(response);
}

export async function getReorderSuggestions(
    businessId: string,
): Promise<SmartReorderSuggestion[]> {
    const response = await apiClient.get<ApiSuccess<SmartReorderSuggestion[]>>(
        `/businesses/${businessId}/products/analytics/reorder-suggestions`,
    );
    return unwrap(response);
}

export async function getProductPerformance(
    businessId: string,
    days = 30,
): Promise<ProductPerformanceReport> {
    const response = await apiClient.get<ApiSuccess<ProductPerformanceReport>>(
        `/businesses/${businessId}/products/analytics/performance`,
        { params: { days } },
    );
    return unwrap(response);
}

export async function getProductVelocity(
    businessId: string,
    productId: string,
    days = 30,
): Promise<ProductVelocityReport> {
    const response = await apiClient.get<ApiSuccess<ProductVelocityReport>>(
        `/businesses/${businessId}/products/analytics/${productId}/velocity`,
        { params: { days } },
    );
    return unwrap(response);
}

export async function getRestockPattern(
    businessId: string,
    productId: string,
): Promise<RestockPatternReport> {
    const response = await apiClient.get<ApiSuccess<RestockPatternReport>>(
        `/businesses/${businessId}/products/analytics/${productId}/restock-pattern`,
    );
    return unwrap(response);
}

// ─── AI Insights API ─────────────────────────────────────

export async function getAIInsights(
    businessId: string,
    options?: { type?: string; unread?: boolean },
): Promise<AIInsight[]> {
    const params: Record<string, string | boolean> = {};
    if (options?.type) params.type = options.type;
    if (options?.unread) params.unread = true;

    const response = await apiClient.get<ApiSuccess<AIInsight[]>>(
        `/businesses/${businessId}/ai/insights`,
        { params },
    );
    return unwrap(response);
}

export async function generateAIInsights(businessId: string): Promise<void> {
    await apiClient.post(`/businesses/${businessId}/ai/insights/generate`);
}

export async function getInsightDashboardStats(
    businessId: string,
): Promise<{ unreadCount: number; criticalCount: number; reorderSuggestions: number }> {
    const response = await apiClient.get<ApiSuccess<{ unreadCount: number; criticalCount: number; reorderSuggestions: number }>>(
        `/businesses/${businessId}/ai/insights/dashboard`,
    );
    return unwrap(response);
}

export async function getCriticalInsights(
    businessId: string,
): Promise<AIInsight[]> {
    const response = await apiClient.get<ApiSuccess<AIInsight[]>>(
        `/businesses/${businessId}/ai/insights/critical`,
    );
    return unwrap(response);
}

export async function markInsightRead(
    businessId: string,
    insightId: string,
): Promise<AIInsight> {
    const response = await apiClient.patch<ApiSuccess<AIInsight>>(
        `/businesses/${businessId}/ai/insights/${insightId}/read`,
    );
    return unwrap(response);
}

export async function markInsightActedUpon(
    businessId: string,
    insightId: string,
): Promise<AIInsight> {
    const response = await apiClient.patch<ApiSuccess<AIInsight>>(
        `/businesses/${businessId}/ai/insights/${insightId}/act`,
    );
    return unwrap(response);
}

export async function addInsightFeedback(
    businessId: string,
    insightId: string,
    feedback: string,
): Promise<AIInsight> {
    const response = await apiClient.patch<ApiSuccess<AIInsight>>(
        `/businesses/${businessId}/ai/insights/${insightId}/feedback`,
        { feedback },
    );
    return unwrap(response);
}
