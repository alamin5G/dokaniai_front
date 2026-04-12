"use client";

import { FormInput } from "@/components/ui/FormPrimitives";
import {
  applyCoupon,
  getAvailablePlans,
  getCurrentSubscription,
  getPaymentIntentStatus,
  getPlanLimits,
  initializePaymentIntent,
  resubmitPaymentIntent,
  submitPaymentTrx,
} from "@/lib/subscriptionApi";
import type {
  AppliedCoupon,
  MfsType,
  PaymentInitializeResponse,
  PaymentIntentStatus,
  PaymentIntentStatusResponse,
  Plan,
  PlanLimits,
  Subscription,
} from "@/types/subscription";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";

const MFS_OPTIONS: MfsType[] = ["BKASH", "NAGAD", "ROCKET"];

function formatPlanPrice(price: number, locale: string): string {
  return new Intl.NumberFormat(locale.startsWith("bn") ? "bn-BD" : "en-US").format(price);
}

function paymentStatusDone(status: PaymentIntentStatus | null | undefined): boolean {
  return status === "COMPLETED" || status === "FAILED" || status === "EXPIRED";
}

export default function SubscriptionPage() {
  const locale = useLocale();
  const isBn = locale.startsWith("bn");

  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponApplying, setCouponApplying] = useState(false);
  const [checkoutMethod, setCheckoutMethod] = useState<MfsType>("BKASH");
  const [paymentIntent, setPaymentIntent] = useState<PaymentInitializeResponse | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentIntentStatusResponse | null>(null);
  const [trxIdInput, setTrxIdInput] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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
        } else if (allPlans.length > 0) {
          const fallbackPlan = allPlans.find((plan) => !plan.isTrial) ?? allPlans[0];
          setSelectedPlanId(fallbackPlan.id);
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

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? null;
  const payableAmount = appliedCoupon?.finalAmount ?? selectedPlan?.priceBdt ?? 0;

  const refreshPaymentStatus = async () => {
    if (!paymentIntent) return;
    try {
      const status = await getPaymentIntentStatus(paymentIntent.paymentIntentId);
      setPaymentStatus(status);
      if (status.status === "COMPLETED") {
        setNotice(
          isBn
            ? "পেমেন্ট সফল হয়েছে। সাবস্ক্রিপশন আপডেট হয়েছে।"
            : "Payment completed and subscription updated.",
        );
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
  };

  useEffect(() => {
    if (!paymentIntent || !paymentStatus || paymentStatusDone(paymentStatus.status)) return;
    const intervalId = window.setInterval(() => {
      void refreshPaymentStatus();
    }, 6000);
    return () => window.clearInterval(intervalId);
  }, [paymentIntent, paymentStatus]);

  const handleApplyCoupon = async () => {
    if (!selectedPlan || !couponCode.trim()) {
      setNotice(isBn ? "প্ল্যান এবং কুপন কোড দিন।" : "Select a plan and enter a coupon code.");
      return;
    }
    setCouponApplying(true);
    try {
      const result = await applyCoupon(couponCode.trim(), selectedPlan.id, selectedPlan.priceBdt);
      setAppliedCoupon(result);
      setNotice(isBn ? "কুপন প্রয়োগ হয়েছে।" : "Coupon applied.");
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
      });
      setPaymentIntent(intent);
      setPaymentStatus({
        paymentIntentId: intent.paymentIntentId,
        status: intent.status,
        verifiedAt: null,
        failedAttempts: 0,
        fraudFlag: false,
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
      setNotice(isBn ? "TrxID জমা হয়েছে। ভেরিফিকেশন চলছে।" : "TrxID submitted. Verification in progress.");
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
      setNotice(isBn ? "পেমেন্ট ইনটেন্ট রিসেট হয়েছে।" : "Payment intent reset.");
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

  return (
    <section className="space-y-6">
      <header className="rounded-[1.75rem] border border-outline-variant/30 bg-surface p-6">
        <h1 className="text-2xl font-bold text-on-surface">{isBn ? "সাবস্ক্রিপশন ও বিলিং" : "Subscription and Billing"}</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          {isBn ? "প্ল্যান, কুপন, পেমেন্ট ইন্টেন্ট ও ফিচার লক এখানে ম্যানেজ করুন।" : "Manage plan, coupon, payment intent, and feature locks here."}
        </p>
      </header>

      {notice ? (
        <div className="rounded-[1rem] border border-outline-variant/30 bg-surface-container px-4 py-3 text-sm text-on-surface">
          {notice}
        </div>
      ) : null}
      {billingError ? (
        <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{billingError}</div>
      ) : null}
      {billingLoading ? (
        <div className="rounded-[1rem] border border-outline-variant/30 bg-surface p-5 text-sm text-on-surface-variant">
          {isBn ? "সাবস্ক্রিপশন তথ্য লোড হচ্ছে..." : "Loading subscription data..."}
        </div>
      ) : null}

      {!billingLoading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-5 space-y-4">
            <h2 className="text-lg font-semibold text-on-surface">{isBn ? "প্ল্যান ও কুপন" : "Plan and coupon"}</h2>
            <p className="text-sm text-on-surface-variant">
              {currentSubscription
                ? `${isBn ? "বর্তমান স্ট্যাটাস" : "Current status"}: ${currentSubscription.status}`
                : isBn
                  ? "সক্রিয় সাবস্ক্রিপশন নেই।"
                  : "No active subscription."}
            </p>
            <label className="text-sm font-semibold text-primary">{isBn ? "প্ল্যান নির্বাচন" : "Select plan"}</label>
            <select
              value={selectedPlanId}
              onChange={(event) => {
                setSelectedPlanId(event.target.value);
                setAppliedCoupon(null);
              }}
              className="w-full rounded-[1rem] bg-surface-container-highest px-4 py-3"
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {(isBn ? plan.displayNameBn : plan.displayNameEn)} - ৳{formatPlanPrice(plan.priceBdt, locale)}
                </option>
              ))}
            </select>

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
                {couponApplying ? (isBn ? "যাচাই..." : "Applying...") : (isBn ? "কুপন প্রয়োগ" : "Apply coupon")}
              </button>
            </div>

            <div className="rounded-[1rem] bg-surface-container px-4 py-4">
              <p className="text-sm text-on-surface-variant">{isBn ? "পরিশোধযোগ্য মূল্য" : "Payable amount"}</p>
              <p className="text-2xl font-bold text-primary mt-2">৳{formatPlanPrice(payableAmount, locale)}</p>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-5 space-y-4">
            <h2 className="text-lg font-semibold text-on-surface">{isBn ? "চেকআউট ও ভেরিফিকেশন" : "Checkout and verification"}</h2>
            <label className="text-sm font-semibold text-primary">{isBn ? "পেমেন্ট চ্যানেল" : "Payment channel"}</label>
            <select
              value={checkoutMethod}
              onChange={(event) => setCheckoutMethod(event.target.value as MfsType)}
              className="w-full rounded-[1rem] bg-surface-container-highest px-4 py-3"
            >
              {MFS_OPTIONS.map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleInitializeCheckout}
                disabled={checkoutLoading || !selectedPlan}
                className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isBn ? "পেমেন্ট শুরু" : "Start payment"}
              </button>
              <button
                type="button"
                onClick={() => void refreshPaymentStatus()}
                disabled={!paymentIntent || checkoutLoading}
                className="rounded-full bg-surface-container-high px-5 py-3 text-sm font-semibold text-on-surface disabled:opacity-50"
              >
                {isBn ? "স্ট্যাটাস রিফ্রেশ" : "Refresh status"}
              </button>
            </div>

            {paymentIntent ? (
              <div className="rounded-[1rem] bg-surface-container px-4 py-4 space-y-3">
                <p className="text-sm text-on-surface-variant">
                  {isBn ? "রিসিভার নাম্বার" : "Receiver number"}:{" "}
                  <span className="font-semibold text-on-surface">{paymentIntent.receiverNumber}</span>
                </p>
                <FormInput
                  label="TrxID"
                  value={trxIdInput}
                  onChange={(event) => setTrxIdInput(event.target.value.toUpperCase())}
                />
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
                    disabled={checkoutLoading || !paymentStatus || paymentStatus.status === "COMPLETED"}
                    className="rounded-full bg-surface-container-high px-5 py-3 text-sm font-semibold text-on-surface disabled:opacity-50"
                  >
                    {isBn ? "রিসাবমিট" : "Resubmit"}
                  </button>
                </div>
                <p className="text-sm text-on-surface-variant">
                  {isBn ? "স্ট্যাটাস" : "Status"}: <span className="font-semibold text-primary">{paymentStatus?.status ?? paymentIntent.status}</span>
                </p>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-5">
        <h2 className="text-lg font-semibold text-on-surface">{isBn ? "ফিচার লক স্ট্যাটাস" : "Feature lock status"}</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <p className="text-sm text-on-surface-variant">Due: {planLimits?.dueManagementEnabled ? "Enabled" : "Locked"}</p>
          <p className="text-sm text-on-surface-variant">Discount: {planLimits?.discountEnabled ? "Enabled" : "Locked"}</p>
          <p className="text-sm text-on-surface-variant">Voice: {planLimits?.voiceEnabled ? "Enabled" : "Locked"}</p>
          <p className="text-sm text-on-surface-variant">Text NLP: {planLimits?.textNlpEnabled ? "Enabled" : "Locked"}</p>
        </div>
      </section>
    </section>
  );
}
