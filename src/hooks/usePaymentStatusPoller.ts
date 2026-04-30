// ---------------------------------------------------------------------------
// usePaymentStatusPoller — Shared hook for payment status polling + SSE
// Used by: SubscriptionWorkspace, Due Payment Page
// ---------------------------------------------------------------------------
import { useState, useEffect, useCallback, useRef } from "react";

interface UsePaymentStatusPollerOptions<T> {
    /** Function to fetch the current status */
    fetchStatus: () => Promise<T>;
    /** Whether polling is active */
    isActive: boolean;
    /** Check if the status represents a terminal/done state */
    isDone: (status: T) => boolean;
    /** Polling interval in ms (default: 6000) */
    intervalMs?: number;
    /** SSE event type to listen for (default: "payment-status-changed") */
    sseEventType?: string;
    /** Callback when status changes */
    onStatusChange?: (status: T) => void;
}

interface UsePaymentStatusPollerResult<T> {
    /** Current status */
    status: T | null;
    /** Whether a fetch is in progress */
    isLoading: boolean;
    /** Manually trigger a status refresh */
    refresh: () => void;
}

export function usePaymentStatusPoller<T>({
    fetchStatus,
    isActive,
    isDone,
    intervalMs = 6000,
    sseEventType = "payment-status-changed",
    onStatusChange,
}: UsePaymentStatusPollerOptions<T>): UsePaymentStatusPollerResult<T> {
    const [status, setStatus] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const onStatusChangeRef = useRef(onStatusChange);
    onStatusChangeRef.current = onStatusChange;

    const refresh = useCallback(async () => {
        try {
            setIsLoading(true);
            const newStatus = await fetchStatus();
            setStatus(newStatus);
            onStatusChangeRef.current?.(newStatus);
        } catch {
            // Silently ignore — will retry on next interval
        } finally {
            setIsLoading(false);
        }
    }, [fetchStatus]);

    // Polling interval
    useEffect(() => {
        if (!isActive || !status || isDone(status)) return;

        const intervalId = window.setInterval(() => void refresh(), intervalMs);
        return () => window.clearInterval(intervalId);
    }, [isActive, status, isDone, refresh, intervalMs]);

    // SSE listener
    useEffect(() => {
        if (!isActive) return;

        const handleSSE = () => void refresh();
        window.addEventListener(sseEventType, handleSSE);
        return () => window.removeEventListener(sseEventType, handleSSE);
    }, [isActive, refresh, sseEventType]);

    return { status, isLoading, refresh };
}
