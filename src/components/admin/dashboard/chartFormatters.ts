/**
 * Shared formatting utilities for admin dashboard charts.
 * Centralized to ensure consistent number, currency, and time formatting
 * across all chart tooltips, labels, and KPI cards.
 */

/** Format a number as Bangladeshi Taka with shorthand (e.g., ৳12.5K, ৳1.2M) */
export function formatTaka(value: number): string {
    if (value >= 1_000_000) {
        return `৳${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
        return `৳${(value / 1_000).toFixed(1)}K`;
    }
    return `৳${value.toLocaleString('en-BD')}`;
}

/** Format a number as Bangladeshi Taka with full digits (e.g., ৳12,500) */
export function formatTakaFull(value: number): string {
    return `৳${value.toLocaleString('en-BD')}`;
}

/** Format a large number with shorthand (e.g., 1.2K, 3.5M) */
export function formatCompact(value: number): string {
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
        return `${(value / 1_000).toFixed(1)}K`;
    }
    return value.toLocaleString('en-BD');
}

/** Format a percentage value (e.g., 85.2%) */
export function formatPercent(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
}

/** Convert a date string to relative time (e.g., "5m ago", "2h ago", "3d ago") */
export function formatTimeAgo(dateString: string): string {
    const now = Date.now();
    const then = new Date(dateString).getTime();
    const diffSeconds = Math.floor((now - then) / 1000);

    const MINUTE = 60;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;
    const WEEK = 7 * DAY;

    if (diffSeconds < MINUTE) return 'just now';
    if (diffSeconds < HOUR) return `${Math.floor(diffSeconds / MINUTE)}m ago`;
    if (diffSeconds < DAY) return `${Math.floor(diffSeconds / HOUR)}h ago`;
    if (diffSeconds < WEEK) return `${Math.floor(diffSeconds / DAY)}d ago`;
    return `${Math.floor(diffSeconds / WEEK)}w ago`;
}

/** Format a token count with shorthand (e.g., 45.2K tokens) */
export function formatTokenCount(value: number): string {
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
        return `${(value / 1_000).toFixed(1)}K`;
    }
    return value.toString();
}

/** Recharts tooltip formatter that wraps formatTaka for consistent ৳ display */
export function tooltipTakaFormatter(value: number): string {
    return formatTakaFull(value);
}

/** Recharts tooltip label formatter for date strings */
export function tooltipDateFormatter(dateLabel: string): string {
    return dateLabel;
}