/**
 * Weekly Business Insight SWR Hook
 * Handles fetching, caching, and refreshing weekly AI business analysis
 */
import useSWR from "swr";
import { useCallback, useState } from "react";
import type { WeeklyBusinessInsight } from "@/types/weeklyInsight";
import {
    getWeeklyInsight,
    refreshWeeklyInsight,
} from "@/lib/weeklyInsightApi";

interface UseWeeklyInsightReturn {
    /** Current insight data (null if loading/error) */
    insight: WeeklyBusinessInsight | undefined;
    /** Whether the initial fetch is in progress */
    loading: boolean;
    /** Whether a refresh is in progress */
    refreshing: boolean;
    /** Error message if fetch failed */
    error: string | null;
    /** Manually trigger a refresh */
    refresh: () => Promise<void>;
}

/** SWR cache key generator */
export const weeklyInsightKey = (businessId: string) =>
    `weekly-insight:${businessId}`;

export function useWeeklyInsight(
    businessId: string | undefined
): UseWeeklyInsightReturn {
    const [refreshing, setRefreshing] = useState(false);
    const [refreshError, setRefreshError] = useState<string | null>(null);

    // SWR fetcher
    const { data, error, isLoading, mutate } = useSWR<WeeklyBusinessInsight>(
        businessId ? weeklyInsightKey(businessId) : null,
        () => getWeeklyInsight(businessId!),
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 60_000, // 1 min dedup
            errorRetryCount: 2,
        }
    );

    /** Force-refresh the insight */
    const refresh = useCallback(async () => {
        if (!businessId) return;
        setRefreshing(true);
        setRefreshError(null);
        try {
            const newInsight = await refreshWeeklyInsight(businessId);
            await mutate(newInsight, false);
        } catch (err: any) {
            setRefreshError(
                err?.message || "বিশ্লেষণ রিফ্রেশ করতে সমস্যা হয়েছে"
            );
        } finally {
            setRefreshing(false);
        }
    }, [businessId, mutate]);

    return {
        insight: data,
        loading: isLoading,
        refreshing,
        error: error?.message || refreshError,
        refresh,
    };
}