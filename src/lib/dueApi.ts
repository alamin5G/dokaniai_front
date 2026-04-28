/**
 * Due Management API Client — বাকী খাতা
 * Aligned with backend: DueTransactionController, CustomerController
 */

import apiClient from "@/lib/api";
import type {
    DueTransaction,
    DueTransactionRequest,
    DueTransactionType,
    CustomerResponse,
    CustomerCreateRequest,
    CustomerUpdateRequest,
    CustomerDueSummary,
    DueLedgerResponse,
    AgedDuesResponse,
    WhatsAppLink,
    WhatsAppReminderResponse,
    PagedDueTransactions,
    PagedCustomers,
} from "@/types/due";

// ─── Internal helpers ────────────────────────────────────

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    message?: string;
}

function unwrap<T>(response: { data: ApiSuccess<T> }): T {
    return response.data.data;
}

// ─── Due Transactions ────────────────────────────────────

export interface ListDueTransactionsParams {
    customerId?: string;
    type?: DueTransactionType;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
}

export async function listDueTransactions(
    businessId: string,
    params: ListDueTransactionsParams = {}
): Promise<PagedDueTransactions> {
    const { data } = await apiClient.get(`/businesses/${businessId}/due-transactions`, { params });
    return unwrap<PagedDueTransactions>(data);
}

export async function createBaki(
    businessId: string,
    request: DueTransactionRequest
): Promise<DueTransaction> {
    const { data } = await apiClient.post(
        `/businesses/${businessId}/due-transactions/baki`,
        request
    );
    return unwrap<DueTransaction>(data);
}

export async function createJoma(
    businessId: string,
    request: DueTransactionRequest
): Promise<DueTransaction> {
    const { data } = await apiClient.post(
        `/businesses/${businessId}/due-transactions/joma`,
        request
    );
    return unwrap<DueTransaction>(data);
}

export async function createAdjustment(
    businessId: string,
    request: DueTransactionRequest
): Promise<DueTransaction> {
    const { data } = await apiClient.post(
        `/businesses/${businessId}/due-transactions/adjustment`,
        request
    );
    return unwrap<DueTransaction>(data);
}

export async function getDueTransaction(
    businessId: string,
    transactionId: string
): Promise<DueTransaction> {
    const { data } = await apiClient.get(
        `/businesses/${businessId}/due-transactions/${transactionId}`
    );
    return unwrap<DueTransaction>(data);
}

export async function voidDueTransaction(
    businessId: string,
    transactionId: string,
    reason: string
): Promise<void> {
    await apiClient.post(
        `/businesses/${businessId}/due-transactions/${transactionId}/void`,
        null,
        { params: { reason } }
    );
}

// ─── Due Summaries ───────────────────────────────────────

export async function getDueSummary(
    businessId: string,
    customerId: string
): Promise<CustomerDueSummary> {
    const { data } = await apiClient.get(
        `/businesses/${businessId}/due-transactions/summary`,
        { params: { customerId } }
    );
    return unwrap<CustomerDueSummary>(data);
}

export async function getCustomersWithDue(
    businessId: string
): Promise<CustomerDueSummary[]> {
    const { data } = await apiClient.get(
        `/businesses/${businessId}/due-transactions/customers-with-due`
    );
    return unwrap<CustomerDueSummary[]>(data);
}

export async function getCustomerDueLedger(
    businessId: string,
    customerId: string,
    page = 0,
    size = 20
): Promise<DueLedgerResponse> {
    const { data } = await apiClient.get(
        `/businesses/${businessId}/due-transactions/customer/${customerId}/ledger`,
        { params: { page, size } }
    );
    return unwrap<DueLedgerResponse>(data);
}

// ─── Aged Dues ───────────────────────────────────────────

export async function getAgedDues(
    businessId: string
): Promise<AgedDuesResponse> {
    const { data } = await apiClient.get(
        `/businesses/${businessId}/due-transactions/aged`
    );
    return unwrap<AgedDuesResponse>(data);
}

// ─── Customers ───────────────────────────────────────────

export interface ListCustomersParams {
    search?: string;
    status?: string;
    page?: number;
    size?: number;
}

export async function listCustomers(
    businessId: string,
    params: ListCustomersParams = {}
): Promise<PagedCustomers> {
    const { data } = await apiClient.get(
        `/businesses/${businessId}/customers`,
        { params }
    );
    return unwrap<PagedCustomers>(data);
}

export async function createCustomer(
    businessId: string,
    request: CustomerCreateRequest
): Promise<CustomerResponse> {
    const { data } = await apiClient.post(
        `/businesses/${businessId}/customers`,
        request
    );
    return unwrap<CustomerResponse>(data);
}

export async function getCustomer(
    businessId: string,
    customerId: string
): Promise<CustomerResponse> {
    const { data } = await apiClient.get(
        `/businesses/${businessId}/customers/${customerId}`
    );
    return unwrap<CustomerResponse>(data);
}

export async function updateCustomer(
    businessId: string,
    customerId: string,
    request: CustomerUpdateRequest
): Promise<CustomerResponse> {
    const { data } = await apiClient.put(
        `/businesses/${businessId}/customers/${customerId}`,
        request
    );
    return unwrap<CustomerResponse>(data);
}

// ─── WhatsApp Reminders ──────────────────────────────────

export async function generateDueReminder(
    businessId: string,
    customerId: string,
    customMessage?: string
): Promise<WhatsAppLink> {
    const params: Record<string, string> = {};
    if (customMessage) params.customMessage = customMessage;

    const { data } = await apiClient.post(
        `/businesses/${businessId}/customers/${customerId}/reminder`,
        null,
        { params }
    );
    return unwrap<WhatsAppLink>(data);
}

export async function generateAiReminder(
    businessId: string,
    customerId: string
): Promise<WhatsAppReminderResponse> {
    const { data } = await apiClient.post(
        `/businesses/${businessId}/reminders/ai/${customerId}`
    );
    const reminder = unwrap<WhatsAppReminderResponse & {
        customerPhone?: string | null;
        whatsappLink?: string | null;
    }>(data);
    return {
        ...reminder,
        phone: reminder.phone ?? reminder.customerPhone ?? null,
        link: reminder.link ?? reminder.whatsappLink ?? "",
        message: reminder.message ?? "",
        resetAt: reminder.resetAt ?? null,
    };
}

// ─── Bulk WhatsApp Reminders ────────────────────────────

export async function generateBulkReminders(
    businessId: string
): Promise<WhatsAppLink[]> {
    const { data } = await apiClient.post(
        `/businesses/${businessId}/customers/bulk-reminder`
    );
    return unwrap<WhatsAppLink[]>(data);
}
