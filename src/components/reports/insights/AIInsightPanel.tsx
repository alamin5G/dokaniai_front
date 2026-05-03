"use client";

import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import {
    generateWeeklySummary,
    generateExpenseIntelligence,
    generateDueIntelligence,
    generateDailySummary,
    generateCustomerAnalytics,
    generateSalesForecast,
    generateProfitOptimization,
    generateSeasonalTrends,
    generateMorningBriefing,
    generateReturnAnalysis,
} from "@/lib/aiInsightsApi";
import type { AIInsight } from "@/types/aiInsight";

interface InsightCardConfig {
    key: string;
    icon: string;
    generateFn: (businessId: string) => Promise<AIInsight>;
    feature?: "aiInsights" | "customerAnalytics" | "forecasting";
}

const INSIGHT_CARDS: InsightCardConfig[] = [
    {
        key: "morningBriefing",
        icon: "wb_sunny",
        generateFn: generateMorningBriefing,
    },
    {
        key: "dailySummary",
        icon: "today",
        generateFn: generateDailySummary,
    },
    {
        key: "weeklySummary",
        icon: "date_range",
        generateFn: generateWeeklySummary,
    },
    {
        key: "expenseIntelligence",
        icon: "account_balance_wallet",
        generateFn: generateExpenseIntelligence,
    },
    {
        key: "dueIntelligence",
        icon: "payments",
        generateFn: generateDueIntelligence,
    },
    {
        key: "customerAnalytics",
        icon: "group",
        generateFn: generateCustomerAnalytics,
        feature: "customerAnalytics",
    },
    {
        key: "salesForecast",
        icon: "trending_up",
        generateFn: generateSalesForecast,
        feature: "forecasting",
    },
    {
        key: "profitOptimization",
        icon: "monetization_on",
        generateFn: generateProfitOptimization,
        feature: "forecasting",
    },
    {
        key: "seasonalTrends",
        icon: "calendar_month",
        generateFn: generateSeasonalTrends,
        feature: "forecasting",
    },
    {
        key: "returnAnalysis",
        icon: "assignment_return",
        generateFn: generateReturnAnalysis,
    },
];

/**
 * AI-powered business insights panel with advanced insight types.
 * Shows a grid of insight cards that can be generated on demand.
 */
