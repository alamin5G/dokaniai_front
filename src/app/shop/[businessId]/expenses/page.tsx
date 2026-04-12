import ShopFeaturePage from "@/components/dashboard/ShopFeaturePage";

export default async function ShopExpensesPage({
    params,
}: {
    params: Promise<{ businessId: string }>;
}) {
    const { businessId } = await params;
    return (
        <ShopFeaturePage
            businessId={businessId}
            title="Expense Workspace"
            description="Track operating costs and keep this shop's expense ledger accurate and isolated."
        />
    );
}
