import type { DiscountMethod, DiscountType } from "./sale";

// ---------------------------------------------------------------------------
// Discount Entity — mirrors backend com.dokaniai.entity.Discount
// ---------------------------------------------------------------------------

export interface Discount {
    id: string;
    businessId: string;
    customerId: string | null;
    saleId: string | null;
    saleItemId: string | null;
    duePaymentId: string | null;
    discountType: DiscountType;
    discountMethod: DiscountMethod;
    discountValue: number;
    discountAmount: number;
    reason: string | null;
    createdBy: string;
    createdAt: string;
}

export interface DiscountListResponse {
    content: Discount[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

// ---------------------------------------------------------------------------
// Summary DTOs — mirrors backend com.dokaniai.dto.response.*
// ---------------------------------------------------------------------------

export interface TypeSummary {
    type: string;
    count: number;
    totalAmount: number;
}

export interface DiscountSummaryResponse {
    totalDiscounts: number;
    totalAmount: number;
    byType: TypeSummary[];
    byMethod: TypeSummary[];
    averageDiscount: number;
}

// ---------------------------------------------------------------------------
// List params
// ---------------------------------------------------------------------------

export interface ListDiscountsParams {
    page?: number;
    size?: number;
    type?: DiscountType;
    customerId?: string;
    startDate?: string;
    endDate?: string;
}