export default function AIInsightPanel({ businessId }: { businessId: string }) {
    const t = useTranslations("shop.reports");
    const [activeInsight, setActiveInsight] = useState<AIInsight | null>(null);
    const [activeKey, setActiveKey] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = useCallback(async (card: InsightCardConfig) => {
        setIsLoading(true);
        setError(null);
        setActiveKey(card.key);
        try {
            const insight = await card.generateFn(businessId);
            setActiveInsight(insight);
        } catch {
            setError(t("insights.generateError"));
            setActiveInsight(null);
        } finally {
            setIsLoading(false);
        }
    }, [businessId, t]);

    return (
        <div className="space-y-6">
            {/* Insight Type Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {INSIGHT_CARDS.map((card) => {
                    const isActive = activeKey === card.key;
                    return (
                        <button
                            key={card.key}
                            onClick={() => handleGenerate(card)}
                            disabled={isLoading}
                            className={`relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-200 border ${isActive
                                    ? "bg-primary-container border-primary/30 shadow-md"
                                    : "bg-surface-container-lowest border-outline-variant/20 hover:bg-surface-container hover:border-primary/30 hover:shadow-sm"
                                } ${isLoading ? "opacity-70 cursor-wait" : "cursor-pointer"}`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${isActive ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
                                    }`}>
                                    <span className="material-symbols-outlined text-lg">{card.icon}</span>
                                </div>
                                <h4 className="text-sm font-bold text-on-surface">
                                    {t(`insights.types.${card.key}.title`)}
                                </h4>
                            </div>
                            <p className="text-xs text-on-surface-variant line-clamp-2">
                                {t(`insights.types.${card.key}.description`)}
                            </p>
                            {isActive && isLoading && (
                                <div className="absolute top-2 right-2">
                                    <span className="material-symbols-outlined animate-spin text-primary text-sm">
                                        progress_activity
                                    </span>
                                </div>
                            )}
                            {isActive && activeInsight && !isLoading && (
                                <div className="absolute top-2 right-2">
                                    <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center gap-3 py-6 text-on-surface-variant">
                    <span className="material-symbols-outlined animate-spin text-primary">
                        progress_activity
                    </span>
                    <span className="text-sm">{t("insights.generating")}</span>
                </div>
            )}

            {/* Error */}
            {error && !isLoading && (
                <div className="rounded-xl bg-error-container p-4 text-on-error-container text-sm">
                    {error}
                </div>
            )}

            {/* Active Insight Display */}
            {activeInsight && !isLoading && (
                <div className="relative overflow-hidden rounded-[24px] bg-surface-container-lowest p-6 shadow-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
                    <div className="relative space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-container text-on-primary-container">
                                    <span className="material-symbols-outlined">auto_awesome</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-primary">
                                        {activeInsight.title}
                                    </h3>
                                    <p className="text-xs text-on-surface-variant">
                                        {new Date(activeInsight.createdAt).toLocaleDateString()} · {" "}
                                        {t(`insights.severity.${activeInsight.severity.toLowerCase()}`)}
                                    </p>
                                </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${activeInsight.severity === "CRITICAL"
                                    ? "bg-error-container text-on-error-container"
                                    : activeInsight.severity === "WARNING"
                                        ? "bg-tertiary-container text-on-tertiary-container"
                                        : "bg-primary-container text-on-primary-container"
                                }`}>
                                {Math.round(activeInsight.confidence * 100)}% {t("insights.confidence")}
                            </div>
                        </div>

                        {/* Message */}
                        <div className="rounded-xl bg-surface-container p-4">
                            <StructuredAiMessage content={activeInsight.message} />
                        </div>

                        {(activeInsight.aiModel || activeInsight.tokenInput || activeInsight.tokenOutput || activeInsight.sourcePeriodStart) && (
                            <div className="grid gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4 text-xs text-on-surface-variant sm:grid-cols-2">
                                {activeInsight.aiModel && (
                                    <div>
                                        <span className="font-semibold text-on-surface">{t("insights.model")}:</span> {activeInsight.aiModel}
                                    </div>
                                )}
                                {(activeInsight.tokenInput || activeInsight.tokenOutput) && (
                                    <div>
                                        <span className="font-semibold text-on-surface">{t("insights.tokens")}:</span> {t("insights.inputTokens")} {activeInsight.tokenInput ?? 0} / {t("insights.outputTokens")} {activeInsight.tokenOutput ?? 0}
                                    </div>
                                )}
                                {activeInsight.sourcePeriodStart && (
                                    <div>
                                        <span className="font-semibold text-on-surface">{t("insights.source")}:</span> {new Date(activeInsight.sourcePeriodStart).toLocaleDateString()} {activeInsight.sourcePeriodEnd ? `- ${new Date(activeInsight.sourcePeriodEnd).toLocaleDateString()}` : ""}
                                    </div>
                                )}
                                {activeInsight.priorityScore != null && (
                                    <div>
                                        <span className="font-semibold text-on-surface">{t("insights.priority")}:</span> {activeInsight.priorityScore}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Suggested */}
                        {activeInsight.actionSuggested && (
                            <div className="rounded-xl bg-secondary-container p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="material-symbols-outlined text-on-secondary-container text-sm">lightbulb</span>
                                    <span className="text-xs font-bold text-on-secondary-container">
                                        {t("insights.actionSuggested")}
                                    </span>
                                </div>
                                <p className="text-sm text-on-secondary-container">{activeInsight.actionSuggested}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function StructuredAiMessage({ content }: { content: string }) {
    const t = useTranslations("shop.reports");
    const parsed = parseAiJson(content);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line">{content}</p>;
    }

    const entries = Object.entries(parsed as Record<string, unknown>);
    const primaryText = pickPrimaryText(parsed as Record<string, unknown>);
    const advice = Array.isArray((parsed as Record<string, unknown>).advice)
        ? ((parsed as Record<string, unknown>).advice as unknown[])
        : [];

    return (
        <div className="space-y-4">
            {primaryText != null && (
                <div className="rounded-lg bg-surface-container-low px-3 py-2">
                    <p className="text-sm leading-relaxed text-on-surface">{String(primaryText)}</p>
                </div>
            )}

            {advice.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-bold uppercase text-on-surface-variant">{t("insights.structuredAdvice")}</p>
                    {advice.map((item, index) => (
                        <StructuredAdviceCard key={index} item={item} />
                    ))}
                </div>
            )}

            {entries
                .filter(([key]) => !["briefing", "summary", "message", "analysis", "advice"].includes(key))
                .map(([key, value]) => (
                    <StructuredValue key={key} label={translateAiKey(key, t)} value={value} />
                ))}
        </div>
    );
}

function StructuredAdviceCard({ item }: { item: unknown }) {
    const t = useTranslations("shop.reports");
    if (!item || typeof item !== "object" || Array.isArray(item)) {
        return <p className="rounded-lg bg-surface-container-low px-3 py-2 text-sm text-on-surface">{String(item)}</p>;
    }
    const record = item as Record<string, unknown>;
    return (
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
                {record.priority != null && (
                    <span className="rounded-full bg-primary-container px-2 py-0.5 text-[11px] font-bold text-on-primary-container">
                        {t("insights.priority")}: {String(record.priority)}
                    </span>
                )}
                {record.risk != null && (
                    <span className="rounded-full bg-tertiary-container px-2 py-0.5 text-[11px] font-bold text-on-tertiary-container">
                        {t("insights.risk")}: {String(record.risk)}
                    </span>
                )}
            </div>
            {record.next_action != null && (
                <p className="text-sm font-medium text-on-surface">{String(record.next_action)}</p>
            )}
            {Object.entries(record)
                .filter(([key]) => !["priority", "risk", "next_action"].includes(key))
                .map(([key, value]) => (
                    <p key={key} className="mt-1 text-xs text-on-surface-variant">
                        <span className="font-semibold">{translateAiKey(key, t)}:</span> {String(value)}
                    </p>
                ))}
        </div>
    );
}

function StructuredValue({ label, value }: { label: string; value: unknown }) {
    if (Array.isArray(value)) {
        return (
            <div>
                <p className="mb-2 text-xs font-bold uppercase text-on-surface-variant">{label}</p>
                <div className="space-y-2">
                    {value.map((item, index) => (
                        <StructuredAdviceCard key={index} item={item} />
                    ))}
                </div>
            </div>
        );
    }
    if (value && typeof value === "object") {
        return (
            <div className="rounded-xl bg-surface-container-low p-3">
                <p className="mb-2 text-xs font-bold uppercase text-on-surface-variant">{label}</p>
                {Object.entries(value as Record<string, unknown>).map(([key, itemValue]) => (
                    <p key={key} className="text-xs text-on-surface-variant">
                        <span className="font-semibold text-on-surface">{key}:</span> {String(itemValue)}
                    </p>
                ))}
            </div>
        );
    }
    return (
        <p className="text-sm text-on-surface">
            <span className="font-semibold">{label}:</span> {String(value)}
        </p>
    );
}

function parseAiJson(content: string): unknown | null {
    const trimmed = content.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("```")) {
        return null;
    }
    const json = trimmed
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim();
    try {
        return JSON.parse(json);
    } catch {
        return null;
    }
}

function pickPrimaryText(record: Record<string, unknown>): unknown {
    return record.briefing ?? record.summary ?? record.message ?? record.analysis ?? null;
}

function translateAiKey(key: string, t: (key: string) => string): string {
    const map: Record<string, string> = {
        briefing: "insights.briefing",
        summary: "insights.summary",
        advice: "insights.structuredAdvice",
        priority: "insights.priority",
        risk: "insights.risk",
        next_action: "insights.nextAction",
        expected_impact: "insights.expectedImpact",
        health_score: "insights.healthScore",
        findings: "insights.findings",
        recommendations: "insights.recommendations",
        prediction: "insights.prediction",
    };
    return map[key] ? t(map[key]) : key.replace(/_/g, " ");
}
