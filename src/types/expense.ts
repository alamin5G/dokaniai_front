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
}

export interface ExpenseUpdateRequest {
    category?: string;
    customCategoryName?: string;
    amount?: number;
    description?: string;
    expenseDate?: string;
    paymentMethod?: string;
    receiptUrl?: string;
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
