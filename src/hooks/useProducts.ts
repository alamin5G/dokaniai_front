/**
 * Product data hooks — SWR-backed with shared cache
 */

import useSWR from "swr";
import type {
    Product,
    ProductListResponse,
    ProductStatsResponse,
} from "@/types/product";
import {
    listProducts,
    getProductStats,
    getLowStockProducts,
    getReorderNeededProducts,
} from "@/lib/productApi";
import { swrKeys } from "@/lib/swrKeys";
import { SWR_CACHE } from "@/config/cacheConfig";

// ─── Fetchers ─────────────────────────────────────────────

async function fetchProductList(key: string): Promise<ProductListResponse> {
    // key = "/businesses/{id}/products?..."
    const url = new URL(key, "http://localhost");
    const businessId = url.pathname.split("/")[2];
    const params: Record<string, string | number | undefined> = {};
    url.searchParams.forEach((v, k) => { params[k] = v; });
    return listProducts(businessId, params);
}

async function fetchProductStats(key: string): Promise<ProductStatsResponse> {
    const businessId = key.split("/")[2];
    return getProductStats(businessId);
}

async function fetchLowStock(key: string): Promise<Product[]> {
    const businessId = key.split("/")[2];
    return getLowStockProducts(businessId);
}

async function fetchReorderNeeded(key: string): Promise<Product[]> {
    const businessId = key.split("/")[2];
    return getReorderNeededProducts(businessId);
}

// ─── Hooks ────────────────────────────────────────────────

/** Paginated product listing with search/filter */
export function useProducts(
    businessId: string | null | undefined,
    params?: Record<string, unknown>,
) {
    const key = businessId ? swrKeys.products(businessId, params) : null;
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        key,
        fetchProductList,
        { keepPreviousData: true, dedupingInterval: SWR_CACHE.productList },
    );

    return {
        products: data?.content ?? [],
        totalPages: data?.totalPages ?? 1,
        totalElements: data?.totalElements ?? 0,
        isLoading,
        isValidating,
        error,
        mutate,
    };
}

/** Product stats (total, active, low stock counts) */
export function useProductStats(businessId: string | null | undefined) {
    const key = businessId ? swrKeys.productStats(businessId) : null;
    const { data, error, isLoading, mutate } = useSWR(key, fetchProductStats, {
        dedupingInterval: SWR_CACHE.productStats,
    });

    return {
        stats: data ?? null,
        isLoading,
        error,
        mutate,
    };
}

/** Low-stock products */
export function useLowStockProducts(businessId: string | null | undefined) {
    const key = businessId ? swrKeys.lowStockProducts(businessId) : null;
    const { data, error, isLoading, mutate } = useSWR(key, fetchLowStock, {
        dedupingInterval: SWR_CACHE.lowStockProducts,
    });

    return {
        lowStockProducts: data ?? [],
        isLoading,
        error,
        mutate,
    };
}

/** Reorder-needed products */
export function useReorderNeededProducts(businessId: string | null | undefined) {
    const key = businessId ? swrKeys.reorderNeededProducts(businessId) : null;
    const { data, error, isLoading, mutate } = useSWR(key, fetchReorderNeeded);

    return {
        reorderProducts: data ?? [],
        isLoading,
        error,
        mutate,
    };
}
