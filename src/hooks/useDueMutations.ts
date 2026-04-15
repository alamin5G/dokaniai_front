/**
 * Due transaction mutation hooks — baki, joma, adjustment, void with cache invalidation
 */

import { useCallback } from "react";
import { useSWRConfig } from "swr";
import type { DueTransaction, DueTransactionRequest, CustomerCreateRequest, CustomerResponse, CustomerUpdateRequest } from "@/types/due";
import {
    createBaki,
    createJoma,
    createAdjustment,
    voidDueTransaction,
    createCustomer,
    updateCustomer,
} from "@/lib/dueApi";
import { invalidateAfterDue } from "@/lib/swrMutations";

/**
 * Hook for due transaction mutations with automatic cache invalidation.
 */
export function useDueMutations(businessId: string) {
    const { mutate } = useSWRConfig();

    const submitBaki = useCallback(
        async (request: DueTransactionRequest): Promise<DueTransaction> => {
            const tx = await createBaki(businessId, request);
            await invalidateAfterDue(businessId);
            return tx;
        },
        [businessId, mutate],
    );

    const submitJoma = useCallback(
        async (request: DueTransactionRequest): Promise<DueTransaction> => {
            const tx = await createJoma(businessId, request);
            await invalidateAfterDue(businessId);
            return tx;
        },
        [businessId, mutate],
    );

    const submitAdjustment = useCallback(
        async (request: DueTransactionRequest): Promise<DueTransaction> => {
            const tx = await createAdjustment(businessId, request);
            await invalidateAfterDue(businessId);
            return tx;
        },
        [businessId, mutate],
    );

    const submitVoid = useCallback(
        async (transactionId: string, reason: string): Promise<void> => {
            await voidDueTransaction(businessId, transactionId, reason);
            await invalidateAfterDue(businessId);
        },
        [businessId, mutate],
    );

    return {
        submitBaki,
        submitJoma,
        submitAdjustment,
        submitVoid,
    };
}

/**
 * Hook for customer mutations with automatic cache invalidation.
 */
export function useCustomerMutations(businessId: string) {
    const { mutate } = useSWRConfig();

    const submitCreate = useCallback(
        async (request: CustomerCreateRequest): Promise<CustomerResponse> => {
            const customer = await createCustomer(businessId, request);
            await invalidateAfterDue(businessId);
            return customer;
        },
        [businessId, mutate],
    );

    const submitUpdate = useCallback(
        async (customerId: string, request: CustomerUpdateRequest): Promise<CustomerResponse> => {
            const customer = await updateCustomer(businessId, customerId, request);
            await invalidateAfterDue(businessId);
            return customer;
        },
        [businessId, mutate],
    );

    return {
        submitCreate,
        submitUpdate,
    };
}
