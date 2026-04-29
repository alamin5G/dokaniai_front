"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { NotificationItem, NotificationType } from "@/types/notification";
import {
    listNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    deleteNotification,
} from "@/lib/notificationApi";
import {
    trackActivityEvent,
    trackNotificationDismiss,
    trackNotificationOpen,
    trackNotificationPanelOpen,
} from "@/lib/activityTracker";
import { useAuthStore } from "@/store/authStore";
import { useBusinessStore } from "@/store/businessStore";

// ─── Icons ──────────────────────────────────────────────────

function IconBell({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
    );
}

function IconCheck({ className = "w-4 h-4" }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
    );
}

function IconTrash({ className = "w-4 h-4" }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

function IconSparkle({ className = "w-3.5 h-3.5" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z" />
        </svg>
    );
}

function IconSettings({ className = "w-4 h-4" }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
        </svg>
    );
}

// ─── Type badge colors ──────────────────────────────────────

const typeColors: Record<string, string> = {
    LOW_STOCK: "bg-orange-100 text-orange-700",
    REORDER_NEEDED: "bg-red-100 text-red-700",
    DISCOUNT: "bg-green-100 text-green-700",
    PAYMENT: "bg-blue-100 text-blue-700",
    TRIAL_ENDING: "bg-yellow-100 text-yellow-700",
    GRACE_PERIOD: "bg-purple-100 text-purple-700",
    DUE_REMINDER: "bg-amber-100 text-amber-700",
    CATEGORY_REQUEST: "bg-indigo-100 text-indigo-700",
    SYSTEM: "bg-gray-100 text-gray-700",
    SUBSCRIPTION: "bg-indigo-100 text-indigo-700",
    SUPPORT: "bg-teal-100 text-teal-700",
    MARKETING: "bg-pink-100 text-pink-700",
    // AI Notification types (v8.0)
    DAILY_SUMMARY: "bg-cyan-100 text-cyan-700",
    AI_TIP: "bg-violet-100 text-violet-700",
    PATTERN_ALERT: "bg-fuchsia-100 text-fuchsia-700",
};

// ─── Tone-based left border colors ──────────────────────────

const toneBorders: Record<string, string> = {
    FRIENDLY: "border-l-green-400",
    URGENT: "border-l-red-400",
    WARNING: "border-l-amber-400",
    INFO: "border-l-blue-400",
    ENCOURAGING: "border-l-emerald-400",
};

// ─── Component ──────────────────────────────────────────────

