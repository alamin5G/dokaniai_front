"use client";

import { useState } from "react";
import AIResponseRenderer from "@/components/ai/AIResponseRenderer";
import type { AIInsight } from "@/lib/productAnalyticsApi";

interface AIInsightCardProps {
    insight: AIInsight;
    onMarkRead?: (id: string) => void;
    onAct?: (id: string) => void;
    onDismiss?: (id: string) => void;
}

const severityColors: Record<string, { bg: string; border: string; icon: string; glow: string }> = {
    CRITICAL: { bg: "bg-red-50", border: "border-l-red-500", icon: "🔴", glow: "shadow-red-100" },
    WARNING: { bg: "bg-amber-50", border: "border-l-amber-500", icon: "🟡", glow: "shadow-amber-100" },
    INFO: { bg: "bg-blue-50", border: "border-l-blue-500", icon: "🔵", glow: "shadow-blue-100" },
};

const actionLabels: Record<string, string> = {
    restock: "অর্ডার দিন",
    discount: "ডিসকাউন্ট দিন",
    adjust_price: "দাম আপডেট করুন",
    send_reminder: "রিমাইন্ডার পাঠান",
    increase_stock: "স্টক বাড়ান",
};

export default function AIInsightCard({
    insight,
    onMarkRead,
    onAct,
    onDismiss,
}: AIInsightCardProps) {
    const [expanded, setExpanded] = useState(false);
    const severity = severityColors[insight.severity] || severityColors.INFO;
    const hasLongMessage = insight.message && insight.message.length > 120;

    return (
        <div
            className={`rounded-2xl ${severity.bg} p-4 border-l-4 ${severity.border} transition-all duration-200 hover:shadow-md ${severity.glow}`}
        >
            <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">{severity.icon}</span>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface">
                        {insight.title}
                    </p>

                    <div className={`mt-2 text-xs text-on-surface-variant ${!expanded && hasLongMessage ? "line-clamp-2" : ""}`}>
                        <AIResponseRenderer content={insight.message} className="text-xs" />
                    </div>

                    {hasLongMessage && (
                        <button
                            type="button"
                            onClick={() => setExpanded(!expanded)}
                            className="mt-1 text-xs text-primary font-medium hover:underline"
                        >
                            {expanded ? "কম দেখুন" : "আরও দেখুন"}
                        </button>
                    )}

                    {insight.actionSuggested && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {onAct && (
                                <button
                                    type="button"
                                    onClick={() => onAct(insight.id)}
                                    className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-on-primary hover:bg-primary-container transition-colors"
                                >
                                    {actionLabels[insight.actionSuggested] || insight.actionSuggested}
                                </button>
                            )}
                            {onDismiss && (
                                <button
                                    type="button"
                                    onClick={() => onDismiss(insight.id)}
                                    className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-on-surface-variant hover:bg-surface-variant transition-colors"
                                >
                                    এড়িয়ে যান
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {insight.isRead === false && onMarkRead && (
                    <button
                        type="button"
                        onClick={() => onMarkRead(insight.id)}
                        className="shrink-0 rounded-full p-1 text-on-surface-variant hover:bg-surface-variant"
                        title="Mark as read"
                    >
                        <span
                            className="material-symbols-outlined text-base"
                            style={{ fontVariationSettings: "'FILL' 0" }}
                        >
                            check_circle
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
}