import type { EntryMode, PaymentMethod, PaymentStatus } from "./sale";

// ---------------------------------------------------------------------------
// Enums — mirror backend com.dokaniai.enums.*
// ---------------------------------------------------------------------------

export type ReturnType = "FULL" | "PARTIAL" | "DEFECTIVE" | "EXCHANGE";

// ---------------------------------------------------------------------------
// SaleReturn Entity — mirrors backend com.dokaniai.entity.SaleReturn
// ---------------------------------------------------------------------------

export interface SaleReturn {
    id: string;
    businessId: string;
    saleId: string;
    saleItemId: string | null;
    productId: string | null;
    customerId: string | null;
    returnType: ReturnType;
    quantity: number;
    refundAmount: number;
    stockRestored: boolean;
    refundMethod: PaymentMethod | null;
    refundStatus: PaymentStatus;
    reason: string | null;
    notes: string | null;
    recordedVia: EntryMode;
    createdBy: string;
    returnDate: string;
    createdAt: string;
    updatedAt: string;
}

export interface SaleReturnListResponse {
    content: SaleReturn[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

// ---------------------------------------------------------------------------
// Request DTOs — mirrors backend com.dokaniai.dto.request.*
// ---------------------------------------------------------------------------

export interface ReturnCreateRequest {
    saleId: string;
    returnType: ReturnType;
    reason?: string;
    notes?: string;
}

export interface ReturnItemRequest {
    saleItemId: string;
    productId: string;
    quantity: number;
    refundAmount: number;
}

export interface VoidReturnRequest {
    reason?: string;
}

// ---------------------------------------------------------------------------
// Response DTOs — mirrors backend com.dokaniai.dto.response.*
// ---------------------------------------------------------------------------

export interface ReturnStatsResponse {
    totalReturns: number;
    totalRefundAmount: number;
    fullReturns: number;
    partialReturns: number;
    defectiveReturns: number;
    totalStockRestored: number;
}

// ---------------------------------------------------------------------------
// List params
// ---------------------------------------------------------------------------

export interface ListSaleReturnsParams {
    page?: number;
    size?: number;
    saleId?: string;
    startDate?: string;
    endDate?: string;
}
