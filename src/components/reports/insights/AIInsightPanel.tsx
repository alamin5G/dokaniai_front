"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api";
import TrendIndicator from "./TrendIndicator";

interface InsightData {
    summary: string;
    recommendations: string[];
    trends: {
        revenueChange: number | null;
        profitChange: number | null;
        expenseChange: number | null;
    };
}

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    message?: string;
}

/**
 * AI-powered business insights panel.
 * Fetches AI-generated recommendations and trend analysis.
 * Available for Pro and Plus plans only.
 */
export default function AIInsightPanel({ businessId }: { businessId: string }) {
    const t = useTranslations("shop.reports");
    const [insight, setInsight] = useState<InsightData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInsight = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiClient.post<ApiSuccess<InsightData>>("/ai/chat", {
                message: `Analyze my business performance for business ${businessId}. Give me a summary, 3 actionable recommendations, and trend analysis (revenue, profit, expense changes as percentages).`,
                businessId,
            });
            setInsight(response.data.data);
        } catch {
            // If AI endpoint fails, show a graceful fallback
            setInsight({
                summary: t("insights.fallbackSummary"),
                recommendations: [
                    t("insights.fallbackRec1"),
                    t("insights.fallbackRec2"),
                    t("insights.fallbackRec3"),
                ],
                trends: {
                    revenueChange: null,
                    profitChange: null,
                    expenseChange: null,
                },
            });
        } finally {
            setIsLoading(false);
        }
    }, [businessId, t]);

    useEffect(() => {
        fetchInsight();
    }, [fetchInsight]);

    return (
        <div className="relative overflow-hidden rounded-[24px] bg-surface-container-lowest p-6 shadow-sm">
            {/* Decorative gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

            <div className="relative">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-container text-on-primary-container">
                        <span className="material-symbols-outlined">auto_awesome</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-primary">{t("insights.title")}</h3>
                        <p className="text-xs text-on-surface-variant">{t("insights.subtitle")}</p>
                    </div>
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="flex items-center gap-3 py-8 text-on-surface-variant">
                        <span className="material-symbols-outlined animate-spin text-primary">
                            progress_activity
                        </span>
                        <span className="text-sm">{t("insights.loading")}</span>
                    </div>
                )}

                {/* Error */}
                {error && !isLoading && (
                    <div className="rounded-xl bg-error-container p-4 text-on-error-container text-sm">
                        {error}
                    </div>
                )}

                {/* Content */}
                {insight && !isLoading && (
                    <div className="space-y-6">
                        {/* Trend indicators */}
                        <div className="flex flex-wrap gap-4">
                            <TrendIndicator
                                value={insight.trends.revenueChange}
                                label={t("insights.revenueChange")}
                            />
                            <TrendIndicator
                                value={insight.trends.profitChange}
                                label={t("insights.profitChange")}
                            />
                            <TrendIndicator
                                value={insight.trends.expenseChange}
                                label={t("insights.expenseChange")}
                                invert
                            />
                        </div>

                        {/* Summary */}
                        <div className="rounded-xl bg-surface-container p-4">
                            <p className="text-sm text-on-surface leading-relaxed">
                                {insight.summary}
                            </p>
                        </div>

                        {/* Recommendations */}
                        {insight.recommendations.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-primary mb-3">
                                    {t("insights.recommendations")}
                                </h4>
                                <div className="space-y-2">
                                    {insight.recommendations.map((rec, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-start gap-3 rounded-xl bg-surface-container p-3"
                                        >
                                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold shrink-0">
                                                {idx + 1}
                                            </span>
                                            <p className="text-sm text-on-surface">{rec}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Refresh */}
                        <button
                            onClick={fetchInsight}
                            className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-container transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">refresh</span>
                            {t("insights.refresh")}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