export default function NotificationBell() {
    const t = useTranslations("notifications");
    const activeBusinessId = useBusinessStore((state) => state.activeBusinessId);

    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const bellRef = useRef<HTMLButtonElement>(null);

    // ─── Load unread count (SSE-driven, no polling) ─────
    const fetchUnreadCount = useCallback(async () => {
        // Skip if not authenticated to avoid 401 console noise
        if (!useAuthStore.getState().accessToken) return;
        try {
            const count = await getUnreadCount();
            setUnreadCount(count);
        } catch (err) {
            console.error("[NotificationBell] Failed to fetch unread count:", err);
        }
    }, []);

    useEffect(() => {
        // Initial fetch on mount
        fetchUnreadCount();

        // SSE drives all subsequent updates — no polling needed.
        // Backend pushes NOTIFICATION_NEW event via SSE whenever
        // a notification is created, which triggers this listener.
        const handleSSENotification = () => fetchUnreadCount();
        window.addEventListener("sse:notification-new", handleSSENotification);

        return () => {
            window.removeEventListener("sse:notification-new", handleSSENotification);
        };
    }, [fetchUnreadCount]);

    // ─── Load notifications when panel opens ─────────────
    useEffect(() => {
        if (!isOpen) return;

        // Sync unread count when panel opens
        fetchUnreadCount();

        trackNotificationPanelOpen({
            unreadCount,
            notificationCount: notifications.length,
        });

        async function loadNotifications() {
            setLoading(true);
            setLoadError(false);
            try {
                const page = await listNotifications(undefined, undefined, 0, 20);
                setNotifications(page.content);
            } catch (err) {
                console.error("[NotificationBell] Failed to load notifications:", err);
                setLoadError(true);
            } finally {
                setLoading(false);
            }
        }
        loadNotifications();
    }, [isOpen]);

    // ─── Close panel on outside click ───────────────────
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            if (
                panelRef.current && !panelRef.current.contains(target) &&
                bellRef.current && !bellRef.current.contains(target)
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ─── Actions ────────────────────────────────────────
    async function handleMarkRead(notification: NotificationItem) {
        try {
            await markAsRead(notification.id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((c) => Math.max(0, c - (notification.isRead ? 0 : 1)));
            trackNotificationOpen({
                businessId: activeBusinessId,
                notification,
            });
        } catch { /* non-critical */ }
    }

    async function handleMarkAllRead() {
        try {
            await markAllAsRead();
            setUnreadCount(0);
            trackActivityEvent({
                businessId: activeBusinessId,
                eventType: "NOTIFICATION_MARK_ALL_READ",
                eventCategory: "NOTIFICATION",
                metadata: {
                    affectedCount: notifications.filter((item) => !item.isRead).length,
                },
            });
            // Reload list from API to ensure sync
            try {
                const page = await listNotifications(undefined, undefined, 0, 20);
                setNotifications(page.content);
            } catch {
                // Fallback to optimistic update
                setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            }
        } catch (err) {
            console.error("[NotificationBell] Failed to mark all as read:", err);
        }
    }

    async function handleDelete(notification: NotificationItem) {
        try {
            await deleteNotification(notification.id);
            setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
            setUnreadCount((c) => Math.max(0, c - (notification.isRead ? 0 : 1)));
            trackNotificationDismiss({
                businessId: activeBusinessId,
                notification,
            });
        } catch { /* non-critical */ }
    }

    function handleOpenNotification(notification: NotificationItem) {
        setSelectedNotification(notification);
        // Auto mark as read
        if (!notification.isRead) {
            handleMarkRead(notification);
        }
    }

    // ─── Time formatting ────────────────────────────────
    function timeAgo(dateStr: string): string {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60_000);
        if (mins < 1) return t("justNow");
        if (mins < 60) return t("minutesAgo", { count: mins });
        const hours = Math.floor(mins / 60);
        if (hours < 24) return t("hoursAgo", { count: hours });
        const days = Math.floor(hours / 24);
        return t("daysAgo", { count: days });
    }

    // ─── Render ─────────────────────────────────────────
    return (
        <div className="relative">
            {/* Bell button */}
            <button
                ref={bellRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
                aria-label={t("title")}
            >
                <IconBell />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-on-error">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {isOpen && (
                <div
                    ref={panelRef}
                    className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl bg-surface-container-lowest shadow-xl border border-outline-variant/10 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-surface-container">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-on-surface">{t("title")}</h3>
                            <IconSparkle className="w-3.5 h-3.5 text-violet-500" />
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleMarkAllRead}
                                    className="text-xs font-semibold text-primary hover:underline"
                                >
                                    {t("markAllRead")}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notification list */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="h-6 w-6 animate-spin rounded-full border-3 border-surface-container-high border-t-primary" />
                            </div>
                        ) : loadError ? (
                            <div className="px-4 py-8 text-center space-y-3">
                                <p className="text-sm text-on-surface-variant">{t("loadError")}</p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLoadError(false);
                                        setLoading(true);
                                        listNotifications(undefined, undefined, 0, 20)
                                            .then((page) => setNotifications(page.content))
                                            .catch((err) => {
                                                console.error("[NotificationBell] Retry failed:", err);
                                                setLoadError(true);
                                            })
                                            .finally(() => setLoading(false));
                                    }}
                                    className="text-xs font-semibold text-primary hover:underline"
                                >
                                    {t("retry")}
                                </button>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-sm text-on-surface-variant">
                                {t("empty")}
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <NotificationCard
                                    key={notif.id}
                                    notification={notif}
                                    onMarkRead={handleMarkRead}
                                    onDelete={handleDelete}
                                    onOpen={handleOpenNotification}
                                    timeAgo={timeAgo}
                                    typeLabel={t(`type.${notif.type}`, { defaultValue: notif.type })}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
            {/* Notification Detail Modal */}
            {selectedNotification && (
                <NotificationDetailModal
                    notification={selectedNotification}
                    typeLabel={t(`type.${selectedNotification.type}`, { defaultValue: selectedNotification.type })}
                    timeAgo={timeAgo(selectedNotification.createdAt)}
                    onClose={() => setSelectedNotification(null)}
                />
            )}
        </div>
    );
}

// ─── Notification Card (extracted for clarity) ──────────────

