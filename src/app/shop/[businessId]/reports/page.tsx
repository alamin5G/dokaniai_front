import ShopFeaturePage from "@/components/dashboard/ShopFeaturePage";

export default async function ShopReportsPage({
    params,
}: {
    params: Promise<{ businessId: string }>;
}) {
    const { businessId } = await params;
    return (
        <ShopFeaturePage
            businessId={businessId}
            title="Reports Workspace"
            description="Review sales, due, and profitability reports scoped to the current shop."
        />
    );
}
