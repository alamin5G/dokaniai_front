"use client";

import { useTranslations } from "next-intl";
import { CHART_COLORS } from "./chartColors";
import { formatTimeAgo } from "./chartFormatters";
import type { AdminNotification, AuditLogHighlight } from "@/types/admin";

/** Activity items derived from real notifications + audit highlights */
interface ActivityItem {
    id: string;
    icon: string;
    message: string;
    time: string;
    color: string;
}

interface PlatformActivityFeedProps {
    notifications: AdminNotification[];
    auditSummary: {
        highlights?: AuditLogHighlight[];
    } | null;
    loading: boolean;
}

/** Map notification type to display icon */
const NOTIFICATION_ICON: Record<string, string> = {
    CATEGORY_REQUEST: "🏷️",
    PAYMENT_RECEIVED: "💰",
    PAYMENT_FAILED: "💰",
    PAYMENT_REFUNDED: "💰",
    SUBSCRIPTION_CREATED: "📦",
    SUBSCRIPTION_CANCELLED: "📦",
    SUBSCRIPTION_EXPIRED: "📦",
    SUBSCRIPTION_RENEWED: "📦",
    COUPON_CREATED: "🎫",
    COUPON_REDEEMED: "🎫",
    COUPON_EXPIRED: "🎫",
    TICKET_CREATED: "🎫",
    TICKET_ASSIGNED: "🎫",
    TICKET_OVERDUE: "🎫",
    SUSPICIOUS_ACTIVITY: "⚠️",
};

/** Map notification severity to color */
const SEVERITY_COLOR: Record<string, string> = {
    INFO: CHART_COLORS.primary,
    WARNING: CHART_COLORS.warning,
    ERROR: CHART_COLORS.error,
    CRITICAL: CHART_COLORS.error,
};

/** Map audit severity to color */
const AUDIT_SEVERITY_COLOR: Record<string, string> = {
    INFO: CHART_COLORS.primary,
    WARNING: CHART_COLORS.warning,
    ERROR: CHART_COLORS.error,
    CRITICAL: CHART_COLORS.error,
};

/** Build a unified activity feed from notifications + audit highlights */
function buildActivityFeed(
    notifications: AdminNotification[],
    highlights: AuditLogHighlight[],
): ActivityItem[] {
    const items: ActivityItem[] = [];

    for (const n of notifications) {
        items.push({
            id: `notif-${n.id}`,
            icon: NOTIFICATION_ICON[n.type] ?? "📋",
            message: n.title ?? n.message,
            time: n.createdAt,
            color: SEVERITY_COLOR[n.severity] ?? CHART_COLORS.primary,
        });
    }

    for (const h of highlights) {
        items.push({
            id: `audit-${h.id}`,
            icon: "🔍",
            message: h.details ?? h.action,
            time: h.createdAt,
            color: AUDIT_SEVERITY_COLOR[h.severity] ?? CHART_COLORS.primary,
        });
    }

    // Sort by time descending (newest first)
    items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // Cap at 10 visible items
    return items.slice(0, 10);
}

/**
 * Recent platform activity feed combining notifications and audit highlights.
 * Shows real data from the backend with icon, message, and relative timestamp.
 */
export function PlatformActivityFeed({ notifications, auditSummary, loading }: PlatformActivityFeedProps) {
    const t = useTranslations("AdminDashboard");

    if (loading) {
        return (
            <div className="rounded-2xl bg-surface-container p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-on-surface mb-4">
                    {t("activity.title")}
                </h3>
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-start gap-3 p-2">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-on-surface/10 animate-pulse" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-3.5 bg-on-surface/10 rounded animate-pulse w-3/4" />
                                <div className="h-2.5 bg-on-surface/10 rounded animate-pulse w-1/4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const highlights = auditSummary?.highlights ?? [];
    const activityItems = buildActivityFeed(notifications, highlights);

    if (activityItems.length === 0) {
        return (
            <div className="rounded-2xl bg-surface-container p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-on-surface mb-4">
                    {t("activity.title")}
                </h3>
                <div className="h-40 flex items-center justify-center text-on-surface/40 text-sm">
                    {t("charts.noData")}
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl bg-surface-container p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-on-surface mb-4">
                {t("activity.title")}
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
                {activityItems.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-on-surface/5 transition-colors"
                    >
                        <span
                            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm"
                            style={{ backgroundColor: `${item.color}15` }}
                        >
                            {item.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm text-on-surface truncate">{item.message}</p>
                            <p className="text-xs text-on-surface/50 mt-0.5">{formatTimeAgo(item.time)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}