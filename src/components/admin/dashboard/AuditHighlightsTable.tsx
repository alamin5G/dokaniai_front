"use client";

import { useTranslations } from "next-intl";
import type { AuditLogSummary, AuditLogHighlight } from "@/types/admin";
import { CHART_COLORS } from "./chartColors";

interface AuditHighlightsTableProps {
    auditSummary: AuditLogSummary | null;
    loading: boolean;
}

/** Severity badge colors */
const SEVERITY_STYLES: Record<string, string> = {
    CRITICAL: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    WARNING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    INFO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    NORMAL: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

/**
 * Compact table showing the latest high-severity audit log entries.
 * Visible only to SUPER_ADMIN. Shows severity badge, action, actor, and time.
 */
export function AuditHighlightsTable({ auditSummary, loading }: AuditHighlightsTableProps) {
    const t = useTranslations("AdminDashboard");

    if (loading) {
        return (
            <div className="rounded-2xl bg-surface-container p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-on-surface mb-4">
                    {t("audit.title")}
                </h3>
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="h-5 w-16 rounded bg-on-surface/10" />
                            <div className="h-4 flex-1 rounded bg-on-surface/5" />
                            <div className="h-4 w-20 rounded bg-on-surface/5" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const highlights: AuditLogHighlight[] = auditSummary?.highlights ?? [];

    if (highlights.length === 0) {
        return (
            <div className="rounded-2xl bg-surface-container p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-on-surface mb-4">
                    {t("audit.title")}
                </h3>
                <p className="text-sm text-on-surface/50 py-6 text-center">
                    {t("audit.noData")}
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl bg-surface-container p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-on-surface">
                    {t("audit.title")}
                </h3>
                {auditSummary && (
                    <span className="text-xs text-on-surface/50">
                        {auditSummary.totalLogs} total · {auditSummary.uniqueActors} actors
                    </span>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-on-surface/50 text-xs">
                            <th className="pb-2 font-medium">Severity</th>
                            <th className="pb-2 font-medium">Action</th>
                            <th className="pb-2 font-medium hidden sm:table-cell">Actor</th>
                            <th className="pb-2 font-medium text-right">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-on-surface/5">
                        {highlights.slice(0, 5).map((h) => (
                            <tr key={h.id} className="hover:bg-on-surface/[0.02]">
                                <td className="py-2 pr-3">
                                    <span
                                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_STYLES[h.severity] ?? SEVERITY_STYLES.NORMAL
                                            }`}
                                    >
                                        {h.severity}
                                    </span>
                                </td>
                                <td className="py-2 pr-3 max-w-[200px] truncate">
                                    {h.action}
                                </td>
                                <td className="py-2 pr-3 hidden sm:table-cell text-on-surface/60">
                                    {h.actorId.slice(0, 8)}…
                                </td>
                                <td className="py-2 text-right text-on-surface/50 whitespace-nowrap">
                                    {formatTimeAgo(h.createdAt)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Summary chips */}
            {auditSummary && (
                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-on-surface/5">
                    <SummaryChip
                        label="Warnings"
                        value={auditSummary.warningCount}
                        color={CHART_COLORS.warning}
                    />
                    <SummaryChip
                        label="Critical"
                        value={auditSummary.criticalCount}
                        color={CHART_COLORS.error}
                    />
                    <SummaryChip
                        label="Failed"
                        value={auditSummary.failedCount}
                        color={CHART_COLORS.error}
                    />
                    <SummaryChip
                        label="Auth Events"
                        value={auditSummary.authEventCount}
                        color={CHART_COLORS.info}
                    />
                </div>
            )}
        </div>
    );
}

/** Small colored chip for summary stats */
function SummaryChip({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: `${color}15`, color }}
        >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
            {value} {label}
        </span>
    );
}

/** Relative time formatter (e.g., "3m ago", "2h ago") */
function formatTimeAgo(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}