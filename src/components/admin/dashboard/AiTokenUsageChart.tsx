"use client";

import { useTranslations } from "next-intl";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ChartErrorBoundary } from "./ChartErrorBoundary";
import { CHART_COLORS } from "./chartColors";
import type { AiTokenStats } from "@/types/admin";

interface AiTokenUsageChartProps {
    data: AiTokenStats | null;
    loading: boolean;
}

/**
 * Bar chart showing AI token usage per day/week.
 * When data is null or loading, shows a skeleton placeholder.
 */
export function AiTokenUsageChart({ data, loading }: AiTokenUsageChartProps) {
    const t = useTranslations("AdminDashboard");

    const chartData = (data?.dailyUsage ?? []).map((du) => ({
        date: du.date,
        tokens: du.inputTokens + du.outputTokens,
        inputTokens: du.inputTokens,
        outputTokens: du.outputTokens,
    }));

    return (
        <ChartErrorBoundary>
            <div className="rounded-2xl bg-surface-container p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-on-surface mb-4">
                    {t("charts.aiTokenUsage")}
                </h3>
                <div className="h-56 sm:h-64">
                    {loading || chartData.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-on-surface/50 text-sm animate-pulse">
                            {t("loading")}
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
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
                                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
                                />
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString()} tokens`, "Tokens"]} />
                                <Bar dataKey="tokens" fill={CHART_COLORS.primary} radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </ChartErrorBoundary>
    );
}