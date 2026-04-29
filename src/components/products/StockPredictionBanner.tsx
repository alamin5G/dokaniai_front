"use client";

import { useTranslations } from "next-intl";
import AIResponseRenderer from "@/components/ai/AIResponseRenderer";
import type { StockPrediction } from "@/types/restockIntelligence";

interface StockPredictionBannerProps {
    prediction: StockPrediction;
    onQuickOrder?: (productId: string) => void;
    onDismiss?: () => void;
}

const urgencyConfig: Record<string, { bg: string; border: string; badge: string; label: string }> = {
    HIGH: {
        bg: "bg-red-50",
        border: "border-l-red-500",
        badge: "bg-red-500 text-white",
        label: "জরুরি",
    },
    MEDIUM: {
        bg: "bg-amber-50",
        border: "border-l-amber-500",
        badge: "bg-amber-500 text-white",
        label: "সতর্কতা",
    },
    LOW: {
        bg: "bg-green-50",
        border: "border-l-green-500",
        badge: "bg-green-500 text-white",
        label: "স্বাভাবিক",
    },
};

export default function StockPredictionBanner({
    prediction,
    onQuickOrder,
    onDismiss,
}: StockPredictionBannerProps) {
    const t = useTranslations("shop.products.restockIntelligence");
    const urgency = urgencyConfig[prediction.confidenceLevel] || urgencyConfig.LOW;

    const isUrgent = prediction.estimatedDaysRemaining <= 3;

    return (
        <div
            className={`rounded-[16px] ${urgency.bg} p-3 border-l-4 ${urgency.border} transition hover:shadow-md ${isUrgent ? "animate-pulse" : ""
                }`}
        >
            <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">⚡</span>
                <span className="text-sm font-semibold text-on-surface">
                    {prediction.productName}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${urgency.badge}`}>
                    {urgency.label}
                </span>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="text-center">
                    <p className="text-[10px] text-on-surface-variant">
                        {t?.("daysRemaining") ?? "দিন বাকি"}
                    </p>
                    <p className={`text-lg font-bold ${isUrgent ? "text-red-600" : "text-on-surface"}`}>
                        {prediction.estimatedDaysRemaining}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] text-on-surface-variant">
                        {t?.("suggestedOrder") ?? "অর্ডার পরিমাণ"}
                    </p>
                    <p className="text-lg font-bold text-on-surface">
                        {prediction.suggestedOrderQty}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] text-on-surface-variant">
                        {t?.("currentStock") ?? "বর্তমান স্টক"}
                    </p>
                    <p className="text-lg font-bold text-on-surface">
                        {prediction.currentStock}
                    </p>
                </div>
            </div>

            {/* AI reasoning — rendered with markdown */}
            {prediction.aiReasoning && (
                <div className="text-xs text-on-surface-variant leading-relaxed mb-2">
                    <AIResponseRenderer content={prediction.aiReasoning} className="text-xs" />
                </div>
            )}

            {/* Suggested order date */}
            {prediction.suggestedOrderDate && (
                <p className="text-xs text-on-surface font-medium mb-2">
                    📅 {prediction.suggestedOrderDate}
                </p>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                {onQuickOrder && isUrgent && (
                    <button
                        type="button"
                        onClick={() => onQuickOrder(prediction.productId)}
                        className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-on-primary hover:bg-primary-container"
                    >
                        Quick Order
                    </button>
                )}
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
        </div>
    );
}
