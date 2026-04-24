/**
 * Inventory Management API Client
 * Aligned with backend: InventoryController
 * SRS Reference: FR-STOCK-01 to FR-STOCK-03, FR-RETURN-02, FR-RPT-07
 */

import apiClient from "@/lib/api";
import type {
    InventoryLog,
    InventoryAction,
    InventoryAdjustmentRequest,
    InventorySummary,
    StockAlertReport,
    StockHistoryEntry,
    PagedInventoryLogs,
} from "@/types/inventory";

// ─── Internal helpers ────────────────────────────────────

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    message?: string;
}

function unwrap<T>(response: { data: ApiSuccess<T> }): T {
    return response.data.data;
}

// ─── List Inventory Logs ─────────────────────────────────

export interface ListInventoryLogsParams {
    productId?: string;
    action?: InventoryAction;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
}

export async function listInventoryLogs(
    businessId: string,
    params: ListInventoryLogsParams = {}
): Promise<PagedInventoryLogs> {
    const response = await apiClient.get<ApiSuccess<PagedInventoryLogs>>(
        `/businesses/${businessId}/inventory/logs`,
        { params }
    );
    return unwrap(response);
}

// ─── Manual Stock Adjustment ─────────────────────────────

export async function adjustInventory(
    businessId: string,
    request: InventoryAdjustmentRequest
): Promise<InventoryLog> {
    const response = await apiClient.post<ApiSuccess<InventoryLog>>(
        `/businesses/${businessId}/inventory/adjust`,
        request
    );
    return unwrap(response);
}

// ─── Product Stock History ───────────────────────────────

export async function getProductStockHistory(
    businessId: string,
    productId: string,
    limit = 50
): Promise<StockHistoryEntry[]> {
    const response = await apiClient.get<ApiSuccess<StockHistoryEntry[]>>(
        `/businesses/${businessId}/inventory/${productId}/history`,
        { params: { limit } }
    );
    return unwrap(response);
}

// ─── Inventory Summary ───────────────────────────────────

export async function getInventorySummary(
    businessId: string,
    startDate?: string,
    endDate?: string
): Promise<InventorySummary[]> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await apiClient.get<ApiSuccess<InventorySummary[]>>(
        `/businesses/${businessId}/inventory/summary`,
        { params }
    );
    return unwrap(response);
}

// ─── Stock Alerts ────────────────────────────────────────

export async function getStockAlerts(
    businessId: string
): Promise<StockAlertReport> {
    const response = await apiClient.get<ApiSuccess<StockAlertReport>>(
        `/businesses/${businessId}/inventory/alerts`
    );
    return unwrap(response);
}
