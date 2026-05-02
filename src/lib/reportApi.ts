/**
 * MIS Report API Client
 */

import apiClient from "@/lib/api";
import type {
    CustomReport,
    CustomReportRequest,
    DashboardSummary,
    DssReportResponse,
    MisReportResponse,
} from "@/types/report";

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    message?: string;
}

function unwrap<T>(response: ApiSuccess<T>): T {
    return response.data;
}

export async function getMisReport(
    businessId: string,
    tab: string,
    startDate?: string,
    endDate?: string
): Promise<MisReportResponse> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const { data } = await apiClient.get(
        `/businesses/${businessId}/reports/mis/${tab}`,
        { params }
    );
    return unwrap<MisReportResponse>(data);
}

export async function getDashboardSummary(
    businessId: string
): Promise<DashboardSummary> {
    const report = await getMisReport(businessId, "dashboard");
    const byLabel = new Map(report.kpis.map((kpi) => [kpi.label, kpi.value]));
    return {
        todaySales: byLabel.get("Revenue") ?? 0,
        todayProfit: byLabel.get("Net profit") ?? 0,
        monthSales: byLabel.get("Revenue") ?? 0,
        monthProfit: byLabel.get("Net profit") ?? 0,
        lowStockItems: Number(report.metadata.stockRisk ?? 0),
        reorderNeededItems: Number(report.metadata.stockRisk ?? 0),
        totalDue: byLabel.get("Due exposure") ?? 0,
        customersWithDue: 0,
        topSellingToday: report.rows.map((row) => ({
            productId: String(row.meta.productId ?? row.label),
            productName: row.label,
            quantitySold: Number(row.quantity ?? 0),
            revenue: Number(row.amount ?? 0),
        })),
        recentActivities: [],
    };
}

export async function getMisDssReport(
    businessId: string,
    startDate?: string,
    endDate?: string
): Promise<DssReportResponse> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const { data } = await apiClient.get(
        `/businesses/${businessId}/reports/mis/dss`,
        { params }
    );
    return unwrap<DssReportResponse>(data);
}

export async function generateMisDssReport(
    businessId: string,
    startDate?: string,
    endDate?: string
): Promise<DssReportResponse> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const { data } = await apiClient.post(
        `/businesses/${businessId}/reports/mis/dss/generate`,
        null,
        { params }
    );
    return unwrap<DssReportResponse>(data);
}

export async function exportMisReport(
    businessId: string,
    tab: string,
    format: string = "csv",
    startDate?: string,
    endDate?: string
): Promise<Blob> {
    const params: Record<string, string> = { tab, format };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const { data } = await apiClient.get(
        `/businesses/${businessId}/reports/mis/export`,
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
