"use client";

import { useState, useEffect, useCallback } from "react";
import {
    getSystemStats,
    getReferralStats,
    getAuditLogSummary,
    adminListTickets,
    getAdminNotifications,
    getDashboardRevenueTrend,
    getDashboardUserGrowth,
    getDashboardAiTokenStats,
} from "@/lib/adminApi";
import { getPaymentSummary } from "@/lib/paymentAdminApi";
import type {
    SystemStats,
    ReferralStats,
    AuditLogSummary,
    AdminNotification,
    RevenueTrendData,
    UserGrowthData,
    AiTokenStats,
} from "@/types/admin";
import type { PaymentSummary } from "@/types/paymentAdmin";
import type { SupportTicket } from "@/types/support";

/**
 * Per-section loading states for progressive rendering.
 * Each section renders independently — one failure doesn't block others.
 */
export interface LoadingStates {
    kpis: boolean;
    revenue: boolean;
    subscription: boolean;
    payments: boolean;
    tickets: boolean;
    aiTokens: boolean;
    activity: boolean;
    userGrowth: boolean;
}

/**
 * Aggregated state for all dashboard data sources.
 * Each field is null when its API call hasn't completed yet,
 * allowing individual sections to show skeletons independently.
 */
export interface DashboardData {
    // Core stats (always available)
    stats: SystemStats | null;
    referralStats: ReferralStats | null;
    paymentSummary: PaymentSummary | null;
    recentTickets: SupportTicket[];
    notifications: AdminNotification[];

    // Only available for SUPER_ADMIN
    auditSummary: AuditLogSummary | null;

    // Dashboard analytics (from new endpoints)
    revenueTrend: RevenueTrendData | null;
    userGrowth: UserGrowthData | null;
    aiTokenStats: AiTokenStats | null;

    // Per-section loading flags
    loadingStates: LoadingStates;

    // Global error (only for critical failures like /admin/stats)
    error: string | null;
}

/** Time range options for chart filtering */
export type TimeRange = "7D" | "30D" | "90D" | "1Y";

/**
 * Centralized data-fetching hook for the admin dashboard.
 * Fires all API calls in parallel via Promise.allSettled so one
 * failing endpoint doesn't block the rest. Each section tracks
 * its own loading state for progressive skeleton rendering.
 */
export function useDashboardData(): DashboardData & {
    refresh: () => void;
    timeRange: TimeRange;
    setTimeRange: (range: TimeRange) => void;
} {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
    const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
    const [auditSummary, setAuditSummary] = useState<AuditLogSummary | null>(null);
    const [recentTickets, setRecentTickets] = useState<SupportTicket[]>([]);
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [revenueTrend, setRevenueTrend] = useState<RevenueTrendData | null>(null);
    const [userGrowth, setUserGrowth] = useState<UserGrowthData | null>(null);
    const [aiTokenStats, setAiTokenStats] = useState<AiTokenStats | null>(null);

    const [loadingStates, setLoadingStates] = useState<LoadingStates>({
        kpis: true,
        revenue: true,
        subscription: true,
        payments: true,
        tickets: true,
        aiTokens: true,
        activity: true,
        userGrowth: true,
    });

    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<TimeRange>("30D");

    /** Mark a single section as loaded */
    const markLoaded = useCallback(
        (section: keyof LoadingStates) => {
            setLoadingStates((prev) => ({ ...prev, [section]: false }));
        },
        []
    );

    const fetchAll = useCallback(async (range: TimeRange) => {
        // Reset all loading states
        setLoadingStates({
            kpis: true,
            revenue: true,
            subscription: true,
            payments: true,
            tickets: true,
            aiTokens: true,
            activity: true,
            userGrowth: true,
        });
        setError(null);

        const results = await Promise.allSettled([
            getSystemStats(),                    // 0 — KPIs
            getReferralStats(),                  // 1 — Referral health + KPIs
            getAuditLogSummary(),                // 2 — Audit highlights
            adminListTickets({ page: 0, size: 5 }), // 3 — Recent tickets
            getPaymentSummary(),                 // 4 — Payment pipeline + KPIs
            getAdminNotifications({ size: 10 }), // 5 — Activity feed
            getDashboardRevenueTrend(range),     // 6 — Revenue trend chart
            getDashboardUserGrowth(range),       // 7 — User growth chart
            getDashboardAiTokenStats(range),     // 8 — AI token usage chart
        ]);

        // 0. System stats — critical, powers KPIs + subscription charts
        if (results[0].status === "fulfilled" && results[0].value) {
            setStats(results[0].value);
        } else if (results[0].status === "rejected") {
            setError("Failed to load system stats. Please try again.");
        }
        markLoaded("kpis");
        markLoaded("subscription");

        // 1. Referral stats — powers referral health donut + KPI
        if (results[1].status === "fulfilled" && results[1].value) {
            setReferralStats(results[1].value);
        }
        markLoaded("kpis");

        // 2. Audit summary — powers audit highlights table
        if (results[2].status === "fulfilled" && results[2].value) {
            setAuditSummary(results[2].value);
        }
        markLoaded("activity");

        // 3. Recent tickets — for the activity feed
        if (results[3].status === "fulfilled" && results[3].value) {
            setRecentTickets(results[3].value.content ?? []);
        }
        markLoaded("tickets");

        // 4. Payment summary — powers payment pipeline chart + KPIs
        if (results[4].status === "fulfilled" && results[4].value) {
            setPaymentSummary(results[4].value);
        }
        markLoaded("payments");
        markLoaded("kpis");

        // 5. Admin notifications — for the activity feed
        if (results[5].status === "fulfilled" && results[5].value) {
            setNotifications(
                (results[5].value as { content: AdminNotification[] }).content ?? []
            );
        }
        markLoaded("activity");

        // 6. Revenue trend — powers revenue trend area chart
        if (results[6].status === "fulfilled" && results[6].value) {
            setRevenueTrend(results[6].value);
        }
        markLoaded("revenue");

        // 7. User growth — powers user growth line chart
        if (results[7].status === "fulfilled" && results[7].value) {
            setUserGrowth(results[7].value);
        }
        markLoaded("userGrowth");

        // 8. AI token stats — powers AI token usage bar chart
        if (results[8].status === "fulfilled" && results[8].value) {
            setAiTokenStats(results[8].value);
        }
        markLoaded("aiTokens");
    }, [markLoaded]);

    // Re-fetch when timeRange changes
    useEffect(() => {
        fetchAll(timeRange);
    }, [fetchAll, timeRange]);

    return {
        stats,
        referralStats,
        paymentSummary,
        recentTickets,
        notifications,
        auditSummary,
        revenueTrend,
        userGrowth,
        aiTokenStats,
        loadingStates,
        error,
        refresh: () => fetchAll(timeRange),
        timeRange,
        setTimeRange,
    };
}