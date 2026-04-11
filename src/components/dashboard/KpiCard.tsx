"use client";

import { useTranslations } from "next-intl";

// ---------------------------------------------------------------------------
// Inline SVG Icons
// ---------------------------------------------------------------------------

function IconTrendingUp({ className = "w-4 h-4" }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={className}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"
            />
        </svg>
    );
}

function IconTrendingDown({ className = "w-4 h-4" }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={className}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181"
            />
        </svg>
    );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KpiCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: { value: number; isPositive: boolean };
    accentColor?: string; // Tailwind text color class for the value
    className?: string;
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

export function KpiCardSkeleton() {
    return (
        <div className="bg-surface-container-lowest rounded-2xl p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-surface-container-high rounded-xl p-3 w-12 h-12" />
                <div className="bg-surface-container-high rounded-lg h-4 w-24" />
            </div>
            <div className="bg-surface-container-high rounded-lg h-8 w-32 mb-3" />
            <div className="bg-surface-container-high rounded-full h-5 w-20" />
        </div>
    );
}

// ---------------------------------------------------------------------------
// KpiCard Component
// ---------------------------------------------------------------------------

export default function KpiCard({
    title,
    value,
    subtitle,
    icon,
    trend,
    accentColor = "text-primary",
    className = "",
}: KpiCardProps) {
    const t = useTranslations("dashboard.kpi");

    return (
        <div
            className={`bg-surface-container-lowest rounded-2xl p-6 ${className}`}
        >
            {/* Icon + Title */}
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 rounded-xl p-3 text-primary flex items-center justify-center">
                    {icon}
                </div>
                <p className="text-on-surface-variant font-medium text-sm">{title}</p>
            </div>

            {/* Value */}
            <h3 className={`text-2xl font-bold ${accentColor}`}>{value}</h3>

            {/* Trend badge or subtitle */}
            {(trend || subtitle) && (
                <div className="mt-3">
                    {trend ? (
                        <div
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend.isPositive
                                    ? "text-primary bg-primary-fixed/40"
                                    : "text-tertiary bg-tertiary-fixed/40"
                                }`}
                        >
                            {trend.isPositive ? (
                                <IconTrendingUp className="w-3 h-3" />
                            ) : (
                                <IconTrendingDown className="w-3 h-3" />
                            )}
                            <span>
                                {trend.isPositive
                                    ? t("trendUp", { percent: Math.abs(trend.value) })
                                    : t("trendDown", { percent: Math.abs(trend.value) })}
                            </span>
                        </div>
                    ) : (
                        subtitle && (
                            <p className="text-on-surface-variant text-xs">{subtitle}</p>
                        )
                    )}
                </div>
            )}
        </div>
    );
}
