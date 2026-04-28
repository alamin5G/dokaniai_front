/**
 * Report Module API Client
 * Aligned with backend: ReportController
 */

import apiClient from "@/lib/api";
import type {
    DailySalesReport,
    PeriodSalesReport,
    ProductProfitReport,
    NetProfitReport,
    DueLedgerReport,
    StockAlertReport,
    DashboardSummary,
    CustomReport,
    CustomReportRequest,
    ReportType,
    ExpenseBreakdownReport,
} from "@/types/report";

// ─── Internal helpers ────────────────────────────────────

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    message?: string;
}

function unwrap<T>(response: { data: ApiSuccess<T> }): T {
    return response.data.data;
}

// ─── Reports ─────────────────────────────────────────────

export async function getDailySalesReport(
    businessId: string,
    date?: string
): Promise<DailySalesReport> {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    const { data } = await apiClient.get(
        `/businesses/${businessId}/reports/daily`,
        { params }
    );
    return unwrap<DailySalesReport>(data);
}

export async function getWeeklySalesReport(
    businessId: string,
    startDate?: string
): Promise<PeriodSalesReport> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    const { data } = await apiClient.get(
        `/businesses/${businessId}/reports/weekly`,
        { params }
    );
    return unwrap<PeriodSalesReport>(data);
}

export async function getMonthlySalesReport(
    businessId: string,
    month?: string
): Promise<PeriodSalesReport> {
    const params: Record<string, string> = {};
    if (month) params.month = month;
    const { data } = await apiClient.get(
        `/businesses/${businessId}/reports/monthly`,
        { params }
    );
    return unwrap<PeriodSalesReport>(data);
}

export async function getProductProfitReport(
    businessId: string,
    startDate?: string,
    endDate?: string
): Promise<ProductProfitReport> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const { data } = await apiClient.get(
        `/businesses/${businessId}/reports/products/profit`,
        { params }
    );
    return unwrap<ProductProfitReport>(data);
}

export async function getExpenseBreakdown(
    businessId: string,
    startDate?: string,
    endDate?: string
): Promise<ExpenseBreakdownReport> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const { data } = await apiClient.get(
        `/businesses/${businessId}/reports/expenses/breakdown`,
        { params }
    );
    return unwrap<ExpenseBreakdownReport>(data);
}

export async function getNetProfitReport(
    businessId: string,
    startDate?: string,
    endDate?: string
): Promise<NetProfitReport> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const { data } = await apiClient.get(
        `/businesses/${businessId}/reports/net-profit`,
        { params }
    );
    return unwrap<NetProfitReport>(data);
}

export async function getDueLedgerReport(
    businessId: string,
    customerId?: string
): Promise<DueLedgerReport> {
    const params: Record<string, string> = {};
    if (customerId) params.customerId = customerId;
    const { data } = await apiClient.get(
        `/businesses/${businessId}/reports/due-ledger`,
        { params }
    );
    return unwrap<DueLedgerReport>(data);
}

export async function getStockAlertReport(
    businessId: string
): Promise<StockAlertReport> {
    const { data } = await apiClient.get(
        `/businesses/${businessId}/reports/stock-alert`
    );
    return unwrap<StockAlertReport>(data);
}

export async function getDashboardSummary(
    businessId: string
): Promise<DashboardSummary> {
    const { data } = await apiClient.get(
        `/businesses/${businessId}/reports/dashboard`
    );
    return unwrap<DashboardSummary>(data);
}

export async function exportReport(
    businessId: string,
    type: ReportType,
    format: string = "pdf",
    date?: string
): Promise<Blob> {
    const params: Record<string, string> = { type: type, format };
    if (date) params.date = date;
    const { data } = await apiClient.get(
        `/businesses/${businessId}/reports/export`,
        { params, responseType: "blob" }
    );
    return data as Blob;
}

export async function generateCustomReport(
    businessId: string,
    request: CustomReportRequest
): Promise<CustomReport> {
    const { data } = await apiClient.post(
        `/businesses/${businessId}/reports/custom`,
        request
    );
    return unwrap<CustomReport>(data);
}
