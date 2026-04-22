"use client";

import { FormInput } from "@/components/ui/FormPrimitives";
import {
  applyCoupon,
  getAvailablePlans,
  getCurrentSubscription,
  getPaymentIntentStatus,
  getPlanLimits,
  getPublicCoupons,
  getReferralStatus,
  getUpgradeProration,
  initializePaymentIntent,
  invalidateCurrentSubscriptionCache,
  resubmitPaymentIntent,
  scheduleDowngrade,
  submitPaymentTrx,
  validateDowngrade,
} from "@/lib/subscriptionApi";
import apiClient from "@/lib/api";
import type {
  AppliedCoupon,
  UpgradeProrationResponse,
  DowngradeValidation,
  MfsType,
  PaymentInitializeResponse,
  PaymentIntentStatus,
  PaymentIntentStatusResponse,
  Plan,
  PlanLimits,
  PublicCoupon,
  ReferralStatus,
  Subscription,
  SubscriptionStatus,
} from "@/types/subscription";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

/* ── Constants ────────────────────────────────────────────────── */
const MFS_OPTIONS: MfsType[] = ["BKASH", "NAGAD", "ROCKET"];

const MFS_LABELS: Record<MfsType, string> = {
  BKASH: "bKash",
  NAGAD: "Nagad",
  ROCKET: "Rocket",
};

const STATUS_LABELS_EN: Record<string, string> = {
  ACTIVE: "Active",
  TRIAL: "Free Trial",
  GRACE: "Grace Period",
  RESTRICTED: "Restricted",
  ARCHIVED: "Archived",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
  PENDING: "Pending",
  COMPLETED: "Completed",
  MANUAL_REVIEW: "Under Review",
  FAILED: "Failed",
  REJECTED: "Rejected",
};

const STATUS_LABELS_BN: Record<string, string> = {
  ACTIVE: "সক্রিয়",
  TRIAL: "ফ্রি ট্রায়াল",
  GRACE: "গ্রেস পিরিয়ড",
  RESTRICTED: "সীমাবদ্ধ",
  ARCHIVED: "আর্কাইভ",
  EXPIRED: "মেয়াদোত্তীর্ণ",
  CANCELLED: "বাতিল",
  PENDING: "অপেক্ষমাণ",
  COMPLETED: "সম্পন্ন",
  MANUAL_REVIEW: "যাচাই চলছে",
  FAILED: "ব্যর্থ",
  REJECTED: "প্রত্যাখ্যাত",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  TRIAL: "bg-blue-100 text-blue-700",
  GRACE: "bg-amber-100 text-amber-700",
  RESTRICTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-gray-100 text-gray-600",
  PENDING: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  MANUAL_REVIEW: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-700",
  REJECTED: "bg-red-100 text-red-700",
};

const FEATURE_ICONS: Record<string, string> = {
  dueManagementEnabled: "account_balance_wallet",
  discountEnabled: "sell",
  voiceEnabled: "mic",
  textNlpEnabled: "psychology",
};

const FEATURE_LABELS_EN: Record<string, string> = {
  dueManagementEnabled: "Due Management",
  discountEnabled: "Discount System",
  voiceEnabled: "Voice AI",
  textNlpEnabled: "Text NLP",
};

const FEATURE_LABELS_BN: Record<string, string> = {
  dueManagementEnabled: "বাকি ম্যানেজমেন্ট",
  discountEnabled: "ডিসকাউন্ট সিস্টেম",
  voiceEnabled: "ভয়েস AI",
  textNlpEnabled: "টেক্সট NLP",
};

/* ── Helpers ──────────────────────────────────────────────────── */
function formatPrice(value: number, locale: string): string {
  return new Intl.NumberFormat(locale.startsWith("bn") ? "bn-BD" : "en-US").format(value);
}

function formatDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(locale.startsWith("bn") ? "bn-BD" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(iso: string | null | undefined, locale: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(locale.startsWith("bn") ? "bn-BD" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTrxMaxLength(mfsMethod: MfsType | undefined): number {
  switch (mfsMethod) {
    case "BKASH": return 10;
    case "NAGAD": return 8;
    case "ROCKET": return 10;
    default: return 10;
  }
}

function getTrxHint(mfsMethod: MfsType | undefined, isBn: boolean): string {
  switch (mfsMethod) {
    case "BKASH": return isBn ? "১০ অক্ষরের আলফানিউমেরিক (যেমন DDJ8BQBVCM)" : "10 alphanumeric chars (e.g. DDJ8BQBVCM)";
    case "NAGAD": return isBn ? "৮ অক্ষরের আলফানিউমেরিক (যেমন 754PTHMR)" : "8 alphanumeric chars (e.g. 754PTHMR)";
    case "ROCKET": return isBn ? "১০ সংখ্যার ডিজিট (যেমন 4661971574)" : "10 digit number (e.g. 4661971574)";
    default: return "";
  }
}

function paymentStatusDone(status: PaymentIntentStatus | null | undefined): boolean {
  return status === "COMPLETED" || status === "FAILED" || status === "EXPIRED" || status === "REJECTED";
}

function daysRemaining(endIso: string | null): number | null {
  if (!endIso) return null;
  const diff = new Date(endIso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function secondsRemaining(endIso: string | null): number | null {
  if (!endIso) return null;
  const diff = new Date(endIso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 1000));
}

/* ── Component ────────────────────────────────────────────────── */
export default function SubscriptionPage() {
  const locale = useLocale();
  const isBn = locale.startsWith("bn");

  /* State */
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null);
  const [referralStatus, setReferralStatus] = useState<ReferralStatus | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponApplying, setCouponApplying] = useState(false);
  const [checkoutMethod, setCheckoutMethod] = useState<MfsType>("BKASH");
  const [paymentIntent, setPaymentIntent] = useState<PaymentInitializeResponse | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentIntentStatusResponse | null>(null);
  const [trxIdInput, setTrxIdInput] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [downgradeValidation, setDowngradeValidation] = useState<DowngradeValidation | null>(null);
  const [downgradeLoading, setDowngradeLoading] = useState(false);
  const [proration, setProration] = useState<UpgradeProrationResponse | null>(null);
  const [prorationLoading, setProrationLoading] = useState(false);
  const [publicCoupons, setPublicCoupons] = useState<PublicCoupon[]>([]);
  const [referralCopied, setReferralCopied] = useState(false);

  /* Derived */
  const selectedPlan = useMemo(() => plans.find((p) => p.id === selectedPlanId) ?? null, [plans, selectedPlanId]);
  const currentPlan = useMemo(() => {
    if (!currentSubscription) return null;
    return plans.find((p) => p.id === currentSubscription.planId) ?? null;
  }, [plans, currentSubscription]);
  const planPrice = useMemo(() => {
    if (!selectedPlan) return 0;
    return billingCycle === "ANNUAL" && selectedPlan.annualPriceBdt ? selectedPlan.annualPriceBdt : selectedPlan.priceBdt;
  }, [selectedPlan, billingCycle]);
  const payableAmount = appliedCoupon?.finalAmount ?? planPrice;
  const couponSavings = appliedCoupon ? appliedCoupon.originalAmount - appliedCoupon.finalAmount : 0;

  /* ── Data loading ─────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    const loadBillingData = async () => {
      setBillingLoading(true);
      setBillingError(null);
      try {
        const [allPlans, limits] = await Promise.all([
          getAvailablePlans(),
          getPlanLimits(),
        ]);
        if (cancelled) return;

        setPlans(allPlans.filter((plan) => plan.isActive));
        setPlanLimits(limits);

        let current: Subscription | null = null;
        try {
          current = await getCurrentSubscription();
        } catch {
          current = null;
        }
        if (cancelled) return;

        setCurrentSubscription(current);
        if (current?.planId) {
          setSelectedPlanId(current.planId);
          if (current.billingCycle) setBillingCycle(current.billingCycle);
        } else if (allPlans.length > 0) {
          const fallbackPlan = allPlans.find((plan) => !plan.isTrial) ?? allPlans[0];
          setSelectedPlanId(fallbackPlan.id);
        }

        // Load referral status
        try {
          const referral = await getReferralStatus();
          if (!cancelled) setReferralStatus(referral);
        } catch {
          // Referral not available for this user
        }
      } catch (error) {
        if (!cancelled) {
          setBillingError(
            error instanceof Error
              ? error.message
              : isBn
                ? "সাবস্ক্রিপশন তথ্য লোড করা যায়নি।"
                : "Failed to load subscription data.",
          );
        }
      } finally {
        if (!cancelled) {
          setBillingLoading(false);
        }
      }
    };

    void loadBillingData();
    return () => {
      cancelled = true;
    };
  }, [isBn]);

  /* ── Fetch public coupons for plan badges ─────────────────── */
  useEffect(() => {
    getPublicCoupons().then(setPublicCoupons).catch(() => { });
  }, []);

  /* ── Payment countdown timer ──────────────────────────────── */
  useEffect(() => {
    const expiry = paymentStatus?.expiresAt || paymentIntent?.expiresAt;
    if (!expiry || paymentStatusDone(paymentStatus?.status)) {
      setCountdown(null);
      return;
    }
    const tick = () => setCountdown(secondsRemaining(expiry));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [paymentStatus?.expiresAt, paymentIntent?.expiresAt, paymentStatus?.status]);

  /* ── Payment status polling ───────────────────────────────── */
  const refreshPaymentStatus = useCallback(async () => {
    if (!paymentIntent) return;
    try {
      const status = await getPaymentIntentStatus(paymentIntent.paymentIntentId);
      setPaymentStatus(status);
      if (status.status === "COMPLETED") {
        invalidateCurrentSubscriptionCache();
        const updated = await getCurrentSubscription();
        setCurrentSubscription(updated);
        setNotice(isBn ? "✅ পেমেন্ট সফল! সাবস্ক্রিপশন আপডেট হয়েছে।" : "✅ Payment completed! Subscription updated.");
      }
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : isBn
            ? "পেমেন্ট স্ট্যাটাস আনা যায়নি।"
            : "Could not fetch payment status.",
      );
    }
  }, [paymentIntent, isBn]);

  useEffect(() => {
    if (!paymentIntent || !paymentStatus || paymentStatusDone(paymentStatus.status)) return;
    const intervalId = window.setInterval(() => void refreshPaymentStatus(), 6000);
    return () => window.clearInterval(intervalId);
  }, [paymentIntent, paymentStatus, refreshPaymentStatus]);

  /* ── Upgrade proration fetch ──────────────────────────────── */
  useEffect(() => {
    if (!selectedPlan || !currentSubscription || !currentPlan) {
      setProration(null);
      return;
    }
    // Only fetch proration when selecting a higher-tier plan (upgrade)
    if (selectedPlan.tierLevel <= currentPlan.tierLevel) {
      setProration(null);
      return;
    }
    let cancelled = false;
    setProrationLoading(true);
    getUpgradeProration(selectedPlan.id)
      .then((data) => {
        if (!cancelled) setProration(data);
      })
      .catch(() => {
        if (!cancelled) setProration(null);
      })
      .finally(() => {
        if (!cancelled) setProrationLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedPlan, currentSubscription, currentPlan]);

  /* ── Handlers ─────────────────────────────────────────────── */
  const handleApplyCoupon = async () => {
    if (!selectedPlan || !couponCode.trim()) {
      setNotice(isBn ? "প্ল্যান এবং কুপন কোড দিন।" : "Select a plan and enter a coupon code.");
      return;
    }
    setCouponApplying(true);
    try {
      const result = await applyCoupon(couponCode.trim(), selectedPlan.id, planPrice);
      setAppliedCoupon(result);
      setNotice(isBn ? "✅ কুপন প্রয়োগ হয়েছে।" : "✅ Coupon applied.");
    } catch (error) {
      setAppliedCoupon(null);
      setNotice(
        error instanceof Error
          ? error.message
          : isBn
            ? "কুপন প্রয়োগ করা যায়নি।"
            : "Failed to apply coupon.",
      );
    } finally {
      setCouponApplying(false);
    }
  };

  const handleInitializeCheckout = async () => {
    if (!selectedPlan) {
      setNotice(isBn ? "একটি প্ল্যান নির্বাচন করুন।" : "Please select a plan.");
      return;
    }
    setCheckoutLoading(true);
    try {
      const intent = await initializePaymentIntent({
        planId: selectedPlan.id,
        amount: payableAmount,
        mfsMethod: checkoutMethod,
        couponCode: appliedCoupon?.code ?? (couponCode.trim() || undefined),
        billingCycle,
      });
      setPaymentIntent(intent);
      setPaymentStatus({
        paymentIntentId: intent.paymentIntentId,
        status: intent.status,
        verifiedAt: null,
        failedAttempts: 0,
        fraudFlag: false,
        rejectionReason: null,
        expiresAt: intent.expiresAt ?? null,
      });
      setNotice(isBn ? "পেমেন্ট ইনটেন্ট তৈরি হয়েছে। TrxID দিন।" : "Payment intent created. Submit TrxID.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : isBn
            ? "পেমেন্ট শুরু করা যায়নি।"
            : "Could not initialize payment.",
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleSubmitTrx = async () => {
    if (!paymentIntent || !trxIdInput.trim()) {
      setNotice(isBn ? "TrxID দিন।" : "Enter TrxID first.");
      return;
    }
    setCheckoutLoading(true);
    try {
      const status = await submitPaymentTrx(paymentIntent.paymentIntentId, trxIdInput.trim());
      setPaymentStatus(status);
      setNotice(isBn ? "TrxID জমা হয়েছে। ভেরিফিকেশন চলছে..." : "TrxID submitted. Verification in progress...");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : isBn
            ? "TrxID সাবমিট করা যায়নি।"
            : "TrxID submit failed.",
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleResubmitPayment = async () => {
    if (!paymentIntent) return;
    setCheckoutLoading(true);
    try {
      const status = await resubmitPaymentIntent(paymentIntent.paymentIntentId);
      setPaymentStatus(status);
      setTrxIdInput("");
      setNotice(isBn ? "পেমেন্ট ইনটেন্ট রিসেট হয়েছে। নতুন TrxID দিন।" : "Payment intent reset. Enter new TrxID.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : isBn
            ? "রিসাবমিট করা যায়নি।"
            : "Could not resubmit payment intent.",
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleValidateDowngrade = async (targetPlanId: string) => {
    setDowngradeLoading(true);
    try {
      const validation = await validateDowngrade(targetPlanId);
      setDowngradeValidation(validation);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : isBn
            ? "ডাউনগ্রেড যাচাই করা যায়নি।"
            : "Downgrade validation failed.",
      );
    } finally {
      setDowngradeLoading(false);
    }
  };

  const handleScheduleDowngrade = async (targetPlanId: string) => {
    setDowngradeLoading(true);
    try {
      const updated = await scheduleDowngrade(targetPlanId);
      setCurrentSubscription(updated);
      setNotice(isBn ? "ডাউনগ্রেড নির্ধারিত হয়েছে। বর্তমান পিরিয়ডের শেষে কার্যকর হবে।" : "Downgrade scheduled. Takes effect at end of current period.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : isBn
            ? "ডাউনগ্রেড করা যায়নি।"
            : "Could not schedule downgrade.",
      );
    } finally {
      setDowngradeLoading(false);
    }
  };

  const handleCancelDowngrade = async () => {
    setDowngradeLoading(true);
    try {
      await apiClient.delete("/subscriptions/downgrade");
      invalidateCurrentSubscriptionCache();
      const updated = await getCurrentSubscription();
      setCurrentSubscription(updated);
      setNotice(isBn ? "ডাউনগ্রেড বাতিল করা হয়েছে।" : "Downgrade cancelled.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : isBn
            ? "বাতিল করা যায়নি।"
            : "Could not cancel downgrade.",
      );
    } finally {
      setDowngradeLoading(false);
    }
  };

  /* ── Status label helper ──────────────────────────────────── */
  const statusLabel = (status: string | null | undefined): string => {
    if (!status) return "—";
    return isBn ? (STATUS_LABELS_BN[status] ?? status) : (STATUS_LABELS_EN[status] ?? status);
  };

  const statusColor = (status: string | null | undefined): string => {
    if (!status) return "bg-gray-100 text-gray-600";
    return STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600";
  };

  /* ── Format countdown ─────────────────────────────────────── */
  const formatCountdown = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <section className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="rounded-[1.75rem] border border-outline-variant/30 bg-surface p-6">
        <h1 className="text-2xl font-bold text-on-surface">
          {isBn ? "সাবস্ক্রিপশন ও বিলিং" : "Subscription & Billing"}
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          {isBn ? "প্ল্যান, পেমেন্ট, রেফারেল ও ফিচার লক এখানে ম্যানেজ করুন।" : "Manage your plan, payments, referrals, and feature locks."}
        </p>
      </header>

      {/* ── Notice ──────────────────────────────────────────── */}
      {notice && (
        <div className="rounded-[1rem] border border-outline-variant/30 bg-surface-container px-4 py-3 text-sm text-on-surface">
          {notice}
        </div>
      )}
      {billingError && (
        <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{billingError}</div>
      )}
      {billingLoading && (
        <div className="rounded-[1rem] border border-outline-variant/30 bg-surface p-5 text-sm text-on-surface-variant">
          {isBn ? "সাবস্ক্রিপশন তথ্য লোড হচ্ছে..." : "Loading subscription data..."}
        </div>
      )}

      {!billingLoading && (
        <>
          {/* ══════════════════════════════════════════════════════
              SECTION 1: Current Subscription Card
              ══════════════════════════════════════════════════════ */}
          {currentSubscription && (
            <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-on-surface">
                  {isBn ? "বর্তমান সাবস্ক্রিপশন" : "Current Subscription"}
                </h2>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${statusColor(currentSubscription.status)}`}>
                  {statusLabel(currentSubscription.status)}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* Plan name */}
                <div className="rounded-xl bg-surface-container px-4 py-3">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {isBn ? "প্ল্যান" : "Plan"}
                  </p>
                  <p className="text-sm font-bold text-on-surface mt-1">
                    {currentPlan ? (isBn ? currentPlan.displayNameBn : currentPlan.displayNameEn) : "—"}
                  </p>
                </div>

                {/* Billing cycle */}
                <div className="rounded-xl bg-surface-container px-4 py-3">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {isBn ? "বিলিং সাইকেল" : "Billing Cycle"}
                  </p>
                  <p className="text-sm font-bold text-on-surface mt-1">
                    {currentSubscription.billingCycle === "ANNUAL"
                      ? (isBn ? "বার্ষিক" : "Annual")
                      : (isBn ? "মাসিক" : "Monthly")}
                  </p>
                </div>

                {/* Period start */}
                <div className="rounded-xl bg-surface-container px-4 py-3">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {isBn ? "শুরু" : "Started"}
                  </p>
                  <p className="text-sm font-bold text-on-surface mt-1">
                    {formatDate(currentSubscription.currentPeriodStart, locale)}
                  </p>
                </div>

                {/* Period end / renewal */}
                <div className="rounded-xl bg-surface-container px-4 py-3">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {currentSubscription.cancelAtPeriodEnd
                      ? (isBn ? "মেয়াদ শেষ" : "Expires")
                      : (isBn ? "নবায়ন" : "Renews")}
                  </p>
                  <p className="text-sm font-bold text-on-surface mt-1">
                    {formatDate(currentSubscription.currentPeriodEnd, locale)}
                  </p>
                  {(() => {
                    const days = daysRemaining(currentSubscription.currentPeriodEnd);
                    if (days !== null && days <= 7 && days > 0) {
                      return (
                        <p className="text-[10px] text-amber-600 font-semibold mt-0.5">
                          {isBn ? `${days} দিন বাকি` : `${days} days left`}
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* Downgrade notice */}
              {currentSubscription.downgradeScheduledTo && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-amber-800">
                      {isBn ? "ডাউনগ্রেড নির্ধারিত" : "Downgrade Scheduled"}
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      {isBn
                        ? `${plans.find((p) => p.id === currentSubscription.downgradeScheduledTo)?.displayNameBn ?? "—"} তে ${formatDate(currentSubscription.downgradeScheduledAt, locale)} তারিখে ডাউনগ্রেড হবে`
                        : `Downgrade to ${plans.find((p) => p.id === currentSubscription.downgradeScheduledTo)?.displayNameEn ?? "—"} scheduled on ${formatDate(currentSubscription.downgradeScheduledAt, locale)}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCancelDowngrade()}
                    disabled={downgradeLoading}
                    className="rounded-full bg-amber-100 px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-200 disabled:opacity-50 shrink-0"
                  >
                    {isBn ? "বাতিল করুন" : "Cancel"}
                  </button>
                </div>
              )}
            </section>
          )}

          {/* ══════════════════════════════════════════════════════
              SECTION 2: Plan Selection Cards
              ══════════════════════════════════════════════════════ */}
          <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-on-surface">
                {isBn ? "প্ল্যান নির্বাচন" : "Choose a Plan"}
              </h2>

              {/* Annual toggle */}
              {plans.some((p) => p.annualPriceBdt !== null) && (
                <button
                  type="button"
                  onClick={() => {
                    setBillingCycle((prev) => prev === "MONTHLY" ? "ANNUAL" : "MONTHLY");
                    setAppliedCoupon(null);
                  }}
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-colors"
                  style={{
                    backgroundColor: billingCycle === "ANNUAL" ? "var(--color-primary, #00503a)" : "transparent",
                    color: billingCycle === "ANNUAL" ? "white" : "var(--color-on-surface-variant, #44474a)",
                    border: billingCycle === "ANNUAL" ? "none" : "1px solid var(--color-outline-variant, #c4c7c5)",
                  }}
                >
                  {isBn ? "বার্ষিক" : "Annual"}
                  {billingCycle === "ANNUAL" && (
                    <span className="text-[10px] opacity-80">
                      {isBn ? "(সাশ্রয়)" : "(save)"}
                    </span>
                  )}
                </button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => {
                const isCurrentPlan = currentSubscription?.planId === plan.id;
                const isSelected = selectedPlanId === plan.id;
                const price = billingCycle === "ANNUAL" && plan.annualPriceBdt ? plan.annualPriceBdt : plan.priceBdt;
                const periodLabel = billingCycle === "ANNUAL" && plan.annualPriceBdt
                  ? (isBn ? "/বছর" : "/yr")
                  : (isBn ? "/মাস" : "/mo");

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => {
                      if (!isCurrentPlan) {
                        setSelectedPlanId(plan.id);
                        setAppliedCoupon(null);
                      }
                    }}
                    className={`relative text-left rounded-2xl border-2 p-4 transition-all ${isSelected
                      ? "border-primary bg-primary/5 shadow-md"
                      : isCurrentPlan
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-outline-variant/30 bg-surface hover:border-primary/30 hover:bg-surface-container"
                      }`}
                  >
                    {/* Badge */}
                    {plan.badge && (
                      <span className="absolute -top-2 right-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-white">
                        {plan.badge}
                      </span>
                    )}

                    {/* Public coupon badge */}
                    {(() => {
                      const coupon = publicCoupons.find(c =>
                        !c.applicablePlans || c.applicablePlans.length === 0 || c.applicablePlans.includes(plan.id)
                      );
                      if (!coupon) return null;
                      const label = isBn ? (coupon.displayLabelBn || coupon.code) : (coupon.displayLabelEn || coupon.code);
                      const discount = coupon.type === "PERCENTAGE"
                        ? `${coupon.value}%`
                        : coupon.type === "FIXED_AMOUNT"
                          ? `৳${coupon.value}`
                          : `+${coupon.value}d`;
                      return (
                        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2 py-1">
                          <span className="material-symbols-outlined text-amber-600 text-[14px]">sell</span>
                          <span className="text-[11px] font-semibold text-amber-700">{label}</span>
                          <span className="text-[11px] font-bold text-amber-900">−{discount}</span>
                        </div>
                      );
                    })()}

                    {/* Current plan indicator */}
                    {isCurrentPlan && (
                      <div className="flex items-center gap-1 mb-2">
                        <span className="material-symbols-outlined text-emerald-600 text-[14px]">check_circle</span>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                          {isBn ? "বর্তমান প্ল্যান" : "Current Plan"}
                        </span>
                      </div>
                    )}

                    {/* Plan name */}
                    <p className="text-base font-bold text-on-surface">
                      {isBn ? plan.displayNameBn : plan.displayNameEn}
                    </p>

                    {/* Price */}
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-primary">৳{formatPrice(price, locale)}</span>
                      <span className="text-xs text-on-surface-variant">{periodLabel}</span>
                    </div>

                    {/* Annual savings */}
                    {billingCycle === "ANNUAL" && plan.annualPriceBdt && (
                      <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                        {isBn
                          ? `মাসিক থেকে ৳${formatPrice(plan.priceBdt * 12 - plan.annualPriceBdt, locale)} সাশ্রয়`
                          : `Save ৳${formatPrice(plan.priceBdt * 12 - plan.annualPriceBdt, locale)} vs monthly`}
                      </p>
                    )}

                    {/* Features list */}
                    <div className="mt-3 space-y-1">
                      <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-primary">storefront</span>
                        {plan.maxBusinesses === -1
                          ? (isBn ? "আনলিমিটেড ব্যবসা" : "Unlimited businesses")
                          : `${isBn ? "সর্বোচ্চ" : "Up to"} ${plan.maxBusinesses} ${isBn ? "টি ব্যবসা" : "businesses"}`}
                      </p>
                      {plan.maxProductsPerBusiness !== null && (
                        <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-primary">inventory_2</span>
                          {plan.maxProductsPerBusiness === -1
                            ? (isBn ? "আনলিমিটেড পণ্য" : "Unlimited products")
                            : `${isBn ? "প্রতি ব্যবসায়" : "Per business"} ${plan.maxProductsPerBusiness} ${isBn ? "টি পণ্য" : "products"}`}
                        </p>
                      )}
                      {plan.aiQueriesPerDay !== null && (
                        <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-primary">psychology</span>
                          {plan.aiQueriesPerDay === -1
                            ? (isBn ? "আনলিমিটেড AI কুয়েরি" : "Unlimited AI queries")
                            : `${plan.aiQueriesPerDay} ${isBn ? "AI কুয়েরি/দিন" : "AI queries/day"}`}
                        </p>
                      )}
                      {plan.features && Object.entries(plan.features)
                        .filter(([key]) => plan.features![key])
                        .slice(0, 3)
                        .map(([key]) => (
                          <p key={key} className="text-xs text-on-surface-variant flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] text-primary">check</span>
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </p>
                        ))
                      }
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════
              SECTION 2.5: Upgrade Proration Breakdown
              ══════════════════════════════════════════════════════ */}
          {proration && proration.isUpgrade && (
            <section className="rounded-[1.5rem] border border-primary/20 bg-primary/5 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">trending_up</span>
                <h2 className="text-base font-bold text-primary">
                  {isBn ? "আপগ্রেড ব্রেকডাউন" : "Upgrade Breakdown"}
                </h2>
              </div>

              {prorationLoading ? (
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  {isBn ? "হিসাব করা হচ্ছে..." : "Calculating..."}
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  {/* Current plan credit */}
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant">
                      {proration.currentPlanName} ({isBn ? "বর্তমান" : "current"})
                    </span>
                    <span className="text-on-surface font-medium">
                      ৳{formatPrice(proration.currentPlanPrice, locale)}
                    </span>
                  </div>

                  {/* Remaining days */}
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant">
                      {isBn
                        ? `বাকি দিন (${proration.remainingDays}/${proration.totalDaysInPeriod})`
                        : `Days remaining (${proration.remainingDays}/${proration.totalDaysInPeriod})`}
                    </span>
                    <span className="text-emerald-600 font-semibold">
                      −৳{formatPrice(proration.proratedCredit, locale)}
                    </span>
                  </div>

                  {/* New plan price */}
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant">
                      {proration.newPlanName}
                    </span>
                    <span className="text-on-surface font-medium">
                      ৳{formatPrice(proration.newPlanPrice, locale)}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-primary/20" />

                  {/* Net upgrade amount */}
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-on-surface">
                      {isBn ? "আপগ্রেড খরচ" : "Upgrade cost"}
                    </span>
                    <span className="text-lg font-black text-primary">
                      ৳{formatPrice(proration.upgradeAmount, locale)}
                    </span>
                  </div>

                  {/* Hint */}
                  {proration.proratedCredit > 0 && (
                    <p className="text-[11px] text-on-surface-variant">
                      {isBn
                        ? `আপনার বর্তমান প্ল্যানের বাকি ${proration.remainingDays} দিনের ক্রেডিট ৳${formatPrice(proration.proratedCredit, locale)} কেটে নেওয়া হবে।`
                        : `Your remaining ${proration.remainingDays} days credit of ৳${formatPrice(proration.proratedCredit, locale)} will be deducted from the new plan price.`}
                    </p>
                  )}
                </div>
              )}
            </section>
          )}

          {/* ══════════════════════════════════════════════════════
              SECTION 3: Coupon & Pricing
              ══════════════════════════════════════════════════════ */}
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-5 space-y-4">
              <h2 className="text-lg font-semibold text-on-surface">
                {isBn ? "কুপন কোড" : "Coupon Code"}
              </h2>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <FormInput
                  label={isBn ? "কুপন কোড" : "Coupon code"}
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                  placeholder={isBn ? "যেমন: EID25" : "e.g. EID25"}
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponApplying || !couponCode.trim() || !selectedPlan}
                  className="self-end rounded-full bg-surface-container-high px-5 py-3 text-sm font-semibold text-on-surface disabled:opacity-50"
                >
                  {couponApplying ? (isBn ? "যাচাই..." : "Applying...") : (isBn ? "কুপন প্রয়োগ" : "Apply")}
                </button>
              </div>

              {/* Pricing summary */}
              <div className="rounded-xl bg-surface-container px-4 py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-on-surface-variant">
                    {isBn ? "মূল মূল্য" : "Original Price"}
                  </p>
                  <p className={`text-sm font-semibold ${appliedCoupon ? "text-on-surface-variant line-through" : "text-primary"}`}>
                    ৳{formatPrice(planPrice, locale)}
                  </p>
                </div>
                {appliedCoupon && couponSavings > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-emerald-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">sell</span>
                      {isBn ? "কুপন ছাড়" : "Coupon Discount"}
                    </p>
                    <p className="text-sm font-bold text-emerald-600">
                      -৳{formatPrice(couponSavings, locale)}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/30">
                  <p className="text-sm font-bold text-on-surface">
                    {isBn ? "পরিশোধযোগ্য" : "Payable"}
                  </p>
                  <p className="text-2xl font-black text-primary">৳{formatPrice(payableAmount, locale)}</p>
                </div>
              </div>
            </section>

            {/* ══════════════════════════════════════════════════════
                SECTION 4: Checkout & Verification
                ══════════════════════════════════════════════════════ */}
            <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-5 space-y-4">
              <h2 className="text-lg font-semibold text-on-surface">
                {isBn ? "চেকআউট ও ভেরিফিকেশন" : "Checkout & Verification"}
              </h2>

              {/* MFS method selector */}
              <div>
                <label className="text-sm font-semibold text-primary">
                  {isBn ? "পেমেন্ট চ্যানেল" : "Payment Channel"}
                </label>
                <div className="flex gap-2 mt-2">
                  {MFS_OPTIONS.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setCheckoutMethod(method)}
                      className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${checkoutMethod === method
                        ? "bg-primary text-white shadow-md"
                        : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container"
                        }`}
                    >
                      {MFS_LABELS[method]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleInitializeCheckout}
                  disabled={checkoutLoading || !selectedPlan}
                  className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {checkoutLoading
                    ? (isBn ? "প্রসেসিং..." : "Processing...")
                    : (isBn ? "পেমেন্ট শুরু করুন" : "Start Payment")}
                </button>
                <button
                  type="button"
                  onClick={() => void refreshPaymentStatus()}
                  disabled={!paymentIntent || checkoutLoading}
                  className="rounded-full bg-surface-container-high px-5 py-3 text-sm font-semibold text-on-surface disabled:opacity-50"
                >
                  {isBn ? "স্ট্যাটাস রিফ্রেশ" : "Refresh Status"}
                </button>
              </div>

              {/* Payment intent details */}
              {paymentIntent && (
                <div className="rounded-xl bg-surface-container px-4 py-4 space-y-3">
                  {/* Receiver number */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-on-surface-variant">
                      {isBn ? "রিসিভার নম্বর" : "Send to"}
                    </p>
                    <p className="text-sm font-bold text-on-surface font-mono tracking-wider">
                      {paymentIntent.receiverNumber}
                    </p>
                  </div>

                  {/* Amount to send */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-on-surface-variant">
                      {isBn ? "পরিমাণ" : "Amount"}
                    </p>
                    <p className="text-sm font-bold text-primary">
                      ৳{formatPrice(payableAmount, locale)}
                    </p>
                  </div>

                  {/* Countdown timer */}
                  {countdown !== null && countdown > 0 && !paymentStatusDone(paymentStatus?.status) && (
                    <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${countdown < 120 ? "bg-red-50 border border-red-200" : "bg-surface-container-low"
                      }`}>
                      <p className={`text-xs font-semibold ${countdown < 120 ? "text-red-600" : "text-on-surface-variant"}`}>
                        {isBn ? "সময় বাকি" : "Time remaining"}
                      </p>
                      <p className={`text-sm font-black font-mono ${countdown < 120 ? "text-red-600" : "text-primary"}`}>
                        {formatCountdown(countdown)}
                      </p>
                    </div>
                  )}

                  {/* TrxID input */}
                  {!paymentStatusDone(paymentStatus?.status) && paymentStatus?.status !== "COMPLETED" && (
                    <>
                      <FormInput
                        label="TrxID"
                        value={trxIdInput}
                        onChange={(event) => {
                          const maxLen = getTrxMaxLength(checkoutMethod);
                          const raw = event.target.value.toUpperCase();
                          setTrxIdInput(raw.length > maxLen ? raw.slice(0, maxLen) : raw);
                        }}
                        maxLength={getTrxMaxLength(checkoutMethod)}
                      />
                      <p className="text-[11px] text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">info</span>
                        {getTrxHint(checkoutMethod, isBn)}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={handleSubmitTrx}
                          disabled={checkoutLoading || !trxIdInput.trim()}
                          className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          {isBn ? "TrxID জমা দিন" : "Submit TrxID"}
                        </button>
                        <button
                          type="button"
                          onClick={handleResubmitPayment}
                          disabled={checkoutLoading || !paymentStatus}
                          className="rounded-full bg-surface-container-high px-5 py-3 text-sm font-semibold text-on-surface disabled:opacity-50"
                        >
                          {isBn ? "রিসাবমিট" : "Resubmit"}
                        </button>
                      </div>
                    </>
                  )}

                  {/* Status display */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-on-surface-variant">
                      {isBn ? "স্ট্যাটাস" : "Status"}
                    </p>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${statusColor(paymentStatus?.status ?? paymentIntent.status)}`}>
                      {statusLabel(paymentStatus?.status ?? paymentIntent.status)}
                    </span>
                  </div>

                  {/* Rejection reason */}
                  {paymentStatus?.status === "REJECTED" && paymentStatus.rejectionReason && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                      <p className="text-xs text-red-700 font-semibold">
                        {isBn ? "প্রত্যাখ্যানের কারণ" : "Rejection Reason"}:
                      </p>
                      <p className="text-xs text-red-600 mt-0.5">{paymentStatus.rejectionReason}</p>
                    </div>
                  )}

                  {/* Completed timestamp */}
                  {paymentStatus?.status === "COMPLETED" && paymentStatus.verifiedAt && (
                    <p className="text-xs text-on-surface-variant">
                      {isBn ? "যাচাইকরণের সময়" : "Verified at"}: {formatDateTime(paymentStatus.verifiedAt, locale)}
                    </p>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* ══════════════════════════════════════════════════════
              SECTION 5: Feature Lock Status (Visual)
              ══════════════════════════════════════════════════════ */}
          <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-5 space-y-4">
            <h2 className="text-lg font-semibold text-on-surface">
              {isBn ? "ফিচার ও ব্যবহার" : "Features & Usage"}
            </h2>

            {/* Usage meters */}
            <div className="grid gap-3 sm:grid-cols-2">
              {planLimits && (
                <>
                  {/* Businesses usage */}
                  <div className="rounded-xl bg-surface-container px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-primary">storefront</span>
                        {isBn ? "ব্যবসা" : "Businesses"}
                      </p>
                      <p className="text-xs font-bold text-on-surface">
                        {planLimits.currentBusinesses}/{planLimits.maxBusinesses === -1 ? "∞" : planLimits.maxBusinesses}
                      </p>
                    </div>
                    {planLimits.maxBusinesses !== -1 && (
                      <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.min(100, (planLimits.currentBusinesses / planLimits.maxBusinesses) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* AI queries */}
                  {planLimits.aiQueriesPerDay !== null && (
                    <div className="rounded-xl bg-surface-container px-4 py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-primary">psychology</span>
                          {isBn ? "AI কুয়েরি/দিন" : "AI Queries/Day"}
                        </p>
                        <p className="text-xs font-bold text-on-surface">
                          {planLimits.aiQueriesPerDay === -1 ? "∞" : planLimits.aiQueriesPerDay}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Products per business */}
                  <div className="rounded-xl bg-surface-container px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-primary">inventory_2</span>
                        {isBn ? "প্রতি ব্যবসায় পণ্য" : "Products/Business"}
                      </p>
                      <p className="text-xs font-bold text-on-surface">
                        {planLimits.maxProductsPerBusiness === -1 ? "∞" : planLimits.maxProductsPerBusiness ?? "—"}
                      </p>
                    </div>
                  </div>

                  {/* Conversation turns */}
                  <div className="rounded-xl bg-surface-container px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-primary">forum</span>
                        {isBn ? "কনভার্সেশন টার্ন" : "Conversation Turns"}
                      </p>
                      <p className="text-xs font-bold text-on-surface">
                        {planLimits.conversationHistoryTurns}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Feature locks */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {(["dueManagementEnabled", "discountEnabled", "voiceEnabled", "textNlpEnabled"] as const).map((key) => {
                const enabled = planLimits?.[key] ?? false;
                return (
                  <div
                    key={key}
                    className={`rounded-xl px-4 py-3 flex items-center gap-3 ${enabled ? "bg-emerald-50 border border-emerald-200" : "bg-gray-50 border border-gray-200"
                      }`}
                  >
                    <span className={`material-symbols-outlined text-xl ${enabled ? "text-emerald-600" : "text-gray-400"}`}>
                      {enabled ? FEATURE_ICONS[key] : "lock"}
                    </span>
                    <div>
                      <p className={`text-xs font-bold ${enabled ? "text-emerald-700" : "text-gray-500"}`}>
                        {isBn ? FEATURE_LABELS_BN[key] : FEATURE_LABELS_EN[key]}
                      </p>
                      <p className={`text-[10px] font-semibold ${enabled ? "text-emerald-500" : "text-gray-400"}`}>
                        {enabled
                          ? (isBn ? "সক্রিয়" : "Enabled")
                          : (isBn ? "লক করা" : "Locked")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════
              SECTION 6: Referral
              ══════════════════════════════════════════════════════ */}
          {referralStatus && (
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
                      {referralStatus.referralCode ?? "—"}
                    </p>
                    {referralStatus.referralCode && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(referralStatus.referralCode!);
                          } catch {
                            const ta = document.createElement("textarea");
                            ta.value = referralStatus.referralCode!;
                            document.body.appendChild(ta);
                            ta.select();
                            document.execCommand("copy");
                            document.body.removeChild(ta);
                          }
                          setReferralCopied(true);
                          setTimeout(() => setReferralCopied(false), 2000);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition bg-primary/10 text-primary hover:bg-primary/20"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {referralCopied ? "check" : "content_copy"}
                        </span>
                        {referralCopied
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
                    {referralStatus.totalReferrals}
                  </p>
                </div>

                {/* Earned credits */}
                <div className="rounded-xl bg-surface-container px-4 py-3">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {isBn ? "অর্জিত ক্রেডিট" : "Earned Credits"}
                  </p>
                  <p className="text-sm font-bold text-on-surface mt-1">
                    {referralStatus.earnedCredits} {isBn ? "দিন" : "days"}
                  </p>
                </div>

                {/* Pending rewards */}
                <div className="rounded-xl bg-surface-container px-4 py-3">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {isBn ? "অপেক্ষমাণ পুরস্কার" : "Pending Rewards"}
                  </p>
                  <p className="text-sm font-bold text-on-surface mt-1">
                    {referralStatus.pendingRewardCount}
                  </p>
                </div>
              </div>

              {/* Referral reward info */}
              {referralStatus.rewardDays > 0 && (
                <p className="text-xs text-on-surface-variant">
                  {isBn
                    ? `প্রতিটি সফল রেফারেলে ${referralStatus.rewardDays} দিনের ফ্রি সাবস্ক্রিপশন পাবেন।`
                    : `Earn ${referralStatus.rewardDays} free subscription days for each successful referral.`}
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
          )}

          {/* ══════════════════════════════════════════════════════
              SECTION 7: Downgrade (if current plan is not lowest)
              ══════════════════════════════════════════════════════ */}
          {currentSubscription && currentPlan && plans.length > 1 && !currentSubscription.downgradeScheduledTo && (
            <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-5 space-y-4">
              <h2 className="text-lg font-semibold text-on-surface">
                {isBn ? "প্ল্যান পরিবর্তন" : "Change Plan"}
              </h2>

              {/* Lower tier plans available for downgrade */}
              {plans
                .filter((p) => p.tierLevel < currentPlan.tierLevel && !p.isTrial)
                .map((plan) => (
                  <div key={plan.id} className="rounded-xl bg-surface-container px-4 py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-on-surface">
                        {isBn ? plan.displayNameBn : plan.displayNameEn}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        ৳{formatPrice(plan.priceBdt, locale)}/{isBn ? "মাস" : "mo"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleValidateDowngrade(plan.id)}
                        disabled={downgradeLoading}
                        className="rounded-full bg-surface-container-high px-4 py-2 text-xs font-bold text-on-surface disabled:opacity-50"
                      >
                        {isBn ? "যাচাই করুন" : "Validate"}
                      </button>
                      {downgradeValidation?.canDowngrade && (
                        <button
                          type="button"
                          onClick={() => void handleScheduleDowngrade(plan.id)}
                          disabled={downgradeLoading}
                          className="rounded-full bg-amber-100 px-4 py-2 text-xs font-bold text-amber-800 disabled:opacity-50"
                        >
                          {isBn ? "ডাউনগ্রেড" : "Downgrade"}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              }

              {/* Downgrade validation results */}
              {downgradeValidation && !downgradeValidation.canDowngrade && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-xs font-bold text-red-700">
                    {isBn ? "ডাউনগ্রেড সম্ভব নয়" : "Cannot downgrade"}
                  </p>
                  {downgradeValidation.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-red-600 mt-1">• {w}</p>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </section>
  );
}
