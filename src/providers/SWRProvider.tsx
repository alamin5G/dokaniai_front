"use client";

import { SWRConfig } from "swr";
import type { ReactNode } from "react";
import { SWR_CACHE } from "@/config/cacheConfig";

/**
 * Global fetcher for SWR — delegates to existing API functions.
 * Most hooks will use dedicated fetchers (e.g., listProducts), but this
 * generic fetcher is available for simple GET endpoints.
 */
async function genericFetcher<T>(url: string): Promise<T> {
    const { default: apiClient } = await import("@/lib/api");
    const { data } = await apiClient.get<{ success: boolean; data: T }>(url);
    return data.data;
}

interface SWRProviderProps {
    children: ReactNode;
}

export default function SWRProvider({ children }: SWRProviderProps) {
    return (
        <SWRConfig
            value={{
                fetcher: genericFetcher,
                revalidateOnFocus: true,
                revalidateOnReconnect: true,
                shouldRetryOnError: true,
                errorRetryCount: 2,
                errorRetryInterval: SWR_CACHE.globalErrorRetry,
                dedupingInterval: SWR_CACHE.globalDedup,
            }}
        >
            {children}
        </SWRConfig>
    );
}
