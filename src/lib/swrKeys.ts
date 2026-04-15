/**
 * SWR Cache Key Factory
 *
 * Centralised key generation for all SWR hooks.
 * Using factory functions ensures consistent keys across components
 * and makes cache invalidation predictable.
 */

// ─── Helpers ──────────────────────────────────────────────

/** Sort and stringify params for deterministic cache keys */
function paramsKey(params: Record<string, unknown> | undefined): string {
    if (!params) return "";
    const filtered: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== "") {
            filtered[k] = v;
        }
    }
    const keys = Object.keys(filtered).sort();
    if (keys.length === 0) return "";
    return "?" + keys.map((k) => `${k}=${encodeURIComponent(String(filtered[k]))}`).join("&");
}

// ─── Products ─────────────────────────────────────────────

export const swrKeys = {
    // Products
    products: (businessId: string, params?: Record<string, unknown>) =>
        `/businesses/${businessId}/products${paramsKey(params)}`,
    productStats: (businessId: string) =>
        `/businesses/${businessId}/products/stats`,
    lowStockProducts: (businessId: string) =>
        `/businesses/${businessId}/products/low-stock`,
    reorderNeededProducts: (businessId: string) =>
        `/businesses/${businessId}/products/reorder-needed`,

    // Sales
    sales: (businessId: string, params?: Record<string, unknown>) =>
        `/businesses/${businessId}/sales${paramsKey(params)}`,
    todaySales: (businessId: string) =>
        `/businesses/${businessId}/sales/today`,
    salesStats: (businessId: string, startDate?: string, endDate?: string) =>
        `/businesses/${businessId}/sales/stats${paramsKey({ startDate, endDate })}`,
    dailySummary: (businessId: string, date?: string) =>
        `/businesses/${businessId}/sales/daily-summary${paramsKey({ date })}`,
    topProducts: (businessId: string, limit?: number) =>
        `/businesses/${businessId}/sales/top-products${paramsKey({ limit })}`,

    // Expenses
    expenses: (businessId: string, params?: Record<string, unknown>) =>
        `/businesses/${businessId}/expenses${paramsKey(params)}`,
    expenseCategories: (businessId: string) =>
        `/businesses/${businessId}/expenses/categories`,
    expenseMonthlySummary: (businessId: string, year?: number, month?: number) =>
        `/businesses/${businessId}/expenses/summary${paramsKey({ year, month })}`,
    expenseCategoryBreakdown: (businessId: string, startDate?: string, endDate?: string) =>
        `/businesses/${businessId}/expenses/breakdown${paramsKey({ startDate, endDate })}`,

    // Due Ledger
    dueTransactions: (businessId: string, params?: Record<string, unknown>) =>
        `/businesses/${businessId}/due-transactions${paramsKey(params)}`,
    customersWithDue: (businessId: string) =>
        `/businesses/${businessId}/due-transactions/customers-with-due`,
    customerDueLedger: (businessId: string, customerId: string, page?: number, size?: number) =>
        `/businesses/${businessId}/due-transactions/customer/${customerId}/ledger${paramsKey({ page, size })}`,
    agedDues: (businessId: string) =>
        `/businesses/${businessId}/due-transactions/aged`,

    // Customers
    customers: (businessId: string, params?: Record<string, unknown>) =>
        `/businesses/${businessId}/customers${paramsKey(params)}`,

    // Categories
    categoriesByBusinessType: (businessType: string) =>
        `/categories/by-business-type/${encodeURIComponent(businessType)}`,

    // Business
    businessStats: (businessId: string) =>
        `/businesses/${businessId}/stats`,
    businessSettings: (businessId: string) =>
        `/businesses/${businessId}/settings`,
    businessOnboarding: (businessId: string) =>
        `/businesses/${businessId}/onboarding`,

    // Reports
    dashboardSummary: (businessId: string) =>
        `/businesses/${businessId}/reports/dashboard`,
    dailySalesReport: (businessId: string, date?: string) =>
        `/businesses/${businessId}/reports/daily${paramsKey({ date })}`,
    weeklySalesReport: (businessId: string, startDate?: string) =>
        `/businesses/${businessId}/reports/weekly${paramsKey({ startDate })}`,
    monthlySalesReport: (businessId: string, month?: string) =>
        `/businesses/${businessId}/reports/monthly${paramsKey({ month })}`,
    stockAlertReport: (businessId: string) =>
        `/businesses/${businessId}/reports/stock-alert`,

    // Inventory
    inventoryLogs: (businessId: string, params?: Record<string, unknown>) =>
        `/businesses/${businessId}/inventory/logs${paramsKey(params ?? {})}`,
} as const;

