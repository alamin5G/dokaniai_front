"use client";

import { useTranslations } from "next-intl";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { ChartErrorBoundary } from "./ChartErrorBoundary";
import { CHART_COLORS } from "./chartColors";
import { tooltipTakaFormatter } from "./chartFormatters";
import type { RevenueTrendData } from "@/types/admin";

interface RevenueTrendChartProps {
    data: RevenueTrendData | null;
    loading: boolean;
}

/**
 * Area chart showing revenue trend over the selected time range.
 * When data is null or loading, shows a skeleton placeholder.
 */
export function RevenueTrendChart({ data, loading }: RevenueTrendChartProps) {
    const t = useTranslations("AdminDashboard");

    // Transform API data into recharts-friendly format
    const chartData = (data?.dataPoints ?? []).map((dp) => ({
        date: dp.date,
        revenue: dp.revenue,
    }));

    return (
        <ChartErrorBoundary fallbackTitle={t("charts.revenueError")}>
            <div className="rounded-2xl bg-surface-container p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-on-surface mb-4">
                    {t("charts.revenueTrend")}
                </h3>
                <div className="h-56 sm:h-64">
                    {loading || chartData.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-on-surface/50 text-sm animate-pulse">
                            {t("loading")}
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 11, fill: "rgba(0,0,0,0.5)" }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: "rgba(0,0,0,0.5)" }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v: number) => `৳${(v / 1000).toFixed(0)}K`}
                                />
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                <Tooltip formatter={(value: any) => [tooltipTakaFormatter(Number(value)), "Revenue"]} />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke={CHART_COLORS.primary}
                                    strokeWidth={2}
                                    fill="url(#revenueGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </ChartErrorBoundary>
    );
}