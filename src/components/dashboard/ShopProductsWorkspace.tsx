"use client";

/**
 * @deprecated Use `@/components/products/ProductInventoryPage` instead.
 * This file is kept for backward compatibility and re-exports the new component.
 */
import ProductInventoryPage from "@/components/products/ProductInventoryPage";

export default function ShopProductsWorkspace({
  businessId,
}: {
  businessId: string;
}) {
  return <ProductInventoryPage businessId={businessId} />;
}
