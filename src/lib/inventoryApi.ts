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
    const { data } = await apiClient.get(
        `/api/v1/businesses/${businessId}/inventory/logs`,
        { params }
    );
    return unwrap<PagedInventoryLogs>(data);
}

// ─── Manual Stock Adjustment ─────────────────────────────

export async function adjustInventory(
    businessId: string,
    request: InventoryAdjustmentRequest
): Promise<InventoryLog> {
    const { data } = await apiClient.post(
        `/api/v1/businesses/${businessId}/inventory/adjust`,
        request
    );
    return unwrap<InventoryLog>(data);
}

// ─── Product Stock History ───────────────────────────────

export async function getProductStockHistory(
    businessId: string,
    productId: string,
    limit = 50
): Promise<StockHistoryEntry[]> {
    const { data } = await apiClient.get(
        `/api/v1/businesses/${businessId}/inventory/${productId}/history`,
        { params: { limit } }
    );
    return unwrap<StockHistoryEntry[]>(data);
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

    const { data } = await apiClient.get(
        `/api/v1/businesses/${businessId}/inventory/summary`,
        { params }
    );
    return unwrap<InventorySummary[]>(data);
}

// ─── Stock Alerts ────────────────────────────────────────

export async function getStockAlerts(
    businessId: string
): Promise<StockAlertReport> {
    const { data } = await apiClient.get(
        `/api/v1/businesses/${businessId}/inventory/alerts`
    );
    return unwrap<StockAlertReport>(data);
}
