"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import * as referralConfigApi from "@/lib/referralConfigApi";
import type { ReferralConfig, ReferralConfigUpdateRequest } from "@/lib/referralConfigApi";

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ReferralConfigTab() {
    const t = useTranslations("admin.referralConfig");

    const [config, setConfig] = useState<ReferralConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);

    // Form state
    const [isActive, setIsActive] = useState(true);
    const [referrerRewardType, setReferrerRewardType] = useState("FREE_DAYS");
    const [referrerRewardValue, setReferrerRewardValue] = useState(90);
    const [referredDiscountType, setReferredDiscountType] = useState("DISCOUNT_PERCENT");
    const [referredDiscountValue, setReferredDiscountValue] = useState(50);
    const [maxReferralsPerMonth, setMaxReferralsPerMonth] = useState(10);

    const loadConfig = useCallback(async () => {
        setLoading(true);
        try {
            const cfg = await referralConfigApi.getReferralConfig();
            setConfig(cfg);
            setIsActive(cfg.isActive);
            setReferrerRewardType(cfg.referrerRewardType);
            setReferrerRewardValue(cfg.referrerRewardValue);
            setReferredDiscountType(cfg.referredDiscountType);
            setReferredDiscountValue(cfg.referredDiscountValue);
            setMaxReferralsPerMonth(cfg.maxReferralsPerMonth ?? 10);
        } catch {
            setNotice("Failed to load referral config");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadConfig();
    }, [loadConfig]);

    const handleSave = async () => {
        setSaving(true);
        setNotice(null);
        try {
            const request: ReferralConfigUpdateRequest = {
                isActive,
                referrerRewardType,
                referrerRewardValue,
                referredDiscountType,
                referredDiscountValue,
                maxReferralsPerMonth,
            };
            const updated = await referralConfigApi.updateReferralConfig(request);
            setConfig(updated);
            setNotice(t("saved"));
        } catch {
            setNotice("Failed to save referral config");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-surface-container-high border-t-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-6 space-y-6">
                {/* Header with toggle */}
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-on-surface">{t("title")}</h2>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <span className="text-sm font-medium text-on-surface-variant">{t("active")}</span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={isActive}
                            onClick={() => setIsActive(!isActive)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? "bg-primary" : "bg-surface-container-highest"}`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? "translate-x-6" : "translate-x-1"}`}
                            />
                        </button>
                    </label>
                </div>

                {/* Referrer Reward */}
                <fieldset className="space-y-3 rounded-[1rem] bg-surface-container-lowest p-4 border border-outline-variant/10">
                    <legend className="text-sm font-semibold text-on-surface px-2">{t("referrerReward")}</legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs font-medium text-on-surface-variant mb-1">{t("rewardType")}</label>
                            <select
                                value={referrerRewardType}
                                onChange={(e) => setReferrerRewardType(e.target.value)}
                                className="w-full rounded-[0.75rem] bg-surface-container-highest px-4 py-2.5 text-sm text-on-surface"
                            >
                                <option value="FREE_DAYS">{t("freeDays")}</option>
                                <option value="DISCOUNT_PERCENT">{t("discountPercent")}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-on-surface-variant mb-1">
                                {referrerRewardType === "FREE_DAYS" ? t("freeDays") : t("discountPercent")}
                            </label>
                            <input
                                type="number"
                                min={1}
                                value={referrerRewardValue}
                                onChange={(e) => setReferrerRewardValue(Number(e.target.value))}
                                className="w-full rounded-[0.75rem] bg-surface-container-highest px-4 py-2.5 text-sm text-on-surface"
                            />
                        </div>
                    </div>
                </fieldset>

                {/* Referred User Discount */}
                <fieldset className="space-y-3 rounded-[1rem] bg-surface-container-lowest p-4 border border-outline-variant/10">
                    <legend className="text-sm font-semibold text-on-surface px-2">{t("referredDiscount")}</legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs font-medium text-on-surface-variant mb-1">{t("discountType")}</label>
                            <select
                                value={referredDiscountType}
                                onChange={(e) => setReferredDiscountType(e.target.value)}
                                className="w-full rounded-[0.75rem] bg-surface-container-highest px-4 py-2.5 text-sm text-on-surface"
                            >
                                <option value="DISCOUNT_PERCENT">{t("discountPercent")}</option>
                                <option value="FLAT_AMOUNT">{t("flatAmount")}</option>
                                <option value="FREE_DAYS">{t("freeDays")}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-on-surface-variant mb-1">
                                {referredDiscountType === "FREE_DAYS"
                                    ? t("freeDays")
                                    : referredDiscountType === "FLAT_AMOUNT"
                                        ? t("flatAmount")
                                        : t("discountPercent")}
                            </label>
                            <input
                                type="number"
                                min={1}
                                value={referredDiscountValue}
                                onChange={(e) => setReferredDiscountValue(Number(e.target.value))}
                                className="w-full rounded-[0.75rem] bg-surface-container-highest px-4 py-2.5 text-sm text-on-surface"
                            />
                        </div>
                    </div>
                </fieldset>

                {/* Monthly Cap */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface-variant">{t("monthlyCap")}</label>
                    <input
                        type="number"
                        min={1}
                        value={maxReferralsPerMonth}
                        onChange={(e) => setMaxReferralsPerMonth(Number(e.target.value))}
                        className="w-full max-w-xs rounded-[0.75rem] bg-surface-container-highest px-4 py-2.5 text-sm text-on-surface"
                    />
                </div>

                {/* Notice */}
                {notice && (
                    <div className="rounded-[1rem] bg-primary-container/10 px-4 py-3 text-sm text-primary">
                        {notice}
                    </div>
                )}

                {/* Save button */}
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
                >
                    {saving ? "..." : t("save")}
                </button>
            </div>
        </div>
    );
}
