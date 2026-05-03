"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, RotateCcw, Save } from "lucide-react";
import * as adminApi from "@/lib/adminApi";
import type { AdminFeature, AdminPlan, AdminPlanFeature, AdminPlanFeatureMatrix, FeatureType, QuotaResetPeriod } from "@/lib/adminApi";

type EditableFeatureState = {
    enabled: boolean;
    limitValue: string;
    resetPeriod: QuotaResetPeriod | "";
};

type FeatureFormState = {
    id: string | null;
    key: string;
    nameEn: string;
    nameBn: string;
    description: string;
    category: string;
    icon: string;
    type: FeatureType;
    displayOrder: string;
    isPublic: boolean;
    isActive: boolean;
};

type PlanPricingDraft = {
    priceBdt: string;
    annualPriceBdt: string;
    durationDays: string;
    isActive: boolean;
    highlight: boolean;
    badge: string;
};

const RESET_PERIODS: QuotaResetPeriod[] = ["DAILY", "WEEKLY", "MONTHLY", "NEVER"];
const FEATURE_TYPES: FeatureType[] = ["BOOLEAN", "LIMIT", "QUOTA"];
const EMPTY_FEATURE_FORM: FeatureFormState = {
    id: null,
    key: "",
    nameEn: "",
    nameBn: "",
    description: "",
    category: "CORE",
    icon: "",
    type: "BOOLEAN",
    displayOrder: "0",
    isPublic: true,
    isActive: true,
};

function toEditableState(feature: AdminPlanFeature): EditableFeatureState {
    return {
        enabled: Boolean(feature.enabled),
        limitValue: feature.limitValue == null ? "" : String(feature.limitValue),
        resetPeriod: feature.resetPeriod ?? "",
    };
}

function stateKey(planName: string, featureKey: string) {
    return `${planName}:${featureKey}`;
}

function featureLabel(feature: AdminPlanFeature) {
    return feature.nameEn || feature.nameBn || feature.featureKey;
}

function typeBadgeClass(type: FeatureType) {
    if (type === "BOOLEAN") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (type === "LIMIT") return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-amber-50 text-amber-700 border-amber-200";
}

function toPlanPricingDraft(plan: AdminPlan): PlanPricingDraft {
    return {
        priceBdt: String(plan.priceBdt ?? 0),
        annualPriceBdt: plan.annualPriceBdt == null ? "" : String(plan.annualPriceBdt),
        durationDays: String(plan.durationDays ?? 30),
        isActive: Boolean(plan.isActive),
        highlight: Boolean(plan.highlight),
        badge: plan.badge ?? "",
    };
}

