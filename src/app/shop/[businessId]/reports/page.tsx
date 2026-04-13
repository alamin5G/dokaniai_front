import ReportWorkspace from "@/components/reports/ReportWorkspace";

export default async function ShopReportsPage({
    params,
}: {
    params: Promise<{ businessId: string }>;
}) {
    const { businessId } = await params;
    return <ReportWorkspace businessId={businessId} />;
}
