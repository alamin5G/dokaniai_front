/**
 * Cart Intelligence API Client
 * Purpose: Smart product suggestions + cart event logging
 */

import apiClient from "@/lib/api";

// ─── Types ──────────────────────────────────────────────

export interface CartSuggestion {
    productId: string;
    productName: string;
    unitPrice: number;
    stockQuantity: number;
    unit: string | null;
    confidenceScore: number | null;
    coOccurrenceCount: number | null;
    source: "AFFINITY" | "TIME_PATTERN" | "COMBINED";
}

export interface CartEventPayload {
    sessionId: string | null;
    eventType: "ITEM_ADDED" | "ITEM_REMOVED" | "QUANTITY_CHANGED"
    | "CHECKOUT_STARTED" | "CHECKOUT_COMPLETED" | "SESSION_ABANDONED";
    productId?: string;
    quantity?: number;
    metadata?: string;
}

// ─── Helper ──────────────────────────────────────────────

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    message?: string;
}

function unwrap<T>(response: { data: ApiSuccess<T> }): T {
    return response.data.data;
}

// ─── Cart Intelligence API ──────────────────────────────

/** Fetch smart product suggestions for the current cart. */
export async function fetchCartSuggestions(
    businessId: string,
    cartProductIds: string[],
    limit = 10,
): Promise<CartSuggestion[]> {
    const params = new URLSearchParams();
    if (cartProductIds.length > 0) {
        params.set("cartProductIds", cartProductIds.join(","));
    }
    params.set("limit", String(limit));

    const response = await apiClient.get<ApiSuccess<CartSuggestion[]>>(
        `/businesses/${businessId}/cart-intelligence/suggestions?${params.toString()}`,
    );
    return unwrap(response);
}

/** Log a cart event for intelligence gathering. */
export async function logCartEvent(
    businessId: string,
    payload: CartEventPayload,
): Promise<string | null> {
    const response = await apiClient.post<ApiSuccess<string | null>>(
        `/businesses/${businessId}/cart-intelligence/events`,
        payload,
    );
    return unwrap(response);
}

/** Get or create a cart session for event logging. */
export async function getCartSession(
    businessId: string,
    userId: string,
): Promise<string> {
    const response = await apiClient.post<ApiSuccess<string>>(
        `/businesses/${businessId}/cart-intelligence/sessions?userId=${userId}`,
    );
    return unwrap(response);
}

/** Mark a cart session as completed. */
export async function completeCartSession(
    businessId: string,
    sessionId: string,
): Promise<void> {
    await apiClient.post(
        `/businesses/${businessId}/cart-intelligence/sessions/${sessionId}/complete`,
    );
}