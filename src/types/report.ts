/**
 * Report Module Types
 * Aligned with backend: ReportController
 * SRS Reference: Section 6.8 - Reports
 */

// ─── Enums ───────────────────────────────────────────────

export type ReportType =
    | "DAILY_SALES"
    | "WEEKLY_SALES"
    | "MONTHLY_SALES"
    | "PRODUCT_PROFIT"
    | "EXPENSE_BREAKDOWN"
    | "DUE_LEDGER"
    | "AGED_DUES"
    | "NET_PROFIT"
    | "STOCK_ALERT"
    | "CUSTOM";

// ─── Shared Sub-types ────────────────────────────────────

export interface TopSellingItem {
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
}

export interface RecentActivity {
    type: string;
    description: string;
    timestamp: string;
    amount: number;
}

export interface ProductProfitItem {
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
    cost: number;
    profit: number;
    profitMargin: number;
}

export interface StockAlertItem {
    productId: string;
    productName: string;
    sku: string | null;
    currentStock: number;
    reorderPoint: number;
    status: string;
}

// ─── Report Responses ────────────────────────────────────

export interface DailySalesReport {
    date: string;
    totalSales: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    totalDiscount: number;
    itemsSold: number;
    topItems: TopSellingItem[];
}

export interface PeriodSalesReport {
    period: string;
    startDate: string;
    endDate: string;
    totalSales: number;
    totalRevenue: number;
    totalProfit: number;
    dailyBreakdown: DailySalesReport[];
}

export interface ProductProfitReport {
    startDate: string;
    endDate: string;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    products: ProductProfitItem[];
}

export interface NetProfitReport {
    startDate: string;
    endDate: string;
    totalRevenue: number;
    cogs: number;
    grossProfit: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
}

export interface DueLedgerReport {
    totalDue: number;
    customersWithDue: number;
    customers: Array<{
        customerId: string;
        customerName: string;
        phone: string | null;
        dueAmount: number;
        lastTransactionDate: string | null;
    }>;
}

export interface StockAlertReport {
    lowStockCount: number;
    outOfStockCount: number;
    reorderNeededCount: number;
    items: StockAlertItem[];
}

export interface ExpenseCategoryItem {
    category: string;
    amount: number;
    percentage: number;
}

export interface ExpenseBreakdownReport {
    startDate: string;
    endDate: string;
    totalExpenses: number;
    categories: ExpenseCategoryItem[];
}

export interface DashboardSummary {
    todaySales: number;
    todayProfit: number;
    monthSales: number;
    monthProfit: number;
    lowStockItems: number;
    reorderNeededItems: number;
    totalDue: number;
    customersWithDue: number;
    topSellingToday: TopSellingItem[];
    recentActivities: RecentActivity[];
}

export interface MisKpi {
    label: string;
    value: number;
    unit: "BDT" | "COUNT" | "PERCENT" | string;
    delta: number;
    tone: "good" | "warning" | "danger" | "neutral" | string;
}

export interface MisTrendPoint {
    label: string;
    revenue: number;
    profit: number;
    expenses: number;
    count: number;
}

export interface MisBreakdownItem {
    label: string;
    value: number;
    percentage: number;
    tone: string;
}

export interface MisTableRow {
    label: string;
    amount: number;
    quantity: number;
    metric: number;
    meta: Record<string, unknown>;
}

export interface MisActionItem {
    title: string;
    message: string;
    severity: "INFO" | "WARNING" | "CRITICAL" | string;
    actionType: string;
    expectedImpact: string;
}

export interface MisReportResponse {
    reportType: string;
    startDate: string;
    endDate: string;
    kpis: MisKpi[];
    trend: MisTrendPoint[];
    breakdown: MisBreakdownItem[];
    rows: MisTableRow[];
    actions: MisActionItem[];
    metadata: Record<string, unknown>;
}

export interface DssReportResponse {
    context: string;
    insights: Array<{
        id: string;
        title: string;
        message: string;
        severity: string;
        confidence: number;
        isRead: boolean;
        isActedUpon: boolean;
        sourcePeriodStart?: string;
        sourcePeriodEnd?: string;
        priorityScore?: number;
        createdAt: string;
    }>;
    actions: MisActionItem[];
    metrics: Record<string, unknown>;
}

export interface CustomReport {
    title: string;
    columns: string[];
    rows: unknown[][];
    generatedAt: string;
}

// ─── Request ─────────────────────────────────────────────

export interface CustomReportRequest {
    type: ReportType;
    startDate?: string;
    endDate?: string;
    groupBy?: string[];
    metrics?: string[];
}
