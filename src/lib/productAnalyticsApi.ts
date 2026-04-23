/**
 * Product Analytics API Client
 * Purpose: API functions for product analytics and AI insights
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

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

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },
    });

    if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    return json.data ?? json;
}

// ─── Analytics API ───────────────────────────────────────

export async function getFastestMovingProducts(
    businessId: string,
    limit = 10,
): Promise<ProductVelocityReport[]> {
    return apiFetch<ProductVelocityReport[]>(
        `${API_BASE}/products/analytics/fastest-moving?businessId=${businessId}&limit=${limit}`,
    );
}

export async function getSlowestMovingProducts(
    businessId: string,
    limit = 10,
): Promise<ProductPerformanceItem[]> {
    return apiFetch<ProductPerformanceItem[]>(
        `${API_BASE}/products/analytics/slowest-moving?businessId=${businessId}&limit=${limit}`,
    );
}

export async function getReorderSuggestions(
    businessId: string,
): Promise<SmartReorderSuggestion[]> {
    return apiFetch<SmartReorderSuggestion[]>(
        `${API_BASE}/products/analytics/reorder-suggestions?businessId=${businessId}`,
    );
}

export async function getProductPerformance(
    businessId: string,
    days = 30,
): Promise<ProductPerformanceReport> {
    return apiFetch<ProductPerformanceReport>(
        `${API_BASE}/products/analytics/performance?businessId=${businessId}&days=${days}`,
    );
}

export async function getProductVelocity(
    businessId: string,
    productId: string,
    days = 30,
): Promise<ProductVelocityReport> {
    return apiFetch<ProductVelocityReport>(
        `${API_BASE}/products/analytics/${productId}/velocity?businessId=${businessId}&days=${days}`,
    );
}

export async function getRestockPattern(
    businessId: string,
    productId: string,
): Promise<RestockPatternReport> {
    return apiFetch<RestockPatternReport>(
        `${API_BASE}/products/analytics/${productId}/restock-pattern?businessId=${businessId}`,
    );
}

// ─── AI Insights API ─────────────────────────────────────

export async function getAIInsights(
    businessId: string,
    options?: { type?: string; unread?: boolean },
): Promise<AIInsight[]> {
    const params = new URLSearchParams({ businessId });
    if (options?.type) params.set("type", options.type);
    if (options?.unread) params.set("unread", "true");

    return apiFetch<AIInsight[]>(
        `${API_BASE}/ai/insights?${params.toString()}`,
    );
}

export async function getInsightDashboardStats(
    businessId: string,
): Promise<{ unreadCount: number; criticalCount: number; reorderSuggestions: number }> {
    return apiFetch(`${API_BASE}/ai/insights/dashboard?businessId=${businessId}`);
}

export async function getCriticalInsights(
    businessId: string,
): Promise<AIInsight[]> {
    return apiFetch<AIInsight[]>(
        `${API_BASE}/ai/insights/critical?businessId=${businessId}`,
    );
}

export async function markInsightRead(insightId: string): Promise<AIInsight> {
    return apiFetch<AIInsight>(`${API_BASE}/ai/insights/${insightId}/read`, {
        method: "PATCH",
    });
}

export async function markInsightActedUpon(insightId: string): Promise<AIInsight> {
    return apiFetch<AIInsight>(`${API_BASE}/ai/insights/${insightId}/act`, {
        method: "PATCH",
    });
}

export async function addInsightFeedback(
    insightId: string,
    feedback: string,
): Promise<AIInsight> {
    return apiFetch<AIInsight>(`${API_BASE}/ai/insights/${insightId}/feedback`, {
        method: "PATCH",
        body: JSON.stringify({ feedback }),
    });
}
