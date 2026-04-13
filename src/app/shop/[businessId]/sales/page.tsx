import SalesWorkspace from "@/components/sales/SalesWorkspace";

export default async function ShopSalesPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  return <SalesWorkspace businessId={businessId} />;
}