export default function PlanFeaturesTab() {
    const t = useTranslations("admin.planFeatures");
    const [matrix, setMatrix] = useState<AdminPlanFeatureMatrix[]>([]);
    const [catalog, setCatalog] = useState<AdminFeature[]>([]);
    const [plans, setPlans] = useState<AdminPlan[]>([]);
    const [featureForm, setFeatureForm] = useState<FeatureFormState>(EMPTY_FEATURE_FORM);
    const [drafts, setDrafts] = useState<Record<string, EditableFeatureState>>({});
    const [pricingDrafts, setPricingDrafts] = useState<Record<string, PlanPricingDraft>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [savingFeature, setSavingFeature] = useState(false);
    const [savingPlan, setSavingPlan] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPlanName, setSelectedPlanName] = useState<string>("");

    const loadMatrix = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [result, features, adminPlans] = await Promise.all([
                adminApi.getPlanFeatureMatrix(),
                adminApi.getFeatureCatalog(),
                adminApi.getPlans(),
            ]);
            setMatrix(result);
            setCatalog(features);
            setPlans(adminPlans);
            const nextDrafts: Record<string, EditableFeatureState> = {};
            for (const plan of result) {
                for (const feature of plan.features) {
                    nextDrafts[stateKey(plan.planName, feature.featureKey)] = toEditableState(feature);
                }
            }
            setDrafts(nextDrafts);
            const nextPricingDrafts: Record<string, PlanPricingDraft> = {};
            for (const plan of adminPlans) {
                nextPricingDrafts[plan.name] = toPlanPricingDraft(plan);
            }
            setPricingDrafts(nextPricingDrafts);
        } catch {
            setError(t("loadFailed"));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadMatrix();
    }, [loadMatrix]);

    useEffect(() => {
        if (!selectedPlanName && matrix.length > 0) {
            setSelectedPlanName(matrix[0].planName);
        }
    }, [matrix, selectedPlanName]);

    const totalFeatures = useMemo(() => {
        const keys = new Set<string>();
        matrix.forEach((plan) => plan.features.forEach((feature) => keys.add(feature.featureKey)));
        return keys.size;
    }, [matrix]);

    const selectedPlan = useMemo(
        () => matrix.find((plan) => plan.planName === selectedPlanName) ?? matrix[0] ?? null,
        [matrix, selectedPlanName],
    );

    const selectedPlanDetails = useMemo(
        () => plans.find((plan) => plan.name === selectedPlan?.planName) ?? null,
        [plans, selectedPlan],
    );

    const selectedPlanFeatureGroups = useMemo(() => {
        if (!selectedPlan) return [];
        const groups = new Map<string, AdminPlanFeature[]>();
        for (const feature of selectedPlan.features) {
            const groupKey = feature.category || "OTHER";
            groups.set(groupKey, [...(groups.get(groupKey) ?? []), feature]);
        }
        return Array.from(groups.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([groupKey, features]) => ({
                groupKey,
                features: features.sort((a, b) => featureLabel(a).localeCompare(featureLabel(b))),
            }));
    }, [selectedPlan]);

    function updateDraft(planName: string, featureKey: string, patch: Partial<EditableFeatureState>) {
        const key = stateKey(planName, featureKey);
        setDrafts((prev) => ({
            ...prev,
            [key]: {
                ...prev[key],
                ...patch,
            },
        }));
    }

    function updatePricingDraft(planName: string, patch: Partial<PlanPricingDraft>) {
        setPricingDrafts((prev) => ({
            ...prev,
            [planName]: {
                ...prev[planName],
                ...patch,
            },
        }));
    }

    function hasChanged(planName: string, feature: AdminPlanFeature) {
        const draft = drafts[stateKey(planName, feature.featureKey)];
        if (!draft) return false;
        return (
            draft.enabled !== Boolean(feature.enabled) ||
            draft.limitValue !== (feature.limitValue == null ? "" : String(feature.limitValue)) ||
            draft.resetPeriod !== (feature.resetPeriod ?? "")
        );
    }

    async function saveFeature(planName: string, feature: AdminPlanFeature) {
        const key = stateKey(planName, feature.featureKey);
        const draft = drafts[key];
        if (!draft) return;

        const limitValue = draft.limitValue.trim() === "" ? null : Number(draft.limitValue);
        if (limitValue != null && (!Number.isFinite(limitValue) || !Number.isInteger(limitValue))) {
            setError(t("invalidLimit"));
            return;
        }

        setSaving(key);
        setError(null);
        try {
            const updated = await adminApi.updatePlanFeatureConfig(planName, feature.featureKey, {
                enabled: draft.enabled,
                limitValue,
                resetPeriod: draft.resetPeriod || null,
            });
            setMatrix((prev) =>
                prev.map((plan) =>
                    plan.planName !== planName
                        ? plan
                        : {
                            ...plan,
                            features: plan.features.map((item) =>
                                item.featureKey === feature.featureKey ? updated : item,
                            ),
                        },
                ),
            );
            setDrafts((prev) => ({ ...prev, [key]: toEditableState(updated) }));
        } catch {
            setError(t("saveFailed"));
        } finally {
            setSaving(null);
        }
    }

    async function savePlanPricing() {
        if (!selectedPlanDetails) return;
        const draft = pricingDrafts[selectedPlanDetails.name];
        if (!draft) return;

        const priceBdt = Number(draft.priceBdt);
        const annualPriceBdt = draft.annualPriceBdt.trim() === "" ? null : Number(draft.annualPriceBdt);
        const durationDays = Number(draft.durationDays);

        if (!Number.isFinite(priceBdt) || priceBdt < 0 || !Number.isFinite(durationDays) || !Number.isInteger(durationDays) || durationDays < 1) {
            setError(t("invalidPlanPricing"));
            return;
        }
        if (annualPriceBdt != null && (!Number.isFinite(annualPriceBdt) || annualPriceBdt < 0)) {
            setError(t("invalidPlanPricing"));
            return;
        }

        setSavingPlan(true);
        setError(null);
        try {
            await adminApi.updatePlan(selectedPlanDetails.id, {
                priceBdt,
                annualPriceBdt,
                durationDays,
                gracePeriodDays: selectedPlanDetails.gracePeriodDays,
                maxBusinesses: selectedPlanDetails.maxBusinesses,
                maxProductsPerBusiness: selectedPlanDetails.maxProductsPerBusiness,
                aiQueriesPerDay: selectedPlanDetails.aiQueriesPerDay,
                maxAiTokensPerQuery: selectedPlanDetails.maxAiTokensPerQuery,
                maxQueryCharacters: selectedPlanDetails.maxQueryCharacters,
                conversationHistoryTurns: selectedPlanDetails.conversationHistoryTurns,
                isActive: draft.isActive,
                highlight: draft.highlight,
                badge: draft.badge.trim() || null,
                displayNameBn: selectedPlanDetails.displayNameBn,
                displayNameEn: selectedPlanDetails.displayNameEn,
            });
            await loadMatrix();
        } catch {
            setError(t("planPricingSaveFailed"));
        } finally {
            setSavingPlan(false);
        }
    }

    function editCatalogFeature(feature: AdminFeature) {
        setFeatureForm({
            id: feature.id,
            key: feature.key,
            nameEn: feature.nameEn ?? "",
            nameBn: feature.nameBn ?? "",
            description: feature.description ?? "",
            category: feature.category ?? "CORE",
            icon: feature.icon ?? "",
            type: feature.type,
            displayOrder: String(feature.displayOrder ?? 0),
            isPublic: Boolean(feature.isPublic),
            isActive: Boolean(feature.isActive),
        });
    }

    async function saveCatalogFeature() {
        const displayOrder = Number(featureForm.displayOrder || "0");
        if (!featureForm.key.trim() || !featureForm.nameEn.trim() || !featureForm.nameBn.trim() || !featureForm.category.trim()) {
            setError(t("catalogRequired"));
            return;
        }
        if (!Number.isFinite(displayOrder) || !Number.isInteger(displayOrder)) {
            setError(t("invalidLimit"));
            return;
        }

        setSavingFeature(true);
        setError(null);
        try {
            const payload = {
                key: featureForm.key.trim(),
                nameEn: featureForm.nameEn.trim(),
                nameBn: featureForm.nameBn.trim(),
                description: featureForm.description.trim() || null,
                category: featureForm.category.trim(),
                icon: featureForm.icon.trim() || null,
                type: featureForm.type,
                displayOrder,
                isPublic: featureForm.isPublic,
                isActive: featureForm.isActive,
            };
            if (featureForm.id) {
                await adminApi.updateFeature(featureForm.id, payload);
            } else {
                await adminApi.createFeature(payload);
            }
            setFeatureForm(EMPTY_FEATURE_FORM);
            await loadMatrix();
        } catch {
            setError(t("catalogSaveFailed"));
        } finally {
            setSavingFeature(false);
        }
    }

    async function toggleCatalogFeature(feature: AdminFeature) {
        setSavingFeature(true);
        setError(null);
        try {
            await adminApi.setFeatureActive(feature.id, !feature.isActive);
            await loadMatrix();
        } catch {
            setError(t("catalogSaveFailed"));
        } finally {
            setSavingFeature(false);
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
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <h2 className="text-lg font-bold text-on-surface">{t("title")}</h2>
                    <p className="mt-1 max-w-3xl text-sm text-on-surface-variant">{t("subtitle")}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-on-surface-variant">
                        <span className="rounded-full border border-outline-variant/40 px-3 py-1">
                            {t("plansCount", { count: matrix.length })}
                        </span>
                        <span className="rounded-full border border-outline-variant/40 px-3 py-1">
                            {t("featuresCount", { count: totalFeatures })}
                        </span>
                    </div>
                </div>

                <div>
                    <button
                        type="button"
                        onClick={loadMatrix}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-outline-variant/60 px-3 text-sm font-medium text-on-surface hover:bg-surface-container-low"
                    >
                        <RotateCcw className="h-4 w-4" />
                        {t("refresh")}
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                    {error}
                </div>
            )}

            {selectedPlan && (
                <div className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-on-surface">{t("selectedPlanTitle")}</h3>
                            <p className="text-xs text-on-surface-variant">{t("selectedPlanSubtitle")}</p>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {matrix.map((plan) => (
                                <button
                                    key={plan.planName}
                                    type="button"
                                    onClick={() => setSelectedPlanName(plan.planName)}
                                    className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${selectedPlan.planName === plan.planName
                                        ? "border-primary bg-primary text-on-primary"
                                        : "border-outline-variant/50 bg-surface-container-low text-on-surface-variant hover:text-on-surface"
                                        }`}
                                >
                                    {plan.displayNameEn || plan.displayNameBn || plan.planName}
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedPlanDetails && pricingDrafts[selectedPlanDetails.name] && (
                        <div className="mt-5 rounded-lg border border-outline-variant/25 bg-surface p-4">
                            <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                                {t("planPricingTitle")}
                            </h4>
                            <div className="grid gap-3 md:grid-cols-[repeat(4,minmax(120px,1fr))_auto] md:items-end">
                                <label className="grid gap-1 text-xs font-medium text-on-surface-variant">
                                    {t("monthlyPrice")}
                                    <input
                                        type="number"
                                        min={0}
                                        value={pricingDrafts[selectedPlanDetails.name].priceBdt}
                                        onChange={(event) => updatePricingDraft(selectedPlanDetails.name, { priceBdt: event.target.value })}
                                        className="h-10 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 text-sm text-on-surface outline-none focus:border-primary"
                                    />
                                </label>
                                <label className="grid gap-1 text-xs font-medium text-on-surface-variant">
                                    {t("annualPrice")}
                                    <input
                                        type="number"
                                        min={0}
                                        value={pricingDrafts[selectedPlanDetails.name].annualPriceBdt}
                                        onChange={(event) => updatePricingDraft(selectedPlanDetails.name, { annualPriceBdt: event.target.value })}
                                        placeholder={t("none")}
                                        className="h-10 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 text-sm text-on-surface outline-none focus:border-primary"
                                    />
                                </label>
                                <label className="grid gap-1 text-xs font-medium text-on-surface-variant">
                                    {t("durationDays")}
                                    <input
                                        type="number"
                                        min={1}
                                        value={pricingDrafts[selectedPlanDetails.name].durationDays}
                                        onChange={(event) => updatePricingDraft(selectedPlanDetails.name, { durationDays: event.target.value })}
                                        className="h-10 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 text-sm text-on-surface outline-none focus:border-primary"
                                    />
                                </label>
                                <label className="grid gap-1 text-xs font-medium text-on-surface-variant">
                                    {t("badge")}
                                    <input
                                        value={pricingDrafts[selectedPlanDetails.name].badge}
                                        onChange={(event) => updatePricingDraft(selectedPlanDetails.name, { badge: event.target.value })}
                                        placeholder={t("badge")}
                                        className="h-10 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 text-sm text-on-surface outline-none focus:border-primary"
                                    />
                                </label>
                                <button
                                    type="button"
                                    onClick={() => void savePlanPricing()}
                                    disabled={savingPlan}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary disabled:opacity-50"
                                >
                                    <Save className="h-4 w-4" />
                                    {savingPlan ? t("saving") : t("savePlanPricing")}
                                </button>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-4 text-sm text-on-surface">
                                <label className="inline-flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={pricingDrafts[selectedPlanDetails.name].isActive}
                                        onChange={(event) => updatePricingDraft(selectedPlanDetails.name, { isActive: event.target.checked })}
                                    />
                                    {t("activeFeature")}
                                </label>
                                <label className="inline-flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={pricingDrafts[selectedPlanDetails.name].highlight}
                                        onChange={(event) => updatePricingDraft(selectedPlanDetails.name, { highlight: event.target.checked })}
                                    />
                                    {t("highlightPlan")}
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="mt-5 grid gap-4 xl:grid-cols-2">
                        {selectedPlanFeatureGroups.map((group) => (
                            <section key={group.groupKey} className="rounded-lg border border-outline-variant/25 bg-surface p-4">
                                <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                                    {group.groupKey}
                                </h4>
                                <div className="space-y-3">
                                    {group.features.map((feature) => {
                                        const key = stateKey(selectedPlan.planName, feature.featureKey);
                                        const draft = drafts[key] ?? toEditableState(feature);
                                        const changed = hasChanged(selectedPlan.planName, feature);
                                        const isBoolean = feature.type === "BOOLEAN";
                                        const isSaving = saving === key;

                                        return (
                                            <div key={key} className="grid gap-3 rounded-md border border-outline-variant/20 p-3 md:grid-cols-[minmax(180px,1fr)_auto_140px_150px_auto] md:items-center">
                                                <div>
                                                    <p className="text-sm font-semibold text-on-surface">{featureLabel(feature)}</p>
                                                    <p className="font-mono text-xs text-on-surface-variant">{feature.featureKey}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => updateDraft(selectedPlan.planName, feature.featureKey, { enabled: !draft.enabled })}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${draft.enabled ? "bg-primary" : "bg-surface-container-high"}`}
                                                    aria-label={t("toggleFeature")}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${draft.enabled ? "translate-x-6" : "translate-x-1"}`}
                                                    />
                                                </button>
                                                <input
                                                    type="number"
                                                    inputMode="numeric"
                                                    step={1}
                                                    value={draft.limitValue}
                                                    disabled={isBoolean}
                                                    onChange={(event) => updateDraft(selectedPlan.planName, feature.featureKey, { limitValue: event.target.value })}
                                                    placeholder={isBoolean ? "-" : t("unlimited")}
                                                    className="h-9 rounded-md border border-outline-variant/60 bg-surface-container-lowest px-3 text-sm text-on-surface outline-none disabled:bg-surface-container-low disabled:text-on-surface-variant focus:border-primary"
                                                />
                                                <select
                                                    value={draft.resetPeriod}
                                                    disabled={feature.type !== "QUOTA"}
                                                    onChange={(event) => updateDraft(selectedPlan.planName, feature.featureKey, { resetPeriod: event.target.value as QuotaResetPeriod | "" })}
                                                    className="h-9 rounded-md border border-outline-variant/60 bg-surface-container-lowest px-3 text-sm text-on-surface outline-none disabled:bg-surface-container-low disabled:text-on-surface-variant focus:border-primary"
                                                >
                                                    <option value="">{t("none")}</option>
                                                    {RESET_PERIODS.map((period) => (
                                                        <option key={period} value={period}>
                                                            {period}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => saveFeature(selectedPlan.planName, feature)}
                                                    disabled={!changed || isSaving}
                                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-on-primary transition disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-on-surface-variant"
                                                >
                                                    <Save className="h-4 w-4" />
                                                    {isSaving ? t("saving") : t("save")}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                <div className="overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container-lowest">
                    <div className="border-b border-outline-variant/30 px-4 py-3">
                        <h3 className="text-sm font-bold text-on-surface">{t("catalogTitle")}</h3>
                        <p className="text-xs text-on-surface-variant">{t("catalogSubtitle")}</p>
                    </div>
                    <div className="max-h-[360px] overflow-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="sticky top-0 bg-surface-container-low text-xs font-bold uppercase text-on-surface-variant">
                                <tr>
                                    <th className="px-4 py-3">{t("colFeature")}</th>
                                    <th className="px-4 py-3">{t("colType")}</th>
                                    <th className="px-4 py-3">{t("allCategories")}</th>
                                    <th className="px-4 py-3 text-right">{t("colAction")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/20">
                                {catalog.map((feature) => (
                                    <tr key={feature.id} className={feature.isActive ? "" : "opacity-60"}>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-on-surface">{feature.nameEn || feature.nameBn}</p>
                                            <p className="font-mono text-xs text-on-surface-variant">{feature.key}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${typeBadgeClass(feature.type)}`}>
                                                {feature.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-on-surface-variant">{feature.category}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => editCatalogFeature(feature)}
                                                    className="inline-flex h-8 items-center gap-1 rounded-md border border-outline-variant/60 px-2 text-xs font-medium text-on-surface hover:bg-surface-container-low"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                    {t("edit")}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void toggleCatalogFeature(feature)}
                                                    disabled={savingFeature}
                                                    className="inline-flex h-8 items-center rounded-md border border-outline-variant/60 px-2 text-xs font-medium text-on-surface hover:bg-surface-container-low disabled:opacity-50"
                                                >
                                                    {feature.isActive ? t("deactivate") : t("activate")}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-4">
                    <h3 className="text-sm font-bold text-on-surface">
                        {featureForm.id ? t("editFeature") : t("createFeature")}
                    </h3>
                    <div className="mt-4 grid gap-3">
                        <input
                            value={featureForm.key}
                            onChange={(event) => setFeatureForm((prev) => ({ ...prev, key: event.target.value }))}
                            placeholder={t("featureKey")}
                            className="h-10 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 text-sm outline-none focus:border-primary"
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                            <input
                                value={featureForm.nameEn}
                                onChange={(event) => setFeatureForm((prev) => ({ ...prev, nameEn: event.target.value }))}
                                placeholder={t("nameEn")}
                                className="h-10 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 text-sm outline-none focus:border-primary"
                            />
                            <input
                                value={featureForm.nameBn}
                                onChange={(event) => setFeatureForm((prev) => ({ ...prev, nameBn: event.target.value }))}
                                placeholder={t("nameBn")}
                                className="h-10 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 text-sm outline-none focus:border-primary"
                            />
                        </div>
                        <textarea
                            value={featureForm.description}
                            onChange={(event) => setFeatureForm((prev) => ({ ...prev, description: event.target.value }))}
                            placeholder={t("description")}
                            className="min-h-20 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 py-2 text-sm outline-none focus:border-primary"
                        />
                        <div className="grid gap-3 sm:grid-cols-3">
                            <input
                                value={featureForm.category}
                                onChange={(event) => setFeatureForm((prev) => ({ ...prev, category: event.target.value }))}
                                placeholder={t("category")}
                                className="h-10 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 text-sm outline-none focus:border-primary"
                            />
                            <select
                                value={featureForm.type}
                                onChange={(event) => setFeatureForm((prev) => ({ ...prev, type: event.target.value as FeatureType }))}
                                className="h-10 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 text-sm outline-none focus:border-primary"
                            >
                                {FEATURE_TYPES.map((featureType) => (
                                    <option key={featureType} value={featureType}>{featureType}</option>
                                ))}
                            </select>
                            <input
                                value={featureForm.displayOrder}
                                onChange={(event) => setFeatureForm((prev) => ({ ...prev, displayOrder: event.target.value }))}
                                placeholder={t("displayOrder")}
                                type="number"
                                className="h-10 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 text-sm outline-none focus:border-primary"
                            />
                        </div>
                        <input
                            value={featureForm.icon}
                            onChange={(event) => setFeatureForm((prev) => ({ ...prev, icon: event.target.value }))}
                            placeholder={t("icon")}
                            className="h-10 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 text-sm outline-none focus:border-primary"
                        />
                        <div className="flex flex-wrap gap-4 text-sm text-on-surface">
                            <label className="inline-flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={featureForm.isPublic}
                                    onChange={(event) => setFeatureForm((prev) => ({ ...prev, isPublic: event.target.checked }))}
                                />
                                {t("publicFeature")}
                            </label>
                            <label className="inline-flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={featureForm.isActive}
                                    onChange={(event) => setFeatureForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                                />
                                {t("activeFeature")}
                            </label>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => void saveCatalogFeature()}
                                disabled={savingFeature}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary disabled:opacity-50"
                            >
                                <Plus className="h-4 w-4" />
                                {savingFeature ? t("saving") : t("save")}
                            </button>
                            <button
                                type="button"
                                onClick={() => setFeatureForm(EMPTY_FEATURE_FORM)}
                                className="h-10 rounded-lg border border-outline-variant/60 px-4 text-sm font-medium text-on-surface hover:bg-surface-container-low"
                            >
                                {t("reset")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary-container/10 px-4 py-3 text-sm text-on-surface-variant">
                {t("infoNote")}
            </div>
        </div>
    );
}
