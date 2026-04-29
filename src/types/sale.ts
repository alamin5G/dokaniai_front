// ---------------------------------------------------------------------------
// Enums — mirror backend com.dokaniai.enums.*
// ---------------------------------------------------------------------------

export type PaymentMethod =
    | "CASH"
    | "CREDIT"
    | "BKASH"
    | "NAGAD"
    | "ROCKET"
    | "CARD"
    | "BANK"
    | "MANUAL";

export type PaymentStatus =
    // For sales.payment_status
    | "PAID"
    | "PARTIAL"
    | "DUE";

export type EntryMode = "MANUAL" | "TEXT_NLP" | "VOICE";

export type DiscountMethod = "PERCENTAGE" | "FIXED";

export type DiscountType =
    | "BULK_PAYMENT"
    | "CASH_PAYMENT"
    | "LOYALTY"
    | "CUSTOM";

// ---------------------------------------------------------------------------
// Request DTOs — mirror backend com.dokaniai.dto.request.*
// ---------------------------------------------------------------------------

export interface SaleItemRequest {
    productId: string | null;
    productName: string;
    quantity: number;
    unitPrice: number;
}

export interface DiscountRequest {
    discountType: DiscountType;
    discountMethod: DiscountMethod;
    value: number;
    reason?: string;
}

export interface SaleCreateRequest {
    customerId?: string | null;
    items: SaleItemRequest[];
    discounts?: DiscountRequest[];
    paymentMethod: PaymentMethod;
    saleDate?: string;
    recordedVia?: EntryMode;
    voiceTranscript?: string;
    notes?: string;
}

// ---------------------------------------------------------------------------
// Response / Entity — mirror backend entity Sale + SaleItem
// ---------------------------------------------------------------------------

export interface SaleItem {
    id: string;
    saleId: string;
    productId: string | null;
    productNameSnapshot: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
    subtotal: number;
}

export interface Sale {
    id: string;
    businessId: string;
    customerId: string | null;
    invoiceNumber: string;
    subtotal: number;
    totalDiscount: number;
    taxRate: number;
    taxAmount: number;
    totalAmount: number;
    totalCost: number;
    profit: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    amountPaid: number;
    amountDue: number;
    recordedVia: EntryMode;
    voiceTranscript: string | null;
    notes: string | null;
    createdBy: string;
    saleDate: string;
    createdAt: string;
    updatedAt: string;
    items: SaleItem[];
}

export interface SaleListResponse {
    content: Sale[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

// ---------------------------------------------------------------------------
// Stats DTOs — mirror backend com.dokaniai.dto.response.*
// ---------------------------------------------------------------------------

export interface SalesStatsResponse {
    totalSales: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    totalDiscount: number;
    averageSaleValue: number;
}

export interface DailySalesSummary {
    date: string;
    totalSales: number;
    totalRevenue: number;
    totalProfit: number;
    totalDiscount: number;
    itemsSold: number;
}

export interface TopProductResponse {
    productId: string;
    productName: string;
    totalQuantitySold: number;
    totalRevenue: number;
}

// ---------------------------------------------------------------------------
// Enhanced sale creation response — includes today's summary context
// SRS Ref: FR-SALE-01, FR-RPT-01
// ---------------------------------------------------------------------------

export interface SaleCreatedResponse {
    id: string;
    invoiceNumber: string;
    subtotal: number;
    totalDiscount: number;
    taxAmount: number;
    totalAmount: number;
    profit: number;
    paymentMethod: string;
    paymentStatus: string;
    itemCount: number;
    todaySummary: TodaySalesSummary | null;
    customerId: string | null;
    customerName: string | null;
    customerPhone: string | null;
    customerAddress: string | null;
    dueAmount: number | null;
    runningBalance: number | null;
    whatsappReminderUrl: string | null;
}

export interface TodaySalesSummary {
    salesCount: number;
    totalRevenue: number;
    totalProfit: number;
    totalDiscount: number;
}

// ---------------------------------------------------------------------------
// Cart item (frontend-only, used in POS UI)
// ---------------------------------------------------------------------------

export interface CartItem {
    productId: string;
    productName: string;
    unit: string;
    unitPrice: number;
    costPrice: number;
    quantity: number;
    stockQty: number;
}
