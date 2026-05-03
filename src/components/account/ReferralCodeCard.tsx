"use client";

/**
 * ReferralCodeCard — Reusable referral summary card
 *
 * Shows the user's referral code (with copy), stats, reward info,
 * and a link to the full referral page for sharing.
 *
 * Used in: SubscriptionControlCenter, Profile page.
 */

import Link from "next/link";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
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
        const referralCode = status?.referralCode;
        if (!referralCode) return;
        try {
            await navigator.clipboard.writeText(referralCode);
        } catch {
            const ta = document.createElement("textarea");
            ta.value = referralCode;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [status]);

    if (!status) return null;

    const progress = status.maxReferralsTotal > 0
        ? Math.min((status.totalReferrals / status.maxReferralsTotal) * 100, 100)
        : 0;

    return (
        <section className="rounded-lg border border-outline-variant/30 bg-surface p-5">
            <p className="text-xs font-bold uppercase text-primary">{isBn ? "রেফারেল" : "Referral"}</p>
            <h2 className="mt-1 text-lg font-bold text-on-surface">
                {isBn ? "রেফারেল প্রোগ্রাম" : "Referral Program"}
            </h2>

            <div className="mt-4 rounded-lg bg-surface-container p-4">
                <p className="text-[10px] font-bold uppercase text-on-surface-variant">
                    {isBn ? "আপনার কোড" : "Your code"}
                </p>
                <div className="mt-2 flex items-center gap-2">
                    <code className="min-w-0 flex-1 rounded-md bg-surface px-3 py-2 font-mono text-base font-black tracking-widest text-primary">
                        {status.referralCode ?? "—"}
                    </code>
                    {status.referralCode && (
                        <button
                            type="button"
                            onClick={handleCopy}
                            aria-label={isBn ? "রেফারেল কোড কপি করুন" : "Copy referral code"}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary text-on-primary transition hover:bg-primary/90"
                        >
                            {copied ? <Check size={17} /> : <Copy size={17} />}
                        </button>
                    )}
                </div>
                {copied && (
                    <p className="mt-2 text-xs font-semibold text-emerald-600">
                        {isBn ? "কোড কপি হয়েছে।" : "Code copied."}
                    </p>
                )}
            </div>

            <div className="mt-4 divide-y divide-outline-variant/30 rounded-lg border border-outline-variant/30">
                {[
                    [isBn ? "মোট রেফারেল" : "Total referrals", `${status.totalReferrals} / ${status.maxReferralsTotal}`],
                    [isBn ? "অর্জিত ক্রেডিট" : "Earned credit", `${status.earnedCredits} ${isBn ? "দিন" : "days"}`],
                    [isBn ? "অপেক্ষমাণ পুরস্কার" : "Pending rewards", status.pendingRewardCount.toString()],
                ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-3 px-4 py-3">
                        <span className="text-sm text-on-surface-variant">{label}</span>
                        <span className="text-sm font-bold text-on-surface">{value}</span>
                    </div>
                ))}
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-outline-variant/20">
                <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>

            {status.rewardDays > 0 && (
                <p className="mt-3 text-xs leading-5 text-on-surface-variant">
                    {isBn
                        ? `প্রতিটি সফল রেফারেলে ${status.rewardDays} দিনের ফ্রি সাবস্ক্রিপশন যোগ হবে।`
                        : `Each successful referral adds ${status.rewardDays} free subscription days.`}
                </p>
            )}

            <Link
                href="/account/referral"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-bold text-on-primary transition hover:bg-primary/90"
            >
                <Share2 size={16} />
                {isBn ? "রেফারেল শেয়ার করুন" : "Share referral"}
            </Link>
        </section>
    );
}