function NotificationCard({
    notification,
    onMarkRead,
    onDelete,
    onOpen,
    timeAgo,
    typeLabel,
}: {
    notification: NotificationItem;
    onMarkRead: (notification: NotificationItem) => void;
    onDelete: (notification: NotificationItem) => void;
    onOpen: (notification: NotificationItem) => void;
    timeAgo: (dateStr: string) => string;
    typeLabel: string;
}) {
    const isAi = notification.aiGenerated === true;
    const tone = notification.tone || "INFO";
    const actionLabel = notification.aiContext?.actionLabel;
    const isFallback = notification.aiContext?.fallback === true;
    const isRejection = notification.type === "CATEGORY_REQUEST" && /reject/i.test(notification.title);

    // Determine left border color based on tone for AI notifications
    const borderClass = isAi
        ? `border-l-3 ${toneBorders[tone] || "border-l-blue-400"}`
        : isRejection ? "border-l-3 border-l-red-400" : "";

    return (
        <div
            onClick={() => onOpen(notification)}
            className={`cursor-pointer flex gap-3 px-4 py-3 border-b border-surface-container/50 transition-colors hover:bg-surface-container-low ${!notification.isRead ? "bg-primary-container/5" : ""
                } ${borderClass}`}
        >
            {/* Type badge */}
            <div className="flex-shrink-0 mt-0.5">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${isRejection ? "bg-red-100 text-red-700" : typeColors[notification.type] || "bg-gray-100 text-gray-700"}`}>
                    {isRejection && <span className="material-symbols-outlined text-[11px]">close</span>}
                    {isAi && !isRejection && <IconSparkle className="w-2.5 h-2.5" />}
                    {typeLabel}
                </span>
                {isFallback && (
                    <span className="mt-0.5 block text-[8px] text-on-surface-variant/60 text-center">
                        AI
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${!notification.isRead ? "font-semibold text-on-surface" : "text-on-surface-variant"}`}>
                    {notification.title}
                </p>
                <p className="mt-0.5 text-xs text-on-surface-variant line-clamp-2">
                    {notification.message}
                </p>

                {/* AI action button */}
                {isAi && actionLabel && (
                    <button
                        type="button"
                        onClick={() => onMarkRead(notification)}
                        className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                    >
                        {actionLabel}
                    </button>
                )}

                <div className="mt-1 flex items-center gap-2">
                    <p className="text-[10px] text-on-surface-variant/70">
                        {timeAgo(notification.createdAt)}
                    </p>
                    {isAi && !isFallback && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] text-violet-500 font-medium">
                            <IconSparkle className="w-2 h-2" />
                            AI
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-1 flex-shrink-0">
                {!notification.isRead && (
                    <button
                        type="button"
                        onClick={() => onMarkRead(notification)}
                        className="rounded-lg p-1 text-primary hover:bg-primary-container/10 transition-colors"
                        title="Mark read"
                    >
                        <IconCheck />
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => onDelete(notification)}
                    className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container transition-colors"
                    title="Delete"
                >
                    <IconTrash />
                </button>
            </div>
        </div>
    );
}

// ─── Notification Detail Modal ──────────────────────────────

function NotificationDetailModal({
    notification,
    typeLabel,
    timeAgo,
    onClose,
}: {
    notification: NotificationItem;
    typeLabel: string;
    timeAgo: string;
    onClose: () => void;
}) {
    const isAi = notification.aiGenerated === true;
    const tone = notification.tone || "INFO";
    const actionLabel = notification.aiContext?.actionLabel;
    const modalRef = useRef<HTMLDivElement>(null);

    // Close on backdrop click
    useEffect(() => {
        function handleBackdropClick(e: MouseEvent) {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleBackdropClick);
        return () => document.removeEventListener("mousedown", handleBackdropClick);
    }, [onClose]);

    // Close on Escape key
    useEffect(() => {
        function handleEscape(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    const isRejection = notification.type === "CATEGORY_REQUEST" && /reject/i.test(notification.title);

    const borderClass = isAi
        ? `border-l-4 ${toneBorders[tone] || "border-l-blue-400"}`
        : isRejection ? "border-l-4 border-l-red-400" : "";

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div
                ref={modalRef}
                className={`w-full sm:w-[440px] max-h-[80vh] bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col ${borderClass}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container">
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${isRejection ? "bg-red-100 text-red-700" : typeColors[notification.type] || "bg-gray-100 text-gray-700"}`}>
                            {isRejection && <span className="material-symbols-outlined text-[13px]">close</span>}
                            {isAi && !isRejection && <IconSparkle className="w-3 h-3" />}
                            {typeLabel}
                        </span>
                        {isAi && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-violet-500 font-medium">
                                <IconSparkle className="w-2.5 h-2.5" />
                                AI
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-high transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto px-5 py-4 space-y-3">
                    <h3 className="text-base font-bold text-on-surface leading-snug">
                        {notification.title}
                    </h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                        {notification.message}
                    </p>

                    {/* AI action button */}
                    {isAi && actionLabel && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                        >
                            {actionLabel}
                        </button>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-surface-container flex items-center justify-between">
                    <p className="text-[11px] text-on-surface-variant/70">
                        {timeAgo}
                    </p>
                    {isAi && notification.tone && (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${tone === "URGENT" ? "bg-red-100 text-red-700" :
                            tone === "WARNING" ? "bg-amber-100 text-amber-700" :
                                tone === "FRIENDLY" ? "bg-green-100 text-green-700" :
                                    tone === "ENCOURAGING" ? "bg-emerald-100 text-emerald-700" :
                                        "bg-blue-100 text-blue-700"
                            }`}>
                            {tone}
                        </span>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

