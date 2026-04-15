import apiClient from "@/lib/api";
import type {
    DailySalesSummary,
    Sale,
    SaleCreateRequest,
    SaleListResponse,
    SalesStatsResponse,
    TopProductResponse,
    PaymentStatus,
} from "@/types/sale";

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    message?: string;
}

function unwrap<T>(response: { data: ApiSuccess<T> }): T {
    return response.data.data;
}

// ---------------------------------------------------------------------------
// List Sales
// ---------------------------------------------------------------------------

export interface ListSalesParams {
    page?: number;
    size?: number;
    startDate?: string;
    endDate?: string;
    customerId?: string;
    paymentStatus?: PaymentStatus;
}

export async function listSales(
    businessId: string,
    params: ListSalesParams = {},
): Promise<SaleListResponse> {
    const response = await apiClient.get<ApiSuccess<SaleListResponse>>(
        `/businesses/${businessId}/sales`,
        { params },
    );
    return unwrap(response);
}

// ---------------------------------------------------------------------------
// Create Sale
// ---------------------------------------------------------------------------

export async function createSale(
    businessId: string,
    data: SaleCreateRequest,
): Promise<Sale> {
    const response = await apiClient.post<ApiSuccess<Sale>>(
        `/businesses/${businessId}/sales`,
        data,
    );
    return unwrap(response);
}

// ---------------------------------------------------------------------------
// Force Create Sale (stock override — used after stock conflict confirmation)
// ---------------------------------------------------------------------------

export async function forceCreateSale(
    businessId: string,
    data: SaleCreateRequest,
): Promise<Sale> {
    const response = await apiClient.post<ApiSuccess<Sale>>(
        `/businesses/${businessId}/sales/force`,
        data,
    );
    return unwrap(response);
}

// ---------------------------------------------------------------------------
// Get Sale
// ---------------------------------------------------------------------------

export async function getSale(
    businessId: string,
    saleId: string,
): Promise<Sale> {
    const response = await apiClient.get<ApiSuccess<Sale>>(
        `/businesses/${businessId}/sales/${saleId}`,
    );
    return unwrap(response);
}

// ---------------------------------------------------------------------------
// Cancel Sale
// ---------------------------------------------------------------------------

export async function cancelSale(
    businessId: string,
    saleId: string,
    reason?: string,
): Promise<void> {
    await apiClient.delete(`/businesses/${businessId}/sales/${saleId}/cancel`, {
        data: reason ? { reason } : {},
    });
}

// ---------------------------------------------------------------------------
// Today's Sales
// ---------------------------------------------------------------------------

export async function getTodaySales(businessId: string): Promise<Sale[]> {
    const response = await apiClient.get<ApiSuccess<Sale[]>>(
        `/businesses/${businessId}/sales/today`,
    );
    return unwrap(response);
}

// ---------------------------------------------------------------------------
// Sales Stats
// ---------------------------------------------------------------------------

export async function getSalesStats(
    businessId: string,
    startDate?: string,
    endDate?: string,
): Promise<SalesStatsResponse> {
    const response = await apiClient.get<ApiSuccess<SalesStatsResponse>>(
        `/businesses/${businessId}/sales/stats`,
        {
            params: {
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            },
        },
    );
    return unwrap(response);
}

// ---------------------------------------------------------------------------
// Daily Summary
// ---------------------------------------------------------------------------

export async function getDailySummary(
    businessId: string,
    date?: string,
): Promise<DailySalesSummary> {
    const response = await apiClient.get<ApiSuccess<DailySalesSummary>>(
        `/businesses/${businessId}/sales/daily-summary`,
        {
            params: date ? { date } : undefined,
        },
    );
    return unwrap(response);
}

// ---------------------------------------------------------------------------
// Top Products
// ---------------------------------------------------------------------------

export async function getTopProducts(
    businessId: string,
    limit = 10,
): Promise<TopProductResponse[]> {
    const response = await apiClient.get<ApiSuccess<TopProductResponse[]>>(
        `/businesses/${businessId}/sales/top-products`,
        { params: { limit } },
    );
    return unwrap(response);
}

// ---------------------------------------------------------------------------
// Download Invoice PDF
// ---------------------------------------------------------------------------

export async function downloadInvoice(
    businessId: string,
    saleId: string,
): Promise<Blob> {
    const response = await apiClient.get(
        `/businesses/${businessId}/sales/${saleId}/invoice`,
        { responseType: "blob" },
    );
    return response.data as Blob;
}
