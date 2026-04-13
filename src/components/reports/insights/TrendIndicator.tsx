"use client";

/**
 * Reusable trend indicator showing % change with up/down arrow.
 * Uses MD3 color tokens for positive/negative/neutral states.
 */
export default function TrendIndicator({
    value,
    label,
    invert = false,
}: {
    /** Percentage change value (e.g., 12.5 for +12.5%) */
    value: number | null | undefined;
    /** Optional label text */
    label?: string;
    /** If true, negative is good (e.g., expenses decreased) */
    invert?: boolean;
}) {
    if (value == null) return null;

    const isPositive = invert ? value < 0 : value > 0;
    const isNeutral = value === 0;

    const colorClass = isNeutral
        ? "text-on-surface-variant"
        : isPositive
            ? "text-secondary"
            : "text-error";

    const icon = isNeutral
        ? "trending_flat"
        : isPositive
            ? "trending_up"
            : "trending_down";

    const displayValue = `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;

    return (
        <div className={`flex items-center gap-1 text-sm font-bold ${colorClass}`}>
            <span className="material-symbols-outlined text-base">{icon}</span>
            <span>{displayValue}</span>
            {label && (
                <span className="font-normal text-on-surface-variant ml-1">{label}</span>
            )}
        </div>
    );
}
