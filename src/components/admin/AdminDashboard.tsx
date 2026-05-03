"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardHeader } from "./dashboard/DashboardHeader";
import { KpiMetricRow } from "./dashboard/KpiMetricRow";
import { RevenueTrendChart } from "./dashboard/RevenueTrendChart";
import { SubscriptionDonut } from "./dashboard/SubscriptionDonut";
import { PlanRevenueChart } from "./dashboard/PlanRevenueChart";
import { PaymentPipelineChart } from "./dashboard/PaymentPipelineChart";
import { UserGrowthChart } from "./dashboard/UserGrowthChart";
import { AiTokenUsageChart } from "./dashboard/AiTokenUsageChart";
import { ReferralHealthDonut } from "./dashboard/ReferralHealthDonut";
import { PlatformActivityFeed } from "./dashboard/PlatformActivityFeed";
import { QuickActionGrid } from "./dashboard/QuickActionGrid";
import { TicketStatusBar } from "./dashboard/TicketStatusBar";
import { AuditHighlightsTable } from "./dashboard/AuditHighlightsTable";
import { DashboardMobileTabs } from "./dashboard/DashboardMobileTabs";
import { useDashboardData } from "./dashboard/useDashboardData";
import { exportDashboardCsv } from "@/lib/adminApi";

/**
 * Redesigned admin dashboard — modular, responsive, chart-rich.
 *
 * Desktop Layout:
 *   Header (greeting + time range selector)
 *   Ticket Status Bar
 *   KPI Row (4 primary + 4 expandable metric cards)
 *   Chart Row 1: Revenue Trend (2/3) | Subscription Donut (1/3)
 *   Chart Row 2: Plan Revenue (1/3) | Payment Pipeline (1/3) | User Growth (1/3)
 *   Chart Row 3: AI Token Usage (1/2) | Referral Health (1/2)
 *   Bottom Row: Activity Feed (1/3) | Audit Highlights (1/3) | Quick Actions (1/3)
 *
 * Mobile (<640px): DashboardMobileTabs with tabbed sections.
 */

const MOBILE_BREAKPOINT = 640;

export default function AdminDashboard() {
    const {
        stats,
        referralStats,
        paymentSummary,
        auditSummary,
        recentTickets,
        notifications,
        revenueTrend,
        userGrowth,
        aiTokenStats,
        loadingStates,
        error,
        refresh,
        timeRange,
        setTimeRange,
    } = useDashboardData();

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    /** Derive a single boolean: true while any section is still loading */
    const loading = Object.values(loadingStates).some(Boolean);

    /** Export current dashboard data as CSV */
    const handleExport = useCallback(async () => {
        try {
            const blob = await exportDashboardCsv(timeRange);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `dashboard-${timeRange}-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            // Silently fail — export is best-effort
        }
    }, [timeRange]);

    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto">
            {/* Header */}
            <DashboardHeader
                loading={loading}
                onRefresh={refresh}
                onExport={handleExport}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
            />

            {/* Notification badge / Ticket status bar */}
            <TicketStatusBar
                ticketStats={stats?.ticketStats ?? null}
                loading={loadingStates.tickets}
            />

            {isMobile ? (
                /* ─── Mobile: Tabbed layout ─── */
                <DashboardMobileTabs
                    tabs={[
                        {
                            id: "overview",
                            labelKey: "overview",
                            icon: <span className="material-symbols-outlined text-sm">dashboard</span>,
                            content: (
                                <div className="space-y-4">
                                    <KpiMetricRow
                                        stats={stats}
                                        referralStats={referralStats}
                                        paymentSummary={paymentSummary}
                                        loading={loading}
                                    />
                                    <QuickActionGrid />
                                </div>
                            ),
                        },
                        {
                            id: "revenue",
                            labelKey: "revenue",
                            icon: <span className="material-symbols-outlined text-sm">trending_up</span>,
                            content: (
                                <div className="space-y-4">
                                    <RevenueTrendChart
                                        data={revenueTrend}
                                        loading={loadingStates.revenue}
                                    />
                                    <SubscriptionDonut
                                        subscriptionStats={stats?.subscriptionStats ?? null}
                                        loading={loading}
                                    />
                                    <PlanRevenueChart
                                        subscriptionStats={stats?.subscriptionStats ?? null}
                                        loading={loading}
                                    />
                                </div>
                            ),
                        },
                        {
                            id: "payments",
                            labelKey: "payments",
                            icon: <span className="material-symbols-outlined text-sm">payments</span>,
                            content: (
                                <div className="space-y-4">
                                    <PaymentPipelineChart
                                        paymentSummary={paymentSummary}
                                        loading={loading}
                                    />
                                    <UserGrowthChart
                                        data={userGrowth}
                                        loading={loadingStates.userGrowth}
                                    />
                                </div>
                            ),
                        },
                        {
                            id: "ai",
                            labelKey: "ai",
                            icon: <span className="material-symbols-outlined text-sm">auto_awesome</span>,
                            content: (
                                <div className="space-y-4">
                                    <AiTokenUsageChart
                                        data={aiTokenStats}
                                        loading={loadingStates.aiTokens}
                                    />
                                    <ReferralHealthDonut />
                                </div>
                            ),
                        },
                        {
                            id: "activity",
                            labelKey: "activity",
                            icon: <span className="material-symbols-outlined text-sm">feed</span>,
                            content: (
                                <div className="space-y-4">
                                    <PlatformActivityFeed />
                                    <AuditHighlightsTable
                                        auditSummary={auditSummary}
                                        loading={loading}
                                    />
                                </div>
                            ),
                        },
                    ]}
                />
            ) : (
                /* ─── Desktop: Full grid layout ─── */
                <>
                    {/* KPI Metric Cards */}
                    <KpiMetricRow
                        stats={stats}
                        referralStats={referralStats}
                        paymentSummary={paymentSummary}
                        loading={loading}
                    />

                    {/* ─── Chart Row 1: Revenue + Subscription ─── */}
                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                        <div className="lg:col-span-2">
                            <RevenueTrendChart
                                data={revenueTrend}
                                loading={loadingStates.revenue}
                            />
                        </div>
                        <SubscriptionDonut
                            subscriptionStats={stats?.subscriptionStats ?? null}
                            loading={loading}
                        />
                    </section>

                    {/* ─── Chart Row 2: Plan Revenue + Payment Pipeline + User Growth ─── */}
                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <PlanRevenueChart
                            subscriptionStats={stats?.subscriptionStats ?? null}
                            loading={loading}
                        />
                        <PaymentPipelineChart
                            paymentSummary={paymentSummary}
                            loading={loading}
                        />
                        <UserGrowthChart
                            data={userGrowth}
                            loading={loadingStates.userGrowth}
                        />
                    </section>

                    {/* ─── Chart Row 3: AI Token + Referral Health ─── */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <AiTokenUsageChart
                            data={aiTokenStats}
                            loading={loadingStates.aiTokens}
                        />
                        <ReferralHealthDonut />
                    </section>

                    {/* ─── Bottom Row: Activity + Audit + Quick Actions ─── */}
                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                        <PlatformActivityFeed />
                        <AuditHighlightsTable
                            auditSummary={auditSummary}
                            loading={loading}
                        />
                        <QuickActionGrid />
                    </section>
                </>
            )}
        </div>
    );
}