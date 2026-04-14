"use client";

import { useLocale, useTranslations } from "next-intl";
import type { SaleReturn, ReturnStatsResponse } from "@/types/saleReturn";
import type { ReturnType } from "@/types/saleReturn";
import { getReturnStats, listSaleReturns } from "@/lib/saleReturnApi";
import { useCallback, useEffect, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

const RETURN_TYPES: ReturnType[] = ["FULL", "PARTIAL", "DEFECTIVE", "EXCHANGE"];

// ---------------------------------------------------------------------------
// Component — embedded as a tab in ReportWorkspace
// ---------------------------------------------------------------------------

export default function ReturnReportTab({
    businessId,
}: {
    businessId: string;
}) {
    const t = useTranslations("shop.sales.returns");
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
    const [returns, setReturns] = useState<SaleReturn[]>([]);
    const [stats, setStats] = useState<ReturnStatsResponse | null>(null);

    // ---- UI state ----
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    // ---- Filters ----
    const [filterType, setFilterType] = useState<ReturnType | "">("");

    // ---- Load returns ----
    const loadReturns = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await listSaleReturns(businessId, {
                page,
                size: 15,
            });
            // Client-side filter by type if selected (backend doesn't have type filter)
            const filtered = filterType
                ? response.content.filter((r) => r.returnType === filterType)
                : response.content;
            setReturns(filtered);
            setTotalPages(Math.max(response.totalPages, 1));
            setTotalElements(response.totalElements);
        } catch {
            setError(t("messages.error"));
        } finally {
            setIsLoading(false);
        }
    }, [businessId, page, t]);

    // ---- Load stats ----
    const loadStats = useCallback(async () => {
        try {
            const data = await getReturnStats(businessId);
            setStats(data);
        } catch {
            // silent — stats are supplementary
        }
    }, [businessId]);

    useEffect(() => {
        void loadReturns();
    }, [loadReturns]);

    useEffect(() => {
        void loadStats();
    }, [loadStats]);

    // ---- Reset page when filter changes ----
    useEffect(() => {
        setPage(0);
    }, [filterType]);

    // ---- Label helpers ----
    function typeLabel(type: string): string {
        const key = `returnType.${type}` as Parameters<typeof t>[0];
        try {
            return t(key);
        } catch {
            return type;
        }
    }

    function statusLabel(status: string): string {
        const key = `status.${status}` as Parameters<typeof t>[0];
        try {
            return t(key);
        } catch {
            return status;
        }
    }

    // ---- Pagination helpers ----
    const pageStart = totalElements === 0 ? 0 : page * 15 + 1;
    const pageEnd = Math.min((page + 1) * 15, totalElements);

    // ---- Render ----
    return (
        <div className="space-y-6">
            {/* ---- Stats Cards ---- */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                        {t("stats.totalReturns")}
                    </p>
                    <p className="text-2xl font-bold text-on-surface mt-1">
                        {stats?.totalReturns ?? 0}
                    </p>
                </div>
                <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                        {t("stats.totalRefund")}
                    </p>
                    <p className="text-2xl font-bold text-on-surface mt-1">
                        ৳{formatMoney(stats?.totalRefundAmount)}
                    </p>
                </div>
                <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                        {t("stats.stockRestored")}
                    </p>
                    <p className="text-2xl font-bold text-on-surface mt-1">
                        {formatMoney(stats?.totalStockRestored)}
                    </p>
                </div>
            </div>

            {/* ---- Secondary stats ---- */}
            {stats && (
                <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-xl bg-surface-container px-4 py-3 text-center">
                        <p className="text-lg font-bold text-primary">{stats.fullReturns}</p>
                        <p className="text-xs text-on-surface-variant">{t("stats.fullReturns")}</p>
                    </div>
                    <div className="rounded-xl bg-surface-container px-4 py-3 text-center">
                        <p className="text-lg font-bold text-secondary">{stats.partialReturns}</p>
                        <p className="text-xs text-on-surface-variant">{t("stats.partialReturns")}</p>
                    </div>
                    <div className="rounded-xl bg-surface-container px-4 py-3 text-center">
                        <p className="text-lg font-bold text-error">{stats.defectiveReturns}</p>
                        <p className="text-xs text-on-surface-variant">{t("stats.defectiveReturns")}</p>
                    </div>
                </div>
            )}

            {/* ---- Filters + Table ---- */}
            <div className="rounded-2xl bg-surface-container-lowest shadow-sm overflow-hidden">
                {/* Type filter chips */}
                <div className="p-6 flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setFilterType("")}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${filterType === ""
                                ? "bg-primary text-on-primary"
                                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                            }`}
                    >
                        All
                    </button>
                    {RETURN_TYPES.map((rt) => (
                        <button
                            key={rt}
                            onClick={() => setFilterType(rt)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${filterType === rt
                                    ? "bg-primary text-on-primary"
                                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                                }`}
                        >
                            {typeLabel(rt)}
                        </button>
                    ))}
                </div>

                {/* ---- Returns Table ---- */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-surface-container text-on-surface-variant text-sm font-bold">
                            <tr>
                                <th className="px-6 py-4">{t("table.date")}</th>
                                <th className="px-6 py-4">{t("table.type")}</th>
                                <th className="px-6 py-4">{t("table.quantity")}</th>
                                <th className="px-6 py-4">{t("table.refund")}</th>
                                <th className="px-6 py-4">{t("table.status")}</th>
                                <th className="px-6 py-4">{t("table.stockRestored")}</th>
                                <th className="px-6 py-4">{t("table.reason")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant">
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
                                    <td colSpan={7} className="px-6 py-12 text-center text-error">
                                        <p className="text-sm">{error}</p>
                                    </td>
                                </tr>
                            ) : returns.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant">
                                        <p className="text-sm">{t("pagination.noResults")}</p>
                                    </td>
                                </tr>
                            ) : (
                                returns.map((ret) => (
                                    <tr
                                        key={ret.id}
                                        className="hover:bg-surface-container-low transition-colors"
                                    >
                                        <td className="px-6 py-4 text-sm text-on-surface">
                                            {formatDate(ret.returnDate)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${ret.returnType === "FULL"
                                                    ? "bg-primary/10 text-primary"
                                                    : ret.returnType === "DEFECTIVE"
                                                        ? "bg-error/10 text-error"
                                                        : "bg-secondary/10 text-secondary"
                                                }`}>
                                                {typeLabel(ret.returnType)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-on-surface">
                                            {ret.quantity}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-on-surface">
                                            ৳{formatMoney(ret.refundAmount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-tertiary/10 text-tertiary">
                                                {statusLabel(ret.refundStatus)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant">
                                            {ret.stockRestored ? t("table.yes") : t("table.no")}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant max-w-[200px] truncate">
                                            {ret.reason || "—"}
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
