"use client";

import { useTranslations } from "next-intl";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ChartErrorBoundary } from "./ChartErrorBoundary";
import { CHART_COLORS } from "./chartColors";
import type { UserGrowthData } from "@/types/admin";

interface UserGrowthChartProps {
    data: UserGrowthData | null;
    loading: boolean;
}

/**
 * Line chart showing user registration growth over time.
 * When data is null or loading, shows a skeleton placeholder.
 */
export function UserGrowthChart({ data, loading }: UserGrowthChartProps) {
    const t = useTranslations("AdminDashboard");

    const chartData = (data?.dataPoints ?? []).map((dp) => ({
        date: dp.date,
        users: dp.newUsers,
        cumulative: dp.cumulativeTotal,
    }));

    return (
        <ChartErrorBoundary>
            <div className="rounded-2xl bg-surface-container p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-on-surface mb-4">
                    {t("charts.userGrowth")}
                </h3>
                <div className="h-56 sm:h-64">
                    {loading || chartData.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-on-surface/50 text-sm animate-pulse">
                            {t("loading")}
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
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
                                />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="users"
                                    stroke={CHART_COLORS.userGrowth}
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: CHART_COLORS.userGrowth }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </ChartErrorBoundary>
    );
}