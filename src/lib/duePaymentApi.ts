/**
 * Due Payment API Client — Public Customer Due Payment
 * Aligned with plans/due-payment-final-architecture.md
 *
 * Public endpoints (no auth) + Shop owner authenticated endpoints
 */

import apiClient from "@/lib/api";
import type {
    BusinessPaymentInfo,
    CreateDuePaymentIntentRequest,
    CustomerDuePublicInfo,
    DuePaymentIntent,
    DuePaymentIntentStatusResponse,
    PendingDuePaymentItem,
} from "@/types/duePayment";

// ─── Helper ──────────────────────────────────────────────

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    message?: string;
}

function unwrap<T>(response: { data: ApiSuccess<T> }): T {
    return response.data.data;
}

// ─── Public Endpoints (No Auth) ──────────────────────────

/**
 * Get business payment info + MFS numbers (public, no auth).
 * Used when no customer context is available.
 */
export async function getBusinessPaymentInfo(
    businessId: string,
): Promise<BusinessPaymentInfo> {
    const response = await apiClient.get<ApiSuccess<BusinessPaymentInfo>>(
        `/public/due-payment/business/${businessId}`,
    );
    return unwrap(response);
}

/**
 * Get customer due info + last purchases + MFS numbers (public, no auth).
 * Used when customer ID is provided in URL.
 */
export async function getCustomerDueInfo(
    businessId: string,
    customerId: string,
): Promise<CustomerDuePublicInfo> {
    const response = await apiClient.get<ApiSuccess<CustomerDuePublicInfo>>(
        `/public/due-payment/business/${businessId}/customer/${customerId}`,
    );
    return unwrap(response);
}

/**
 * Create a DuePaymentIntent (public, no auth).
 * Customer submits TrxID + amount after making MFS payment.
 */
export async function createDuePaymentIntent(
    payload: CreateDuePaymentIntentRequest,
): Promise<DuePaymentIntent> {
    const response = await apiClient.post<ApiSuccess<DuePaymentIntent>>(
        `/public/due-payment/intent`,
        payload,
    );
    return unwrap(response);
}

/**
 * Poll DuePaymentIntent status (public, no auth).
 * Used for real-time status updates after submission.
 */
export async function getDuePaymentIntentStatus(
    intentId: string,
): Promise<DuePaymentIntentStatusResponse> {
    const response = await apiClient.get<ApiSuccess<DuePaymentIntentStatusResponse>>(
        `/public/due-payment/intent/${intentId}/status`,
    );
    return unwrap(response);
}

// ─── Authenticated Endpoints (Shop Owner) ────────────────

/**
 * Get list of pending DuePaymentIntents for a business.
 * Shop owner views these in the verification queue.
 */
export async function getPendingDuePayments(
    businessId: string,
): Promise<PendingDuePaymentItem[]> {
    const response = await apiClient.get<ApiSuccess<PendingDuePaymentItem[]>>(
        `/businesses/${businessId}/due-payments/pending`,
    );
    return unwrap(response);
}

/**
 * Manually verify a DuePaymentIntent.
 * Creates a JOMA transaction for the customer.
 */
export async function verifyDuePayment(
    businessId: string,
    intentId: string,
): Promise<DuePaymentIntentStatusResponse> {
    const response = await apiClient.post<ApiSuccess<DuePaymentIntentStatusResponse>>(
        `/businesses/${businessId}/due-payments/${intentId}/verify`,
    );
    return unwrap(response);
}

/**
 * Reject a DuePaymentIntent with a reason.
 * Customer will be notified that their payment was rejected.
 */
export async function rejectDuePayment(
    businessId: string,
    intentId: string,
    reason?: string,
): Promise<DuePaymentIntentStatusResponse> {
    const params = reason ? `?reason=${encodeURIComponent(reason)}` : "";
    const response = await apiClient.post<ApiSuccess<DuePaymentIntentStatusResponse>>(
        `/businesses/${businessId}/due-payments/${intentId}/reject${params}`,
    );
    return unwrap(response);
}
