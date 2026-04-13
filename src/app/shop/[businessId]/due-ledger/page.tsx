import DueLedgerWorkspace from "@/components/due/DueLedgerWorkspace";

export default async function ShopDueLedgerPage({
    params,
}: {
    params: Promise<{ businessId: string }>;
}) {
    const { businessId } = await params;
    return <DueLedgerWorkspace businessId={businessId} />;
}
