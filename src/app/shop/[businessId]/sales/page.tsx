import ShopFeaturePage from "@/components/dashboard/ShopFeaturePage";

export default async function ShopSalesPage({
    params,
}: {
    params: Promise<{ businessId: string }>;
}) {
    const { businessId } = await params;
    return (
        <ShopFeaturePage
            businessId={businessId}
            title="Sales Workspace"
            description="Record new sales, returns, and payment updates for this shop from a single flow."
        />
    );
}
