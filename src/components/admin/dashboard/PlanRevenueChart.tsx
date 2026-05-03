"use client";

import { useTranslations } from "next-intl";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { ChartErrorBoundary } from "./ChartErrorBoundary";
import { CHART_COLORS } from "./chartColors";
import type { SubscriptionStats } from "@/types/admin";

interface PlanRevenueChartProps {
    subscriptionStats: SubscriptionStats | null;
    loading: boolean;
}

/**
 * Horizontal bar chart showing estimated revenue per subscription plan.
 * Revenue = plan user count × plan price.
 */
export function PlanRevenueChart({ subscriptionStats, loading }: PlanRevenueChartProps) {
    const t = useTranslations("AdminDashboard");

    if (loading) {
        return (
            <div className="rounded-2xl bg-surface-container p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-on-surface mb-4">
                    {t("charts.planRevenue")}
                </h3>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-6 bg-on-surface/10 rounded animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    const chartData = [
        { plan: "Basic", revenue: (subscriptionStats?.basicUsers ?? 0) * 99, fill: CHART_COLORS.secondary },
        { plan: "Pro", revenue: (subscriptionStats?.proUsers ?? 0) * 199, fill: CHART_COLORS.primary },
        { plan: "Plus", revenue: (subscriptionStats?.plusUsers ?? 0) * 399, fill: CHART_COLORS.tertiary },
    ];

    return (
        <ChartErrorBoundary>
            <div className="rounded-2xl bg-surface-container p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-on-surface mb-4">
                    {t("charts.planRevenue")}
                </h3>
                <div className="h-56 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                            <XAxis
                                type="number"
                                tick={{ fontSize: 11, fill: "rgba(0,0,0,0.5)" }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v: number) => `৳${(v / 1000).toFixed(0)}K`}
                            />
                            <YAxis
                                type="category"
                                dataKey="plan"
                                tick={{ fontSize: 12, fill: "rgba(0,0,0,0.6)" }}
                                axisLine={false}
                                tickLine={false}
                                width={50}
                            />
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <Tooltip formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, "Revenue"]} />
                            <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                                {chartData.map((entry) => (
                                    <Cell key={entry.plan} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </ChartErrorBoundary>
    );
}