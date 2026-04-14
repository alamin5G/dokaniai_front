import apiClient from "@/lib/api";
import type {
    SaleReturn,
    SaleReturnListResponse,
    ReturnCreateRequest,
    ReturnStatsResponse,
    ListSaleReturnsParams,
} from "@/types/saleReturn";

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    message?: string;
}

function unwrap<T>(response: { data: ApiSuccess<T> }): T {
    return response.data.data;
}

// ---------------------------------------------------------------------------
// List Sale Returns (paginated with optional filters)
// ---------------------------------------------------------------------------

export async function listSaleReturns(
    businessId: string,
    params: ListSaleReturnsParams = {},
): Promise<SaleReturnListResponse> {
    const response = await apiClient.get<ApiSuccess<SaleReturnListResponse>>(
        `/businesses/${businessId}/returns`,
        { params },
    );
    return unwrap(response);
}

// ---------------------------------------------------------------------------
// Create Sale Return
// ---------------------------------------------------------------------------

export async function createSaleReturn(
    businessId: string,
    data: ReturnCreateRequest,
): Promise<SaleReturn> {
    const response = await apiClient.post<ApiSuccess<SaleReturn>>(
        `/businesses/${businessId}/returns`,
        data,
    );
    return unwrap(response);
}

// ---------------------------------------------------------------------------
// Get Sale Return by ID
// ---------------------------------------------------------------------------

export async function getSaleReturn(
    businessId: string,
    returnId: string,
): Promise<SaleReturn> {
    const response = await apiClient.get<ApiSuccess<SaleReturn>>(
        `/businesses/${businessId}/returns/${returnId}`,
    );
    return unwrap(response);
}

// ---------------------------------------------------------------------------
// Void a Sale Return
// ---------------------------------------------------------------------------

export async function voidSaleReturn(
    businessId: string,
    returnId: string,
    reason?: string,
): Promise<void> {
    await apiClient.post(
        `/businesses/${businessId}/returns/${returnId}/void`,
        reason ? { reason } : {},
    );
}

// ---------------------------------------------------------------------------
// Get Return Statistics
// ---------------------------------------------------------------------------

export interface ReturnStatsParams {
    startDate?: string;
    endDate?: string;
}

export async function getReturnStats(
    businessId: string,
    params: ReturnStatsParams = {},
): Promise<ReturnStatsResponse> {
    const response = await apiClient.get<ApiSuccess<ReturnStatsResponse>>(
        `/businesses/${businessId}/returns/stats`,
        { params },
    );
    return unwrap(response);
}
