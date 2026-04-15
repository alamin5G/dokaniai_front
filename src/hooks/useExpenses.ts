/**
 * Expense data hooks — SWR-backed with shared cache
 */

import useSWR from "swr";
import type {
    Expense,
    ExpenseListResponse,
    ExpenseCategoryResponse,
    MonthlyExpenseSummary,
    ExpenseCategorySummary,
} from "@/types/expense";
import {
    listExpenses,
    getExpenseCategories,
    getMonthlySummary,
    getCategoryBreakdown,
} from "@/lib/expenseApi";
import { swrKeys } from "@/lib/swrKeys";

// ─── Fetchers ─────────────────────────────────────────────

async function fetchExpenseList(key: string): Promise<ExpenseListResponse> {
    const url = new URL(key, "http://localhost");
    const businessId = url.pathname.split("/")[2];
    const params: Record<string, string | number | undefined> = {};
    url.searchParams.forEach((v, k) => { params[k] = v; });
    return listExpenses(businessId, params);
}

async function fetchExpenseCategories(key: string): Promise<ExpenseCategoryResponse[]> {
    const businessId = key.split("/")[2];
    return getExpenseCategories(businessId);
}

async function fetchMonthlySummary(key: string): Promise<MonthlyExpenseSummary> {
    const businessId = key.split("/")[2];
    const url = new URL(key, "http://localhost");
    const year = url.searchParams.get("year") ? Number(url.searchParams.get("year")) : undefined;
    const month = url.searchParams.get("month") ? Number(url.searchParams.get("month")) : undefined;
    return getMonthlySummary(businessId, year, month);
}

async function fetchCategoryBreakdown(key: string): Promise<ExpenseCategorySummary[]> {
    const businessId = key.split("/")[2];
    const url = new URL(key, "http://localhost");
    const startDate = url.searchParams.get("startDate") ?? undefined;
    const endDate = url.searchParams.get("endDate") ?? undefined;
    return getCategoryBreakdown(businessId, startDate, endDate);
}

// ─── Hooks ────────────────────────────────────────────────

/** Paginated expense listing */
export function useExpenses(
    businessId: string | null | undefined,
    params?: Record<string, unknown>,
) {
    const key = businessId ? swrKeys.expenses(businessId, params) : null;
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        key,
        fetchExpenseList,
        { keepPreviousData: true },
    );

    return {
        expenses: data?.content ?? [],
        totalPages: data?.totalPages ?? 1,
        totalElements: data?.totalElements ?? 0,
        isLoading,
        isValidating,
        error,
        mutate,
    };
}

/** Expense categories for a business */
export function useExpenseCategories(businessId: string | null | undefined) {
    const key = businessId ? swrKeys.expenseCategories(businessId) : null;
    const { data, error, isLoading, mutate } = useSWR(key, fetchExpenseCategories);

    return {
        categories: data ?? [],
        isLoading,
        error,
        mutate,
    };
}

/** Monthly expense summary */
export function useExpenseMonthlySummary(
    businessId: string | null | undefined,
    year?: number,
    month?: number,
) {
    const key = businessId ? swrKeys.expenseMonthlySummary(businessId, year, month) : null;
    const { data, error, isLoading, mutate } = useSWR(key, fetchMonthlySummary);

    return {
        summary: data ?? null,
        isLoading,
        error,
        mutate,
    };
}

/** Category breakdown */
export function useExpenseCategoryBreakdown(
    businessId: string | null | undefined,
    startDate?: string,
    endDate?: string,
) {
    const key = businessId ? swrKeys.expenseCategoryBreakdown(businessId, startDate, endDate) : null;
    const { data, error, isLoading, mutate } = useSWR(key, fetchCategoryBreakdown);

    return {
        breakdown: data ?? [],
        isLoading,
        error,
        mutate,
    };
}
