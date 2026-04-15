/**
 * Due Ledger & Customer data hooks — SWR-backed with shared cache
 */

import useSWR from "swr";
import type {
    PagedDueTransactions,
    CustomerDueSummary,
    DueLedgerResponse,
    AgedDuesResponse,
    PagedCustomers,
    CustomerResponse,
} from "@/types/due";
import {
    listDueTransactions,
    getCustomersWithDue,
    getCustomerDueLedger,
    getAgedDues,
    listCustomers,
} from "@/lib/dueApi";
import { swrKeys } from "@/lib/swrKeys";

// ─── Fetchers ─────────────────────────────────────────────

async function fetchDueTransactions(key: string): Promise<PagedDueTransactions> {
    const url = new URL(key, "http://localhost");
    const businessId = url.pathname.split("/")[2];
    const params: Record<string, string | number | undefined> = {};
    url.searchParams.forEach((v, k) => { params[k] = v; });
    return listDueTransactions(businessId, params);
}

async function fetchCustomersWithDue(key: string): Promise<CustomerDueSummary[]> {
    const businessId = key.split("/")[2];
    return getCustomersWithDue(businessId);
}

async function fetchCustomerDueLedger(key: string): Promise<DueLedgerResponse> {
    // key = "/businesses/{id}/due-transactions/customer/{cid}/ledger?..."
    const parts = key.split("/");
    const businessId = parts[2];
    const customerId = parts[6];
    const url = new URL(key, "http://localhost");
    const page = Number(url.searchParams.get("page")) || 0;
    const size = Number(url.searchParams.get("size")) || 20;
    return getCustomerDueLedger(businessId, customerId, page, size);
}

async function fetchAgedDues(key: string): Promise<AgedDuesResponse> {
    const businessId = key.split("/")[2];
    return getAgedDues(businessId);
}

async function fetchCustomers(key: string): Promise<PagedCustomers> {
    const url = new URL(key, "http://localhost");
    const businessId = url.pathname.split("/")[2];
    const params: Record<string, string | number | undefined> = {};
    url.searchParams.forEach((v, k) => { params[k] = v; });
    return listCustomers(businessId, params);
}

// ─── Hooks ────────────────────────────────────────────────

/** Paginated due transactions */
export function useDueTransactions(
    businessId: string | null | undefined,
    params?: Record<string, unknown>,
) {
    const key = businessId ? swrKeys.dueTransactions(businessId, params) : null;
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        key,
        fetchDueTransactions,
        { keepPreviousData: true },
    );

    return {
        transactions: data?.content ?? [],
        totalPages: data?.totalPages ?? 1,
        totalElements: data?.totalElements ?? 0,
        isLoading,
        isValidating,
        error,
        mutate,
    };
}

/** Customers with outstanding dues */
export function useCustomersWithDue(businessId: string | null | undefined) {
    const key = businessId ? swrKeys.customersWithDue(businessId) : null;
    const { data, error, isLoading, mutate } = useSWR(key, fetchCustomersWithDue);

    return {
        customersWithDue: data ?? [],
        isLoading,
        error,
        mutate,
    };
}

/** Single customer's due ledger */
export function useCustomerDueLedger(
    businessId: string | null | undefined,
    customerId: string | null | undefined,
    page?: number,
    size?: number,
) {
    const key = businessId && customerId
        ? swrKeys.customerDueLedger(businessId, customerId, page, size)
        : null;
    const { data, error, isLoading, mutate } = useSWR(key, fetchCustomerDueLedger);

    return {
        ledger: data ?? null,
        isLoading,
        error,
        mutate,
    };
}

/** Aged dues report */
export function useAgedDues(businessId: string | null | undefined) {
    const key = businessId ? swrKeys.agedDues(businessId) : null;
    const { data, error, isLoading, mutate } = useSWR(key, fetchAgedDues);

    return {
        agedDues: data ?? null,
        isLoading,
        error,
        mutate,
    };
}

/** Paginated customer listing */
export function useCustomers(
    businessId: string | null | undefined,
    params?: Record<string, unknown>,
) {
    const key = businessId ? swrKeys.customers(businessId, params) : null;
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        key,
        fetchCustomers,
        { keepPreviousData: true },
    );

    return {
        customers: data?.content ?? [],
        totalPages: data?.totalPages ?? 1,
        totalElements: data?.totalElements ?? 0,
        isLoading,
        isValidating,
        error,
        mutate,
    };
}
