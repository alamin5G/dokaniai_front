/**
 * Weekly Business Insight API
 * REST client for weekly AI business analysis endpoints
 */
import type { WeeklyBusinessInsight } from "@/types/weeklyInsight";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/** Helper: get auth token */
function getAuthHeaders(): HeadersInit {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Get current weekly insight for a business
 * GET /api/v1/businesses/{businessId}/inventory/weekly-insight
 */
export async function getWeeklyInsight(
    businessId: string
): Promise<WeeklyBusinessInsight> {
    const res = await fetch(
        `${API_BASE}/api/v1/businesses/${businessId}/inventory/weekly-insight`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            },
        }
    );
    if (!res.ok) throw new Error("Failed to fetch weekly insight");
    const json = await res.json();
    return json.data;
}

/**
 * Force-refresh weekly insight
 * POST /api/v1/businesses/{businessId}/inventory/weekly-insight/refresh
 */
export async function refreshWeeklyInsight(
    businessId: string
): Promise<WeeklyBusinessInsight> {
    const res = await fetch(
        `${API_BASE}/api/v1/businesses/${businessId}/inventory/weekly-insight/refresh`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            },
        }
    );
    if (!res.ok) throw new Error("Failed to refresh weekly insight");
    const json = await res.json();
    return json.data;
}