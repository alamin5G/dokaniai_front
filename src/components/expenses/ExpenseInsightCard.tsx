"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { ExpenseAlert, ExpenseInsightDTO } from "@/types/expense";
import { getExpenseInsight, getInsightStatus } from "@/lib/expenseApi";

// ---------------------------------------------------------------------------
// Severity badge helper
// ---------------------------------------------------------------------------

function severityColor(severity: string) {
    switch (severity) {
        case "CRITICAL": return "bg-red-100 text-red-700";
        case "HIGH": return "bg-orange-100 text-orange-700";
        case "MEDIUM": return "bg-yellow-100 text-yellow-700";
        default: return "bg-blue-100 text-blue-700";
    }
}

function alertTypeIcon(type: string) {
    switch (type) {
        case "ANOMALY": return "⚡";
        case "CASH_FLOW_RISK": return "💰";
        case "RECURRING_REMINDER": return "🔔";
        case "CATEGORY_SPIKE": return "📈";
        default: return "📊";
    }
}

// ---------------------------------------------------------------------------
// Alert Card
// ---------------------------------------------------------------------------

function AlertCard({ alert }: { alert: ExpenseAlert }) {
    return (
        <div className="rounded-[20px] border border-outline-variant/40 bg-surface-container-lowest p-4 transition hover:shadow-sm">
            <div className="flex items-start gap-3">
                <span className="text-xl">{alertTypeIcon(alert.alertType)}</span>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-on-surface">{alert.title}</h4>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${severityColor(alert.severity)}`}>
                            {alert.severity}
                        </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{alert.message}</p>
                    {alert.recommendation && (
                        <p className="mt-2 text-xs font-medium text-primary">💡 {alert.recommendation}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ExpenseInsightCard({
    businessId,
    alerts,
}: {
    businessId: string;
    alerts: ExpenseAlert[];
}) {
    const t = useTranslations("shop.expenses");
    const [insight, setInsight] = useState<ExpenseInsightDTO | null>(null);
    const [isLoadingInsight, setIsLoadingInsight] = useState(false);
    const [insightError, setInsightError] = useState<string | null>(null);
    const [buttonStatus, setButtonStatus] = useState<ExpenseInsightDTO | null>(null);

    // Fetch button status on mount (no AI call)
    useEffect(() => {
        getInsightStatus(businessId)
            .then(setButtonStatus)
            .catch(() => { /* non-critical */ });
    }, [businessId]);

    const canAnalyze = buttonStatus ? buttonStatus.callsRemaining > 0 && !buttonStatus.cooldownRemaining : true;

    async function handleAnalyze(category?: string, vendorName?: string) {
        setIsLoadingInsight(true);
        setInsightError(null);
        try {
            const result = await getExpenseInsight(businessId, category, vendorName);
            setInsight(result);
            // Refresh button status
            const status = await getInsightStatus(businessId);
            setButtonStatus(status);
        } catch (err) {
            setInsightError(err instanceof Error ? err.message : "Failed to get insight");
        } finally {
            setIsLoadingInsight(false);
        }
    }

    const hasAlerts = alerts.length > 0;
    const healthScore = insight?.healthScore;

    return (
        <section className="space-y-4">
            {/* Alerts Section */}
            {hasAlerts && (
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-primary">{t("insight.alertsTitle")}</h3>
                    {alerts.map((alert, i) => (
                        <AlertCard key={`${alert.alertType}-${i}`} alert={alert} />
                    ))}
                </div>
            )}

            {/* AI Analysis Section */}
            <div className="rounded-[24px] border border-outline-variant/40 bg-surface-container-lowest p-5">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-primary">{t("insight.aiTitle")}</h3>
                    {healthScore != null && (
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${healthScore >= 70 ? "bg-emerald-100 text-emerald-700" :
                            healthScore >= 40 ? "bg-yellow-100 text-yellow-700" :
                                "bg-red-100 text-red-700"
                            }`}>
                            {t("insight.healthScore")}: {healthScore}/100
                        </span>
                    )}
                </div>

                {insight ? (
                    <div className="mt-4 space-y-3">
                        {/* Summary */}
                        <p className="whitespace-pre-line text-xs leading-relaxed text-on-surface-variant">
                            {insight.summary}
                        </p>

                        {/* Findings */}
                        {insight.findings.length > 0 && (
                            <div className="space-y-1">
                                {insight.findings.map((f, i) => (
                                    <p key={i} className="text-xs text-on-surface-variant">🔍 {f}</p>
                                ))}
                            </div>
                        )}

                        {/* Recommendations */}
                        {insight.recommendations.length > 0 && (
                            <div className="rounded-[16px] bg-blue-50 p-3 space-y-2">
                                <p className="text-xs font-semibold text-blue-700">💡 {t("insight.recommendations")}</p>
                                {insight.recommendations.map((rec, i) => (
                                    <p key={i} className="text-xs text-blue-600">
                                        {i + 1}. {(rec as Record<string, string>).action || JSON.stringify(rec)}
                                        {(rec as Record<string, number>).estimated_savings != null &&
                                            ` — ৳${(rec as Record<string, number>).estimated_savings}/মাস`}
                                    </p>
                                ))}
                            </div>
                        )}

                        {/* Prediction */}
                        {insight.prediction && (
                            <p className="text-xs text-on-surface-variant">🔮 {insight.prediction}</p>
                        )}

                        {/* Annual Savings */}
                        {insight.estimatedAnnualSavings && (
                            <div className="rounded-[16px] bg-emerald-50 p-3">
                                <p className="text-xs font-semibold text-emerald-700">
                                    💰 {t("insight.savings")}: {insight.estimatedAnnualSavings}
                                </p>
                            </div>
                        )}

                        {/* Cache badge */}
                        {insight.cached && (
                            <p className="text-[10px] text-on-surface-variant/60">
                                📦 ক্যাশ থেকে আনা হয়েছে
                            </p>
                        )}

                        {/* Cooldown info */}
                        {buttonStatus?.cooldownRemaining && (
                            <p className="text-[10px] text-amber-600">
                                ⏳ পরবর্তী বিশ্লেষণ: {buttonStatus.cooldownRemaining}
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={() => setInsight(null)}
                            className="rounded-full bg-surface-container-high px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary-fixed"
                        >
                            {t("insight.dismiss")}
                        </button>
                    </div>
                ) : (
                    <div className="mt-4 space-y-2">
                        <button
                            type="button"
                            onClick={() => handleAnalyze()}
                            disabled={isLoadingInsight || !canAnalyze}
                            className="w-full rounded-full bg-gradient-to-br from-primary to-primary-container px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isLoadingInsight ? t("insight.loading") :
                                !canAnalyze && buttonStatus?.cooldownRemaining
                                    ? `⏳ ${buttonStatus.cooldownRemaining}`
                                    : !canAnalyze
                                        ? "মাসিক সীমা শেষ"
                                        : t("insight.analyze")}
                        </button>

                        {/* Remaining calls indicator */}
                        {buttonStatus && buttonStatus.callsRemaining > 0 && (
                            <p className="text-center text-[10px] text-on-surface-variant/60">
                                এ মাসে বাকি {buttonStatus.callsRemaining}/2 বিশ্লেষণ
                            </p>
                        )}

                        {insightError && (
                            <p className="mt-2 text-xs text-rose-600">{insightError}</p>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}