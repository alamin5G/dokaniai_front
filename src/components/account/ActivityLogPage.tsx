"use client";

/**
 * Activity Log Page
 * SRS Reference: Section 6.9 — FR-AUD-03: User views own activity log (last 90 days)
 */

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { getActivityLog, type UserActivitySummary } from "@/lib/activityLogApi";

function formatDate(dateStr: string, locale: string): string {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return dateStr;
    }
}

function getActionIcon(action: string): string {
    const map: Record<string, string> = {
        LOGIN: "login",
        LOGOUT: "logout",
        SALE_CREATE: "receipt_long",
        PRODUCT_ADD: "add_circle",
        DUE_ADD: "menu_book",
        EXPENSE_ADD: "payments",
        PAYMENT_RECEIVE: "account_balance_wallet",
        AI_CHAT: "smart_toy",
        DATA_EXPORT: "download",
        SUBSCRIPTION_CHANGE: "swap_horiz",
        PASSWORD_CHANGE: "lock",
        APP_OPEN: "smartphone",
        REPORT_VIEW: "bar_chart",
    };
    return map[action] || "history";
}

export default function ActivityLogPage() {
    const t = useTranslations("shop.activityLog");
    const locale = typeof window !== "undefined"
        ? (document.cookie.includes("NEXT_LOCALE=bn") ? "bn" : "en")
        : "en";

    const [activities, setActivities] = useState<UserActivitySummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const loadActivities = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await getActivityLog({
                page,
                size: 20,
            });
            setActivities(data);
            setHasMore(data.length >= 20);
        } catch {
            setError(t("loadError"));
        } finally {
            setIsLoading(false);
        }
    }, [page, t]);

    useEffect(() => {
        loadActivities();
    }, [loadActivities]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <header>
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-secondary">
                    {t("label")}
                </p>
                <h1 className="mt-2 text-4xl font-black tracking-tight text-primary">
                    {t("title")}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-on-surface-variant">
                    {t("subtitle")}
                </p>
            </header>

            {/* Error */}
            {error && (
                <div className="rounded-2xl bg-error-container p-6 text-center text-on-error-container">
                    {error}
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <span className="material-symbols-outlined animate-spin text-primary text-3xl">
                        progress_activity
                    </span>
                </div>
            )}

            {/* Activity list */}
            {!isLoading && !error && (
                <>
                    {activities.length === 0 ? (
                        <div className="rounded-2xl bg-surface-container p-12 text-center">
                            <span className="material-symbols-outlined mb-3 text-5xl text-on-surface-variant">
                                history
                            </span>
                            <p className="text-sm text-on-surface-variant">
                                {t("noActivity")}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activities.map((activity, index) => (
                                <div
                                    key={`${activity.userId}-${index}`}
                                    className="flex items-start gap-4 rounded-2xl bg-surface-container-lowest p-4 transition hover:bg-surface-container-low"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                        <span className="material-symbols-outlined text-lg text-primary">
                                            {getActionIcon(activity.lastAction)}
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-on-surface">
                                            {activity.lastAction?.replace(/_/g, " ")}
                                        </p>
                                        <p className="mt-0.5 text-xs text-on-surface-variant">
                                            {activity.userName}
                                            {activity.actionCount > 1 && (
                                                <span className="ml-2 rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-bold">
                                                    ×{activity.actionCount}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-xs text-on-surface-variant">
                                            {activity.lastActivity
                                                ? formatDate(activity.lastActivity, locale)
                                                : "—"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {activities.length > 0 && (
                        <div className="flex items-center justify-center gap-4">
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="rounded-xl bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-highest disabled:opacity-50"
                            >
                                {t("previous")}
                            </button>
                            <span className="text-sm text-on-surface-variant">
                                {t("page", { number: page + 1 })}
                            </span>
                            <button
                                type="button"
                                onClick={() => setPage((p) => p + 1)}
                                disabled={!hasMore}
                                className="rounded-xl bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-highest disabled:opacity-50"
                            >
                                {t("next")}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
