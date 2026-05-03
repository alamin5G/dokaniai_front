/**
 * Shared color palette for all admin dashboard charts.
 * Aligned with Material Design 3 theme tokens used across DokaniAI.
 *
 * Centralized here so chart colors are consistent and maintainable —
 * change a color once, it updates everywhere.
 */

export const CHART_COLORS = {
    // Semantic colors — map to specific data meanings
    primary: '#00503a',
    primaryLight: '#9ef4d0',
    secondary: '#0061a4',
    tertiary: '#74302a',
    success: '#16a34a',
    warning: '#d97706',
    error: '#ba1a1a',
    info: '#2563eb',
    neutral: '#6f7a73',

    // Feature-specific colors — each dashboard section gets a unique hue
    aiTokens: '#7c3aed',
    planRevenue: '#0d9488',
    userGrowth: '#4f46e5',
} as const;

/** Sequential palette for pie/donut segments (plan distribution, referral status, etc.) */
export const SEGMENT_PALETTE = [
    CHART_COLORS.primary,
    CHART_COLORS.secondary,
    CHART_COLORS.tertiary,
    CHART_COLORS.aiTokens,
    CHART_COLORS.planRevenue,
    CHART_COLORS.userGrowth,
    CHART_COLORS.warning,
    CHART_COLORS.info,
] as const;

/** Payment pipeline status → color mapping */
export const PAYMENT_STATUS_COLORS: Record<string, string> = {
    completed: CHART_COLORS.success,
    manualReview: CHART_COLORS.warning,
    rejected: CHART_COLORS.error,
    failed: '#991b1b',
    fraudFlags: '#7f1d1d',
} as const;

/** Ticket status → color mapping */
export const TICKET_STATUS_COLORS: Record<string, string> = {
    open: CHART_COLORS.info,
    inProgress: CHART_COLORS.warning,
    resolved: CHART_COLORS.success,
    closed: CHART_COLORS.neutral,
} as const;

/** Referral status → color mapping */
export const REFERRAL_STATUS_COLORS: Record<string, string> = {
    granted: CHART_COLORS.success,
    pending: CHART_COLORS.warning,
    revoked: CHART_COLORS.error,
    expired: CHART_COLORS.neutral,
} as const;

/** Plan name → color mapping for subscription charts */
export const PLAN_COLORS: Record<string, string> = {
    Trial: '#6b7280',
    Basic: CHART_COLORS.primary,
    Pro: CHART_COLORS.secondary,
    Plus: CHART_COLORS.aiTokens,
} as const;