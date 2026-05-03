"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { mutate } from "swr";

/**
 * useSSE — Opens an SSE connection to the backend for real-time events.
 *
 * Automatically connects when user is authenticated and reconnects on failure.
 * Routes incoming events to the appropriate Zustand store actions.
 *
 * **Key behaviors:**
 * - On AUTH_ERROR event with JWT_REVOKED/AUTH_ERROR: STOPS reconnecting + force logout
 * - On AUTH_ERROR event with TOKEN_EXPIRED: refreshes token first, then reconnects
 * - On network errors: exponential backoff with max 10 retries
 * - On max retries exceeded: force logout
 *
 * Mount this hook ONCE in the root layout.
 */

const MAX_RECONNECT_ATTEMPTS = 10;

export function useSSE() {
    const accessToken = useAuthStore((s) => s.accessToken);
    const status = useAuthStore((s) => s.status);
    const sourceRef = useRef<EventSource | null>(null);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const stoppedRef = useRef(false); // true = permanently stopped (auth error)

    useEffect(() => {
        // Only connect when authenticated
        if (status !== "AUTHENTICATED" || !accessToken) {
            // Clean up existing connection if user logs out
            if (sourceRef.current) {
                sourceRef.current.close();
                sourceRef.current = null;
            }
            stoppedRef.current = false;
            reconnectAttemptsRef.current = 0;
            return;
        }

        // Reset stopped flag on new auth session
        stoppedRef.current = false;
        reconnectAttemptsRef.current = 0;

        const connect = (token?: string) => {
            // Don't connect if permanently stopped
            if (stoppedRef.current) return;

            // Close existing connection
            if (sourceRef.current) {
                sourceRef.current.close();
            }

            // Use provided token (reconnect) or current token from effect
            const activeToken = token || accessToken;
            const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082/api/v1"}/sse/subscribe?token=${encodeURIComponent(activeToken)}`;
            const source = new EventSource(url);
            sourceRef.current = source;

            source.onopen = () => {
                // Connection established — reset backoff counter
                reconnectAttemptsRef.current = 0;
            };

            source.onerror = () => {
                source.close();
                sourceRef.current = null;

                // If already stopped, don't retry
                if (stoppedRef.current) return;

                reconnectAttemptsRef.current++;
                const attempts = reconnectAttemptsRef.current;

                if (attempts > MAX_RECONNECT_ATTEMPTS) {
                    console.warn(`[SSE] Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Stopping.`);
                    forceLogout("SSE connection failed after multiple attempts.");
                    return;
                }

                // Exponential backoff: 3s, 6s, 12s, 24s, max 60s
                const delay = Math.min(3_000 * Math.pow(2, attempts - 1), 60_000);
                console.debug(`[SSE] Reconnect attempt ${attempts}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);

                reconnectTimerRef.current = setTimeout(() => {
                    if (stoppedRef.current) return;
                    // Read fresh token from store on reconnect (token may have been refreshed)
                    const freshToken = useAuthStore.getState().accessToken;
                    const freshStatus = useAuthStore.getState().status;
                    if (freshStatus === "AUTHENTICATED" && freshToken) {
                        connect(freshToken);
                    }
                }, delay);
            };

            // ─── Auth Error Handler (server-sent) ────────────────────────────
            // The backend sends this event when JWT validation fails on SSE endpoint.
            // This is the PRIMARY mechanism to stop zombie reconnection loops.

            source.addEventListener("AUTH_ERROR", (e) => {
                try {
                    const data = JSON.parse(e.data);
                    const errorCode = data?.error;

                    console.warn(`[SSE] Auth error from server: ${errorCode}`);

                    // Permanently stop reconnecting for these errors
                    if (errorCode === "JWT_REVOKED" || errorCode === "AUTH_ERROR") {
                        source.close();
                        sourceRef.current = null;
                        stoppedRef.current = true;
                        forceLogout("Session expired or revoked. Please log in again.");
                        return;
                    }

                    // Token expired — try refreshing token, then reconnect
                    if (errorCode === "TOKEN_EXPIRED") {
                        source.close();
                        sourceRef.current = null;
                        refreshTokenAndReconnect();
                        return;
                    }

                    // Unknown auth error — stop reconnecting
                    source.close();
                    sourceRef.current = null;
                    stoppedRef.current = true;
                    forceLogout("Authentication failed. Please log in again.");
                } catch {
                    // Malformed auth error data — stop to be safe
                    source.close();
                    sourceRef.current = null;
                    stoppedRef.current = true;
                    forceLogout("Authentication failed.");
                }
            });

            // ─── Event Handlers ──────────────────────────────────────────

            source.addEventListener("PAYMENT_STATUS_CHANGED", (e) => {
                try {
                    const data = JSON.parse(e.data);
                    useSubscriptionStore.getState().handlePaymentStatusChange(data);
                    window.dispatchEvent(new CustomEvent("sse:payment-status-changed", { detail: data }));
                } catch {
                    // ignore malformed data
                }
            });

            source.addEventListener("SUBSCRIPTION_CHANGED", () => {
                useSubscriptionStore.getState().handleSubscriptionChange();
                window.dispatchEvent(new CustomEvent("sse:subscription-changed"));
            });

            source.addEventListener("REFERRAL_REWARD_GRANTED", () => {
                useSubscriptionStore.getState().refreshReferralStatus();
                window.dispatchEvent(new CustomEvent("sse:referral-reward-granted"));
            });

            source.addEventListener("NOTIFICATION_NEW", (e) => {
                try {
                    const data = JSON.parse(e.data);
                    window.dispatchEvent(new CustomEvent("sse:notification-new", { detail: data }));
                } catch {
                    window.dispatchEvent(new CustomEvent("sse:notification-new"));
                }
            });

            source.addEventListener("LOW_STOCK_ALERT", (e) => {
                try {
                    const data = JSON.parse(e.data);
                    window.dispatchEvent(new CustomEvent("sse:low-stock-alert", { detail: data }));
                } catch {
                    // ignore malformed data
                }
            });

            source.addEventListener("OUT_OF_STOCK_ALERT", (e) => {
                try {
                    const data = JSON.parse(e.data);
                    window.dispatchEvent(new CustomEvent("sse:out-of-stock-alert", { detail: data }));
                } catch {
                    // ignore malformed data
                }
            });

            source.addEventListener("STOCK_UPDATED", (e) => {
                try {
                    const data = JSON.parse(e.data);
                    window.dispatchEvent(new CustomEvent("sse:stock-updated", { detail: data }));
                } catch {
                    // ignore malformed data
                }
            });

            // ─── Admin Notification Events ──────────────────────────────

            source.addEventListener("ADMIN_NOTIFICATION_NEW", (e) => {
                try {
                    const data = JSON.parse(e.data);
                    window.dispatchEvent(new CustomEvent("sse:admin-notification-new", { detail: data }));
                } catch {
                    // ignore malformed data
                }
            });

            source.addEventListener("ADMIN_NOTIFICATION_COUNT_UPDATE", (e) => {
                try {
                    const data = JSON.parse(e.data);
                    window.dispatchEvent(new CustomEvent("sse:admin-notification-count", { detail: data }));
                } catch {
                    // ignore malformed data
                }
            });

            // ─── Vendor Events ──────────────────────────────────────────

            source.addEventListener("VENDOR_CHANGED", () => {
                window.dispatchEvent(new CustomEvent("sse:vendor-changed"));
            });

            // ─── Due Payment Events ──────────────────────────────────────

            source.addEventListener("DUE_PAYMENT_STATUS_CHANGED", (e) => {
                try {
                    const data = JSON.parse(e.data);
                    window.dispatchEvent(new CustomEvent("sse:due-payment-status-changed", { detail: data }));

                    // Invalidate all due-related SWR caches so UI refreshes
                    mutate(
                        (key: unknown) => {
                            if (typeof key === "string") {
                                return key.includes("/due-transactions") ||
                                    key.includes("/customers") ||
                                    key.includes("customers-with-due") ||
                                    key.includes("/ledger") ||
                                    key.includes("dashboard");
                            }
                            return false;
                        },
                        undefined,
                        { revalidate: true }
                    );
                } catch {
                    // ignore malformed data
                }
            });
        };

        connect();

        return () => {
            if (sourceRef.current) {
                sourceRef.current.close();
                sourceRef.current = null;
            }
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }
        };
    }, [accessToken, status]);
}

/**
 * Force logout — clear auth state so user must re-authenticate.
 */
function forceLogout(reason: string) {
    console.warn(`[SSE] Force logout: ${reason}`);
    useAuthStore.getState().clearTokens();
}

/**
 * Attempt to refresh the access token via the backend refresh endpoint.
 * On success, the authStore is updated with new tokens, which triggers
 * the useEffect to reconnect SSE with the fresh token.
 * On failure, force logout.
 */
async function refreshTokenAndReconnect() {
    try {
        const { refreshToken } = useAuthStore.getState();
        if (!refreshToken) {
            forceLogout("Token expired and no refresh token available.");
            return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082/api/v1";
        const response = await fetch(`${apiUrl}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
            throw new Error(`Refresh failed with status ${response.status}`);
        }

        const result = await response.json();
        const { accessToken: newAccess, refreshToken: newRefresh } = result.data;

        // Update store — this triggers the useEffect to reconnect with new token
        useAuthStore.getState().setTokens(newAccess, newRefresh, useAuthStore.getState().userId || "", "AUTHENTICATED");
        console.debug("[SSE] Token refreshed successfully. useEffect will reconnect.");
    } catch (err) {
        console.warn("[SSE] Token refresh failed:", err);
        forceLogout("Token expired and refresh failed. Please log in again.");
    }
}
