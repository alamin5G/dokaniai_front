"use client";

/**
 * ReferralCodeCard — Reusable referral summary card
 *
 * Shows the user's referral code (with copy), stats, reward info,
 * and a link to the full referral page for sharing.
 *
 * Used in: SubscriptionWorkspace, Profile page.
 */

import Link from "next/link";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { getReferralStatus } from "@/lib/subscriptionApi";
import type { ReferralStatus } from "@/types/subscription";

interface ReferralCodeCardProps {
    /** Pre-loaded referral status — skips internal fetch if provided */
    referralStatus?: ReferralStatus | null;
}

export default function ReferralCodeCard({ referralStatus: externalStatus }: ReferralCodeCardProps) {
    const locale = useLocale();
    const isBn = locale.startsWith("bn");

    const [internalStatus, setInternalStatus] = useState<ReferralStatus | null>(externalStatus ?? null);
    const [copied, setCopied] = useState(false);

    const status = externalStatus ?? internalStatus;

    /* Fetch referral status only if not provided by parent */
    useEffect(() => {
        if (externalStatus !== undefined) return; // parent manages data
        let cancelled = false;
        const load = async () => {
            try {
                const data = await getReferralStatus();
                if (!cancelled) setInternalStatus(data);
            } catch {
                // silent — card simply won't render
            }
        };
        void load();
        return () => { cancelled = true; };
    }, [externalStatus]);

    const handleCopy = useCallback(async () => {
        if (!status?.referralCode) return;
        try {
            await navigator.clipboard.writeText(status.referralCode);
        } catch {
            const ta = document.createElement("textarea");
            ta.value = status.referralCode;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [status?.referralCode]);

    if (!status) return null;

    return (
        <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-5 space-y-4">
            <h2 className="text-lg font-semibold text-on-surface">
                {isBn ? "রেফারেল প্রোগ্রাম" : "Referral Program"}
            </h2>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* Referral code */}
                <div className="rounded-xl bg-surface-container px-4 py-3">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                        {isBn ? "আপনার রেফারেল কোড" : "Your Referral Code"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm font-black text-primary font-mono tracking-widest">
                            {status.referralCode ?? "—"}
                        </p>
                        {status.referralCode && (
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition bg-primary/10 text-primary hover:bg-primary/20"
                            >
                                <span className="material-symbols-outlined text-sm">
                                    {copied ? "check" : "content_copy"}
                                </span>
                                {copied
                                    ? (isBn ? "কপি হয়েছে" : "Copied")
                                    : (isBn ? "কপি" : "Copy")}
                            </button>
                        )}
                    </div>
                </div>

                {/* Total referrals */}
                <div className="rounded-xl bg-surface-container px-4 py-3">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                        {isBn ? "মোট রেফারেল" : "Total Referrals"}
                    </p>
                    <p className="text-sm font-bold text-on-surface mt-1">
                        {status.totalReferrals}
                    </p>
                </div>

                {/* Earned credits */}
                <div className="rounded-xl bg-surface-container px-4 py-3">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                        {isBn ? "অর্জিত ক্রেডিট" : "Earned Credits"}
                    </p>
                    <p className="text-sm font-bold text-on-surface mt-1">
                        {status.earnedCredits} {isBn ? "দিন" : "days"}
                    </p>
                </div>

                {/* Pending rewards */}
                <div className="rounded-xl bg-surface-container px-4 py-3">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                        {isBn ? "অপেক্ষমাণ পুরস্কার" : "Pending Rewards"}
                    </p>
                    <p className="text-sm font-bold text-on-surface mt-1">
                        {status.pendingRewardCount}
                    </p>
                </div>
            </div>

            {/* Referral reward info */}
            {status.rewardDays > 0 && (
                <p className="text-xs text-on-surface-variant">
                    {isBn
                        ? `প্রতিটি সফল রেফারেলে ${status.rewardDays} দিনের ফ্রি সাবস্ক্রিপশন পাবেন।`
                        : `Earn ${status.rewardDays} free subscription days for each successful referral.`}
                </p>
            )}

            {/* Share & earn — link to full referral page */}
            <Link
                href="/account/referral"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary/90"
            >
                <span className="material-symbols-outlined text-lg">share</span>
                {isBn ? "শেয়ার করে আয় করুন" : "Share & Earn"}
            </Link>
        </section>
    );
}
