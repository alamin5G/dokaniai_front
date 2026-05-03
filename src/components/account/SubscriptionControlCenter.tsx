"use client";

import ReferralCodeCard from "@/components/account/ReferralCodeCard";
import { PlanFeatureList } from "@/components/subscription/PlanFeatureList";
import {
  applyCoupon,
  downloadPaymentInvoice,
  getAvailablePlans,
  getCurrentSubscription,
  getPaymentIntentStatus,
  getPaymentHistory,
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
  DowngradeValidation,
  MfsType,
  PaymentInitializeResponse,
  PaymentIntentStatus,
  PaymentIntentStatusResponse,
  PaymentHistoryItem,
  Plan,
  PlanLimits,
  PublicCoupon,
  ReferralStatus,
  Subscription,
  UpgradeProrationResponse,
} from "@/types/subscription";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const MFS_OPTIONS: MfsType[] = ["BKASH", "NAGAD", "ROCKET"];
const MFS_LABELS: Record<MfsType, string> = { BKASH: "bKash", NAGAD: "Nagad", ROCKET: "Rocket" };

const STATUS_LABELS_EN: Record<string, string> = {
  ACTIVE: "Active",
  TRIAL: "Free Trial",
  GRACE: "Grace",
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
  GRACE: "গ্রেস",
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

const FEATURE_LABELS_EN: Record<keyof Pick<PlanLimits, "dueManagementEnabled" | "discountEnabled" | "voiceEnabled" | "textNlpEnabled">, string> = {
  dueManagementEnabled: "Due ledger",
  discountEnabled: "Discount",
  voiceEnabled: "Voice input",
  textNlpEnabled: "Text NLP",
};

const FEATURE_LABELS_BN: typeof FEATURE_LABELS_EN = {
  dueManagementEnabled: "বাকি খাতা",
  discountEnabled: "ডিসকাউন্ট",
  voiceEnabled: "ভয়েস ইনপুট",
  textNlpEnabled: "টেক্সট NLP",
};

function formatPrice(value: number, locale: string) {
  return new Intl.NumberFormat(locale.startsWith("bn") ? "bn-BD" : "en-US").format(value);
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(locale.startsWith("bn") ? "bn-BD" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function paymentDone(status: PaymentIntentStatus | null | undefined) {
  return status === "COMPLETED" || status === "FAILED" || status === "EXPIRED" || status === "REJECTED";
}

function trxMax(method: MfsType) {
  return method === "NAGAD" ? 8 : 10;
}

function validateTrx(value: string, method: MfsType) {
  const trx = value.trim();
  if (!trx) return false;
  if (method === "ROCKET") return /^\d{10}$/.test(trx);
  return new RegExp(`^[A-Z0-9]{${trxMax(method)}}$`).test(trx);
}

function daysLeft(value: string | null | undefined) {
  if (!value) return null;
  return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86400000));
}

export default function SubscriptionControlCenter() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const isBn = locale.startsWith("bn");

  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [referral, setReferral] = useState<ReferralStatus | null>(null);
  const [coupons, setCoupons] = useState<PublicCoupon[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [mfsMethod, setMfsMethod] = useState<MfsType>("BKASH");
  const [paymentIntent, setPaymentIntent] = useState<PaymentInitializeResponse | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentIntentStatusResponse | null>(null);
  const [trxId, setTrxId] = useState("");
  const [downgradeValidation, setDowngradeValidation] = useState<DowngradeValidation | null>(null);
  const [proration, setProration] = useState<UpgradeProrationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"overview" | "plans" | "payment" | "usage">("overview");

  const currentPlan = useMemo(
    () => plans.find((plan) => plan.id === subscription?.planId) ?? subscription?.plan ?? null,
    [plans, subscription],
  );
  const selectedPlan = useMemo(() => plans.find((plan) => plan.id === selectedPlanId) ?? null, [plans, selectedPlanId]);
  const annualAvailable = useMemo(() => plans.some((plan) => !plan.isTrial && plan.priceBdt > 0 && plan.annualPriceBdt != null), [plans]);
  const visiblePlans = useMemo(() => billingCycle === "ANNUAL" ? plans.filter((plan) => !plan.isTrial) : plans, [billingCycle, plans]);
  const selectedPrice = selectedPlan
    ? billingCycle === "ANNUAL" && selectedPlan.annualPriceBdt != null
      ? selectedPlan.annualPriceBdt
      : selectedPlan.priceBdt
    : 0;
  const selectedIsCurrent = Boolean(selectedPlan && subscription?.planId === selectedPlan.id);
  const selectedIsDowngrade = Boolean(selectedPlan && currentPlan && selectedPlan.tierLevel < currentPlan.tierLevel && !selectedPlan.isTrial);
  const selectedIsUpgrade = Boolean(selectedPlan && currentPlan && selectedPlan.tierLevel > currentPlan.tierLevel && !selectedPlan.isTrial);
  const basePayable = selectedIsUpgrade && proration?.isUpgrade ? proration.upgradeAmount : selectedPrice;
  const payable = appliedCoupon?.finalAmount ?? basePayable;
  const couponSavings = appliedCoupon ? appliedCoupon.originalAmount - appliedCoupon.finalAmount : 0;
  const statusLabel = (status?: string | null) => isBn ? STATUS_LABELS_BN[status ?? ""] ?? status ?? "—" : STATUS_LABELS_EN[status ?? ""] ?? status ?? "—";
  const selectedLabel = selectedPlan ? (isBn ? selectedPlan.displayNameBn : selectedPlan.displayNameEn) : "—";
  const currentLabel = currentPlan ? (isBn ? currentPlan.displayNameBn : currentPlan.displayNameEn) : "—";
  const periodEndDays = daysLeft(subscription?.currentPeriodEnd);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [planData, limitData, couponData] = await Promise.all([
        getAvailablePlans(),
        getPlanLimits(),
        getPublicCoupons().catch(() => []),
      ]);
      const activePlans = planData.filter((plan) => plan.isActive);
      setPlans(activePlans);
      setLimits(limitData);
      setCoupons(couponData);

      const current = await getCurrentSubscription().catch(() => null);
      const planFromUrl = searchParams.get("plan");
      const billingFromUrl = searchParams.get("billing") === "ANNUAL" ? "ANNUAL" : searchParams.get("billing") === "MONTHLY" ? "MONTHLY" : null;
      const initialPlanId = activePlans.find((plan) => plan.id === planFromUrl)?.id;
      setSubscription(current);
      setSelectedPlanId(initialPlanId ?? current?.planId ?? activePlans.find((plan) => !plan.isTrial)?.id ?? activePlans[0]?.id ?? "");
      if (billingFromUrl) setBillingCycle(billingFromUrl);
      else if (current?.billingCycle) setBillingCycle(current.billingCycle);
      if (initialPlanId) setActiveView("plans");
      setReferral(await getReferralStatus().catch(() => null));
      setPaymentHistory(await getPaymentHistory().catch(() => []));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : isBn ? "সাবস্ক্রিপশন তথ্য লোড করা যায়নি।" : "Could not load subscription data.");
    } finally {
      setLoading(false);
    }
  }, [isBn, searchParams]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selectedPlan || !currentPlan || selectedPlan.tierLevel <= currentPlan.tierLevel) {
      setProration(null);
      return;
    }
    getUpgradeProration(selectedPlan.id, billingCycle).then(setProration).catch(() => setProration(null));
  }, [billingCycle, currentPlan, selectedPlan]);

  const refreshPaymentStatus = useCallback(async () => {
    if (!paymentIntent) return;
    const status = await getPaymentIntentStatus(paymentIntent.paymentIntentId);
    setPaymentStatus(status);
    if (status.status === "COMPLETED") {
      invalidateCurrentSubscriptionCache();
      setSubscription(await getCurrentSubscription());
      setNotice(isBn ? "পেমেন্ট সফল। সাবস্ক্রিপশন আপডেট হয়েছে।" : "Payment completed. Subscription updated.");
    }
  }, [isBn, paymentIntent]);

  useEffect(() => {
    if (!paymentIntent || paymentDone(paymentStatus?.status)) return;
    const intervalId = window.setInterval(() => void refreshPaymentStatus().catch(() => undefined), 6000);
    return () => window.clearInterval(intervalId);
  }, [paymentIntent, paymentStatus?.status, refreshPaymentStatus]);

  useEffect(() => {
    const onSubscriptionChanged = () => void loadData();
    const onPaymentChanged = () => void refreshPaymentStatus().catch(() => undefined);
    window.addEventListener("sse:subscription-changed", onSubscriptionChanged);
    window.addEventListener("sse:payment-status-changed", onPaymentChanged);
    return () => {
      window.removeEventListener("sse:subscription-changed", onSubscriptionChanged);
      window.removeEventListener("sse:payment-status-changed", onPaymentChanged);
    };
  }, [loadData, refreshPaymentStatus]);

  async function applySelectedCoupon() {
    if (!selectedPlan || !couponCode.trim()) return;
    setBusy(true);
    try {
      setAppliedCoupon(await applyCoupon(couponCode.trim(), selectedPlan.id, basePayable));
      setNotice(isBn ? "কুপন প্রয়োগ হয়েছে।" : "Coupon applied.");
    } catch (error) {
      setAppliedCoupon(null);
      setNotice(error instanceof Error ? error.message : isBn ? "কুপন প্রয়োগ করা যায়নি।" : "Could not apply coupon.");
    } finally {
      setBusy(false);
    }
  }

  async function startPayment() {
    if (!selectedPlan) return;
    setBusy(true);
    try {
      const intent = await initializePaymentIntent({
        planId: selectedPlan.id,
        amount: payable,
        mfsMethod,
        couponCode: appliedCoupon?.code ?? (couponCode.trim() || undefined),
        billingCycle,
      });
      setPaymentIntent(intent);
      setActiveView("payment");
      setPaymentStatus({
        paymentIntentId: intent.paymentIntentId,
        status: intent.status,
        verifiedAt: null,
        failedAttempts: 0,
        fraudFlag: false,
        expiresAt: intent.expiresAt ?? null,
        rejectionReason: null,
      });
      setNotice(isBn ? "পেমেন্ট তৈরি হয়েছে। এখন TrxID দিন।" : "Payment created. Submit TrxID now.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : isBn ? "পেমেন্ট শুরু করা যায়নি।" : "Could not start payment.");
    } finally {
      setBusy(false);
    }
  }

  async function submitTrx() {
    if (!paymentIntent || !validateTrx(trxId, mfsMethod)) return;
    setBusy(true);
    try {
      setPaymentStatus(await submitPaymentTrx(paymentIntent.paymentIntentId, trxId.trim()));
      setNotice(isBn ? "TrxID জমা হয়েছে।" : "TrxID submitted.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : isBn ? "TrxID জমা দেওয়া যায়নি।" : "Could not submit TrxID.");
    } finally {
      setBusy(false);
    }
  }

  async function validateSelectedDowngrade() {
    if (!selectedPlan) return;
    setBusy(true);
    try {
      setDowngradeValidation(await validateDowngrade(selectedPlan.id));
      setActiveView("plans");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : isBn ? "ডাউনগ্রেড যাচাই করা যায়নি।" : "Could not validate downgrade.");
    } finally {
      setBusy(false);
    }
  }

  async function scheduleSelectedDowngrade() {
    if (!selectedPlan || !downgradeValidation?.canDowngrade) return;
    setBusy(true);
    try {
      setSubscription(await scheduleDowngrade(selectedPlan.id));
      setNotice(isBn ? "ডাউনগ্রেড পিরিয়ড শেষে কার্যকর হবে।" : "Downgrade scheduled for period end.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : isBn ? "ডাউনগ্রেড করা যায়নি।" : "Could not schedule downgrade.");
    } finally {
      setBusy(false);
    }
  }

  async function cancelDowngrade() {
    setBusy(true);
    try {
      await apiClient.delete("/subscriptions/downgrade");
      invalidateCurrentSubscriptionCache();
      setSubscription(await getCurrentSubscription());
      setNotice(isBn ? "ডাউনগ্রেড বাতিল হয়েছে।" : "Downgrade cancelled.");
    } finally {
      setBusy(false);
    }
  }

  async function downloadInvoice(payment: PaymentHistoryItem) {
    try {
      const blob = await downloadPaymentInvoice(payment.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dokaniai-invoice-${payment.merchantRef ?? payment.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : isBn ? "ইনভয়েস ডাউনলোড করা যায়নি।" : "Could not download invoice.");
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-outline-variant/30 bg-surface p-6 text-sm text-on-surface-variant">
        {isBn ? "সাবস্ক্রিপশন তথ্য লোড হচ্ছে..." : "Loading subscription data..."}
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <header className="rounded-lg border border-outline-variant/30 bg-surface p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">{isBn ? "বিলিং ও অ্যাক্সেস" : "Billing and access"}</p>
            <h1 className="mt-1 text-2xl font-bold text-on-surface">{isBn ? "সাবস্ক্রিপশন সেন্টার" : "Subscription Center"}</h1>
            <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">
              {isBn ? "বর্তমান প্ল্যান, লিমিট, পেমেন্ট ও ডাউনগ্রেড নিয়ম আলাদা workflow-তে সাজানো।" : "Current plan, limits, payments, and downgrade rules are separated into focused workflows."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[560px]">
            {[
              [isBn ? "বর্তমান" : "Current", currentLabel],
              [isBn ? "সাইকেল" : "Cycle", subscription?.billingCycle === "ANNUAL" ? (isBn ? "বার্ষিক" : "Annual") : (isBn ? "মাসিক" : "Monthly")],
              [subscription?.cancelAtPeriodEnd ? (isBn ? "শেষ" : "Expires") : (isBn ? "নবায়ন" : "Renews"), formatDate(subscription?.currentPeriodEnd, locale)],
              [isBn ? "স্ট্যাটাস" : "Status", statusLabel(subscription?.status)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md bg-surface-container px-3 py-2">
                <p className="text-[10px] font-bold uppercase text-on-surface-variant">{label}</p>
                <p className="mt-1 truncate text-sm font-bold text-on-surface">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {notice && <div className="rounded-lg border border-outline-variant/30 bg-surface-container px-4 py-3 text-sm text-on-surface">{notice}</div>}

      <nav className="grid gap-2 rounded-lg border border-outline-variant/30 bg-surface p-2 sm:grid-cols-4">
        {[
          ["overview", isBn ? "ওভারভিউ" : "Overview"],
          ["plans", isBn ? "প্ল্যান" : "Plans"],
          ["payment", isBn ? "পেমেন্ট" : "Payment"],
          ["usage", isBn ? "লিমিট" : "Limits"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveView(key as "overview" | "plans" | "payment" | "usage")}
            className={`rounded-md px-4 py-2.5 text-sm font-bold transition ${
              activeView === key ? "bg-primary text-white" : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <main className="space-y-6">
          {activeView === "overview" && (
            <section className="rounded-lg border border-outline-variant/30 bg-surface p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-bold text-primary">{isBn ? "বর্তমান সাবস্ক্রিপশন" : "Current subscription"}</p>
                  <h2 className="mt-1 text-3xl font-black text-on-surface">{currentLabel}</h2>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    {isBn
                      ? `${subscription?.billingCycle === "ANNUAL" ? "বার্ষিক" : "মাসিক"} বিলিং, ${formatDate(subscription?.currentPeriodEnd, locale)} পর্যন্ত সক্রিয়।`
                      : `${subscription?.billingCycle === "ANNUAL" ? "Annual" : "Monthly"} billing, active until ${formatDate(subscription?.currentPeriodEnd, locale)}.`}
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button type="button" onClick={() => setActiveView("plans")} className="rounded-md bg-primary px-5 py-3 text-sm font-bold text-white">
                    {isBn ? "প্ল্যান পরিবর্তন" : "Change plan"}
                  </button>
                  <button type="button" onClick={() => setActiveView("usage")} className="rounded-md bg-surface-container-high px-5 py-3 text-sm font-bold text-on-surface">
                    {isBn ? "লিমিট দেখুন" : "View limits"}
                  </button>
                </div>
              </div>
            </section>
          )}

          {subscription?.downgradeScheduledTo && (
            <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-amber-800">{isBn ? "ডাউনগ্রেড নির্ধারিত" : "Downgrade scheduled"}</p>
                  <p className="mt-1 text-xs text-amber-700">
                    {isBn ? "বর্তমান পিরিয়ড শেষে নতুন প্ল্যান কার্যকর হবে।" : "The target plan will apply at the end of the current period."}
                  </p>
                </div>
                <button type="button" onClick={() => void cancelDowngrade()} disabled={busy} className="rounded-md bg-amber-100 px-4 py-2 text-xs font-bold text-amber-900 disabled:opacity-50">
                  {isBn ? "বাতিল করুন" : "Cancel"}
                </button>
              </div>
            </section>
          )}

          {activeView === "plans" && <section className="rounded-lg border border-outline-variant/30 bg-surface p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-on-surface">{isBn ? "প্ল্যান নির্বাচন" : "Choose a plan"}</h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {isBn ? "ডাউনগ্রেড করার আগে limit যাচাই হবে। আপগ্রেড হলে পেমেন্ট শুরু হবে।" : "Downgrades validate limits first. Upgrades start payment."}
                </p>
              </div>
              <div className="inline-flex w-fit rounded-full border border-outline-variant/40 bg-surface-container-low p-1">
                <button type="button" onClick={() => { setBillingCycle("MONTHLY"); setAppliedCoupon(null); }} className={`rounded-full px-4 py-2 text-xs font-bold ${billingCycle === "MONTHLY" ? "bg-primary text-white" : "text-on-surface-variant"}`}>
                  {isBn ? "মাসিক" : "Monthly"}
                </button>
                <button type="button" disabled={!annualAvailable} onClick={() => { setBillingCycle("ANNUAL"); setAppliedCoupon(null); }} className={`rounded-full px-4 py-2 text-xs font-bold ${billingCycle === "ANNUAL" ? "bg-primary text-white" : "text-on-surface-variant"} ${!annualAvailable ? "cursor-not-allowed opacity-50" : ""}`}>
                  {isBn ? "বার্ষিক" : "Annual"}
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {visiblePlans.map((plan) => {
                const isCurrent = subscription?.planId === plan.id;
                const isSelected = selectedPlanId === plan.id;
                const price = billingCycle === "ANNUAL" && plan.annualPriceBdt != null ? plan.annualPriceBdt : plan.priceBdt;
                const lower = currentPlan ? plan.tierLevel < currentPlan.tierLevel && !plan.isTrial : false;
                const higher = currentPlan ? plan.tierLevel > currentPlan.tierLevel && !plan.isTrial : false;
                const planCoupon = coupons.find((coupon) => !coupon.applicablePlans || coupon.applicablePlans.length === 0 || coupon.applicablePlans.includes(plan.id));
                return (
                  <button key={plan.id} type="button" onClick={() => { if (!isCurrent) { setSelectedPlanId(plan.id); setAppliedCoupon(null); setDowngradeValidation(null); setActiveView("plans"); } }} className={`relative min-h-[210px] rounded-lg border p-4 text-left transition ${isSelected ? "border-primary bg-primary/5 shadow-sm" : isCurrent ? "border-emerald-300 bg-emerald-50" : "border-outline-variant/30 bg-surface hover:border-primary/40"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-bold text-on-surface">{isBn ? plan.displayNameBn : plan.displayNameEn}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">{lower ? (isBn ? "ডাউনগ্রেড" : "Downgrade") : higher ? (isBn ? "আপগ্রেড" : "Upgrade") : isCurrent ? (isBn ? "বর্তমান" : "Current") : plan.isTrial ? (isBn ? "ট্রায়াল" : "Trial") : (isBn ? "নতুন প্ল্যান" : "New plan")}</p>
                      </div>
                      {(plan.badge || isCurrent) && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isCurrent ? "bg-emerald-100 text-emerald-700" : "bg-primary text-white"}`}>{isCurrent ? (isBn ? "বর্তমান" : "Current") : plan.badge}</span>}
                    </div>
                    <div className="mt-4">
                      <span className="text-2xl font-black text-primary">৳{formatPrice(price, locale)}</span>
                      <span className="ml-1 text-xs text-on-surface-variant">{billingCycle === "ANNUAL" && plan.annualPriceBdt != null ? (isBn ? "/বছর" : "/yr") : (isBn ? "/মাস" : "/mo")}</span>
                    </div>
                    {planCoupon && <p className="mt-2 inline-flex rounded-md bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">{isBn ? planCoupon.displayLabelBn ?? planCoupon.code : planCoupon.displayLabelEn ?? planCoupon.code}</p>}
                    <div className="mt-4"><PlanFeatureList plan={plan} isBn={isBn} maxItems={4} compact /></div>
                  </button>
                );
              })}
            </div>
          </section>}

          {activeView === "plans" && proration?.isUpgrade && (
            <section className="rounded-lg border border-primary/20 bg-primary/5 p-5">
              <h2 className="text-base font-bold text-primary">{isBn ? "প্রো-রাটা আপগ্রেড হিসাব" : "Prorated upgrade calculation"}</h2>
              <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                {isBn
                  ? `সূত্র: বর্তমান প্ল্যানের মূল্য ÷ ${proration.totalDaysInPeriod} দিন × বাকি ${proration.remainingDays} দিন = অব্যবহৃত দিনের ক্রেডিট।`
                  : `Formula: current plan price ÷ ${proration.totalDaysInPeriod} days × ${proration.remainingDays} remaining days = unused-day credit.`}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-md bg-surface px-3 py-2"><p className="text-[10px] font-bold uppercase text-on-surface-variant">{isBn ? "অব্যবহৃত দিনের ক্রেডিট" : "Unused-day credit"}</p><p className="font-bold text-emerald-600">-৳{formatPrice(proration.proratedCredit, locale)}</p></div>
                <div className="rounded-md bg-surface px-3 py-2"><p className="text-[10px] font-bold uppercase text-on-surface-variant">{isBn ? "নতুন প্ল্যানের মূল্য" : "Target plan price"}</p><p className="font-bold text-on-surface">৳{formatPrice(proration.newPlanPrice, locale)}</p></div>
                <div className="rounded-md bg-surface px-3 py-2"><p className="text-[10px] font-bold uppercase text-on-surface-variant">{isBn ? "এখন পরিশোধযোগ্য" : "Payable now"}</p><p className="font-bold text-primary">৳{formatPrice(proration.upgradeAmount, locale)}</p></div>
              </div>
              <button type="button" onClick={() => setActiveView("payment")} className="mt-4 rounded-md bg-primary px-5 py-3 text-sm font-bold text-white">
                {isBn ? "পেমেন্টে যান" : "Go to payment"}
              </button>
            </section>
          )}

          {(activeView === "payment" || (activeView === "plans" && selectedIsDowngrade)) && <section className="rounded-lg border border-outline-variant/30 bg-surface p-5">
            <h2 className="text-lg font-bold text-on-surface">{selectedIsDowngrade ? (isBn ? "ডাউনগ্রেড যাচাই" : "Downgrade validation") : (isBn ? "চেকআউট" : "Checkout")}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              {selectedIsDowngrade ? (isBn ? "বর্তমান ব্যবহার target plan limit-এর মধ্যে আছে কিনা যাচাই করুন।" : "Check whether current usage fits the target plan limits.") : (isBn ? `${selectedLabel} প্ল্যানের পেমেন্ট শুরু করুন।` : `Start payment for ${selectedLabel}.`)}
            </p>

            {selectedIsCurrent ? (
              <div className="mt-4 rounded-md bg-surface-container px-4 py-3 text-sm text-on-surface-variant">{isBn ? "এটি আপনার বর্তমান প্ল্যান।" : "This is your current plan."}</div>
            ) : selectedIsDowngrade ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => void validateSelectedDowngrade()} disabled={busy || !selectedPlan} className="rounded-md bg-surface-container-high px-5 py-3 text-sm font-bold text-on-surface disabled:opacity-50">{isBn ? "লিমিট যাচাই" : "Validate limits"}</button>
                  <button type="button" onClick={() => void scheduleSelectedDowngrade()} disabled={busy || !downgradeValidation?.canDowngrade} className="rounded-md bg-amber-500 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{isBn ? "ডাউনগ্রেড নির্ধারণ" : "Schedule downgrade"}</button>
                </div>
                {downgradeValidation && (
                  <div className={`rounded-md border px-4 py-3 text-sm ${downgradeValidation.canDowngrade ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                    <p className="font-bold">{downgradeValidation.canDowngrade ? (isBn ? "ডাউনগ্রেড করা যাবে" : "Downgrade allowed") : (isBn ? "ডাউনগ্রেড ব্লক" : "Downgrade blocked")}</p>
                    {downgradeValidation.warnings.map((warning, index) => <p key={index} className="mt-1 text-xs">• {warning}</p>)}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <label className="grid gap-1 text-sm font-semibold text-on-surface">
                      {isBn ? "কুপন কোড" : "Coupon code"}
                      <input value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} className="h-11 rounded-md border border-outline-variant/60 bg-surface px-3 text-sm outline-none focus:border-primary" placeholder={isBn ? "যেমন EID25" : "e.g. EID25"} />
                    </label>
                    <button type="button" onClick={() => void applySelectedCoupon()} disabled={busy || !couponCode.trim() || !selectedPlan} className="self-end rounded-md bg-surface-container-high px-5 py-3 text-sm font-bold text-on-surface disabled:opacity-50">{isBn ? "প্রয়োগ" : "Apply"}</button>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary">{isBn ? "পেমেন্ট চ্যানেল" : "Payment channel"}</p>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {MFS_OPTIONS.map((method) => <button key={method} type="button" onClick={() => setMfsMethod(method)} className={`rounded-md py-2.5 text-sm font-bold ${mfsMethod === method ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant"}`}>{MFS_LABELS[method]}</button>)}
                    </div>
                  </div>
                  <button type="button" onClick={() => void startPayment()} disabled={busy || !selectedPlan} className="w-full rounded-md bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? (isBn ? "প্রসেসিং..." : "Processing...") : selectedIsUpgrade ? (isBn ? "আপগ্রেড পেমেন্ট" : "Start upgrade payment") : (isBn ? "পেমেন্ট শুরু" : "Start payment")}</button>
                </div>
                <div className="rounded-lg bg-surface-container p-4">
                  <p className="text-sm font-bold text-on-surface">{isBn ? "সারাংশ" : "Summary"}</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-on-surface-variant">{selectedIsUpgrade ? (isBn ? "প্রো-রাটা পেমেন্ট" : "Prorated amount") : selectedLabel}</span><span className="font-semibold">৳{formatPrice(basePayable, locale)}</span></div>
                    {couponSavings > 0 && <div className="flex justify-between text-emerald-600"><span>{isBn ? "কুপন" : "Coupon"}</span><span className="font-bold">-৳{formatPrice(couponSavings, locale)}</span></div>}
                    <div className="flex justify-between border-t border-outline-variant/30 pt-2"><span className="font-bold">{isBn ? "পরিশোধযোগ্য" : "Payable"}</span><span className="text-xl font-black text-primary">৳{formatPrice(payable, locale)}</span></div>
                  </div>
                </div>
              </div>
            )}

            {paymentIntent && !selectedIsDowngrade && (
              <div className="mt-5 rounded-lg border border-outline-variant/30 bg-surface-container p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div><p className="text-[10px] font-bold uppercase text-on-surface-variant">{isBn ? "রিসিভার" : "Send to"}</p><p className="font-mono text-sm font-bold">{paymentIntent.receiverNumber}</p></div>
                  <div><p className="text-[10px] font-bold uppercase text-on-surface-variant">{isBn ? "পরিমাণ" : "Amount"}</p><p className="text-sm font-bold text-primary">৳{formatPrice(payable, locale)}</p></div>
                  <div><p className="text-[10px] font-bold uppercase text-on-surface-variant">{isBn ? "স্ট্যাটাস" : "Status"}</p><p className="text-sm font-bold">{statusLabel(paymentStatus?.status ?? paymentIntent.status)}</p></div>
                </div>
                {!paymentDone(paymentStatus?.status) && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                    <label className="grid gap-1 text-sm font-semibold text-on-surface">
                      TrxID
                      <input value={trxId} onChange={(event) => setTrxId(event.target.value.toUpperCase().slice(0, trxMax(mfsMethod)))} className="h-11 rounded-md border border-outline-variant/60 bg-surface px-3 font-mono text-sm outline-none focus:border-primary" />
                    </label>
                    <button type="button" onClick={() => void submitTrx()} disabled={busy || !validateTrx(trxId, mfsMethod)} className="self-end rounded-md bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{isBn ? "জমা" : "Submit"}</button>
                    <button type="button" onClick={() => paymentIntent && void resubmitPaymentIntent(paymentIntent.paymentIntentId).then(setPaymentStatus)} disabled={busy || !paymentStatus} className="self-end rounded-md bg-surface-container-high px-5 py-3 text-sm font-bold text-on-surface disabled:opacity-50">{isBn ? "রিসাবমিট" : "Resubmit"}</button>
                  </div>
                )}
              </div>
            )}

            {activeView === "payment" && (
              <div className="mt-6 rounded-lg border border-outline-variant/30 bg-surface-container p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-bold text-on-surface">{isBn ? "বিলিং হিস্ট্রি" : "Billing history"}</h3>
                    <p className="text-xs text-on-surface-variant">
                      {isBn ? "প্রতিটি সম্পন্ন পেমেন্টের ইনভয়েস এখান থেকে ডাউনলোড করা যাবে।" : "Download invoices for completed payments from here."}
                    </p>
                  </div>
                </div>
                <div className="mt-4 divide-y divide-outline-variant/30 overflow-hidden rounded-md border border-outline-variant/30 bg-surface">
                  {paymentHistory.length === 0 ? (
                    <p className="px-4 py-5 text-sm text-on-surface-variant">{isBn ? "এখনো কোনো পেমেন্ট হিস্ট্রি নেই।" : "No payment history yet."}</p>
                  ) : paymentHistory.map((payment) => (
                    <div key={payment.id} className="grid gap-3 px-4 py-3 text-sm md:grid-cols-[1fr_auto_auto] md:items-center">
                      <div>
                        <p className="font-bold text-on-surface">{payment.merchantRef ?? payment.id}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {payment.method} · {statusLabel(payment.status)} · {formatDate(payment.paidAt ?? payment.createdAt, locale)}
                        </p>
                      </div>
                      <p className="font-black text-primary">৳{formatPrice(payment.amountBdt, locale)}</p>
                      <button
                        type="button"
                        onClick={() => void downloadInvoice(payment)}
                        disabled={payment.status !== "COMPLETED"}
                        className="rounded-md bg-surface-container-high px-4 py-2 text-xs font-bold text-on-surface disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isBn ? "ইনভয়েস" : "Invoice"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>}

          {activeView === "usage" && (
            <section className="rounded-lg border border-outline-variant/30 bg-surface p-5">
              <h2 className="text-lg font-bold text-on-surface">{isBn ? "সাবস্ক্রিপশন লিমিট" : "Subscription limits"}</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                {isBn ? "এই লিমিটগুলো backend resolver এবং interceptor flow দিয়ে enforce হয়।" : "These limits are enforced by the backend resolver and interceptor flow."}
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {[
                  [isBn ? "ব্যবসা" : "Businesses", limits ? `${limits.currentBusinesses}/${limits.maxBusinesses === -1 ? "∞" : limits.maxBusinesses}` : "—"],
                  [isBn ? "পণ্য/ব্যবসা" : "Products/business", limits?.maxProductsPerBusiness === -1 ? "∞" : limits?.maxProductsPerBusiness ?? "—"],
                  [isBn ? "AI কুয়েরি/দিন" : "AI queries/day", limits?.aiQueriesPerDay === -1 ? "∞" : limits?.aiQueriesPerDay ?? "—"],
                  [isBn ? "কথোপকথন হিস্ট্রি" : "Conversation turns", limits?.conversationHistoryTurns === -1 ? "∞" : limits?.conversationHistoryTurns ?? "—"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md bg-surface-container px-4 py-3">
                    <p className="text-xs font-bold uppercase text-on-surface-variant">{label}</p>
                    <p className="mt-1 text-xl font-black text-on-surface">{value}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        <aside className="space-y-6">
          <section className="rounded-lg border border-outline-variant/30 bg-surface p-5">
            <h2 className="text-lg font-bold text-on-surface">{isBn ? "ব্যবহার ও লিমিট" : "Usage and limits"}</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-md bg-surface-container px-4 py-3">
                <div className="flex items-center justify-between text-sm"><span className="font-semibold text-on-surface-variant">{isBn ? "ব্যবসা" : "Businesses"}</span><span className="font-bold">{limits ? `${limits.currentBusinesses}/${limits.maxBusinesses === -1 ? "∞" : limits.maxBusinesses}` : "—"}</span></div>
                {limits && limits.maxBusinesses > 0 && <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-container-high"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (limits.currentBusinesses / limits.maxBusinesses) * 100)}%` }} /></div>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md bg-surface-container px-3 py-3"><p className="text-[10px] font-bold uppercase text-on-surface-variant">{isBn ? "পণ্য/ব্যবসা" : "Products/business"}</p><p className="font-bold">{limits?.maxProductsPerBusiness === -1 ? "∞" : limits?.maxProductsPerBusiness ?? "—"}</p></div>
                <div className="rounded-md bg-surface-container px-3 py-3"><p className="text-[10px] font-bold uppercase text-on-surface-variant">{isBn ? "AI/দিন" : "AI/day"}</p><p className="font-bold">{limits?.aiQueriesPerDay === -1 ? "∞" : limits?.aiQueriesPerDay ?? "—"}</p></div>
                <div className="rounded-md bg-surface-container px-3 py-3"><p className="text-[10px] font-bold uppercase text-on-surface-variant">{isBn ? "টোকেন" : "Tokens"}</p><p className="font-bold">{limits?.maxAiTokensPerQuery ?? "—"}</p></div>
                <div className="rounded-md bg-surface-container px-3 py-3"><p className="text-[10px] font-bold uppercase text-on-surface-variant">{isBn ? "টার্ন" : "Turns"}</p><p className="font-bold">{limits?.conversationHistoryTurns === -1 ? "∞" : limits?.conversationHistoryTurns ?? "—"}</p></div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {(["dueManagementEnabled", "discountEnabled", "voiceEnabled", "textNlpEnabled"] as const).map((key) => {
                const enabled = limits?.[key] ?? false;
                return <div key={key} className={`rounded-md border px-3 py-2 ${enabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-outline-variant/30 bg-surface-container text-on-surface-variant"}`}><p className="text-xs font-bold">{isBn ? FEATURE_LABELS_BN[key] : FEATURE_LABELS_EN[key]}</p><p className="text-[10px] font-semibold">{enabled ? (isBn ? "চালু" : "Enabled") : (isBn ? "লক" : "Locked")}</p></div>;
              })}
            </div>
          </section>

          <ReferralCodeCard referralStatus={referral} />

          {periodEndDays !== null && periodEndDays <= 7 && periodEndDays > 0 && (
            <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-bold">{isBn ? `${periodEndDays} দিন বাকি` : `${periodEndDays} days remaining`}</p>
              <p className="mt-1 text-xs">{isBn ? "সার্ভিস বন্ধ হওয়ার আগে নবায়ন করুন।" : "Renew before service interruption."}</p>
            </section>
          )}
        </aside>
      </div>
    </section>
  );
}
