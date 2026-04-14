import apiClient from "@/lib/api";
import type {
    Discount,
    DiscountListResponse,
    DiscountSummaryResponse,
    ListDiscountsParams,
} from "@/types/discount";

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    message?: string;
}

function unwrap<T>(response: { data: ApiSuccess<T> }): T {
    return response.data.data;
}

// ---------------------------------------------------------------------------
// List Discounts (paginated with optional filters)
// ---------------------------------------------------------------------------

export async function listDiscounts(
    businessId: string,
    params: ListDiscountsParams = {},
): Promise<DiscountListResponse> {
    const response = await apiClient.get<ApiSuccess<DiscountListResponse>>(
        `/businesses/${businessId}/discounts`,
        { params },
    );
    return unwrap(response);
}

// ---------------------------------------------------------------------------
// Get Discount by ID
// ---------------------------------------------------------------------------

export async function getDiscount(
    businessId: string,
    discountId: string,
): Promise<Discount> {
    const response = await apiClient.get<ApiSuccess<Discount>>(
        `/businesses/${businessId}/discounts/${discountId}`,
    );
    return unwrap(response);
}

// ---------------------------------------------------------------------------
// Get Discount Statistics (for a date range)
// ---------------------------------------------------------------------------

export interface DiscountStatsParams {
    startDate?: string;
    endDate?: string;
}

export async function getDiscountStats(
    businessId: string,
    params: DiscountStatsParams = {},
): Promise<DiscountSummaryResponse> {
    const response = await apiClient.get<ApiSuccess<DiscountSummaryResponse>>(
        `/businesses/${businessId}/discounts/stats`,
        { params },
    );
    return unwrap(response);
}

// ---------------------------------------------------------------------------
// Get Discount Summary (grouped by type)
// ---------------------------------------------------------------------------

export async function getDiscountSummary(
    businessId: string,
    params: DiscountStatsParams = {},
): Promise<DiscountSummaryResponse> {
    const response = await apiClient.get<ApiSuccess<DiscountSummaryResponse>>(
        `/businesses/${businessId}/discounts/summary`,
        { params },
    );
    return unwrap(response);
}
