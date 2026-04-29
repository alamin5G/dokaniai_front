import { redirect } from "next/navigation";

export default async function ShopReturnsPage({
    params,
}: {
    params: Promise<{ businessId: string }>;
}) {
    const { businessId } = await params;
    redirect(`/shop/${businessId}/sales?tab=returns`);
}