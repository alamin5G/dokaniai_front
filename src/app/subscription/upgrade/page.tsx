"use client";

import { FormInput } from "@/components/ui/FormPrimitives";
import {
  applyCoupon,
  getAvailablePlans,
  getCurrentSubscription,
  initializePaymentIntent,
} from "@/lib/subscriptionApi";
import {
  clearPendingUpgradePlan,
  getPendingUpgradePlan,
  setRedirectAfterLogin,
} from "@/lib/authFlow";
import type { AppliedCoupon, MfsType, Plan, Subscription } from "@/types/subscription";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

const MFS_OPTIONS: MfsType[] = ["BKASH", "NAGAD", "ROCKET"];

function formatPrice(value: number, locale: string): string {
  return new Intl.NumberFormat(locale.startsWith("bn") ? "bn-BD" : "en-US").format(value);
}

export default function SubscriptionUpgradePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const isBn = locale.startsWith("bn");
  const t = useTranslations("subscription");

  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [checkoutMethod, setCheckoutMethod] = useState<MfsType>("BKASH");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const rawAuth = localStorage.getItem("dokaniai-auth-storage");
      const parsed = rawAuth ? JSON.parse(rawAuth) : null;
      const hasToken = Boolean(parsed?.state?.accessToken);
      if (!hasToken) {
        const planFromUrl = searchParams.get("plan");
        const target = planFromUrl
          ? `/subscription/upgrade?plan=${encodeURIComponent(planFromUrl)}`
          : "/subscription/upgrade";
        setRedirectAfterLogin(target);
        router.replace("/login");
      }
    } catch {
      router.replace("/login");
    }
  }, [router, searchParams]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [allPlans, current] = await Promise.all([
          getAvailablePlans(),
          getCurrentSubscription().catch(() => null),
        ]);

        if (cancelled) {
          return;
        }

        const activePlans = allPlans.filter((plan) => plan.isActive).sort((a, b) => a.tierLevel - b.tierLevel);
        setPlans(activePlans);
        setCurrentSubscription(current);

        const planFromUrl = searchParams.get("plan");
        const pendingPlan = getPendingUpgradePlan();
        const selected =
          activePlans.find((plan) => plan.id === planFromUrl)?.id ??
          activePlans.find((plan) => plan.id === pendingPlan)?.id ??
          current?.planId ??
          activePlans.find((plan) => !plan.isTrial)?.id ??
          activePlans[0]?.id ??
          "";

        setSelectedPlanId(selected);

        if (pendingPlan && pendingPlan === selected) {
          clearPendingUpgradePlan();
        }
      } catch (error) {
        setNotice(
          error instanceof Error
            ? error.message
            : t("upgrade.errors.loadFailed"),
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [isBn, searchParams]);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  );

  const currentPlan = useMemo(
    () => plans.find((plan) => plan.id === currentSubscription?.planId) ?? null,
    [plans, currentSubscription?.planId],
  );

  const payableAmount = appliedCoupon?.finalAmount ?? selectedPlan?.priceBdt ?? 0;

  const handleApplyCoupon = async () => {
    if (!selectedPlan || !couponCode.trim()) {
      setNotice(t("upgrade.errors.enterCoupon"));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await applyCoupon(couponCode.trim(), selectedPlan.id, selectedPlan.priceBdt);
      setAppliedCoupon(result);
      setNotice(t("upgrade.couponApplied"));
    } catch (error) {
      setAppliedCoupon(null);
      setNotice(error instanceof Error ? error.message : t("upgrade.errors.couponFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueToPayment = async () => {
    if (!selectedPlan) {
      return;
    }

    setIsSubmitting(true);
    try {
      const intent = await initializePaymentIntent({
        planId: selectedPlan.id,
        amount: payableAmount,
        mfsMethod: checkoutMethod,
        couponCode: appliedCoupon?.code ?? (couponCode.trim() || undefined),
      });
      clearPendingUpgradePlan();
      router.push(`/subscription/payment/${intent.paymentIntentId}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("upgrade.errors.paymentInitFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCurrentPlan = selectedPlan != null && selectedPlan.id === currentSubscription?.planId;

  return (
    <section className="space-y-6">
      <header className="rounded-[1.75rem] border border-outline-variant/30 bg-surface p-6">
        <h1 className="text-2xl font-bold text-on-surface">{t("upgrade.title")}</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          {t("upgrade.subtitle")}
        </p>
      </header>

      {notice ? (
        <div className="rounded-[1rem] border border-outline-variant/30 bg-surface-container px-4 py-3 text-sm text-on-surface">
          {notice}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-[1rem] border border-outline-variant/30 bg-surface p-5 text-sm text-on-surface-variant">
          {t("upgrade.loading")}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-5 space-y-4">
            <h2 className="text-lg font-semibold text-on-surface">{t("upgrade.planSelection")}</h2>
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
                  {(isBn ? plan.displayNameBn : plan.displayNameEn)} - ৳{formatPrice(plan.priceBdt, locale)}
                </option>
              ))}
            </select>

            <p className="text-sm text-on-surface-variant">
              {t("upgrade.currentPlan")}: {currentPlan ? (isBn ? currentPlan.displayNameBn : currentPlan.displayNameEn) : "-"}
            </p>

            <FormInput
              label={t("upgrade.couponLabel")}
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
              placeholder={t("upgrade.couponPlaceholder")}
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              disabled={isSubmitting || !couponCode.trim() || !selectedPlan}
              className="rounded-full bg-surface-container-high px-5 py-3 text-sm font-semibold text-on-surface disabled:opacity-50"
            >
              {t("upgrade.applyCoupon")}
            </button>

            <div className="rounded-[1rem] bg-surface-container px-4 py-4">
              <p className="text-sm text-on-surface-variant">{t("upgrade.payable")}</p>
              <p className="text-2xl font-bold text-primary mt-2">৳{formatPrice(payableAmount, locale)}</p>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-5 space-y-4">
            <h2 className="text-lg font-semibold text-on-surface">{t("upgrade.paymentChannel")}</h2>
            <select
              value={checkoutMethod}
              onChange={(event) => setCheckoutMethod(event.target.value as MfsType)}
              className="w-full rounded-[1rem] bg-surface-container-highest px-4 py-3"
            >
              {MFS_OPTIONS.map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleContinueToPayment}
              disabled={isSubmitting || !selectedPlan || isCurrentPlan}
              className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isCurrentPlan
                ? t("pricing.currentPlan")
                : t("upgrade.continueToPayment")}
            </button>
          </section>
        </div>
      )}
    </section>
  );
}
