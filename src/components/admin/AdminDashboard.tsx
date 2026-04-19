"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import * as adminApi from "@/lib/adminApi";
import type { SystemStats, ReferralStats } from "@/types/admin";
import type { SupportTicket } from "@/types/support";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const MOCK_REVENUE_DATA = [
    { week: "Week 1", revenue: 280000 },
    { week: "Week 2", revenue: 350000 },
    { week: "Week 3", revenue: 310000 },
    { week: "Week 4", revenue: 450000 },
];

function formatTaka(n: number): string {
    if (n >= 100000) return `৳${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `৳${(n / 1000).toFixed(1)}K`;
    return `৳${n}`;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

const TICKET_ICONS: Record<string, string> = {
    BILLING: "payments",
    TECHNICAL: "build",
    ACCOUNT: "person",
    GENERAL: "help",
    CATEGORY_REQUEST: "category",
    FEATURE_REQUEST: "lightbulb",
    OTHER: "more_horiz",
};

export default function AdminDashboard() {
    const t = useTranslations("admin.dashboardV2");

    const [stats, setStats] = useState<SystemStats | null>(null);
    const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
    const [recentTickets, setRecentTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            adminApi.getSystemStats().catch(() => null),
            adminApi.getReferralStats().catch(() => null),
            adminApi.adminListTickets({ page: 0, size: 4 }).catch(() => ({ content: [] })),
        ]).then(([s, r, tkts]) => {
            setStats(s);
            setReferralStats(r);
            setRecentTickets((tkts as { content: SupportTicket[] }).content || []);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-surface-container-high border-t-primary" />
            </div>
        );
    }

    const sub = stats?.subscriptionStats as Record<string, number> | null;
    const tk = stats?.ticketStats as Record<string, number> | null;
    const totalActiveSubs = sub ? (sub.totalActive || 0) : 0;
    const pendingVerifications = tk ? (tk.totalOpen || 0) + (tk.unassignedCount || 0) : 0;
    const referralPayout = referralStats?.totalGrantedRewardValue || 0;

    return (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-wrap justify-between items-end gap-4">
                <div className="flex flex-col gap-2">
                    <h2 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight">
                        {t("title")}
                    </h2>
                    <p className="text-on-surface-variant text-base">{t("subtitle")}</p>
                </div>
                <button className="bg-gradient-to-r from-primary to-primary-container text-on-primary text-sm font-bold py-3 px-6 rounded-full flex items-center gap-2 hover:opacity-90 transition-opacity shadow-[0_8px_16px_rgba(0,55,39,0.15)]">
                    <span className="material-symbols-outlined text-lg">download</span>
                    {t("generateReport")}
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <MetricCard
                    icon="payments"
                    iconBg="bg-primary-fixed/20 text-primary"
                    label={t("totalMrr")}
                    value={stats ? formatTaka(totalActiveSubs * 500) : "—"}
                    badge="+12%"
                    badgeBg="bg-surface-container text-on-surface-variant"
                />
                <MetricCard
                    icon="storefront"
                    iconBg="bg-secondary-fixed/50 text-secondary"
                    label={t("activeUsers")}
                    value={stats ? stats.activeUsers.toLocaleString() : "—"}
                    badge={stats ? `${Math.round((stats.activeUsers / Math.max(stats.totalUsers, 1)) * 100)}%` : ""}
                    badgeBg="bg-surface-container text-on-surface-variant"
                />
                <MetricCard
                    icon="pending_actions"
                    iconBg="bg-error-container text-on-error-container"
                    label={t("pendingVerifications")}
                    value={pendingVerifications.toLocaleString()}
                    badge={t("actionNeeded")}
                    badgeBg="bg-error-container text-on-error-container"
                    highlight
                />
                <MetricCard
                    icon="group_add"
                    iconBg="bg-tertiary-fixed/50 text-tertiary"
                    label={t("referralPayouts")}
                    value={formatTaka(referralPayout)}
                    badge={t("stable")}
                    badgeBg="bg-surface-container text-on-surface-variant"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-[0_20px_40px_rgba(24,28,26,0.02)]">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                        <div className="flex flex-col gap-1">
                            <h3 className="font-headline text-xl font-bold text-on-surface">{t("revenueGrowth")}</h3>
                            <p className="text-on-surface-variant text-sm">{t("revenueSubtitle")}</p>
                        </div>
                        <div className="flex gap-1 bg-surface-container p-1 rounded-xl">
                            <button className="px-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface text-sm font-bold shadow-sm">30D</button>
                            <button className="px-4 py-2 rounded-lg text-on-surface-variant text-sm font-medium hover:bg-surface-container-lowest/50 transition-colors">90D</button>
                            <button className="px-4 py-2 rounded-lg text-on-surface-variant text-sm font-medium hover:bg-surface-container-lowest/50 transition-colors">1Y</button>
                        </div>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={MOCK_REVENUE_DATA} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#003727" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#003727" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#bfc9c2" strokeOpacity={0.3} />
                                <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#707974" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#707974" tickFormatter={(v: number) => formatTaka(v)} />
                                <Tooltip formatter={(value) => [formatTaka(Number(value)), t("revenue")]} />
                                <Area type="monotone" dataKey="revenue" stroke="#003727" fill="url(#colorRevenue)" strokeWidth={3} dot={{ r: 4, fill: "#ffffff", stroke: "#003727", strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-[0_20px_40px_rgba(24,28,26,0.02)]">
                    <div className="flex justify-between items-center">
                        <h3 className="font-headline text-lg font-bold text-on-surface">{t("recentSupport")}</h3>
                        <a href="/admin/support" className="text-primary text-sm font-bold hover:underline">{t("viewAll")}</a>
                    </div>
                    <div className="flex flex-col gap-5">
                        {recentTickets.length === 0 ? (
                            <p className="text-on-surface-variant text-sm py-8 text-center">{t("noTickets")}</p>
                        ) : (
                            recentTickets.map((ticket) => (
                                <a key={ticket.id} href={`/admin/support`} className="flex gap-4 items-start group cursor-pointer">
                                    <div className="size-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                                        <span className="material-symbols-outlined text-xl">
                                            {TICKET_ICONS[ticket.category] || "help"}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <div className="flex justify-between items-baseline gap-2">
                                            <h4 className="text-on-surface font-semibold text-sm line-clamp-1">{ticket.subject}</h4>
                                            <span className="text-xs text-on-surface-variant shrink-0">{timeAgo(ticket.createdAt)}</span>
                                        </div>
                                        <p className="text-sm text-on-surface-variant line-clamp-2">{ticket.body}</p>
                                    </div>
                                </a>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="fixed bottom-8 right-8 z-50">
                <button className="group flex items-center gap-3 bg-surface-container-lowest/80 backdrop-blur-xl p-3 pr-6 rounded-full shadow-[0_30px_60px_rgba(0,55,39,0.15)] hover:shadow-[0_40px_80px_rgba(0,55,39,0.2)] transition-all duration-300 transform hover:-translate-y-1">
                    <div className="size-12 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary shadow-inner">
                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
                    </div>
                    <div className="flex flex-col items-start pr-2">
                        <span className="text-xs font-bold text-primary tracking-wider uppercase">{t("assistant")}</span>
                        <span className="font-headline text-sm font-extrabold text-on-surface">{t("speakToAi")}</span>
                    </div>
                </button>
            </div>
        </div>
    );
}

function MetricCard({
    icon,
    iconBg,
    label,
    value,
    badge,
    badgeBg,
    highlight,
}: {
    icon: string;
    iconBg: string;
    label: string;
    value: string;
    badge?: string;
    badgeBg?: string;
    highlight?: boolean;
}) {
    return (
        <div className={`bg-surface-container-lowest rounded-2xl p-6 flex flex-col gap-4 shadow-[0_20px_40px_rgba(24,28,26,0.02)] relative overflow-hidden ${highlight ? "" : ""}`}>
            {highlight && <div className="absolute inset-0 bg-gradient-to-br from-error-container/20 to-transparent pointer-events-none" />}
            <div className="flex justify-between items-start relative z-10">
                <div className={`size-12 rounded-xl ${iconBg} flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                </div>
                {badge && (
                    <span className={`${badgeBg} px-2 py-1 rounded-md text-xs font-bold`}>{badge}</span>
                )}
            </div>
            <div className="flex flex-col gap-1 relative z-10">
                <p className="text-on-surface-variant text-sm font-medium">{label}</p>
                <p className="font-headline text-3xl font-bold text-on-surface">{value}</p>
            </div>
        </div>
    );
}
