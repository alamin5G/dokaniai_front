"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Discount, DiscountSummaryResponse, TypeSummary } from "@/types/discount";
import type { DiscountType } from "@/types/sale";
import { getDiscountStats, listDiscounts } from "@/lib/discountApi";
import { useCallback, useEffect, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

type DatePreset = "last7" | "last30" | "thisMonth" | "lastMonth" | "custom";

function getPresetRange(preset: DatePreset): { startDate: string; endDate: string } {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let start: Date;

    switch (preset) {
        case "last7":
            start = new Date(end);
            start.setDate(start.getDate() - 6);
            start.setHours(0, 0, 0, 0);
            break;
        case "last30":
            start = new Date(end);
            start.setDate(start.getDate() - 29);
            start.setHours(0, 0, 0, 0);
            break;
        case "thisMonth":
            start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            break;
        case "lastMonth": {
            const lm = new Date(now.getFullYear(), now.getMonth(), 0);
            start = new Date(lm.getFullYear(), lm.getMonth(), 1, 0, 0, 0, 0);
            end.setTime(lm.getTime());
            end.setHours(23, 59, 59, 999);
            break;
        }
        case "custom":
            return { startDate: "", endDate: "" };
    }

    return { startDate: start.toISOString(), endDate: end.toISOString() };
}

const DISCOUNT_TYPES: DiscountType[] = ["BULK_PAYMENT", "CASH_PAYMENT", "LOYALTY", "CUSTOM"];

// ---------------------------------------------------------------------------
// Component — embedded as a tab in ReportWorkspace
// ---------------------------------------------------------------------------

export default function DiscountReportTab({
    businessId,
}: {
    businessId: string;
}) {
    const t = useTranslations("shop.discounts");
    const locale = useLocale();
    const loc = resolveLocale(locale);

    const currencyFormatter = new Intl.NumberFormat(loc, { maximumFractionDigits: 0 });

    function formatMoney(value: number | null | undefined): string {
        return currencyFormatter.format(value ?? 0);
    }

    function formatDate(iso: string | null | undefined): string {
        if (!iso) return "—";
        return new Intl.DateTimeFormat(loc, {
            year: "numeric",
            month: "short",
            day: "numeric",
        }).format(new Date(iso));
    }

    // ---- Data state ----
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [summary, setSummary] = useState<DiscountSummaryResponse | null>(null);

    // ---- UI state ----
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    // ---- Filters ----
    const [datePreset, setDatePreset] = useState<DatePreset>("last30");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const [filterType, setFilterType] = useState<DiscountType | "">("");

    // ---- Computed date range ----
    const dateRange = useMemo(() => {
        if (datePreset === "custom") {
            return {
                startDate: customStart ? new Date(customStart).toISOString() : undefined,
                endDate: customEnd ? new Date(customEnd + "T23:59:59").toISOString() : undefined,
            };
        }
        const range = getPresetRange(datePreset);
        return { startDate: range.startDate, endDate: range.endDate };
    }, [datePreset, customStart, customEnd]);

    // ---- Load discounts ----
    const loadDiscounts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await listDiscounts(businessId, {
                page,
                size: 15,
                type: filterType || undefined,
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
            });
            setDiscounts(response.content);
            setTotalPages(Math.max(response.totalPages, 1));
            setTotalElements(response.totalElements);
        } catch {
            setError(t("messages.loadError"));
        } finally {
            setIsLoading(false);
        }
    }, [businessId, page, filterType, dateRange.startDate, dateRange.endDate, t]);

    // ---- Load stats/summary ----
    const loadSummary = useCallback(async () => {
        try {
            const stats = await getDiscountStats(businessId, {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
            });
            setSummary(stats);
        } catch {
            // silent — stats are supplementary
        }
    }, [businessId, dateRange.startDate, dateRange.endDate]);

    useEffect(() => {
        void loadDiscounts();
    }, [loadDiscounts]);

    useEffect(() => {
        void loadSummary();
    }, [loadSummary]);

    // ---- Reset page when filters change ----
    useEffect(() => {
        setPage(0);
    }, [filterType, datePreset, customStart, customEnd]);

    // ---- Type label helper ----
    function typeLabel(type: string): string {
        const key = `type.${type}` as Parameters<typeof t>[0];
        try {
            return t(key);
        } catch {
            return type;
        }
    }

    function methodLabel(method: string): string {
        const key = `method.${method}` as Parameters<typeof t>[0];
        try {
            return t(key);
        } catch {
            return method;
        }
    }

    // ---- Pagination helpers ----
    const pageStart = totalElements === 0 ? 0 : page * 15 + 1;
    const pageEnd = Math.min((page + 1) * 15, totalElements);

    // ---- Render ----
    return (
        <div className="space-y-6">
            {/* ---- Stats Cards ---- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Discounts */}
                <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                        {t("stats.totalDiscounts")}
                    </p>
                    <p className="text-2xl font-bold text-on-surface mt-1">
                        {summary?.totalDiscounts ?? 0}
                    </p>
                    <p className="mt-2 text-xs text-primary font-bold">{t("stats.thisPeriod")}</p>
                </div>

                {/* Total Amount */}
                <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                        {t("stats.totalAmount")}
                    </p>
                    <p className="text-2xl font-bold text-on-surface mt-1">
                        ৳{formatMoney(summary?.totalAmount)}
                    </p>
                    <p className="mt-2 text-xs text-secondary font-bold">{t("stats.thisPeriod")}</p>
                </div>

                {/* Average Discount */}
                <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                        {t("stats.averageDiscount")}
                    </p>
                    <p className="text-2xl font-bold text-on-surface mt-1">
                        ৳{formatMoney(summary?.averageDiscount)}
                    </p>
                    <p className="mt-2 text-xs text-tertiary font-bold">{t("stats.thisPeriod")}</p>
                </div>
            </div>

            {/* ---- Summary by Type ---- */}
            {summary && (summary.byType.length > 0 || summary.byMethod.length > 0) && (
                <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-primary mb-4">
                        {t("summary.title")}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* By Type */}
                        <div>
                            <h4 className="text-sm font-bold text-on-surface-variant mb-2">
                                {t("summary.type")}
                            </h4>
                            <div className="space-y-2">
                                {summary.byType.map((item: TypeSummary) => (
                                    <div
                                        key={item.type}
                                        className="flex items-center justify-between bg-surface-container rounded-xl px-4 py-2"
                                    >
                                        <span className="text-sm text-on-surface">
                                            {typeLabel(item.type)}
                                        </span>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-on-surface-variant">
                                                {item.count}×
                                            </span>
                                            <span className="text-sm font-bold text-primary">
                                                ৳{formatMoney(item.totalAmount)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* By Method */}
                        <div>
                            <h4 className="text-sm font-bold text-on-surface-variant mb-2">
                                {t("summary.byMethod")}
                            </h4>
                            <div className="space-y-2">
                                {summary.byMethod.map((item: TypeSummary) => (
                                    <div
                                        key={item.type}
                                        className="flex items-center justify-between bg-surface-container rounded-xl px-4 py-2"
                                    >
                                        <span className="text-sm text-on-surface">
                                            {methodLabel(item.type)}
                                        </span>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-on-surface-variant">
                                                {item.count}×
                                            </span>
                                            <span className="text-sm font-bold text-secondary">
                                                ৳{formatMoney(item.totalAmount)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ---- Filters ---- */}
            <div className="rounded-2xl bg-surface-container-lowest shadow-sm overflow-hidden">
                <div className="p-6 flex flex-col gap-4">
                    {/* Type filter chips */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => setFilterType("")}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${filterType === ""
                                    ? "bg-primary text-on-primary"
                                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                                }`}
                        >
                            {t("filter.allTypes")}
                        </button>
                        {DISCOUNT_TYPES.map((dt) => (
                            <button
                                key={dt}
                                onClick={() => setFilterType(dt)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${filterType === dt
                                        ? "bg-primary text-on-primary"
                                        : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                                    }`}
                            >
                                {typeLabel(dt)}
                            </button>
                        ))}
                    </div>

                    {/* Date range filter */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {(["last7", "last30", "thisMonth", "lastMonth", "custom"] as DatePreset[]).map((preset) => (
                            <button
                                key={preset}
                                onClick={() => setDatePreset(preset)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${datePreset === preset
                                        ? "bg-secondary text-on-secondary"
                                        : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                                    }`}
                            >
                                {t(`filter.${preset}`)}
                            </button>
                        ))}
                    </div>

                    {/* Custom date range inputs */}
                    {datePreset === "custom" && (
                        <div className="flex items-center gap-3">
                            <label className="text-xs text-on-surface-variant">{t("filter.from")}</label>
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="border border-outline-variant rounded-lg px-3 py-1.5 text-sm bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <label className="text-xs text-on-surface-variant">{t("filter.to")}</label>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="border border-outline-variant rounded-lg px-3 py-1.5 text-sm bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    )}
                </div>

                {/* ---- Discount Table ---- */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-surface-container text-on-surface-variant text-sm font-bold">
                            <tr>
                                <th className="px-6 py-4">{t("table.date")}</th>
                                <th className="px-6 py-4">{t("table.type")}</th>
                                <th className="px-6 py-4">{t("table.method")}</th>
                                <th className="px-6 py-4">{t("table.value")}</th>
                                <th className="px-6 py-4">{t("table.amount")}</th>
                                <th className="px-6 py-4">{t("table.reason")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined animate-spin text-primary">
                                                progress_activity
                                            </span>
                                            <span className="text-sm">Loading...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-error">
                                        <p className="text-sm">{error}</p>
                                    </td>
                                </tr>
                            ) : discounts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">
                                        <p className="text-sm">{t("pagination.noResults")}</p>
                                    </td>
                                </tr>
                            ) : (
                                discounts.map((discount) => (
                                    <tr
                                        key={discount.id}
                                        className="hover:bg-surface-container-low transition-colors"
                                    >
                                        <td className="px-6 py-4 text-sm text-on-surface">
                                            {formatDate(discount.createdAt)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                                                {typeLabel(discount.discountType)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary/10 text-secondary">
                                                {methodLabel(discount.discountMethod)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-on-surface">
                                            {discount.discountMethod === "PERCENTAGE"
                                                ? `${discount.discountValue}%`
                                                : `৳${formatMoney(discount.discountValue)}`}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-on-surface">
                                            ৳{formatMoney(discount.discountAmount)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant">
                                            {discount.reason || t("table.noReason")}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ---- Pagination ---- */}
                <div className="p-6 border-t border-surface-container flex justify-between items-center">
                    <p className="text-sm text-on-surface-variant">
                        {t("pagination.showing", {
                            from: pageStart,
                            to: pageEnd,
                            total: totalElements,
                        })}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="px-4 py-2 rounded-xl text-sm font-bold bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {t("pagination.previous")}
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="px-4 py-2 rounded-xl text-sm font-bold bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {t("pagination.next")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
