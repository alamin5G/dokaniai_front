"use client";

import { useCallback, useEffect, useState } from "react";
import {
    getVapidPublicKey,
    subscribePush,
    unsubscribePush,
} from "@/lib/notificationApi";

type PushStatus = "unsupported" | "denied" | "prompt" | "granted" | "subscribed";

/**
 * Hook: useWebPush
 * Purpose: Manage Web Push notification subscription lifecycle
 * SRS Reference: Section 11.3.7 - Delivery Channels (Web App)
 *
 * Handles:
 * - Service worker registration
 * - Notification permission request
 * - VAPID push subscription
 * - Subscribe/unsubscribe API calls
 */
export function useWebPush() {
    const [status, setStatus] = useState<PushStatus>("unsupported");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ─── Check initial state ─────────────────────────────
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
            setStatus("unsupported");
            return;
        }

        // Check current permission
        if (Notification.permission === "granted") {
            checkSubscription();
        } else if (Notification.permission === "denied") {
            setStatus("denied");
        } else {
            setStatus("prompt");
        }
    }, []);

    // ─── Register service worker ─────────────────────────
    const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
        try {
            const registration = await navigator.serviceWorker.register("/sw.js", {
                scope: "/",
            });
            return registration;
        } catch (err) {
            console.warn("[useWebPush] SW registration failed:", err);
            return null;
        }
    }, []);

    // ─── Check if already subscribed ─────────────────────
    const checkSubscription = useCallback(async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setStatus(subscription ? "subscribed" : "granted");
        } catch {
            setStatus("granted");
        }
    }, []);

    // ─── Subscribe to push ───────────────────────────────
    const subscribe = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Step 1: Request permission
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                setStatus("denied");
                setError("Notification permission denied.");
                return false;
            }

            // Step 2: Register service worker
            const registration = await registerServiceWorker();
            if (!registration) {
                setError("Service worker registration failed.");
                return false;
            }

            // Step 3: Get VAPID key
            const vapidResponse = await getVapidPublicKey();
            if (!vapidResponse.enabled || !vapidResponse.publicKey) {
                setError("Web Push is not configured on the server.");
                return false;
            }

            // Step 4: Subscribe via PushManager
            const applicationServerKey = urlBase64ToUint8Array(vapidResponse.publicKey);
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey as unknown as BufferSource,
            });

            // Step 5: Send subscription to backend
            const raw = subscription.toJSON();
            await subscribePush({
                endpoint: subscription.endpoint,
                p256dhKey: raw.keys?.p256dh || "",
                authKey: raw.keys?.auth || "",
                userAgent: navigator.userAgent,
            });

            setStatus("subscribed");
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Subscription failed.";
            setError(message);
            return false;
        } finally {
            setLoading(false);
        }
    }, [registerServiceWorker]);

    // ─── Unsubscribe from push ───────────────────────────
    const unsubscribe = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                const endpoint = subscription.endpoint;
                await subscription.unsubscribe();
                await unsubscribePush(endpoint);
            }

            setStatus("granted");
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unsubscribe failed.";
            setError(message);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        status,
        loading,
        error,
        subscribe,
        unsubscribe,
        isSupported: status !== "unsupported",
        isSubscribed: status === "subscribed",
    };
}

// ─── Utility: VAPID key conversion ──────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
