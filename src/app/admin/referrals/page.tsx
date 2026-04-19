"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import * as adminApi from "@/lib/adminApi";
import * as referralConfigApi from "@/lib/referralConfigApi";
import type { ReferralConfig, ReferralConfigUpdateRequest } from "@/lib/referralConfigApi";
import type { ReferralEvent, ReferralStats, PagedReferralEvents, ReferralEventsParams } from "@/types/admin";

const AVATAR_COLORS = [
    "bg-primary-fixed/30 text-primary",
    "bg-secondary-container/30 text-on-secondary-container",
    "bg-tertiary-fixed/30 text-tertiary",
    "bg-error-container/30 text-on-error-container",
];

function avatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
    return name.split(/[\s_]+/).map(w => w.charAt(0)).join("").toUpperCase().slice(0, 2);
}

function rewardLabel(type: string, value: number): string {
    if (type === "FREE_DAYS") return `${value} Free Days`;
    if (type === "DISCOUNT_PERCENT") return `${value}% Discount`;
    return `${value}`;
}

export default function AdminReferralsPage() {
    const t = useTranslations("admin.referrals");

    const [stats, setStats] = useState<ReferralStats | null>(null);
    const [events, setEvents] = useState<PagedReferralEvents | null>(null);
    const [topReferrers, setTopReferrers] = useState<{ userId: string; count: number }[]>([]);
    const [config, setConfig] = useState<ReferralConfig | null>(null);

    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(0);
    const [revokingId, setRevokingId] = useState<string | null>(null);

    const [showConfig, setShowConfig] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isActive, setIsActive] = useState(true);
    const [referrerRewardType, setReferrerRewardType] = useState("FREE_DAYS");
    const [referrerRewardValue, setReferrerRewardValue] = useState(90);
    const [referredDiscountType, setReferredDiscountType] = useState("DISCOUNT_PERCENT");
    const [referredDiscountValue, setReferredDiscountValue] = useState(50);
    const [maxReferralsPerMonth, setMaxReferralsPerMonth] = useState(10);
    const [configNotice, setConfigNotice] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [s, e, tr, cfg] = await Promise.all([
                adminApi.getReferralStats().catch(() => null),
                adminApi.getReferralEvents({ page, size: 15, status: statusFilter || undefined }).catch(() => null),
                adminApi.getTopReferrers(5).catch(() => []),
                referralConfigApi.getReferralConfig().catch(() => null),
            ]);
            if (s) setStats(s);
            if (e) setEvents(e);
            if (tr) setTopReferrers(tr as { userId: string; count: number }[]);
            if (cfg) {
                setConfig(cfg);
                setIsActive(cfg.isActive);
                setReferrerRewardType(cfg.referrerRewardType);
                setReferrerRewardValue(cfg.referrerRewardValue);
                setReferredDiscountType(cfg.referredDiscountType);
                setReferredDiscountValue(cfg.referredDiscountValue);
                setMaxReferralsPerMonth(cfg.maxReferralsPerMonth ?? 10);
            }
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [page, statusFilter]);

    useEffect(() => { loadData(); }, [loadData]);
    useEffect(() => { setPage(0); }, [statusFilter]);

    async function handleRevoke(eventId: string) {
        if (!confirm(t("confirmRevoke"))) return;
        setRevokingId(eventId);
        try {
            await adminApi.revokeReferralEvent(eventId);
            await loadData();
        } catch { /* silent */ }
        finally { setRevokingId(null); }
    }

    async function handleSaveConfig() {
        setSaving(true);
        setConfigNotice(null);
        try {
            const req: ReferralConfigUpdateRequest = {
                isActive, referrerRewardType, referrerRewardValue,
                referredDiscountType, referredDiscountValue, maxReferralsPerMonth,
            };
            const updated = await referralConfigApi.updateReferralConfig(req);
            setConfig(updated);
            setConfigNotice(t("configSaved"));
        } catch {
            setConfigNotice(t("configError"));
        } finally {
            setSaving(false);
        }
    }

    const conversionRate = stats ? (stats.totalEvents > 0 ? Math.round((stats.grantedCount / stats.totalEvents) * 100) : 0) : 0;

    return (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h2 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface">
                        {t("title")}
                    </h2>
                    <p className="text-on-surface-variant text-base">{t("subtitle")}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowConfig(!showConfig)}
                        className={`px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${showConfig ? "bg-surface-container-high text-on-surface" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high"}`}
                    >
                        <span className="material-symbols-outlined text-lg">settings</span>
                        {t("settings")}
                    </button>
                </div>
            </div>

            {showConfig && (
                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_20px_40px_rgba(24,28,26,0.02)] flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                        <h3 className="font-headline text-lg font-bold text-on-surface">{t("configTitle")}</h3>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <span className="text-sm font-medium text-on-surface-variant">{t("programActive")}</span>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={isActive}
                                onClick={() => setIsActive(!isActive)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? "bg-primary" : "bg-surface-container-highest"}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? "translate-x-6" : "translate-x-1"}`} />
                            </button>
                        </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-on-surface-variant mb-1">{t("referrerRewardType")}</label>
                            <select value={referrerRewardType} onChange={(e) => setReferrerRewardType(e.target.value)}
                                className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none">
                                <option value="FREE_DAYS">{t("freeDays")}</option>
                                <option value="DISCOUNT_PERCENT">{t("discountPercent")}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-on-surface-variant mb-1">{t("rewardValue")}</label>
                            <input type="number" min={1} value={referrerRewardValue} onChange={(e) => setReferrerRewardValue(Number(e.target.value))}
                                className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-on-surface-variant mb-1">{t("referredDiscountType")}</label>
                            <select value={referredDiscountType} onChange={(e) => setReferredDiscountType(e.target.value)}
                                className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none">
                                <option value="DISCOUNT_PERCENT">{t("discountPercent")}</option>
                                <option value="FLAT_AMOUNT">{t("flatAmount")}</option>
                                <option value="FREE_DAYS">{t("freeDays")}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-on-surface-variant mb-1">{t("monthlyCap")}</label>
                            <input type="number" min={1} value={maxReferralsPerMonth} onChange={(e) => setMaxReferralsPerMonth(Number(e.target.value))}
                                className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none" />
                        </div>
                    </div>
                    {configNotice && (
                        <div className="rounded-xl bg-primary-fixed/20 px-4 py-3 text-sm text-primary">{configNotice}</div>
                    )}
                    <div className="flex justify-end">
                        <button onClick={handleSaveConfig} disabled={saving}
                            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-on-primary hover:opacity-90 disabled:opacity-50 transition-opacity">
                            {saving ? "..." : t("saveConfig")}
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface-container-lowest rounded-2xl p-8 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-surface-container-low rounded-full text-primary">
                            <span className="material-symbols-outlined">group_add</span>
                        </div>
                        <span className="text-sm font-medium text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                            {stats ? `${stats.totalEvents} ${t("total")}` : "—"}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-on-surface-variant mb-1">{t("totalReferrals")}</p>
                        <h3 className="text-4xl font-headline font-bold text-on-surface tracking-tight">
                            {stats?.totalEvents?.toLocaleString() ?? "—"}
                        </h3>
                    </div>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-fixed opacity-20 blur-3xl rounded-full translate-x-10 -translate-y-10" />
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="p-3 bg-surface-container-low rounded-full text-primary">
                            <span className="material-symbols-outlined">trending_up</span>
                        </div>
                        <span className="text-sm font-medium text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                            {conversionRate}% {t("rate")}
                        </span>
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-on-surface-variant mb-1">{t("conversions")}</p>
                        <h3 className="text-4xl font-headline font-bold text-on-surface tracking-tight">
                            {stats?.grantedCount?.toLocaleString() ?? "—"}
                        </h3>
                    </div>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl p-8 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-surface-container-low rounded-full text-primary">
                            <span className="material-symbols-outlined">account_balance_wallet</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-on-surface-variant mb-1">{t("totalPayouts")}</p>
                        <h3 className="text-4xl font-headline font-bold text-on-surface tracking-tight">
                            {stats ? `${stats.totalGrantedRewardValue}` : "—"}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl p-8">
                    <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                        <h3 className="text-xl font-headline font-bold text-on-surface">{t("recentActivity")}</h3>
                        <div className="flex gap-2">
                            {["", "PENDING", "GRANTED", "REVOKED", "EXPIRED"].map((s) => (
                                <button key={s} onClick={() => setStatusFilter(s)}
                                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${statusFilter === s
                                        ? "bg-primary text-on-primary shadow-sm"
                                        : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}>
                                    {s || t("all")}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-container-high border-t-primary" />
                        </div>
                    ) : !events?.content?.length ? (
                        <div className="text-center py-12 text-on-surface-variant">{t("noEvents")}</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-sm text-on-surface-variant bg-surface-container-low">
                                        <th className="py-4 px-4 font-medium rounded-l-lg">{t("col.referrer")}</th>
                                        <th className="py-4 px-4 font-medium">{t("col.referred")}</th>
                                        <th className="py-4 px-4 font-medium">{t("col.status")}</th>
                                        <th className="py-4 px-4 font-medium rounded-r-lg">{t("col.reward")}</th>
                                        <th className="py-4 px-4 font-medium">{t("col.actions")}</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm text-on-surface">
                                    {events.content.map((event: ReferralEvent) => (
                                        <tr key={event.id} className="hover:bg-surface-container-low/50 transition-colors">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full ${avatarColor(event.referrerUserId)} flex items-center justify-center text-xs font-bold`}>
                                                        {event.referralCodeUsed.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="font-mono text-xs font-medium">{event.referralCodeUsed}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-on-surface-variant font-mono text-xs">
                                                {event.referredUserId.slice(0, 8)}…
                                            </td>
                                            <td className="py-4 px-4">
                                                <StatusBadge status={event.rewardStatus} />
                                            </td>
                                            <td className="py-4 px-4 font-medium text-on-surface-variant">
                                                {rewardLabel(event.rewardType, event.rewardValue)}
                                            </td>
                                            <td className="py-4 px-4">
                                                {(event.rewardStatus === "PENDING" || event.rewardStatus === "GRANTED") && (
                                                    <button onClick={() => handleRevoke(event.id)} disabled={revokingId === event.id}
                                                        className="rounded-lg px-3 py-1 text-xs font-medium text-error hover:bg-error-container/20 transition-colors disabled:opacity-50">
                                                        {revokingId === event.id ? "..." : t("revoke")}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {events && events.totalPages > 1 && (
                        <div className="flex justify-end mt-4">
                            <div className="flex items-center gap-2">
                                <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50">
                                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                                </button>
                                <span className="text-sm text-on-surface px-4">{page + 1} / {events.totalPages}</span>
                                <button onClick={() => setPage(Math.min(events.totalPages - 1, page + 1))} disabled={page >= events.totalPages - 1}
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50">
                                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-surface-container-lowest rounded-2xl p-8 flex flex-col gap-6">
                    <h3 className="text-xl font-headline font-bold text-on-surface">{t("topReferrers")}</h3>
                    <div className="flex flex-col gap-3">
                        {topReferrers.length === 0 ? (
                            <div className="text-center py-8 text-on-surface-variant text-sm">{t("noReferrers")}</div>
                        ) : (
                            topReferrers.map((ref, idx) => (
                                <div key={ref.userId} className={`flex items-center justify-between p-4 ${idx === 0 ? "bg-surface-container-low rounded-xl" : "hover:bg-surface-container-low/50 rounded-xl"} transition-colors`}>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-lg font-headline font-bold w-6 text-center ${idx === 0 ? "text-primary" : "text-on-surface-variant"}`}>
                                            {idx + 1}
                                        </span>
                                        <div className={`w-10 h-10 rounded-full ${avatarColor(ref.userId)} flex items-center justify-center font-bold text-sm`}>
                                            {ref.userId.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-on-surface text-sm">{ref.userId.slice(0, 8)}…</p>
                                            <p className="text-xs text-on-surface-variant">{ref.count} {t("referrals")}</p>
                                        </div>
                                    </div>
                                    {idx === 0 && <span className="material-symbols-outlined text-primary">emoji_events</span>}
                                </div>
                            ))
                        )}
                    </div>
                    <button className="w-full mt-auto py-3 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-medium text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-lg">share</span>
                        {t("inviteUsers")}
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, string> = {
        PENDING: "bg-surface-container-high text-on-surface-variant",
        GRANTED: "bg-primary-fixed text-on-primary",
        REVOKED: "bg-error-container text-on-error-container",
        EXPIRED: "bg-surface-container text-on-surface-variant",
    };
    return (
        <span className={`${config[status] ?? config.PENDING} px-2 py-1 rounded-full text-xs font-bold tracking-wide`}>
            {status}
        </span>
    );
}
