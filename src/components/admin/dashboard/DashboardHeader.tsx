"use client";

import { useTranslations } from "next-intl";
import type { TimeRange } from "./useDashboardData";

interface DashboardHeaderProps {
    loading: boolean;
    onRefresh: () => void;
    onExport: () => Promise<void>;
    timeRange: TimeRange;
    onTimeRangeChange: (range: TimeRange) => void;
}

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
    { value: "7D", label: "7D" },
    { value: "30D", label: "30D" },
    { value: "90D", label: "90D" },
    { value: "1Y", label: "1Y" },
];

/**
 * Top header bar for the admin dashboard.
 * Contains title, time range picker, and refresh action.
 */
export function DashboardHeader({
    loading,
    onRefresh,
    onExport,
    timeRange,
    onTimeRangeChange,
}: DashboardHeaderProps) {
    const t = useTranslations("AdminDashboard");

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-on-surface">
                    {t("title")}
                </h1>
                <p className="text-sm text-on-surface/60 mt-0.5">
                    {t("subtitle")}
                </p>
            </div>

            <div className="flex items-center gap-2">
                {/* Time range selector */}
                <div className="flex bg-surface-container rounded-xl p-1">
                    {TIME_RANGE_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => onTimeRangeChange(opt.value)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${timeRange === opt.value
                                ? "bg-primary text-on-primary shadow-sm"
                                : "text-on-surface/60 hover:text-on-surface"
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Export CSV button */}
                <button
                    onClick={onExport}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container text-on-surface text-sm font-medium hover:bg-surface-container/80 disabled:opacity-50 transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">download</span>
                    <span className="hidden sm:inline">{t("export")}</span>
                </button>

                {/* Refresh button */}
                <button
                    onClick={onRefresh}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                    <span className={`material-symbols-outlined text-lg ${loading ? "animate-spin" : ""}`}>
                        refresh
                    </span>
                    <span className="hidden sm:inline">{t("refresh")}</span>
                </button>
            </div>
        </div>
    );
}