import ShopFeaturePage from "@/components/dashboard/ShopFeaturePage";

export default async function ShopDueLedgerPage({
    params,
}: {
    params: Promise<{ businessId: string }>;
}) {
    const { businessId } = await params;
    return (
        <ShopFeaturePage
            businessId={businessId}
            title="Due Ledger"
            description="Monitor customer dues, reminders, and collection progress for the selected shop."
        />
    );
}
