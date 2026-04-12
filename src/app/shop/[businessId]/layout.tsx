import DashboardLayout from "@/components/layout/DashboardLayout";

export default async function ShopLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ businessId: string }>;
}) {
    const { businessId } = await params;
    return <DashboardLayout businessId={businessId}>{children}</DashboardLayout>;
}
