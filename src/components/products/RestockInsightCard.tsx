"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import AIResponseRenderer from "@/components/ai/AIResponseRenderer";
import type { RestockInsight } from "@/types/restockIntelligence";

interface RestockInsightCardProps {
    insight: RestockInsight;
    onDismiss?: () => void;
}

const insightTypeConfig: Record<string, { icon: string; bg: string; border: string; label: string }> = {
    MILESTONE: { icon: "🏆", bg: "bg-amber-50", border: "border-l-amber-500", label: "মাইলস্টোন" },
    PATTERN: { icon: "📊", bg: "bg-blue-50", border: "border-l-blue-500", label: "প্যাটার্ন" },
    PREDICTION: { icon: "🔮", bg: "bg-purple-50", border: "border-l-purple-500", label: "পূর্বাভাস" },
    NEW_PRODUCT: { icon: "🆕", bg: "bg-green-50", border: "border-l-green-500", label: "নতুন পণ্য" },
    CROSS_SELL: { icon: "💡", bg: "bg-teal-50", border: "border-l-teal-500", label: "ক্রস-সেল" },
};

export default function RestockInsightCard({ insight, onDismiss }: RestockInsightCardProps) {
    const t = useTranslations("shop.products.restockIntelligence");
    const config = insightTypeConfig[insight.insightType] || insightTypeConfig.PATTERN;
    const [expanded, setExpanded] = useState(false);
    const hasLongText = insight.insightText && insight.insightText.length > 150;

    const confidenceColor =
        insight.confidenceScore >= 80
            ? "bg-green-500"
            : insight.confidenceScore >= 50
                ? "bg-amber-500"
                : "bg-red-400";

    return (
        <div
            className={`rounded-[20px] ${config.bg} p-4 border-l-4 ${config.border} transition hover:shadow-md`}
        >
            <div className="flex items-start gap-3">
                <span className="text-2xl">{config.icon}</span>
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-on-surface-variant">
                            {config.label}
                        </span>
                        <span className="text-[10px] text-on-surface-variant">
                            {insight.productName}
                        </span>
                    </div>

                    {/* AI-generated Bengali text — rendered with markdown */}
                    <div className={`text-sm text-on-surface leading-relaxed ${!expanded && hasLongText ? "max-h-20 overflow-hidden relative" : ""}`}>
                        <AIResponseRenderer content={insight.insightText} />
                        {!expanded && hasLongText && (
                            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white/80 to-transparent" />
                        )}
                    </div>
                    {hasLongText && (
                        <button
                            type="button"
                            onClick={() => setExpanded(!expanded)}
                            className="mt-1 text-xs text-primary font-medium hover:underline"
                        >
                            {expanded ? "কম দেখুন" : "আরও দেখুন"}
                        </button>
                    )}

                    {/* Confidence bar */}
                    <div className="mt-3 flex items-center gap-2">
                        <span className="text-[10px] text-on-surface-variant">
                            {t?.("confidence") ?? "নির্ভরতা"}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-surface-variant overflow-hidden">
                            <div
                                className={`h-full rounded-full ${confidenceColor} transition-all`}
                                style={{ width: `${insight.confidenceScore}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-medium text-on-surface-variant">
                            {insight.confidenceScore}%
                        </span>
                    </div>

                    {/* Suggested action */}
                    {insight.suggestedAction && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-on-primary">
                                {insight.suggestedAction === "RESTOCK" && "Restock করুন"}
                                {insight.suggestedAction === "ORDER" && "অর্ডার দিন"}
                                {insight.suggestedAction === "CROSS_SELL" && "ক্রস-সেল দেখুন"}
                                {insight.suggestedAction === "MONITOR" && "পর্যবেক্ষণ করুন"}
                                {!["RESTOCK", "ORDER", "CROSS_SELL", "MONITOR"].includes(insight.suggestedAction) &&
                                    insight.suggestedAction}
                            </span>
                            {onDismiss && (
                                <button
                                    type="button"
                                    onClick={onDismiss}
                                    className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-on-surface-variant hover:bg-surface-variant"
                                >
                                    এড়িয়ে যান
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
