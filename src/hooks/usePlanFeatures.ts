"use client";

import { useCallback, useEffect, useState } from "react";
import { getCurrentSubscription, getAvailablePlans } from "@/lib/subscriptionApi";
import type { Plan, Subscription } from "@/types/subscription";

// ─── Feature Keys ────────────────────────────────────────
// Must match backend PlanFeature enum keys
export type PlanFeatureKey =
    | "advanced_reports"
    | "ai_insights"
    | "customer_analytics"
    | "forecasting"
    | "pdf_export"
    | "data_export"
    | "due_management"
    | "discount"
    | "voice"
    | "text_nlp";

export interface PlanFeatures {
    /** Advanced trend charts, period comparison */
    advancedReports: boolean;
    /** AI-generated business insights */
    aiInsights: boolean;
    /** Customer lifetime value, purchase frequency */
    customerAnalytics: boolean;
    /** Revenue/expense forecasting */
    forecasting: boolean;
    /** PDF export */
    pdfExport: boolean;
    /** CSV/data export */
    dataExport: boolean;
    /** Due management module */
    dueManagement: boolean;
    /** Discount on sales */
    discount: boolean;
    /** Voice commands */
    voice: boolean;
    /** Text NLP input */
    textNlp: boolean;
    /** Whether any feature check has completed */
    loaded: boolean;
    /** Current plan display name (localized) */
    planName: string | null;
    /** Current subscription status */
    planStatus: string | null;
    /** Generic feature checker */
    hasFeature: (key: PlanFeatureKey) => boolean;
}

const DEFAULT_FEATURES: PlanFeatures = {
    advancedReports: false,
    aiInsights: false,
    customerAnalytics: false,
    forecasting: false,
    pdfExport: false,
    dataExport: false,
    dueManagement: false,
    discount: false,
    voice: false,
    textNlp: false,
    loaded: false,
    planName: null,
    planStatus: null,
    hasFeature: () => false,
};

// Map from camelCase to snake_case feature keys used in backend
const FEATURE_KEY_MAP: Record<keyof Omit<PlanFeatures, "loaded" | "planName" | "planStatus" | "hasFeature">, PlanFeatureKey> = {
    advancedReports: "advanced_reports",
    aiInsights: "ai_insights",
    customerAnalytics: "customer_analytics",
    forecasting: "forecasting",
    pdfExport: "pdf_export",
    dataExport: "data_export",
    dueManagement: "due_management",
    discount: "discount",
    voice: "voice",
    textNlp: "text_nlp",
};

/**
 * Hook to check the current user's plan features.
 * Fetches subscription + plans on mount, then exposes boolean feature flags.
 */
export function usePlanFeatures(): PlanFeatures {
    const [features, setFeatures] = useState<Record<string, boolean>>({});
    const [planName, setPlanName] = useState<string | null>(null);
    const [planStatus, setPlanStatus] = useState<string | null>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const [subscription, plans] = await Promise.all([
                    getCurrentSubscription(),
                    getAvailablePlans(),
                ]);

                if (cancelled) return;
                if (!subscription) { setLoaded(true); return; }

                // Find the current plan
                const currentPlan = plans.find((p) => p.id === subscription.planId);
                const planFeatures = currentPlan?.features ?? {};

                setFeatures(planFeatures);
                setPlanName(currentPlan?.displayNameEn ?? currentPlan?.name ?? null);
                setPlanStatus(subscription.status);
                setLoaded(true);
            } catch {
                // If subscription API fails (e.g., trial user), default to no features
                if (!cancelled) {
                    setLoaded(true);
                }
            }
        }

        load();
        return () => { cancelled = true; };
    }, []);

    const hasFeature = useCallback(
        (key: PlanFeatureKey): boolean => {
            return features[key] === true;
        },
        [features],
    );

    return {
        advancedReports: features["advanced_reports"] === true,
        aiInsights: features["ai_insights"] === true,
        customerAnalytics: features["customer_analytics"] === true,
        forecasting: features["forecasting"] === true,
        pdfExport: features["pdf_export"] === true,
        dataExport: features["data_export"] === true,
        dueManagement: features["due_management"] === true,
        discount: features["discount"] === true,
        voice: features["voice"] === true,
        textNlp: features["text_nlp"] === true,
        loaded,
        planName,
        planStatus,
        hasFeature,
    };
}
