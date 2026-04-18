"use client";

import { clearPendingUpgradePlan } from "@/lib/authFlow";
import { clearPendingPlan, consentTrialPlan } from "@/lib/subscriptionApi";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface FreeTrialModalProps {
    trialDays?: number;
    pendingPlanId?: string | null;
    onConfirm?: () => void;
}

export function FreeTrialModal({ trialDays = 65, pendingPlanId, onConfirm }: FreeTrialModalProps) {
    const router = useRouter();
    const t = useTranslations("subscription.trialModal");
    const [isConfirming, setIsConfirming] = useState(false);

    const handleConfirm = async () => {
        setIsConfirming(true);
        try {
            if (pendingPlanId) {
                await consentTrialPlan(pendingPlanId);
            }
        } catch { /* non-critical */ }
        if (onConfirm) {
            onConfirm();
        } else {
            clearPendingUpgradePlan();
            router.push("/onboarding");
        }
        setIsConfirming(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-6">
                {/* Icon */}
                <div className="text-center">
                    <span className="material-symbols-outlined text-primary text-6xl">
                        card_giftcard
                    </span>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-on-surface text-center">
                    {t("title")}
                </h2>

                {/* Trial details */}
                <div className="bg-primary/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-xl">schedule</span>
                        <p className="text-on-surface font-medium">
                            {t("duration", { days: trialDays })}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-xl">verified</span>
                        <p className="text-on-surface font-medium">
                            {t("allFeatures")}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-xl">payments</span>
                        <p className="text-on-surface font-medium">
                            {t("noCreditCard")}
                        </p>
                    </div>
                </div>

                {/* Description */}
                <p className="text-on-surface-variant text-sm text-center">
                    {t("description")}
                </p>

                {/* Confirm button */}
                <button
                    onClick={handleConfirm}
                    disabled={isConfirming}
                    className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold text-lg hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                    <span>{t("confirm")}</span>
                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </button>
            </div>
        </div>
    );
}
