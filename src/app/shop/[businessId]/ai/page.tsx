import ShopFeaturePage from "@/components/dashboard/ShopFeaturePage";

export default async function ShopAiPage({
    params,
}: {
    params: Promise<{ businessId: string }>;
}) {
    const { businessId } = await params;
    return (
        <ShopFeaturePage
            businessId={businessId}
            title="AI Assistant"
            description="Run AI-powered commands and insights while staying inside this shop's workspace context."
        />
    );
}
