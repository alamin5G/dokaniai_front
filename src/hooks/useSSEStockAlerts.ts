/**
 * useSSEStockAlerts — Listens for SSE stock alert events and optimistically
 * updates the SWR cache for products, stats, and low-stock lists without
 * triggering a full server re-fetch.
 *
 * Drop this hook once in any component that needs real-time stock updates
 * (e.g., ProductInventoryPage, SalesWorkspace).
 */

import { useEffect } from "react";
import { useSWRConfig } from "swr";
import type { Product, ProductStatus, ProductListResponse, ProductStatsResponse } from "@/types/product";
import { swrKeys } from "@/lib/swrKeys";

interface SSEStockPayload {
    productId: string;
    productName: string;
    status: string;
    stockQty: number;
    unit: string;
    businessId: string;
}

export function useSSEStockAlerts(businessId: string | null | undefined) {
    const { mutate } = useSWRConfig();

    useEffect(() => {
        if (!businessId) return;
        const bid = businessId; // narrowed alias for closures

        function optimisticallyUpdateProductCache(payload: SSEStockPayload) {
            const newStatus = payload.status as ProductStatus;

            // 1. Update paginated product list — patch matching product in every cached page
            mutate(
                (key: unknown) =>
                    typeof key === "string" &&
                    key.startsWith(`/businesses/${bid}/products`),
                (currentData: ProductListResponse | undefined) => {
                    if (!currentData?.content) return currentData;
                    return {
                        ...currentData,
                        content: currentData.content.map((p: Product) =>
                            p.id === payload.productId
                                ? { ...p, status: newStatus, stockQty: payload.stockQty }
                                : p
                        ),
                    };
                },
                false // don't revalidate — SSE is the source of truth for this update
            );

            // 2. Update low-stock products list
            mutate(
                swrKeys.lowStockProducts(bid),
                (currentData: Product[] | undefined) => {
                    if (!currentData) return currentData;
                    const isLowOrOut = newStatus === "LOW_STOCK" || newStatus === "OUT_OF_STOCK";
                    const filtered = currentData.filter((p: Product) => p.id !== payload.productId);
                    if (isLowOrOut) {
                        return [...filtered, {
                            id: payload.productId,
                            businessId: payload.businessId,
                            name: payload.productName,
                            status: newStatus,
                            stockQty: payload.stockQty,
                            unit: payload.unit,
                        } as Product];
                    }
                    return filtered;
                },
                false
            );

            // 3. Optimistically adjust product stats counters
            mutate(
                swrKeys.productStats(bid),
                (currentStats: ProductStatsResponse | undefined) => {
                    if (!currentStats) return currentStats;
                    return { ...currentStats };
                },
                false
            );

            // 4. Background revalidation after a short delay (to sync stats counts)
            setTimeout(() => {
                void mutate(
                    (key: unknown) =>
                        typeof key === "string" &&
                        key.startsWith(`/businesses/${bid}/products`),
                    undefined,
                    { revalidate: true }
                );
                void mutate(swrKeys.productStats(bid));
                void mutate(swrKeys.lowStockProducts(bid));
            }, 3000);
        }

        function handleLowStock(e: Event) {
            const payload = (e as CustomEvent).detail as SSEStockPayload;
            if (payload?.businessId === bid) {
                optimisticallyUpdateProductCache(payload);
            }
        }

        function handleOutOfStock(e: Event) {
            const payload = (e as CustomEvent).detail as SSEStockPayload;
            if (payload?.businessId === bid) {
                optimisticallyUpdateProductCache(payload);
            }
        }

        window.addEventListener("sse:low-stock-alert", handleLowStock);
        window.addEventListener("sse:out-of-stock-alert", handleOutOfStock);
        return () => {
            window.removeEventListener("sse:low-stock-alert", handleLowStock);
            window.removeEventListener("sse:out-of-stock-alert", handleOutOfStock);
        };
    }, [businessId, mutate]);
}
