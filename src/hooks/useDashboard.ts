/**
 * Dashboard data hooks — SWR-backed with shared cache
 */

import useSWR from "swr";
import type { BusinessStatsResponse, BusinessOnboardingResponse } from "@/types/business";
import type { DashboardSummary } from "@/types/report";
import type { MonthlyExpenseSummary } from "@/types/expense";
import { getBusinessStats, getOnboarding } from "@/lib/businessApi";
import { getDashboardSummary } from "@/lib/reportApi";
import { getMonthlySummary } from "@/lib/expenseApi";
import { swrKeys } from "@/lib/swrKeys";

// ─── Fetchers ─────────────────────────────────────────────

async function fetchBusinessStats(key: string): Promise<BusinessStatsResponse> {
    const businessId = key.split("/")[2];
    return getBusinessStats(businessId);
}

async function fetchOnboarding(key: string): Promise<BusinessOnboardingResponse> {
    const businessId = key.split("/")[2];
    return getOnboarding(businessId);
}

async function fetchDashboardSummary(key: string): Promise<DashboardSummary> {
    const businessId = key.split("/")[2];
    return getDashboardSummary(businessId);
}

async function fetchMonthlyExpenseSummary(key: string): Promise<MonthlyExpenseSummary> {
    // Key format: /businesses/{id}/expenses/summary?year=...&month=...
    const parts = key.split("?");
    const pathParts = parts[0].split("/");
    const businessId = pathParts[2];
    const params: Record<string, string> = {};
    if (parts[1]) {
        parts[1].split("&").forEach((p) => {
            const [k, v] = p.split("=");
            params[k] = decodeURIComponent(v);
        });
    }
    return getMonthlySummary(
        businessId,
        params.year ? Number(params.year) : undefined,
        params.month ? Number(params.month) : undefined,
    );
}

// ─── Hooks ────────────────────────────────────────────────

/** Business stats (revenue, sales count, etc.) */
export function useBusinessStats(businessId: string | null | undefined) {
    const key = businessId ? swrKeys.businessStats(businessId) : null;
    const { data, error, isLoading, mutate } = useSWR(key, fetchBusinessStats);

    return {
        stats: data ?? null,
        isLoading,
        error,
        mutate,
    };
}

/** Onboarding status */
export function useOnboarding(businessId: string | null | undefined) {
    const key = businessId ? swrKeys.businessOnboarding(businessId) : null;
    const { data, error, isLoading, mutate } = useSWR(key, fetchOnboarding);

    return {
        onboardingData: data ?? null,
        isLoading,
        error,
        mutate,
    };
}

/** Dashboard summary (combined KPIs from reports) */
export function useDashboardSummary(businessId: string | null | undefined) {
    const key = businessId ? swrKeys.dashboardSummary(businessId) : null;
    const { data, error, isLoading, mutate } = useSWR(key, fetchDashboardSummary);

    return {
        summary: data ?? null,
        isLoading,
        error,
        mutate,
    };
}

/** Monthly expense summary for the current month */
export function useMonthlyExpense(businessId: string | null | undefined) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // JS months are 0-indexed
    const key = businessId
        ? swrKeys.expenseMonthlySummary(businessId, year, month)
        : null;
    const { data, error, isLoading, mutate } = useSWR(key, fetchMonthlyExpenseSummary);

    return {
        expenseSummary: data ?? null,
        isLoading,
        error,
        mutate,
    };
}
