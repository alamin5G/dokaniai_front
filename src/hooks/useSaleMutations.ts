/**
 * Sale mutation hooks — create, force-create, cancel with cache invalidation
 */

import { useCallback } from "react";
import { useSWRConfig } from "swr";
import type { SaleCreatedResponse, SaleCreateRequest } from "@/types/sale";
import { createSale, forceCreateSale, cancelSale } from "@/lib/saleApi";
import { invalidateAfterSale } from "@/lib/swrMutations";

/**
 * Hook for sale mutations with automatic cache invalidation.
 *
 * After any sale mutation, invalidates:
 * - Products (stock changed)
 * - Sales list + stats
 * - Dashboard KPIs
 */
export function useSaleMutations(businessId: string) {
    const { mutate } = useSWRConfig();

    const submitCreate = useCallback(
        async (data: SaleCreateRequest): Promise<SaleCreatedResponse> => {
            const sale = await createSale(businessId, data);
            await invalidateAfterSale(businessId);
            return sale;
        },
        [businessId, mutate],
    );

    const submitForceCreate = useCallback(
        async (data: SaleCreateRequest): Promise<SaleCreatedResponse> => {
            const sale = await forceCreateSale(businessId, data);
            await invalidateAfterSale(businessId);
            return sale;
        },
        [businessId, mutate],
    );

    const submitCancel = useCallback(
        async (saleId: string, reason?: string): Promise<void> => {
            await cancelSale(businessId, saleId, reason);
            await invalidateAfterSale(businessId);
        },
        [businessId, mutate],
    );

    return {
        submitCreate,
        submitForceCreate,
        submitCancel,
    };
}
