"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { ParsedAction, AIActionType } from "@/types/ai";
import SaleConfirmationCard from "./SaleConfirmationCard";
import ExpenseConfirmationCard from "./ExpenseConfirmationCard";
import DueBakiConfirmationCard from "./DueBakiConfirmationCard";
import DueJomaConfirmationCard from "./DueJomaConfirmationCard";
import DiscountConfirmationCard from "./DiscountConfirmationCard";
import ReturnConfirmationCard from "./ReturnConfirmationCard";
import QueryResultCard from "./QueryResultCard";

interface ConfirmationRouterProps {
    parsedAction: ParsedAction;
    onConfirm: () => void;
    onReject: () => void;
    isProcessing?: boolean;
    isLowRisk?: boolean;
    onExecute?: () => void;
}

type ConfidenceTier = "green" | "yellow" | "red";

function getConfidenceTier(score: number): ConfidenceTier {
    if (score >= 0.85) return "green";
    if (score >= 0.70) return "yellow";
    return "red";
}

function confidenceColor(tier: ConfidenceTier): string {
    if (tier === "green") return "bg-emerald-500";
    if (tier === "yellow") return "bg-amber-500";
    return "bg-rose-500";
}

function confidenceBorder(tier: ConfidenceTier): string {
    if (tier === "green") return "border-l-4 border-l-emerald-500";
    if (tier === "yellow") return "border-l-4 border-l-amber-500";
    return "border-l-4 border-l-rose-500";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function routeActionCard(actionType: AIActionType, data: any) {
    switch (actionType) {
        case "SALE":
            return <SaleConfirmationCard data={data} />;
        case "EXPENSE":
            return <ExpenseConfirmationCard data={data} />;
        case "DUE_BAKI":
            return <DueBakiConfirmationCard data={data} />;
        case "DUE_JOMA":
            return <DueJomaConfirmationCard data={data} />;
        case "DISCOUNT":
            return <DiscountConfirmationCard data={data} />;
        case "RETURN":
            return <ReturnConfirmationCard data={data} />;
        case "QUERY":
            return <QueryResultCard data={data} />;
        default:
            return (
                <div className="rounded-xl bg-surface-container p-4 text-sm text-on-surface-variant">
                    <pre className="whitespace-pre-wrap font-mono text-xs">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            );
    }
}

export default function ConfirmationRouter({
    parsedAction,
    onConfirm,
    onReject,
    isProcessing = false,
    isLowRisk = false,
    onExecute,
}: ConfirmationRouterProps) {
    const t = useTranslations("shop.ai.confirmation");
    const ct = useTranslations("shop.ai");

    const tier = getConfidenceTier(parsedAction.confidenceScore);
    const confidencePct = Math.round(parsedAction.confidenceScore * 100);

    // Parse structured output
    const structuredData = useMemo(() => {
        if (!parsedAction.structuredOutput) return {};
        try {
            return JSON.parse(parsedAction.structuredOutput);
        } catch {
            return { raw: parsedAction.structuredOutput };
        }
    }, [parsedAction.structuredOutput]);

    const actionCard = routeActionCard(parsedAction.actionType, structuredData);
    const isQuery = parsedAction.actionType === "QUERY";

    return (
        <div className={`relative overflow-hidden rounded-[24px] bg-surface-container-lowest p-6 shadow-sm ${confidenceBorder(tier)}`}>
            {/* Decorative gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

            <div className="relative space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-on-surface">
                            {tier === "green"
                                ? t("title")
                                : tier === "yellow"
                                    ? t("titleUncertain")
                                    : t("titleRejected")}
                        </h3>
                        <p className="text-xs text-on-surface-variant mt-1">
                            {t("yourWords")} &ldquo;{parsedAction.originalText}&rdquo;
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${tier === "green"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                                : tier === "yellow"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                    : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300"
                            }`}>
                            {confidencePct}%
                        </span>
                    </div>
                </div>

                {/* Confidence bar */}
                <div className="flex items-center gap-3">
                    <span className="text-xs text-on-surface-variant">{t("confidence")}</span>
                    <div className="flex-1 h-2 rounded-full bg-surface-container-high overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${confidenceColor(tier)}`}
                            style={{ width: `${confidencePct}%` }}
                        />
                    </div>
                </div>

                {/* Action type badge */}
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">
                        {parsedAction.actionType === "SALE" ? "receipt_long"
                            : parsedAction.actionType === "EXPENSE" ? "payments"
                                : parsedAction.actionType === "DUE_BAKI" ? "menu_book"
                                    : parsedAction.actionType === "DUE_JOMA" ? "savings"
                                        : parsedAction.actionType === "DISCOUNT" ? "sell"
                                            : parsedAction.actionType === "RETURN" ? "undo"
                                                : parsedAction.actionType === "QUERY" ? "help"
                                                    : "question_mark"}
                    </span>
                    <span className="text-sm font-bold text-primary">
                        {ct(`actions.${parsedAction.actionType}`)}
                    </span>
                </div>

                {/* Routed action card */}
                <div>{actionCard}</div>

                {/* Uncertainty reason */}
                {parsedAction.uncertaintyReason && (
                    <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-200">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">warning</span>
                            <span className="font-bold">{parsedAction.uncertaintyReason}</span>
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                {!isQuery && tier !== "red" && (
                    <div className="flex flex-col sm:flex-row gap-3">
                        {onExecute && isLowRisk ? (
                            <button
                                onClick={onExecute}
                                disabled={isProcessing}
                                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-container transition-colors disabled:opacity-50 w-full sm:w-auto"
                            >
                                <span className="material-symbols-outlined text-sm">
                                    {isProcessing ? "progress_activity" : "play_arrow"}
                                </span>
                                {ct("commands.execute")}
                            </button>
                        ) : (
                            <button
                                onClick={onConfirm}
                                disabled={isProcessing}
                                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-container transition-colors disabled:opacity-50 w-full sm:w-auto"
                            >
                                <span className="material-symbols-outlined text-sm">
                                    {isProcessing ? "progress_activity" : "check"}
                                </span>
                                {t("confirm")}
                            </button>
                        )}
                        <button
                            onClick={onReject}
                            disabled={isProcessing}
                            className="flex items-center justify-center gap-2 rounded-xl bg-surface-container px-5 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50 w-full sm:w-auto"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                            {t("reject")}
                        </button>
                    </div>
                )}

                {/* Red tier - only reject */}
                {tier === "red" && (
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={onReject}
                            disabled={isProcessing}
                            className="flex items-center justify-center gap-2 rounded-xl bg-surface-container px-5 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50 w-full sm:w-auto"
                        >
                            <span className="material-symbols-outlined text-sm">refresh</span>
                            {t("reject")}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}