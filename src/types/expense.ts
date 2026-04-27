// ---------------------------------------------------------------------------
// Enums — mirror backend com.dokaniai.enums.*
// ---------------------------------------------------------------------------

export type CategoryScope = "GLOBAL" | "BUSINESS";

// ---------------------------------------------------------------------------
// Request DTOs
// ---------------------------------------------------------------------------

export interface ExpenseCreateRequest {
    category: string;
    customCategoryName?: string;
    amount: number;
    description?: string;
    expenseDate?: string;
    paymentMethod?: string;
    receiptUrl?: string;
    recordedVia?: "MANUAL" | "TEXT_NLP" | "VOICE";
    vendorId?: string;
    vendorName?: string;
    expenseType?: "FIXED" | "VARIABLE";
    isRecurring?: boolean;
}

export interface ExpenseUpdateRequest {
    category?: string;
    customCategoryName?: string;
    amount?: number;
    description?: string;
    expenseDate?: string;
    paymentMethod?: string;
    receiptUrl?: string;
    vendorId?: string | null;
    vendorName?: string;
    expenseType?: "FIXED" | "VARIABLE";
    isRecurring?: boolean;
}

export interface ExpenseCategoryRequest {
    name: string;
    nameBn?: string;
}

// ---------------------------------------------------------------------------
// Response / Entity — mirror backend entity Expense
// ---------------------------------------------------------------------------

export interface Expense {
    id: string;
    businessId: string;
    category: string;
    customCategoryName: string | null;
    amount: number;
    description: string | null;
    expenseDate: string;
    paymentMethod: string | null;
    paymentStatus: string;
    receiptUrl: string | null;
    vendorId: string | null;
    vendorName: string | null;
    expenseType: "FIXED" | "VARIABLE" | null;
    isRecurring: boolean;
    recordedVia: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface ExpenseListResponse {
    content: Expense[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

// ---------------------------------------------------------------------------
// Category
// ---------------------------------------------------------------------------

export interface ExpenseCategoryResponse {
    id: string;
    name: string;
    nameBn: string | null;
    displayName: string;
    scope: CategoryScope;
    businessId: string | null;
    icon: string | null;
    color: string | null;
    sortOrder: number;
    isActive: boolean;
    createdBy: string | null;
    createdAt: string;
}

export interface VendorRequest {
    name: string;
    phone?: string;
    address?: string;
    notes?: string;
    isActive?: boolean;
}

export interface VendorResponse {
    id: string;
    businessId: string;
    name: string;
    phone: string | null;
    address: string | null;
    notes: string | null;
    isActive: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

// ---------------------------------------------------------------------------
// Stats / Summary
// ---------------------------------------------------------------------------

export interface ExpenseCategorySummary {
    category: string;
    categoryName: string;
    count: number;
    totalAmount: number;
    percentage: number;
}

export interface MonthlyExpenseSummary {
    year: number;
    month: number;
    totalExpenses: number;
    expenseCount: number;
    categories: ExpenseCategorySummary[];
}

// ---------------------------------------------------------------------------
// Expense Intelligence — mirrors backend DTOs
// ---------------------------------------------------------------------------

export interface ExpenseAlert {
    alertType: "ANOMALY" | "CASH_FLOW_RISK" | "RECURRING_REMINDER" | "CATEGORY_SPIKE";
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    title: string;
    message: string;
    category: string | null;
    currentAmount: number | null;
    previousAmount: number | null;
    percentageChange: number | null;
    recommendation: string | null;
}

export interface ExpenseInsightDTO {
    type: "CATEGORY" | "VENDOR" | "OVERALL" | "STATUS";
    target: string;
    summary: string;
    healthScore: number | null;
    findings: string[];
    recommendations: Record<string, unknown>[];
    prediction: string;
    estimatedAnnualSavings: string | null;
    rawData: Record<string, unknown> | null;
    cached: boolean;
    callsRemaining: number;
    nextAvailableDate: string | null;
    cooldownRemaining: string | null;
}
