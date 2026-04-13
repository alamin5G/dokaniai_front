import ExpenseWorkspace from "@/components/expenses/ExpenseWorkspace";

export default async function ShopExpensesPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  return <ExpenseWorkspace businessId={businessId} />;
}
