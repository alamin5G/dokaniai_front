"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, RotateCcw, Save, Search } from "lucide-react";
import * as adminApi from "@/lib/adminApi";
import type { AdminFeature, AdminPlanFeature, AdminPlanFeatureMatrix, FeatureType, QuotaResetPeriod } from "@/lib/adminApi";

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

function normalizeSearch(value: string) {
    return value.trim().toLowerCase();
}

function featureLabel(feature: AdminPlanFeature) {
    return feature.nameEn || feature.nameBn || feature.featureKey;
}

function typeBadgeClass(type: FeatureType) {
    if (type === "BOOLEAN") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (type === "LIMIT") return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-amber-50 text-amber-700 border-amber-200";
}

export default function PlanFeaturesTab() {
    const t = useTranslations("admin.planFeatures");
    const [matrix, setMatrix] = useState<AdminPlanFeatureMatrix[]>([]);
    const [catalog, setCatalog] = useState<AdminFeature[]>([]);
    const [featureForm, setFeatureForm] = useState<FeatureFormState>(EMPTY_FEATURE_FORM);
    const [drafts, setDrafts] = useState<Record<string, EditableFeatureState>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [savingFeature, setSavingFeature] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState<string>("ALL");
    const [type, setType] = useState<FeatureType | "ALL">("ALL");

    const loadMatrix = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [result, features] = await Promise.all([
                adminApi.getPlanFeatureMatrix(),
                adminApi.getFeatureCatalog(),
            ]);
            setMatrix(result);
            setCatalog(features);
            const nextDrafts: Record<string, EditableFeatureState> = {};
            for (const plan of result) {
                for (const feature of plan.features) {
                    nextDrafts[stateKey(plan.planName, feature.featureKey)] = toEditableState(feature);
                }
            }
            setDrafts(nextDrafts);
        } catch {
            setError(t("loadFailed"));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadMatrix();
    }, [loadMatrix]);

    const categories = useMemo(() => {
        const values = new Set<string>();
        for (const plan of matrix) {
            for (const feature of plan.features) {
                if (feature.category) values.add(feature.category);
            }
        }
        return Array.from(values).sort();
    }, [matrix]);

    const filteredMatrix = useMemo(() => {
        const query = normalizeSearch(search);
        return matrix
            .map((plan) => ({
                ...plan,
                features: plan.features.filter((feature) => {
                    const matchesCategory = category === "ALL" || feature.category === category;
                    const matchesType = type === "ALL" || feature.type === type;
                    const label = `${feature.featureKey} ${feature.nameEn ?? ""} ${feature.nameBn ?? ""}`.toLowerCase();
                    const matchesSearch = !query || label.includes(query);
                    return matchesCategory && matchesType && matchesSearch;
                }),
            }))
            .filter((plan) => plan.features.length > 0);
    }, [category, matrix, search, type]);

    const totalFeatures = useMemo(() => {
        const keys = new Set<string>();
        matrix.forEach((plan) => plan.features.forEach((feature) => keys.add(feature.featureKey)));
        return keys.size;
    }, [matrix]);

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

                <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_160px_140px_auto]">
                    <label className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={t("searchPlaceholder")}
                            className="h-10 w-full rounded-lg border border-outline-variant/60 bg-surface-container-lowest pl-9 pr-3 text-sm text-on-surface outline-none focus:border-primary"
                        />
                    </label>
                    <select
                        value={category}
                        onChange={(event) => setCategory(event.target.value)}
                        className="h-10 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 text-sm text-on-surface outline-none focus:border-primary"
                    >
                        <option value="ALL">{t("allCategories")}</option>
                        {categories.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                    <select
                        value={type}
                        onChange={(event) => setType(event.target.value as FeatureType | "ALL")}
                        className="h-10 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 text-sm text-on-surface outline-none focus:border-primary"
                    >
                        <option value="ALL">{t("allTypes")}</option>
                        <option value="BOOLEAN">BOOLEAN</option>
                        <option value="LIMIT">LIMIT</option>
                        <option value="QUOTA">QUOTA</option>
                    </select>
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

            <div className="overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container-lowest">
                <div className="overflow-x-auto">
                    <table className="min-w-[1120px] w-full text-left">
                        <thead className="bg-surface-container-low text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                            <tr>
                                <th className="w-[210px] px-4 py-3">{t("colPlan")}</th>
                                <th className="w-[280px] px-4 py-3">{t("colFeature")}</th>
                                <th className="w-[120px] px-4 py-3">{t("colType")}</th>
                                <th className="w-[110px] px-4 py-3">{t("colEnabled")}</th>
                                <th className="w-[150px] px-4 py-3">{t("colLimit")}</th>
                                <th className="w-[160px] px-4 py-3">{t("colReset")}</th>
                                <th className="w-[120px] px-4 py-3 text-right">{t("colAction")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20">
                            {filteredMatrix.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-on-surface-variant">
                                        {t("noPlans")}
                                    </td>
                                </tr>
                            ) : (
                                filteredMatrix.map((plan) =>
                                    plan.features.map((feature, featureIndex) => {
                                        const key = stateKey(plan.planName, feature.featureKey);
                                        const draft = drafts[key] ?? toEditableState(feature);
                                        const changed = hasChanged(plan.planName, feature);
                                        const isBoolean = feature.type === "BOOLEAN";
                                        const isSaving = saving === key;

                                        return (
                                            <tr key={key} className="hover:bg-surface-container-low/60">
                                                <td className="px-4 py-3 align-top">
                                                    {featureIndex === 0 && (
                                                        <div>
                                                            <p className="font-semibold text-on-surface">
                                                                {plan.displayNameEn || plan.displayNameBn || plan.planName}
                                                            </p>
                                                            <p className="text-xs text-on-surface-variant">
                                                                {plan.planName} · Tier {plan.tierLevel ?? "-"}
                                                            </p>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium text-on-surface">{featureLabel(feature)}</p>
                                                        <p className="mt-0.5 font-mono text-xs text-on-surface-variant">
                                                            {feature.featureKey}
                                                        </p>
                                                        {feature.category && (
                                                            <p className="mt-1 text-xs text-on-surface-variant">{feature.category}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${typeBadgeClass(feature.type)}`}>
                                                        {feature.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateDraft(plan.planName, feature.featureKey, { enabled: !draft.enabled })}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${draft.enabled ? "bg-primary" : "bg-surface-container-high"}`}
                                                        aria-label={t("toggleFeature")}
                                                    >
                                                        <span
                                                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${draft.enabled ? "translate-x-6" : "translate-x-1"}`}
                                                        />
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        inputMode="numeric"
                                                        step={1}
                                                        value={draft.limitValue}
                                                        disabled={isBoolean}
                                                        onChange={(event) => updateDraft(plan.planName, feature.featureKey, { limitValue: event.target.value })}
                                                        placeholder={isBoolean ? "-" : t("unlimited")}
                                                        className="h-9 w-full rounded-md border border-outline-variant/60 bg-surface-container-lowest px-3 text-sm text-on-surface outline-none disabled:bg-surface-container-low disabled:text-on-surface-variant focus:border-primary"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        value={draft.resetPeriod}
                                                        disabled={feature.type !== "QUOTA"}
                                                        onChange={(event) => updateDraft(plan.planName, feature.featureKey, { resetPeriod: event.target.value as QuotaResetPeriod | "" })}
                                                        className="h-9 w-full rounded-md border border-outline-variant/60 bg-surface-container-lowest px-3 text-sm text-on-surface outline-none disabled:bg-surface-container-low disabled:text-on-surface-variant focus:border-primary"
                                                    >
                                                        <option value="">{t("none")}</option>
                                                        {RESET_PERIODS.map((period) => (
                                                            <option key={period} value={period}>
                                                                {period}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => saveFeature(plan.planName, feature)}
                                                        disabled={!changed || isSaving}
                                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-on-primary transition disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-on-surface-variant"
                                                    >
                                                        <Save className="h-4 w-4" />
                                                        {isSaving ? t("saving") : t("save")}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    }),
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary-container/10 px-4 py-3 text-sm text-on-surface-variant">
                {t("infoNote")}
            </div>
        </div>
    );
}
