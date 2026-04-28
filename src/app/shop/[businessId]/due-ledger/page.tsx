import DueLedgerWorkspace from "@/components/due/DueLedgerWorkspace";

export default async function ShopDueLedgerPage({
    params,
    searchParams,
}: {
    params: Promise<{ businessId: string }>;
    searchParams: Promise<{ customer?: string }>;
}) {
    const { businessId } = await params;
    const { customer } = await searchParams;
    return <DueLedgerWorkspace businessId={businessId} initialCustomerId={customer} />;
}
