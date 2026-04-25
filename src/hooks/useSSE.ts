"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useSubscriptionStore } from "@/store/subscriptionStore";

/**
 * useSSE — Opens an SSE connection to the backend for real-time events.
 *
 * Automatically connects when user is authenticated and reconnects on failure.
 * Routes incoming events to the appropriate Zustand store actions.
 *
 * Mount this hook ONCE in the root layout.
 */
export function useSSE() {
    const accessToken = useAuthStore((s) => s.accessToken);
    const status = useAuthStore((s) => s.status);
    const sourceRef = useRef<EventSource | null>(null);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Only connect when authenticated
        if (status !== "AUTHENTICATED" || !accessToken) {
            // Clean up existing connection if user logs out
            if (sourceRef.current) {
                sourceRef.current.close();
                sourceRef.current = null;
            }
            return;
        }

        const connect = () => {
            // Close existing connection
            if (sourceRef.current) {
                sourceRef.current.close();
            }

            const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082/api/v1"}/sse/subscribe?token=${encodeURIComponent(accessToken)}`;
            const source = new EventSource(url);
            sourceRef.current = source;

            source.onopen = () => {
                // Connection established
            };

            source.onerror = () => {
                // Auto-reconnect is handled by EventSource, but if it fails permanently,
                // close and retry after delay
                source.close();
                sourceRef.current = null;
                reconnectTimerRef.current = setTimeout(connect, 10_000); // retry in 10s
            };

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

            source.addEventListener("NOTIFICATION_NEW", () => {
                window.dispatchEvent(new CustomEvent("sse:notification-new"));
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
