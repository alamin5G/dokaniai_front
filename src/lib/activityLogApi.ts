/**
 * Activity Log API Client
 * Aligned with backend: UserController.getActivityLog
 * SRS Reference: Section 6.9 — FR-AUD-03: User views own activity log (last 90 days)
 */

import apiClient from "@/lib/api";

// ─── Types ───────────────────────────────────────────────

export interface UserActivitySummary {
    userId: string;
    userName: string;
    actionCount: number;
    lastAction: string;
    lastActivity: string;
}

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    message?: string;
}

function unwrap<T>(response: { data: ApiSuccess<T> }): T {
    return response.data.data;
}

// ─── API Functions ───────────────────────────────────────

/**
 * Get the current user's activity log.
 * Returns activity entries within a date range (max 90 days).
 */
export async function getActivityLog(params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
}): Promise<UserActivitySummary[]> {
    const response = await apiClient.get<ApiSuccess<UserActivitySummary[]>>(
        "/users/me/activity-log",
        { params }
    );
    return unwrap<UserActivitySummary[]>(response);
}
