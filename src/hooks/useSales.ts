/**
 * Sales data hooks — SWR-backed with shared cache
 */

import useSWR from "swr";
import type {
    Sale,
    SaleListResponse,
    SalesStatsResponse,
    DailySalesSummary,
    TopProductResponse,
} from "@/types/sale";
import {
    listSales,
    getSalesStats,
    getTodaySales,
    getDailySummary,
    getTopProducts,
} from "@/lib/saleApi";
import { swrKeys } from "@/lib/swrKeys";

// ─── Fetchers ─────────────────────────────────────────────

async function fetchSalesList(key: string): Promise<SaleListResponse> {
    const url = new URL(key, "http://localhost");
    const businessId = url.pathname.split("/")[2];
    const params: Record<string, string | number | undefined> = {};
    url.searchParams.forEach((v, k) => { params[k] = v; });
    return listSales(businessId, params);
}

async function fetchSalesStats(key: string): Promise<SalesStatsResponse> {
    const businessId = key.split("/")[2];
    const url = new URL(key, "http://localhost");
    const startDate = url.searchParams.get("startDate") ?? undefined;
    const endDate = url.searchParams.get("endDate") ?? undefined;
    return getSalesStats(businessId, startDate, endDate);
}

async function fetchTodaySales(key: string): Promise<Sale[]> {
    const businessId = key.split("/")[2];
    return getTodaySales(businessId);
}

async function fetchDailySummary(key: string): Promise<DailySalesSummary> {
    const businessId = key.split("/")[2];
    const url = new URL(key, "http://localhost");
    const date = url.searchParams.get("date") ?? undefined;
    return getDailySummary(businessId, date);
}

async function fetchTopProducts(key: string): Promise<TopProductResponse[]> {
    const businessId = key.split("/")[2];
    const url = new URL(key, "http://localhost");
    const limit = Number(url.searchParams.get("limit")) || 10;
    return getTopProducts(businessId, limit);
}

// ─── Hooks ────────────────────────────────────────────────

/** Paginated sales listing */
export function useSales(
    businessId: string | null | undefined,
    params?: Record<string, unknown>,
) {
    const key = businessId ? swrKeys.sales(businessId, params) : null;
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        key,
        fetchSalesList,
        { keepPreviousData: true },
    );

    return {
        sales: data?.content ?? [],
        totalPages: data?.totalPages ?? 1,
        totalElements: data?.totalElements ?? 0,
        isLoading,
        isValidating,
        error,
        mutate,
    };
}

/** Sales stats (revenue, count, etc.) */
export function useSalesStats(
    businessId: string | null | undefined,
    startDate?: string,
    endDate?: string,
) {
    const key = businessId ? swrKeys.salesStats(businessId, startDate, endDate) : null;
    const { data, error, isLoading, mutate } = useSWR(key, fetchSalesStats);

    return {
        stats: data ?? null,
        isLoading,
        error,
        mutate,
    };
}

/** Today's sales */
export function useTodaySales(businessId: string | null | undefined) {
    const key = businessId ? swrKeys.todaySales(businessId) : null;
    const { data, error, isLoading, mutate } = useSWR(key, fetchTodaySales);

    return {
        todaySales: data ?? [],
        isLoading,
        error,
        mutate,
    };
}

/** Daily summary */
export function useDailySummary(
    businessId: string | null | undefined,
    date?: string,
) {
    const key = businessId ? swrKeys.dailySummary(businessId, date) : null;
    const { data, error, isLoading, mutate } = useSWR(key, fetchDailySummary);

    return {
        summary: data ?? null,
        isLoading,
        error,
        mutate,
    };
}

/** Top products */
export function useTopProducts(
    businessId: string | null | undefined,
    limit?: number,
) {
    const key = businessId ? swrKeys.topProducts(businessId, limit) : null;
    const { data, error, isLoading, mutate } = useSWR(key, fetchTopProducts);

    return {
        topProducts: data ?? [],
        isLoading,
        error,
        mutate,
    };
}
