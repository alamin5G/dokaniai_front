"use client";

import { useTranslations } from "next-intl";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { ChartErrorBoundary } from "./ChartErrorBoundary";
import { CHART_COLORS } from "./chartColors";
import type { PaymentSummary } from "@/types/paymentAdmin";

interface PaymentPipelineChartProps {
    paymentSummary: PaymentSummary | null;
    loading: boolean;
}

/**
 * Horizontal bar chart showing payment verification pipeline:
 * Completed, Manual Review, Failed, Fraud Flags, Rejected.
 * Uses real PaymentSummary data from the backend.
 */
export function PaymentPipelineChart({ paymentSummary, loading }: PaymentPipelineChartProps) {
    const t = useTranslations("AdminDashboard");

    if (loading) {
        return (
            <div className="rounded-2xl bg-surface-container p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-on-surface mb-4">
                    {t("charts.paymentPipeline")}
                </h3>
                <div className="h-56 sm:h-64 flex items-center justify-center">
                    <div className="w-full space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-8 bg-on-surface/10 rounded animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const chartData = [
        { status: "Completed", count: paymentSummary?.totalCompleted ?? 0, fill: CHART_COLORS.success },
        { status: "Manual Review", count: paymentSummary?.totalManualReview ?? 0, fill: CHART_COLORS.warning },
        { status: "Failed", count: paymentSummary?.totalFailed ?? 0, fill: CHART_COLORS.error },
        { status: "Fraud Flags", count: paymentSummary?.totalFraudFlags ?? 0, fill: "#9333ea" },
        { status: "Rejected", count: paymentSummary?.totalRejected ?? 0, fill: CHART_COLORS.neutral },
    ];

    const autoVerifiedRate = paymentSummary?.autoVerifiedRate ?? 0;

    return (
        <ChartErrorBoundary>
            <div className="rounded-2xl bg-surface-container p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-on-surface">
                        {t("charts.paymentPipeline")}
                    </h3>
                    {autoVerifiedRate > 0 && (
                        <span className="text-xs text-on-surface/50">
                            {autoVerifiedRate.toFixed(1)}% auto-verified
                        </span>
                    )}
                </div>
                <div className="h-56 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                            <XAxis
                                dataKey="status"
                                tick={{ fontSize: 11, fill: "rgba(0,0,0,0.5)" }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: "rgba(0,0,0,0.5)" }}
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                {chartData.map((entry) => (
                                    <Cell key={entry.status} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </ChartErrorBoundary>
    );
}