"use client";

import { useSSE } from "@/hooks/useSSE";

/**
 * Mounts the SSE connection listener.
 * Drop this component once in the root layout — it renders nothing.
 */
export default function SSEListener() {
    useSSE();
    return null;
}
