"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";

interface UpgradeCtaProps {
    /** Which feature is locked */
    feature: "advancedReports" | "aiInsights" | "customerAnalytics" | "forecasting";
    /** Optional custom title override */
    title?: string;
    /** Optional custom description override */
    description?: string;
}

const FEATURE_MIN_TIER: Record<string, string> = {
    advancedReports: "pro",
    aiInsights: "pro",
    customerAnalytics: "plus",
    forecasting: "plus",
};

/**
 * Upgrade CTA card shown when a user's plan doesn't include a feature.
 * Displays a glass-morphism card with a lock icon, description, and upgrade button.
 */
export default function UpgradeCta({ feature, title, description }: UpgradeCtaProps) {
    const t = useTranslations("shop.reports");
    const { planName } = usePlanFeatures();
    const tier = FEATURE_MIN_TIER[feature] ?? "pro";

    return (
        <div className="relative overflow-hidden rounded-[24px] bg-surface-container-lowest p-8 shadow-sm">
            {/* Decorative gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

            <div className="relative flex flex-col items-center gap-6 py-8 text-center">
                {/* Lock icon */}
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-surface-container text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl">lock</span>
                </div>

                {/* Title */}
                <div>
                    <h3 className="text-xl font-bold text-on-surface">
                        {title ?? t(`upgrade.${feature}.title`)}
                    </h3>
                    <p className="mt-2 text-sm text-on-surface-variant max-w-md">
                        {description ?? t(`upgrade.${feature}.description`)}
                    </p>
                </div>

                {/* Current plan badge */}
                {planName && (
                    <span className="rounded-full bg-surface-container px-4 py-1.5 text-xs font-bold text-on-surface-variant">
                        {t("upgrade.currentPlan", { plan: planName })}
                    </span>
                )}

                {/* Upgrade button */}
                <Link
                    href="/pricing"
                    className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-primary-container hover:scale-[1.02] active:scale-[0.98]"
                >
                    <span className="material-symbols-outlined text-sm">rocket_launch</span>
                    {tier === "plus"
                        ? t("upgrade.toPlus")
                        : t("upgrade.toPro")}
                </Link>
            </div>
        </div>
    );
}
