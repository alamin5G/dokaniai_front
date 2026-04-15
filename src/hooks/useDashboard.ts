/**
 * Dashboard data hooks — SWR-backed with shared cache
 */

import useSWR from "swr";
import type { BusinessStatsResponse, BusinessOnboardingResponse } from "@/types/business";
import type { DashboardSummary } from "@/types/report";
import { getBusinessStats, getOnboarding } from "@/lib/businessApi";
import { getDashboardSummary } from "@/lib/reportApi";
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
