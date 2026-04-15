/**
 * Product mutation hooks — create, update, archive with cache invalidation
 */

import { useCallback } from "react";
import { useSWRConfig } from "swr";
import type { Product, ProductCreateRequest, ProductUpdateRequest } from "@/types/product";
import {
    createProduct,
    updateProduct,
    archiveProduct,
} from "@/lib/productApi";
import { invalidateProducts, invalidateDashboard } from "@/lib/swrMutations";

/**
 * Hook for product CRUD mutations with automatic cache invalidation.
 *
 * Usage:
 *   const { submitCreate, submitUpdate, submitArchive, isMutating } = useProductMutations(businessId);
 *   await submitCreate(formData);
 *   await submitUpdate(productId, formData);
 *   await submitArchive(productId);
 */
export function useProductMutations(businessId: string) {
    const { mutate } = useSWRConfig();

    const submitCreate = useCallback(
        async (data: ProductCreateRequest): Promise<Product> => {
            const product = await createProduct(businessId, data);
            await Promise.all([
                invalidateProducts(businessId),
                invalidateDashboard(businessId),
            ]);
            return product;
        },
        [businessId, mutate],
    );

    const submitUpdate = useCallback(
        async (productId: string, data: ProductUpdateRequest): Promise<Product> => {
            const product = await updateProduct(businessId, productId, data);
            await Promise.all([
                invalidateProducts(businessId),
                invalidateDashboard(businessId),
            ]);
            return product;
        },
        [businessId, mutate],
    );

    const submitArchive = useCallback(
        async (productId: string): Promise<void> => {
            await archiveProduct(businessId, productId);
            await Promise.all([
                invalidateProducts(businessId),
                invalidateDashboard(businessId),
            ]);
        },
        [businessId, mutate],
    );

    return {
        submitCreate,
        submitUpdate,
        submitArchive,
    };
}
