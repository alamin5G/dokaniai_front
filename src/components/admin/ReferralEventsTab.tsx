"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import * as adminApi from "@/lib/adminApi";
import type { ReferralEvent, ReferralStats, PagedReferralEvents, ReferralEventsParams } from "@/types/admin";

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        PENDING: "bg-amber-100 text-amber-800",
        GRANTED: "bg-green-100 text-green-800",
        REVOKED: "bg-red-100 text-red-800",
        EXPIRED: "bg-gray-100 text-gray-600",
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? "bg-gray-100 text-gray-600"}`}>
            {status}
        </span>
    );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
    return (
        <div className="rounded-2xl border border-outline-variant/30 bg-surface p-4 shadow-sm">
            <p className="text-xs font-medium text-on-surface-variant">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${accent ?? "text-on-surface"}`}>{value}</p>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ReferralEventsTab() {
    const t = useTranslations("admin.referralEvents");

    const [stats, setStats] = useState<ReferralStats | null>(null);
    const [events, setEvents] = useState<PagedReferralEvents | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [page, setPage] = useState(0);
    const [revokingId, setRevokingId] = useState<string | null>(null);
    const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const pageSize = 15;

    // Load stats
    const loadStats = useCallback(async () => {
        try {
            const s = await adminApi.getReferralStats();
            setStats(s);
        } catch {
            // silent
        }
    }, []);

    // Load events
    const loadEvents = useCallback(async () => {
        setLoading(true);
        try {
            const params: ReferralEventsParams = { page, size: pageSize };
            if (statusFilter) params.status = statusFilter;
            const data = await adminApi.getReferralEvents(params);
            setEvents(data);
        } catch {
            setNotice({ type: "error", message: t("messages.loadFailed") });
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, t]);

    useEffect(() => {
        void loadStats();
    }, [loadStats]);

    useEffect(() => {
        void loadEvents();
    }, [loadEvents]);

    // Reset page when filter changes
    useEffect(() => {
        setPage(0);
    }, [statusFilter]);

    const handleRevoke = async (eventId: string) => {
        if (!confirm(t("messages.confirmRevoke"))) return;
        setRevokingId(eventId);
        setNotice(null);
        try {
            await adminApi.revokeReferralEvent(eventId);
            setNotice({ type: "success", message: t("messages.revoked") });
            await Promise.all([loadStats(), loadEvents()]);
        } catch {
            setNotice({ type: "error", message: t("messages.revokeFailed") });
        } finally {
            setRevokingId(null);
        }
    };

    const totalPages = events?.totalPages ?? 0;

    return (
        <div className="space-y-6">
            {/* Notice */}
            {notice && (
                <div className={`rounded-xl px-4 py-3 text-sm font-medium ${notice.type === "success"
                        ? "bg-green-50 text-green-800 border border-green-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}>
                    {notice.message}
                </div>
            )}

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    <StatCard label={t("stats.total")} value={stats.totalEvents} />
                    <StatCard label={t("stats.pending")} value={stats.pendingCount} accent="text-amber-600" />
                    <StatCard label={t("stats.granted")} value={stats.grantedCount} accent="text-green-600" />
                    <StatCard label={t("stats.revoked")} value={stats.revokedCount} accent="text-red-600" />
                    <StatCard label={t("stats.expired")} value={stats.expiredCount} accent="text-gray-500" />
                    <StatCard label={t("stats.totalReward")} value={stats.totalGrantedRewardValue} />
                </div>
            )}

            {/* Filter */}
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-on-surface-variant">{t("filter.status")}:</span>
                {["", "PENDING", "GRANTED", "REVOKED", "EXPIRED"].map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${statusFilter === s
                                ? "bg-primary text-on-primary shadow-sm"
                                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                            }`}
                    >
                        {s || t("filter.all")}
                    </button>
                ))}
            </div>

            {/* Events Table */}
            <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-outline-variant/30 bg-surface-container-low">
                                <th className="px-4 py-3 text-left font-medium text-on-surface-variant">{t("table.code")}</th>
                                <th className="px-4 py-3 text-left font-medium text-on-surface-variant">{t("table.referrer")}</th>
                                <th className="px-4 py-3 text-left font-medium text-on-surface-variant">{t("table.referred")}</th>
                                <th className="px-4 py-3 text-left font-medium text-on-surface-variant">{t("table.reward")}</th>
                                <th className="px-4 py-3 text-left font-medium text-on-surface-variant">{t("table.status")}</th>
                                <th className="px-4 py-3 text-left font-medium text-on-surface-variant">{t("table.date")}</th>
                                <th className="px-4 py-3 text-left font-medium text-on-surface-variant">{t("table.actions")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">
                                        {t("table.loading")}
                                    </td>
                                </tr>
                            ) : !events?.content?.length ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">
                                        {t("table.empty")}
                                    </td>
                                </tr>
                            ) : (
                                events.content.map((event: ReferralEvent) => (
                                    <tr key={event.id} className="hover:bg-surface-container-low/50 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs">{event.referralCodeUsed}</td>
                                        <td className="px-4 py-3 font-mono text-xs">
                                            {event.referrerUserId.slice(0, 8)}…
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs">
                                            {event.referredUserId.slice(0, 8)}…
                                        </td>
                                        <td className="px-4 py-3">
                                            {event.rewardType === "FREE_DAYS"
                                                ? `${event.rewardValue} ${t("table.freeDays")}`
                                                : `${event.rewardValue}%`}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={event.rewardStatus} />
                                        </td>
                                        <td className="px-4 py-3 text-xs text-on-surface-variant">
                                            {new Date(event.createdAt).toLocaleDateString(undefined, {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </td>
                                        <td className="px-4 py-3">
                                            {event.rewardStatus === "PENDING" && (
                                                <button
                                                    onClick={() => handleRevoke(event.id)}
                                                    disabled={revokingId === event.id}
                                                    className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                                >
                                                    {revokingId === event.id ? t("table.revoking") : t("table.revoke")}
                                                </button>
                                            )}
                                            {event.rewardStatus === "GRANTED" && (
                                                <button
                                                    onClick={() => handleRevoke(event.id)}
                                                    disabled={revokingId === event.id}
                                                    className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                                >
                                                    {revokingId === event.id ? t("table.revoking") : t("table.revoke")}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-outline-variant/30 px-4 py-3">
                        <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="rounded-lg px-3 py-1.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-40"
                        >
                            ← {t("pagination.prev")}
                        </button>
                        <span className="text-sm text-on-surface-variant">
                            {t("pagination.page", { current: page + 1, total: totalPages })}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="rounded-lg px-3 py-1.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-40"
                        >
                            {t("pagination.next")} →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
