"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import type { AIInsight } from "@/types/aiInsight";
import { useProductPrediction } from "@/hooks/useProductPredictions";

interface PredictionPopoverProps {
    businessId: string;
    productId: string;
    productName: string;
    onClose: () => void;
}

const severityConfig: Record<string, { bg: string; border: string; badge: string; label: string }> = {
    CRITICAL: {
        bg: "bg-red-50",
        border: "border-red-300",
        badge: "bg-red-500 text-white",
        label: "জরুরি",
    },
    WARNING: {
        bg: "bg-amber-50",
        border: "border-amber-300",
        badge: "bg-amber-500 text-white",
        label: "সতর্কতা",
    },
    INFO: {
        bg: "bg-blue-50",
        border: "border-blue-300",
        badge: "bg-blue-500 text-white",
        label: "তথ্য",
    },
};

export default function PredictionPopover({
    businessId,
    productId,
    productName,
    onClose,
}: PredictionPopoverProps) {
    const t = useTranslations("shop.products");
    const { prediction, isLoading } = useProductPrediction(businessId, productId);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                onClose();
            }
        }
        // Delay to avoid the opening click
        const timer = setTimeout(() => {
            document.addEventListener("mousedown", handleClickOutside);
        }, 100);
        return () => {
            clearTimeout(timer);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    // Close on Escape
    useEffect(() => {
        function handleEscape(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    const severity = prediction?.severity
        ? severityConfig[prediction.severity] ?? severityConfig.INFO
        : severityConfig.INFO;

    const actionData = prediction?.actionData;

    return (
        <div
            ref={popoverRef}
            className={`absolute z-50 left-0 top-full mt-2 w-72 rounded-2xl ${severity.bg} border ${severity.border} p-4 shadow-xl`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-base">🔮</span>
                    <span className="text-sm font-bold text-on-surface truncate">
                        {productName}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition"
                >
                    <span className="material-symbols-outlined text-sm">close</span>
                </button>
            </div>

            {isLoading ? (
                <p className="text-xs text-on-surface-variant py-4 text-center">
                    লোড হচ্ছে...
                </p>
            ) : prediction ? (
                <>
                    {/* Severity badge */}
                    <div className="mb-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${severity.badge}`}>
                            {severity.label}
                        </span>
                        {prediction.confidence != null && (
                            <span className="ml-2 text-[10px] text-on-surface-variant">
                                {Math.round(prediction.confidence * 100)}% নিশ্চিত
                            </span>
                        )}
                    </div>

                    {/* Key metrics */}
                    {actionData && (
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="text-center">
                                <p className="text-[10px] text-on-surface-variant">বর্তমান স্টক</p>
                                <p className="text-lg font-bold text-on-surface">
                                    {actionData.currentStock ?? "—"}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] text-on-surface-variant">দিন বাকি</p>
                                <p className={`text-lg font-bold ${(actionData.estimatedDaysRemaining ?? 999) <= 3
                                        ? "text-red-600"
                                        : "text-on-surface"
                                    }`}>
                                    {actionData.estimatedDaysRemaining ?? "—"}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] text-on-surface-variant">অর্ডার পরিমাণ</p>
                                <p className="text-lg font-bold text-on-surface">
                                    {actionData.suggestedOrderQty ?? "—"}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* AI reasoning */}
                    {prediction.message && (
                        <p className="text-xs text-on-surface-variant leading-relaxed mb-2">
                            {prediction.message}
                        </p>
                    )}

                    {/* Suggested order date */}
                    {actionData?.suggestedOrderDate && (
                        <p className="text-xs text-on-surface font-medium">
                            📅 অর্ডার তারিখ: {actionData.suggestedOrderDate}
                        </p>
                    )}

                    {/* Valid until */}
                    {prediction.validUntil && (
                        <p className="text-[10px] text-on-surface-variant mt-2">
                            পূর্বাভাস মেয়াদ: {new Date(prediction.validUntil).toLocaleDateString("bn-BD")}
                        </p>
                    )}
                </>
            ) : (
                <p className="text-xs text-on-surface-variant py-4 text-center">
                    কোনো পূর্বাভাস পাওয়া যায়নি
                </p>
            )}
        </div>
    );
}
