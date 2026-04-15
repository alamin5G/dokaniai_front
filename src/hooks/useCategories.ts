/**
 * Category data hooks — SWR-backed with shared cache
 */

import useSWR from "swr";
import type { CategoryResponse } from "@/types/category";
import { getCategoriesByBusinessType } from "@/lib/categoryApi";
import { swrKeys } from "@/lib/swrKeys";

// ─── Fetchers ─────────────────────────────────────────────

async function fetchCategoriesByType(key: string): Promise<CategoryResponse[]> {
    // key = "/categories/by-business-type/{type}"
    const businessType = key.split("/").pop();
    if (!businessType) throw new Error("Invalid category key");
    return getCategoriesByBusinessType(decodeURIComponent(businessType));
}

// ─── Hooks ────────────────────────────────────────────────

/** Categories for a given business type */
export function useCategoriesByBusinessType(businessType: string | null | undefined) {
    const key = businessType ? swrKeys.categoriesByBusinessType(businessType) : null;
    const { data, error, isLoading, mutate } = useSWR(key, fetchCategoriesByType);

    return {
        categories: data ?? [],
        isLoading,
        error,
        mutate,
    };
}
