"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { AdminNotification } from "@/types/admin";
import {
    getAdminNotifications,
    getAdminNotificationCount,
    markAdminNotificationRead,
    markAllAdminNotificationsRead,
    dismissAdminNotification,
} from "@/lib/adminApi";

const SEVERITY_COLORS: Record<string, string> = {
    INFO: "bg-primary/20 text-primary",
    WARNING: "bg-tertiary/20 text-tertiary",
    ERROR: "bg-error/20 text-error",
    CRITICAL: "bg-error/30 text-error",
};

const TYPE_ICONS: Record<string, string> = {
    CATEGORY_REQUEST: "category",
    PAYMENT_RECEIVED: "payments",
    PAYMENT_FAILED: "payments_error",
    PAYMENT_REFUNDED: "money_off",
    SUBSCRIPTION_CREATED: "add_circle",
    SUBSCRIPTION_CANCELLED: "cancel",
    SUBSCRIPTION_EXPIRED: "timer_off",
    SUBSCRIPTION_RENEWED: "autorenew",
    COUPON_CREATED: "confirmation_number",
    COUPON_REDEEMED: "sell",
    COUPON_EXPIRED: "event_busy",
    TICKET_CREATED: "support_agent",
    TICKET_ASSIGNED: "person_add",
    TICKET_OVERDUE: "schedule",
    SUSPICIOUS_ACTIVITY: "warning",
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function AdminNotificationBell() {
    const [count, setCount] = useState<number>(0);
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Fetch unread count
    const refreshCount = useCallback(async () => {
        try {
            const c = await getAdminNotificationCount();
            setCount(c);
        } catch {
            // silent
        }
    }, []);

    // Fetch notification list
    const refreshList = useCallback(async () => {
        setLoading(true);
        try {
            const page = await getAdminNotifications({ page: 0, size: 20 });
            setNotifications(page.content);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        refreshCount();
    }, [refreshCount]);

    // SSE listeners
    useEffect(() => {
        const onNew = () => {
            refreshCount();
            if (open) refreshList();
        };
        const onCount = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (typeof detail?.count === "number") {
                setCount(detail.count);
            } else {
                refreshCount();
            }
        };
        window.addEventListener("sse:admin-notification-new", onNew);
        window.addEventListener("sse:admin-notification-count", onCount);
        return () => {
            window.removeEventListener("sse:admin-notification-new", onNew);
            window.removeEventListener("sse:admin-notification-count", onCount);
        };
    }, [open, refreshCount, refreshList]);

    // Click outside to close
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // Load list when panel opens
    useEffect(() => {
        if (open) refreshList();
    }, [open, refreshList]);

    const handleMarkRead = async (id: number) => {
        await markAdminNotificationRead(id);
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setCount((c) => Math.max(0, c - 1));
    };

    const handleMarkAllRead = async () => {
        await markAllAdminNotificationsRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setCount(0);
    };

    const handleDismiss = async (id: number) => {
        await dismissAdminNotification(id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        refreshCount();
    };

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={() => setOpen(!open)}
                className="size-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors relative"
            >
                <span className="material-symbols-outlined">notifications</span>
                {count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-error rounded-full text-on-error text-[10px] font-bold flex items-center justify-center">
                        {count > 99 ? "99+" : count}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-12 w-80 md:w-96 max-h-[70vh] bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/15 flex flex-col z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/15">
                        <h3 className="text-on-surface font-bold text-sm">Notifications</h3>
                        {count > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-primary text-xs font-medium hover:underline"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading && notifications.length === 0 ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-on-surface-variant text-sm text-center py-8">
                                No notifications
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`px-4 py-3 border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors group ${!n.read ? "bg-primary/5" : ""
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`size-8 rounded-full flex items-center justify-center shrink-0 text-xs ${SEVERITY_COLORS[n.severity] || SEVERITY_COLORS.INFO
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-[16px]">
                                                {TYPE_ICONS[n.type] || "info"}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className={`text-sm leading-snug ${n.read
                                                        ? "text-on-surface-variant"
                                                        : "text-on-surface font-medium"
                                                    }`}
                                            >
                                                {n.title}
                                            </p>
                                            <p className="text-xs text-on-surface-variant/70 mt-0.5 truncate">
                                                {n.message}
                                            </p>
                                            <p className="text-[10px] text-on-surface-variant/50 mt-1">
                                                {timeAgo(n.createdAt)}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!n.read && (
                                                <button
                                                    onClick={() => handleMarkRead(n.id)}
                                                    className="text-primary text-[10px] font-medium hover:underline"
                                                    title="Mark as read"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">
                                                        done
                                                    </span>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDismiss(n.id)}
                                                className="text-on-surface-variant text-[10px] hover:text-error"
                                                title="Dismiss"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">
                                                    close
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}