import apiClient from "@/lib/api";
import type {
    Expense,
    ExpenseAlert,
    ExpenseCategoryRequest,
    ExpenseCategoryResponse,
    ExpenseCategorySummary,
    ExpenseCreateRequest,
    ExpenseInsightDTO,
    ExpenseListResponse,
    ExpenseUpdateRequest,
    MonthlyExpenseSummary,
} from "@/types/expense";

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    message?: string;
}

function unwrap<T>(response: { data: ApiSuccess<T> }): T {
    return response.data.data;
}

// ---------------------------------------------------------------------------
// List Expenses
// ---------------------------------------------------------------------------

export interface ListExpensesParams {
    page?: number;
    size?: number;
    category?: string;
    startDate?: string;
    endDate?: string;
}

export async function listExpenses(
    businessId: string,
    params: ListExpensesParams = {},
): Promise<ExpenseListResponse> {
    const response = await apiClient.get<ApiSuccess<ExpenseListResponse>>(
        `/businesses/${businessId}/expenses`,
        { params },
    );
    return unwrap(response);
}

// ---------------------------------------------------------------------------
// Create Expense
// ---------------------------------------------------------------------------

export async function createExpense(
    businessId: string,
    data: ExpenseCreateRequest,
): Promise<Expense> {
    const response = await apiClient.post<ApiSuccess<Expense>>(
        `/businesses/${businessId}/expenses`,
        data,
    );
    return unwrap(response);
}

// ---------------------------------------------------------------------------
// Update Expense
// ---------------------------------------------------------------------------

export async function updateExpense(
    businessId: string,
    expenseId: string,
    data: ExpenseUpdateRequest,
): Promise<Expense> {
    const response = await apiClient.put<ApiSuccess<Expense>>(
        `/businesses/${businessId}/expenses/${expenseId}`,
        data,
    );
    return unwrap(response);
}

// ---------------------------------------------------------------------------
// Delete Expense
// ---------------------------------------------------------------------------

export async function deleteExpense(
    businessId: string,
    expenseId: string,
): Promise<void> {
    await apiClient.delete(`/businesses/${businessId}/expenses/${expenseId}`);
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function getExpenseCategories(
    businessId: string,
): Promise<ExpenseCategoryResponse[]> {
    const response = await apiClient.get<ApiSuccess<ExpenseCategoryResponse[]>>(
        `/businesses/${businessId}/expenses/categories`,
    );
    return unwrap(response);
}

export async function createExpenseCategory(
    businessId: string,
    data: ExpenseCategoryRequest,
): Promise<ExpenseCategoryResponse> {
    const response = await apiClient.post<ApiSuccess<ExpenseCategoryResponse>>(
        `/businesses/${businessId}/expenses/categories`,
        data,
    );
    return unwrap(response);
}

// ---------------------------------------------------------------------------
// Summary / Stats
// ---------------------------------------------------------------------------

export async function getMonthlySummary(
    businessId: string,
    year?: number,
    month?: number,
): Promise<MonthlyExpenseSummary> {
    const response = await apiClient.get<ApiSuccess<MonthlyExpenseSummary>>(
        `/businesses/${businessId}/expenses/summary`,
        { params: { year: year || undefined, month: month || undefined } },
    );
    return unwrap(response);
}

export async function getCategoryBreakdown(
    businessId: string,
    startDate?: string,
    endDate?: string,
): Promise<ExpenseCategorySummary[]> {
    const response = await apiClient.get<ApiSuccess<ExpenseCategorySummary[]>>(
        `/businesses/${businessId}/expenses/breakdown`,
        { params: { startDate: startDate || undefined, endDate: endDate || undefined } },
    );
    return unwrap(response);
}

// ---------------------------------------------------------------------------
// Expense Intelligence — Insights & Alerts
// ---------------------------------------------------------------------------

export async function getExpenseInsight(
    businessId: string,
    category?: string,
    vendorName?: string,
): Promise<ExpenseInsightDTO> {
    const path = category
        ? `/businesses/${businessId}/expenses/insights/category?name=${encodeURIComponent(category)}`
        : vendorName
            ? `/businesses/${businessId}/expenses/insights/vendor?name=${encodeURIComponent(vendorName)}`
            : `/businesses/${businessId}/expenses/insights/overall`;
    const response = await apiClient.get<ApiSuccess<ExpenseInsightDTO>>(path);
    return unwrap(response);
}

/**
 * Get insight button status — available calls, cooldown, next available date.
 * Does NOT trigger any AI call.
 */
export async function getInsightStatus(
    businessId: string,
): Promise<ExpenseInsightDTO> {
    const response = await apiClient.get<ApiSuccess<ExpenseInsightDTO>>(
        `/businesses/${businessId}/expenses/insights/status`,
    );
    return unwrap(response);
}

export async function getExpenseAlerts(
    businessId: string,
): Promise<ExpenseAlert[]> {
    const response = await apiClient.get<ApiSuccess<ExpenseAlert[]>>(
        `/businesses/${businessId}/expenses/alerts`,
    );
    return unwrap(response);
}
