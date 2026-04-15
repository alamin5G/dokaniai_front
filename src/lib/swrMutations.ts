/**
 * SWR Cache Invalidation Utilities
 *
 * Centralised functions for invalidating related cache entries after mutations.
 * Uses SWR's global `mutate` with regex pattern matching to invalidate all
 * keys matching a given prefix.
 */

import { mutate } from "swr";
import { swrKeys } from "@/lib/swrKeys";

/**
 * Invalidate all product-related caches for a business.
 * Called after product create / update / archive / import.
 */
export async function invalidateProducts(businessId: string) {
    const prefix = `/businesses/${businessId}/products`;
    await mutate(
        (key) => typeof key === "string" && key.startsWith(prefix),
        undefined,
        { revalidate: true },
    );
}

/**
 * Invalidate all sale-related caches for a business.
 * Called after sale create / cancel / discount / payment-status change.
 */
export async function invalidateSales(businessId: string) {
    const prefix = `/businesses/${businessId}/sales`;
    await mutate(
        (key) => typeof key === "string" && key.startsWith(prefix),
        undefined,
        { revalidate: true },
    );
}

/**
 * Invalidate all expense-related caches for a business.
 * Called after expense create / update / delete.
 */
export async function invalidateExpenses(businessId: string) {
    const prefix = `/businesses/${businessId}/expenses`;
    await mutate(
        (key) => typeof key === "string" && key.startsWith(prefix),
        undefined,
        { revalidate: true },
    );
}

/**
 * Invalidate all due-related caches for a business.
 * Called after due transaction (baki / joma / adjustment / void).
 */
export async function invalidateDue(businessId: string) {
    const prefix = `/businesses/${businessId}/due-transactions`;
    await mutate(
        (key) => typeof key === "string" && key.startsWith(prefix),
        undefined,
        { revalidate: true },
    );
}

/**
 * Invalidate customer caches for a business.
 * Called after customer create / update.
 */
export async function invalidateCustomers(businessId: string) {
    const prefix = `/businesses/${businessId}/customers`;
    await mutate(
        (key) => typeof key === "string" && key.startsWith(prefix),
        undefined,
        { revalidate: true },
    );
}

/**
 * Invalidate business stats + dashboard summary.
 * Called after any mutation that changes KPIs (sales, expenses, dues).
 */
export async function invalidateDashboard(businessId: string) {
    await mutate(swrKeys.businessStats(businessId), undefined, { revalidate: true });
    await mutate(swrKeys.dashboardSummary(businessId), undefined, { revalidate: true });
}

/**
 * Nuclear option: invalidate ALL caches for a business.
 * Useful after bulk operations or data imports.
 */
export async function invalidateAll(businessId: string) {
    const prefix = `/businesses/${businessId}`;
    await mutate(
        (key) => typeof key === "string" && key.startsWith(prefix),
        undefined,
        { revalidate: true },
    );
}

/**
 * Composite invalidation: After a sale is created/cancelled,
 * products (stock changed), sales, and dashboard stats all need refreshing.
 */
export async function invalidateAfterSale(businessId: string) {
    await Promise.all([
        invalidateProducts(businessId),
        invalidateSales(businessId),
        invalidateDashboard(businessId),
    ]);
}

/**
 * Composite invalidation: After an expense mutation,
 * expenses and dashboard stats need refreshing.
 */
export async function invalidateAfterExpense(businessId: string) {
    await Promise.all([
        invalidateExpenses(businessId),
        invalidateDashboard(businessId),
    ]);
}

/**
 * Composite invalidation: After a due transaction,
 * due ledger, customers, and dashboard stats need refreshing.
 */
export async function invalidateAfterDue(businessId: string) {
    await Promise.all([
        invalidateDue(businessId),
        invalidateCustomers(businessId),
        invalidateDashboard(businessId),
    ]);
}
