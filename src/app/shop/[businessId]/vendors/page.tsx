import { redirect } from "next/navigation";

export default async function ShopVendorsPage({
    params,
}: {
    params: Promise<{ businessId: string }>;
}) {
    const { businessId } = await params;
    redirect(`/shop/${businessId}/expenses?tab=vendors`);
}
