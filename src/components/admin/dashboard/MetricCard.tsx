"use client";

import { useTranslations } from "next-intl";

interface MetricCardProps {
    title: string;
    value: string;
    subtitle?: string;
    icon: string;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    loading?: boolean;
    colorClass?: string;
}

/**
 * Single KPI metric card for the admin dashboard.
 * Shows an icon, value, optional trend indicator, and subtitle.
 * Renders a skeleton when loading is true.
 */
export function MetricCard({
    title,
    value,
    subtitle,
    icon,
    trend,
    trendValue,
    loading,
    colorClass = "bg-surface-container text-on-surface",
}: MetricCardProps) {
    const t = useTranslations("AdminDashboard");

    if (loading) {
        return (
            <div className="rounded-2xl bg-surface-container p-4 sm:p-5 animate-pulse">
                <div className="flex items-start justify-between mb-3">
                    <div className="h-4 w-20 bg-on-surface/10 rounded" />
                    <div className="h-9 w-9 bg-on-surface/10 rounded-xl" />
                </div>
                <div className="h-7 w-24 bg-on-surface/10 rounded mb-2" />
                <div className="h-3 w-16 bg-on-surface/10 rounded" />
            </div>
        );
    }

    const trendColor =
        trend === "up"
            ? "text-green-600"
            : trend === "down"
                ? "text-red-500"
                : "text-on-surface/50";

    const trendIcon =
        trend === "up"
            ? "trending_up"
            : trend === "down"
                ? "trending_down"
                : "trending_flat";

    return (
        <div className={`rounded-2xl p-4 sm:p-5 ${colorClass} transition-shadow hover:shadow-md`}>
            <div className="flex items-start justify-between mb-3">
                <p className="text-xs sm:text-sm font-medium opacity-70 leading-tight">
                    {title}
                </p>
                <span className="material-symbols-outlined text-xl sm:text-2xl opacity-60">
                    {icon}
                </span>
            </div>
            <p className="text-xl sm:text-2xl font-bold leading-none mb-1">
                {value}
            </p>
            <div className="flex items-center gap-1.5">
                {(trend || trendValue) && (
                    <span className={`flex items-center gap-0.5 text-xs font-medium ${trendColor}`}>
                        <span className="material-symbols-outlined text-sm">
                            {trendIcon}
                        </span>
                        {trendValue}
                    </span>
                )}
                {subtitle && (
                    <span className="text-xs opacity-50">{subtitle}</span>
                )}
            </div>
        </div>
    );
}