/**
 * Expense mutation hooks — create, update, delete with cache invalidation
 */

import { useCallback } from "react";
import { useSWRConfig } from "swr";
import type { Expense, ExpenseCreateRequest, ExpenseUpdateRequest } from "@/types/expense";
import { createExpense, updateExpense, deleteExpense } from "@/lib/expenseApi";
import { invalidateAfterExpense } from "@/lib/swrMutations";

/**
 * Hook for expense mutations with automatic cache invalidation.
 *
 * After any expense mutation, invalidates:
 * - Expenses list + stats
 * - Dashboard KPIs
 */
export function useExpenseMutations(businessId: string) {
    const { mutate } = useSWRConfig();

    const submitCreate = useCallback(
        async (data: ExpenseCreateRequest): Promise<Expense> => {
            const expense = await createExpense(businessId, data);
            await invalidateAfterExpense(businessId);
            return expense;
        },
        [businessId, mutate],
    );

    const submitUpdate = useCallback(
        async (expenseId: string, data: ExpenseUpdateRequest): Promise<Expense> => {
            const expense = await updateExpense(businessId, expenseId, data);
            await invalidateAfterExpense(businessId);
            return expense;
        },
        [businessId, mutate],
    );

    const submitDelete = useCallback(
        async (expenseId: string): Promise<void> => {
            await deleteExpense(businessId, expenseId);
            await invalidateAfterExpense(businessId);
        },
        [businessId, mutate],
    );

    return {
        submitCreate,
        submitUpdate,
        submitDelete,
    };
}
