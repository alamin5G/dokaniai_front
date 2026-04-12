import ShopProductsWorkspace from "@/components/dashboard/ShopProductsWorkspace";

export default async function ShopProductsPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;

  return <ShopProductsWorkspace businessId={businessId} />;
}
