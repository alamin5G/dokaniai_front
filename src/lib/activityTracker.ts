"use client";

import apiClient from "@/lib/api";
import type { NotificationItem } from "@/types/notification";

type ActivityCategory =
    | "AUTH"
    | "NAVIGATION"
    | "NOTIFICATION"
    | "REPORTS"
    | "DASHBOARD";

interface TrackActivityPayload {
    businessId?: string | null;
    eventType: string;
    eventCategory: ActivityCategory;
    metadata?: Record<string, unknown>;
}

interface TrackNotificationPayload {
    businessId?: string | null;
    notification: NotificationItem;
    source?: string;
}

const SESSION_PREFIX = "dokaniai-activity:";

function buildSessionKey(key: string): string {
    return `${SESSION_PREFIX}${key}`;
}

function wasTrackedInSession(key: string): boolean {
    if (typeof window === "undefined") {
        return false;
    }

    try {
        return window.sessionStorage.getItem(buildSessionKey(key)) === "1";
    } catch {
        return false;
    }
}

function markTrackedInSession(key: string): void {
    if (typeof window === "undefined") {
        return;
    }

    try {
        window.sessionStorage.setItem(buildSessionKey(key), "1");
    } catch {
        // Ignore storage failures.
    }
}

function fireAndForget(request: Promise<unknown>): void {
    request.catch(() => {
        // Activity tracking must never disrupt the UI.
    });
}

export function trackActivityEvent(payload: TrackActivityPayload): void {
    fireAndForget(apiClient.post("/activity/log", {
        businessId: payload.businessId ?? null,
        eventType: payload.eventType,
        eventCategory: payload.eventCategory,
        metadata: payload.metadata ?? {},
    }));
}

export function trackActivityEventOnce(
    sessionKey: string,
    payload: TrackActivityPayload,
): void {
    if (wasTrackedInSession(sessionKey)) {
        return;
    }

    markTrackedInSession(sessionKey);
    trackActivityEvent(payload);
}

export function trackAppOpen(params: {
    businessId?: string | null;
    pathname?: string;
}): void {
    const sessionKey = `app-open:${params.businessId ?? "global"}:${params.pathname ?? "unknown"}`;
    trackActivityEventOnce(sessionKey, {
        businessId: params.businessId,
        eventType: "APP_OPEN",
        eventCategory: "AUTH",
        metadata: {
            pathname: params.pathname ?? null,
        },
    });
}

export function trackPageView(params: {
    businessId?: string | null;
    pathname: string;
    section: string;
    title?: string;
}): void {
    const sessionKey = `page-view:${params.businessId ?? "global"}:${params.pathname}`;
    trackActivityEventOnce(sessionKey, {
        businessId: params.businessId,
        eventType: "PAGE_VIEW",
        eventCategory: "NAVIGATION",
        metadata: {
            pathname: params.pathname,
            section: params.section,
            title: params.title ?? null,
        },
    });
}

export function trackNotificationPanelOpen(params: {
    unreadCount?: number;
    notificationCount?: number;
}): void {
    trackActivityEvent({
        eventType: "NOTIFICATION_PANEL_OPEN",
        eventCategory: "NOTIFICATION",
        metadata: {
            unreadCount: params.unreadCount ?? 0,
            notificationCount: params.notificationCount ?? 0,
        },
    });
}

export function trackNotificationOpen({
    businessId,
    notification,
    source = "notification_center",
}: TrackNotificationPayload): void {
    fireAndForget(apiClient.post("/activity/notification-open", undefined, {
        params: { notificationId: notification.id },
    }));

    trackActivityEvent({
        businessId,
        eventType: "NOTIFICATION_INTERACTION",
        eventCategory: "NOTIFICATION",
        metadata: {
            notificationId: notification.id,
            notificationType: notification.type,
            source,
            wasUnread: !notification.isRead,
        },
    });

    if (notification.type === "DAILY_SUMMARY") {
        fireAndForget(apiClient.post("/activity/daily-summary-view", undefined, {
            params: businessId ? { businessId } : undefined,
        }));
    }
}

export function trackNotificationDismiss({
    businessId,
    notification,
    source = "notification_center",
}: TrackNotificationPayload): void {
    fireAndForget(apiClient.post("/activity/notification-dismiss", undefined, {
        params: { notificationId: notification.id },
    }));

    trackActivityEvent({
        businessId,
        eventType: "NOTIFICATION_DELETE",
        eventCategory: "NOTIFICATION",
        metadata: {
            notificationId: notification.id,
            notificationType: notification.type,
            source,
            wasUnread: !notification.isRead,
        },
    });
}

export function trackReportView(params: {
    businessId: string;
    reportType: string;
    tab: string;
    period?: string;
}): void {
    const sessionKey = `report-view:${params.businessId}:${params.tab}:${params.period ?? "na"}`;

    if (!wasTrackedInSession(sessionKey)) {
        markTrackedInSession(sessionKey);
        fireAndForget(apiClient.post("/activity/report-view", undefined, {
            params: {
                reportType: params.reportType,
                businessId: params.businessId,
            },
        }));
    }

    trackActivityEvent({
        businessId: params.businessId,
        eventType: "REPORT_TAB_VIEW",
        eventCategory: "REPORTS",
        metadata: {
            reportType: params.reportType,
            tab: params.tab,
            period: params.period ?? null,
        },
    });
}
