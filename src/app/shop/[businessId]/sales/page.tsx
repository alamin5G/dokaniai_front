import SalesPageShell from "@/components/sales/SalesPageShell";

export default async function ShopSalesPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { businessId } = await params;
  const { tab } = await searchParams;
  const initialTab = tab === "returns" ? "returns" : "sale";
  return <SalesPageShell businessId={businessId} initialTab={initialTab} />;
}