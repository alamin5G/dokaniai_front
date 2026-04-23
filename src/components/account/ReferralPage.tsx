"use client";

/**
 * Referral Page — Refer & Earn
 * Displays the user's referral code, sharing options, stats, and how-it-works flow.
 */

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { getReferralStatus } from "@/lib/subscriptionApi";
import type { ReferralStatus } from "@/types/subscription";

export default function ReferralPage() {
    const t = useTranslations("shop.referral");
    const locale = useLocale();
    const isBn = locale.startsWith("bn");

    const [status, setStatus] = useState<ReferralStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const loadStatus = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getReferralStatus();
            setStatus(data);
        } catch {
            setError(t("loadError"));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadStatus();
    }, [loadStatus]);

    const handleCopy = async () => {
        if (!status?.referralCode) return;
        try {
            await navigator.clipboard.writeText(status.referralCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback: select text from a temporary textarea
            const textarea = document.createElement("textarea");
            textarea.value = status.referralCode;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleWhatsAppShare = () => {
        if (!status?.referralCode) return;
        const code = status.referralCode;
        const registerUrl = `https://dokaniai.com/register?ref=${code}`;
        const message = isBn
            ? `আমার রেফারেল কোড: ${code} — DokaniAI দিয়ে আপনার দোকান ডিজিটাল করুন! ${registerUrl}`
            : `My DokaniAI referral code: ${code} — Digitize your shop! ${registerUrl}`;
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank", "noopener,noreferrer");
    };

    const rewardDays = status?.rewardDays ?? 90;

    return (
        <div className="space-y-6">
            {/* Header */}
            <header>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-on-surface-variant">
                    {t("subtitle")}
                </p>
            </header>

            {/* Error */}
            {error && (
                <div className="rounded-2xl bg-error-container p-6 text-center text-on-error-container">
                    {error}
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <span className="material-symbols-outlined animate-spin text-primary text-3xl">
                        progress_activity
                    </span>
                </div>
            )}

            {/* Content */}
            {!isLoading && !error && status && (
                <>
                    {/* Referral Code Card */}
                    {status.referralCode ? (
                        <div className="rounded-2xl bg-surface-container-low p-6">
                            <p className="mb-2 text-sm font-semibold text-on-surface-variant">
                                {t("yourCode")}
                            </p>
                            <div className="flex items-center gap-3">
                                <code className="rounded-xl bg-surface-container-high px-6 py-4 text-3xl font-bold tracking-widest text-primary">
                                    {status.referralCode}
                                </code>
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                {/* Copy Button */}
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary/90"
                                >
                                    <span className="material-symbols-outlined text-lg">
                                        {copied ? "check" : "content_copy"}
                                    </span>
                                    {copied ? t("copied") : t("copyCode")}
                                </button>

                                {/* WhatsApp Share Button */}
                                <button
                                    type="button"
                                    onClick={handleWhatsAppShare}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1ebe57]"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="h-5 w-5"
                                    >
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                    {t("shareWhatsApp")}
                                </button>
                            </div>
                            <p className="mt-3 text-xs text-on-surface-variant">
                                {t("daysPerReferral", { days: rewardDays })}
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-2xl bg-surface-container-low p-12 text-center">
                            <span className="material-symbols-outlined mb-3 text-5xl text-on-surface-variant">
                                card_giftcard
                            </span>
                            <p className="text-sm font-semibold text-on-surface">
                                {t("noCode")}
                            </p>
                            <p className="mt-1 text-xs text-on-surface-variant">
                                {t("noCodeDesc")}
                            </p>
                        </div>
                    )}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl bg-surface-container-lowest p-5 text-center">
                            <span className="material-symbols-outlined mb-2 text-3xl text-primary">
                                group
                            </span>
                            <p className="text-3xl font-black text-on-surface">
                                {status.totalReferrals}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-on-surface-variant">
                                {t("totalReferrals")}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-surface-container-lowest p-5 text-center">
                            <span className="material-symbols-outlined mb-2 text-3xl text-primary">
                                calendar_month
                            </span>
                            <p className="text-3xl font-black text-on-surface">
                                {status.earnedCredits}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-on-surface-variant">
                                {t("earnedCredits")}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-surface-container-lowest p-5 text-center">
                            <span className="material-symbols-outlined mb-2 text-3xl text-secondary">
                                hourglass_top
                            </span>
                            <p className="text-3xl font-black text-on-surface">
                                {status.pendingRewardCount}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-on-surface-variant">
                                {t("pendingRewards")}
                            </p>
                        </div>
                    </div>

                    {/* How It Works */}
                    <div className="rounded-2xl bg-surface-container-low p-6">
                        <h2 className="mb-6 text-lg font-bold text-on-surface">
                            {t("howItWorks")}
                        </h2>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {/* Step 1 */}
                            <div className="flex flex-col items-center text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-black text-primary">
                                    1
                                </div>
                                <span className="material-symbols-outlined mt-3 text-2xl text-primary">
                                    share
                                </span>
                                <p className="mt-2 text-sm font-semibold text-on-surface">
                                    {t("step1")}
                                </p>
                                <p className="mt-1 text-xs text-on-surface-variant">
                                    {t("step1Desc")}
                                </p>
                            </div>
                            {/* Step 2 */}
                            <div className="flex flex-col items-center text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-black text-primary">
                                    2
                                </div>
                                <span className="material-symbols-outlined mt-3 text-2xl text-primary">
                                    person_add
                                </span>
                                <p className="mt-2 text-sm font-semibold text-on-surface">
                                    {t("step2")}
                                </p>
                                <p className="mt-1 text-xs text-on-surface-variant">
                                    {t("step2Desc")}
                                </p>
                            </div>
                            {/* Step 3 */}
                            <div className="flex flex-col items-center text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-black text-primary">
                                    3
                                </div>
                                <span className="material-symbols-outlined mt-3 text-2xl text-primary">
                                    credit_card
                                </span>
                                <p className="mt-2 text-sm font-semibold text-on-surface">
                                    {t("step3")}
                                </p>
                                <p className="mt-1 text-xs text-on-surface-variant">
                                    {t("step3Desc")}
                                </p>
                            </div>
                            {/* Step 4 */}
                            <div className="flex flex-col items-center text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-black text-primary">
                                    4
                                </div>
                                <span className="material-symbols-outlined mt-3 text-2xl text-primary">
                                    redeem
                                </span>
                                <p className="mt-2 text-sm font-semibold text-on-surface">
                                    {t("step4", { days: rewardDays })}
                                </p>
                                <p className="mt-1 text-xs text-on-surface-variant">
                                    {t("step4Desc")}
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

