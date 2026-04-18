"use client";

import { acceptTrial2 } from "@/lib/subscriptionApi";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function TrialExpiryBanner({ daysRemaining }: { daysRemaining: number }) {
  const t = useTranslations("subscription");
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);

  if (dismissed || result === "success" || daysRemaining > 7) return null;

  const handleAccept = async () => {
    setLoading(true);
    try {
      await acceptTrial2();
      setResult("success");
    } catch {
      setResult("error");
    } finally {
      setLoading(false);
    }
  };

  if (result === "error") {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50/50 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
        <span className="material-symbols-outlined text-amber-600 text-xl">schedule</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900">
          {daysRemaining <= 1
            ? t("trialExpiry.bannerTitleLastDay")
            : t("trialExpiry.bannerTitle", { days: daysRemaining })}
        </p>
        <p className="text-xs text-amber-700 mt-0.5">{t("trialExpiry.bannerDesc")}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-amber-600 hover:text-amber-800 font-medium px-2 py-1"
        >
          {t("trialExpiry.dismiss")}
        </button>
        <button
          onClick={handleAccept}
          disabled={loading}
          className="text-xs font-bold bg-amber-500 text-white rounded-lg px-4 py-2 hover:bg-amber-600 disabled:opacity-50 flex items-center gap-1"
        >
          {loading ? (
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">extension</span>
              {t("trialExpiry.claimFt2")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
