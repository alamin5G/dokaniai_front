"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import * as adminApi from "@/lib/adminApi";

interface Plan {
    id: string;
    name: string;
    displayNameEn: string | null;
    displayNameBn: string | null;
    priceBdt: number;
    features: Record<string, boolean> | null;
    isActive: boolean;
}

const FEATURE_LABELS: Record<string, { key: string; defaultLabel: string }> = {
    AI_INSIGHTS: { key: "aiInsights", defaultLabel: "AI Insights" },
    CUSTOMER_ANALYTICS: { key: "customerAnalytics", defaultLabel: "Customer Analytics" },
    FORECASTING: { key: "forecasting", defaultLabel: "Forecasting" },
};

const ALL_FEATURES = Object.keys(FEATURE_LABELS);

export default function PlanFeaturesTab() {
    const t = useTranslations("admin.planFeatures");
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<string | null>(null);

    const loadPlans = useCallback(async () => {
        setLoading(true);
        try {
            const result = await adminApi.getPlans();
            setPlans(result);
        } catch {
            // error handled silently
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPlans();
    }, [loadPlans]);

    async function handleToggle(planName: string, featureName: string, currentEnabled: boolean) {
        const toggleKey = `${planName}-${featureName}`;
        setToggling(toggleKey);
        try {
            const updated = await adminApi.togglePlanFeature(planName, featureName, !currentEnabled);
            setPlans((prev) => prev.map((p) => (p.name === planName ? updated : p)));
        } catch {
            // error handled silently
        } finally {
            setToggling(null);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-surface-container-high border-t-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold text-on-surface">{t("title")}</h2>
                <p className="mt-1 text-sm text-on-surface-variant">{t("subtitle")}</p>
            </div>

            {/* Feature Toggle Matrix */}
            <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="bg-surface-container-low text-sm font-bold text-on-surface-variant">
                            <tr>
                                <th className="px-6 py-4">{t("colPlan")}</th>
                                {ALL_FEATURES.map((feature) => (
                                    <th key={feature} className="px-6 py-4 text-center">
                                        {t(FEATURE_LABELS[feature].key)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container">
                            {plans.length === 0 ? (
                                <tr>
                                    <td colSpan={ALL_FEATURES.length + 1} className="px-6 py-12 text-center text-on-surface-variant">
                                        {t("noPlans")}
                                    </td>
                                </tr>
                            ) : (
                                plans
                                    .filter((p) => p.isActive)
                                    .map((plan) => (
                                        <tr key={plan.name} className="hover:bg-surface-container-low transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-on-surface">
                                                        {plan.displayNameEn || plan.name}
                                                    </p>
                                                    <p className="text-xs text-on-surface-variant">
                                                        ৳{plan.priceBdt}/mo
                                                    </p>
                                                </div>
                                            </td>
                                            {ALL_FEATURES.map((feature) => {
                                                const enabled = plan.features?.[feature] ?? false;
                                                const toggleKey = `${plan.name}-${feature}`;
                                                const isToggling = toggling === toggleKey;

                                                return (
                                                    <td key={feature} className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => handleToggle(plan.name, feature, enabled)}
                                                            disabled={isToggling}
                                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${enabled
                                                                    ? "bg-primary"
                                                                    : "bg-surface-container-high"
                                                                } ${isToggling ? "opacity-50" : ""}`}
                                                        >
                                                            <span
                                                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"
                                                                    }`}
                                                            />
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Info note */}
            <div className="rounded-xl bg-primary-container/10 p-4 text-sm text-on-surface-variant">
                {t("infoNote")}
            </div>
        </div>
    );
}