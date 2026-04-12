import ShopFeaturePage from "@/components/dashboard/ShopFeaturePage";

export default async function ShopProductsPage({
    params,
}: {
    params: Promise<{ businessId: string }>;
}) {
    const { businessId } = await params;
    return (
        <ShopFeaturePage
            businessId={businessId}
            title="Products Workspace"
            description="Manage catalog, pricing, and stock details with this shop as the active business context."
        />
    );
}
