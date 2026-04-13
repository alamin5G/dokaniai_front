import AIWorkspace from "@/components/ai/AIWorkspace";

export default async function ShopAiPage({
    params,
}: {
    params: Promise<{ businessId: string }>;
}) {
    const { businessId } = await params;
    return <AIWorkspace businessId={businessId} />;
}
