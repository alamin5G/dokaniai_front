"use client";

import { useTranslations } from "next-intl";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { ChartErrorBoundary } from "./ChartErrorBoundary";
import { CHART_COLORS } from "./chartColors";
import type { ReferralStats } from "@/types/admin";

interface ReferralHealthDonutProps {
    referralStats: ReferralStats | null;
    loading: boolean;
}

/** Map referral stats to chart data segments */
function buildReferralChartData(stats: ReferralStats | null) {
    const granted = stats?.grantedCount ?? 0;
    const expired = stats?.expiredCount ?? 0;
    const revoked = stats?.revokedCount ?? 0;
    const pending = stats?.pendingCount ?? 0;

    return [
        { name: "Granted", value: granted, fill: CHART_COLORS.success },
        { name: "Pending", value: pending, fill: CHART_COLORS.primary },
        { name: "Expired", value: expired, fill: CHART_COLORS.warning },
        { name: "Revoked", value: revoked, fill: CHART_COLORS.error },
    ].filter((item) => item.value > 0);
}

/**
 * Donut chart showing referral code health distribution.
 * Displays Granted / Pending / Expired / Revoked breakdown from real backend data.
 */
export function ReferralHealthDonut({ referralStats, loading }: ReferralHealthDonutProps) {
    const t = useTranslations("AdminDashboard");

    if (loading) {
        return (
            <div className="rounded-2xl bg-surface-container p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-on-surface mb-4">
                    {t("charts.referralHealth")}
                </h3>
                <div className="h-56 sm:h-64 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-on-surface/10 animate-pulse" />
                </div>
            </div>
        );
    }

    const chartData = buildReferralChartData(referralStats);
    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    if (chartData.length === 0) {
        return (
            <div className="rounded-2xl bg-surface-container p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-on-surface mb-4">
                    {t("charts.referralHealth")}
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
                    {t("charts.referralHealth")}
                </h3>
                <div className="h-56 sm:h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {chartData.map((entry) => (
                                    <Cell key={entry.name} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {chartData.map((entry) => {
                        const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                        return (
                            <div key={entry.name} className="flex items-center gap-1.5 text-xs text-on-surface/70">
                                <span
                                    className="inline-block h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: entry.fill }}
                                />
                                {entry.name} ({pct}%)
                            </div>
                        );
                    })}
                </div>
            </div>
        </ChartErrorBoundary>
    );
}