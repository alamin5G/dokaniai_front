"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { SystemStats, ReferralStats } from "@/types/admin";
import type { PaymentSummary } from "@/types/paymentAdmin";
import { MetricCard } from "./MetricCard";
import { formatTaka, formatCompact } from "./chartFormatters";

interface KpiMetricRowProps {
    stats: SystemStats | null;
    referralStats: ReferralStats | null;
    paymentSummary: PaymentSummary | null;
    loading: boolean;
}

/**
 * Row of KPI metric cards showing the most important platform numbers.
 * First 4 are always visible. "Show More" reveals 4 additional metrics.
 * Grid is responsive: 2 cols mobile → 4 cols desktop.
 */
export function KpiMetricRow({ stats, referralStats, paymentSummary, loading }: KpiMetricRowProps) {
    const t = useTranslations("AdminDashboard");
    const [expanded, setExpanded] = useState(false);

    const totalUsers = stats?.totalUsers ?? 0;
    const activeUsers = stats?.activeUsers ?? 0;
    const totalProducts = stats?.subscriptionStats?.basicUsers ?? 0;
    const totalSales = stats?.subscriptionStats?.plusUsers ?? 0;
    const monthlyRevenue = paymentSummary?.todayRevenue ?? 0;
    const pendingTickets = stats?.ticketStats?.totalOpen ?? 0;
    const activeSubscriptions = stats?.subscriptionStats?.totalActive ?? 0;
    const referralCodes = referralStats?.totalEvents ?? 0;

    /** Primary KPIs — always visible */
    const primaryKpis = (
        <>
            <MetricCard
                title={t("kpi.totalUsers")}
                value={formatCompact(totalUsers)}
                icon="group"
                loading={loading}
            />
            <MetricCard
                title={t("kpi.activeBusinesses")}
                value={formatCompact(activeUsers)}
                icon="store"
                loading={loading}
            />
            <MetricCard
                title={t("kpi.monthlyRevenue")}
                value={formatTaka(monthlyRevenue)}
                icon="payments"
                loading={loading}
            />
            <MetricCard
                title={t("kpi.totalProducts")}
                value={formatCompact(totalProducts)}
                icon="inventory_2"
                loading={loading}
            />
        </>
    );

    /** Expanded KPIs — visible when "Show More" is clicked */
    const expandedKpis = (
        <>
            <MetricCard
                title={t("kpi.totalSales")}
                value={formatCompact(totalSales)}
                icon="receipt_long"
                loading={loading}
            />
            <MetricCard
                title={t("kpi.pendingTickets")}
                value={pendingTickets.toString()}
                subtitle={`${stats?.ticketStats?.unassignedCount ?? 0} unassigned`}
                icon="support_agent"
                loading={loading}
            />
            <MetricCard
                title={t("kpi.activeSubscriptions")}
                value={activeSubscriptions.toString()}
                icon="workspace_premium"
                loading={loading}
            />
            <MetricCard
                title={t("kpi.referralCodes")}
                value={referralCodes.toString()}
                icon="card_giftcard"
                loading={loading}
            />
        </>
    );

    return (
        <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {primaryKpis}
                {expanded && expandedKpis}
            </div>

            {/* Show More / Show Less toggle */}
            <div className="flex justify-center mt-3">
                <button
                    onClick={() => setExpanded((prev) => !prev)}
                    className="text-xs font-medium text-primary hover:text-primary/80 transition-colors px-4 py-1.5 rounded-full hover:bg-primary/5"
                >
                    {expanded ? t("kpi.showLess") : t("kpi.showMore")}
                </button>
            </div>
        </div>
    );
}