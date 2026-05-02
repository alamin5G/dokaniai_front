import ExpensePageShell from "@/components/expenses/ExpensePageShell";

export default async function ShopExpensesPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { businessId } = await params;
  const { tab } = await searchParams;
  const initialTab = tab === "vendors" ? "vendors" : "expenses";
  return <ExpensePageShell businessId={businessId} initialTab={initialTab} />;
}
