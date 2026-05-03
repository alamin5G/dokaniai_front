"use client";

import { useTranslations } from "next-intl";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { ChartErrorBoundary } from "./ChartErrorBoundary";
import { CHART_COLORS } from "./chartColors";
import type { TicketStatsResponse } from "@/types/admin";

interface TicketStatusBarProps {
    ticketStats: TicketStatsResponse | null;
    loading: boolean;
}

/** Fallback data when API doesn't return ticket stats */
const FALLBACK_DATA = [
    { name: "Open", value: 0, fill: CHART_COLORS.info },
    { name: "In Progress", value: 0, fill: CHART_COLORS.warning },
    { name: "Resolved", value: 0, fill: CHART_COLORS.success },
    { name: "Closed", value: 0, fill: CHART_COLORS.neutral },
];

/**
 * Vertical bar chart showing support ticket status breakdown.
 * Color-coded by urgency. Shows unassigned count badge.
 */
export function TicketStatusBar({ ticketStats, loading }: TicketStatusBarProps) {
    const t = useTranslations("AdminDashboard");

    if (loading) {
        return (
            <div className="rounded-2xl bg-surface-container p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-on-surface mb-4">
                    {t("charts.ticketStatus")}
                </h3>
                <div className="flex items-end gap-3 h-[180px]">
                    {[40, 65, 30, 55].map((h, i) => (
                        <div
                            key={i}
                            className="flex-1 bg-on-surface/10 rounded-t animate-pulse"
                            style={{ height: `${h}%` }}
                        />
                    ))}
                </div>
            </div>
        );
    }

    const data = ticketStats
        ? [
            { name: "Open", value: ticketStats.totalOpen ?? 0, fill: CHART_COLORS.info },
            { name: "In Progress", value: ticketStats.inProgress ?? 0, fill: CHART_COLORS.warning },
            { name: "Resolved", value: ticketStats.resolved ?? 0, fill: CHART_COLORS.success },
            { name: "Closed", value: ticketStats.closed ?? 0, fill: CHART_COLORS.neutral },
        ]
        : FALLBACK_DATA;

    const unassignedCount = ticketStats?.unassignedCount ?? 0;

    return (
        <ChartErrorBoundary>
            <div className="rounded-2xl bg-surface-container p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-on-surface">
                        {t("charts.ticketStatus")}
                    </h3>
                    {unassignedCount > 0 && (
                        <span className="text-xs bg-error/10 text-error px-2 py-0.5 rounded-full font-medium">
                            {unassignedCount} unassigned
                        </span>
                    )}
                </div>
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 11, fill: "rgba(0,0,0,0.6)" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: "rgba(0,0,0,0.6)" }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: 12,
                                fontSize: 12,
                                border: "1px solid rgba(0,0,0,0.08)",
                            }}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                            {data.map((entry, index) => (
                                <Cell key={index} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </ChartErrorBoundary>
    );
}