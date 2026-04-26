/**
 * Weekly Business Insight API
 * REST client for weekly AI business analysis endpoints
 * Uses apiClient (axios) with proper auth interceptor
 */
import apiClient from "@/lib/api";
import type { WeeklyBusinessInsight } from "@/types/weeklyInsight";

// ─── Internal helpers ────────────────────────────────────

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    message?: string;
}

function unwrap<T>(response: { data: ApiSuccess<T> }): T {
    return response.data.data;
}

// ─── Get Weekly Insight ──────────────────────────────────

/**
 * Get current weekly insight for a business
 * GET /api/v1/businesses/{businessId}/inventory/weekly-insight
 */
export async function getWeeklyInsight(
    businessId: string
): Promise<WeeklyBusinessInsight> {
    const response = await apiClient.get<ApiSuccess<WeeklyBusinessInsight>>(
        `/businesses/${businessId}/inventory/weekly-insight`
    );
    return unwrap(response);
}

// ─── Refresh Weekly Insight ──────────────────────────────

/**
 * Force-refresh weekly insight
 * POST /api/v1/businesses/{businessId}/inventory/weekly-insight/refresh
 */
export async function refreshWeeklyInsight(
    businessId: string
): Promise<WeeklyBusinessInsight> {
    const response = await apiClient.post<ApiSuccess<WeeklyBusinessInsight>>(
        `/businesses/${businessId}/inventory/weekly-insight/refresh`
    );
    return unwrap(response);
}