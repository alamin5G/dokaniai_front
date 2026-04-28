import ReturnsWorkspace from "@/components/returns/ReturnsWorkspace";

export default async function ShopReturnsPage({
    params,
}: {
    params: Promise<{ businessId: string }>;
}) {
    const { businessId } = await params;
    return <ReturnsWorkspace businessId={businessId} />;
}
