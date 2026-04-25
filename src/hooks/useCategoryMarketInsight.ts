"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swrKeys";
import { getCategoryMarketInsight } from "@/lib/categoryApi";
import { SWR_CACHE } from "@/config/cacheConfig";

/**
 * SWR-backed hook for fetching AI-generated category market insights.
 *
 * Benefits over plain useEffect + useState:
 * - Client-side deduplication (same category → single request)
 * - Shared cache across ProductTable and ProductSelector
 * - Automatic revalidation on window focus
 * - 1 AI call → reused in both Products page and Sales page = zero extra token cost
 */
export function useCategoryMarketInsight(
    categoryId: string | null,
    businessType?: string,
) {
    const key = categoryId
        ? swrKeys.categoryMarketInsight(categoryId, businessType)
        : null;

    const { data, error, isLoading } = useSWR<string>(
        key,
        () => getCategoryMarketInsight(categoryId!, businessType),
        {
            revalidateOnFocus: false,
            dedupingInterval: SWR_CACHE.categoryInsight,
        },
    );

    return {
        insight: data ?? null,
        isLoading,
        error: !!error,
    };
}