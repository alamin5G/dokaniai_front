"use client";

import { useTranslations } from "next-intl";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChartErrorBoundary } from "./ChartErrorBoundary";
import { PLAN_COLORS } from "./chartColors";
import type { SubscriptionStats } from "@/types/admin";

interface SubscriptionDonutProps {
    subscriptionStats: SubscriptionStats | null;
    loading: boolean;
}

/**
 * Donut chart showing subscription distribution across plans.
 * Shows skeleton when loading, empty state when no data.
 */
export function SubscriptionDonut({ subscriptionStats, loading }: SubscriptionDonutProps) {
    const t = useTranslations("AdminDashboard");

    if (loading) {
        return (
            <div className="rounded-2xl bg-surface-container p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-on-surface mb-4">
                    {t("charts.subscriptionDistribution")}
                </h3>
                <div className="h-56 sm:h-64 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-on-surface/10 animate-pulse" />
                </div>
            </div>
        );
    }

    const chartData = [
        { name: "Trial", value: subscriptionStats?.trialUsers ?? 0 },
        { name: "Basic", value: subscriptionStats?.basicUsers ?? 0 },
        { name: "Pro", value: subscriptionStats?.proUsers ?? 0 },
        { name: "Plus", value: subscriptionStats?.plusUsers ?? 0 },
    ].filter((item) => item.value > 0);

    if (chartData.length === 0) {
        return (
            <div className="rounded-2xl bg-surface-container p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-on-surface mb-4">
                    {t("charts.subscriptionDistribution")}
                </h3>
                <div className="h-56 sm:h-64 flex items-center justify-center text-on-surface/40 text-sm">
                    {t("charts.noData")}
                </div>
            </div>
        );
    }

    return (
        <ChartErrorBoundary>
            <div className="rounded-2xl bg-surface-container p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-on-surface mb-4">
                    {t("charts.subscriptionDistribution")}
                </h3>
                <div className="h-56 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={85}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {chartData.map((entry) => (
                                    <Cell
                                        key={entry.name}
                                        fill={PLAN_COLORS[entry.name] ?? "#888"}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend
                                iconType="circle"
                                iconSize={8}
                                wrapperStyle={{ fontSize: 12 }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </ChartErrorBoundary>
    );
}