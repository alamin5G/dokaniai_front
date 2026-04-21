"use client";

import {
  applyCoupon,
  getAvailablePlans,
  getCurrentSubscription,
  getReferralStatus,
  initializePaymentIntent,
  clearPendingPlan,
  consentTrialPlan,
} from "@/lib/subscriptionApi";
import {
  clearPendingUpgradePlan,
  getPendingUpgradePlan,
  setRedirectAfterLogin,
} from "@/lib/authFlow";
import type { AppliedCoupon, MfsType, Plan, ReferralStatus, Subscription } from "@/types/subscription";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

const MFS_OPTIONS: { key: MfsType; labelBn: string; labelEn: string; color: string; gradient: string; logo: string }[] = [
  { key: "BKASH", labelBn: "বিকাশ", labelEn: "bKash", color: "#E2136E", gradient: "linear-gradient(135deg, #E2136E, #C4105E)", logo: "/icons/payment/bkash.png" },
  { key: "NAGAD", labelBn: "নগদ", labelEn: "Nagad", color: "#F6921E", gradient: "linear-gradient(135deg, #F6921E, #ED1C24)", logo: "/icons/payment/nagad.png" },
  { key: "ROCKET", labelBn: "রকেট", labelEn: "Rocket", color: "#8B2F8B", gradient: "linear-gradient(135deg, #8B2F8B, #6B1F6B)", logo: "/icons/payment/dbbl_rocket.jpeg" },
];

function formatPrice(value: number, locale: string): string {
  return new Intl.NumberFormat(locale.startsWith("bn") ? "bn-BD" : "en-US").format(value);
}

function getPlanDisplayName(plan: Plan, isBn: boolean): string {
  return isBn ? plan.displayNameBn : plan.displayNameEn;
}

function getFeatureList(plan: Plan, isBn: boolean): { icon: string; label: string }[] {
  const features: { icon: string; label: string }[] = [];
  if (plan.maxBusinesses > 0) {
    features.push({ icon: "store", label: isBn ? `সর্বোচ্চ ব্যবসা: ${formatPrice(plan.maxBusinesses, isBn ? "bn-BD" : "en-US")}` : `Max businesses: ${plan.maxBusinesses}` });
  }
  if (plan.maxProductsPerBusiness != null) {
    const val = plan.maxProductsPerBusiness === -1
      ? (isBn ? "আনলিমিটেড" : "Unlimited")
      : formatPrice(plan.maxProductsPerBusiness, isBn ? "bn-BD" : "en-US");
    features.push({ icon: "inventory_2", label: isBn ? `প্রতি ব্যবসায় পণ্য: ${val}` : `Products/business: ${val}` });
  }
  if (plan.aiQueriesPerDay != null) {
    const val = plan.aiQueriesPerDay === -1
      ? (isBn ? "আনলিমিটেড" : "Unlimited")
      : formatPrice(plan.aiQueriesPerDay, isBn ? "bn-BD" : "en-US");
    features.push({ icon: "auto_awesome", label: isBn ? `AI/দিন: ${val}` : `AI/day: ${val}` });
  }
  return features;
}

function SubscriptionUpgradeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const isBn = locale.startsWith("bn");
  const t = useTranslations("subscription");

  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [referralStatus, setReferralStatus] = useState<ReferralStatus | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [checkoutMethod, setCheckoutMethod] = useState<MfsType>("BKASH");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawAuth = localStorage.getItem("dokaniai-auth-storage");
      const parsed = rawAuth ? JSON.parse(rawAuth) : null;
      if (!parsed?.state?.accessToken) {
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

  /* ── Redirect to verification UI if user has an active pending payment ──
   *  If the user submitted a TrxID and navigates back here, send them to
   *  the payment page so they see the verification waiting UI instead.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const trxSubmitted = sessionStorage.getItem("payment_trx_submitted");
      const checkoutRaw = sessionStorage.getItem("payment_checkout");
      if (trxSubmitted && checkoutRaw) {
        const checkout = JSON.parse(checkoutRaw);
        if (checkout.paymentIntentId) {
          router.replace(`/subscription/payment/${checkout.paymentIntentId}`);
        }
      }
    } catch { /* ignore — let user stay on upgrade page if sessionStorage is corrupted */ }
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [allPlans, current, referral] = await Promise.all([
          getAvailablePlans(),
          getCurrentSubscription().catch(() => null),
          getReferralStatus().catch(() => null),
        ]);
        if (cancelled) return;
        const hasSubscription = current != null && ["ACTIVE", "TRIAL", "GRACE"].includes(current.status);
        const activePlans = allPlans
          .filter((p) => p.isActive && !p.customPricing && p.tierLevel !== 1 && (hasSubscription ? !p.isTrial : true))
          .sort((a, b) => a.tierLevel - b.tierLevel);
        setPlans(activePlans);
        setCurrentSubscription(current);
        setReferralStatus(referral);
        const planFromUrl = searchParams.get("plan");
        const pendingPlan = getPendingUpgradePlan();
        const selected =
          activePlans.find((p) => p.id === planFromUrl)?.id ??
          activePlans.find((p) => p.id === pendingPlan)?.id ??
          current?.planId ??
          activePlans.find((p) => !p.isTrial)?.id ??
          activePlans[0]?.id ??
          "";
        setSelectedPlanId(selected);
        if (pendingPlan && pendingPlan === selected) clearPendingUpgradePlan();
      } catch (error) {
        setNotice(error instanceof Error ? error.message : t("upgrade.errors.loadFailed"));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void loadData();
    return () => { cancelled = true; };
  }, [isBn, searchParams]);

  const selectedPlan = useMemo(() => plans.find((p) => p.id === selectedPlanId) ?? null, [plans, selectedPlanId]);
  const currentPlan = useMemo(() => plans.find((p) => p.id === currentSubscription?.planId) ?? null, [plans, currentSubscription?.planId]);

  useEffect(() => {
    if (!planScrollRef.current || !selectedPlanId) return;
    const container = planScrollRef.current;
    const btn = container.querySelector<HTMLElement>(`[data-plan-id="${selectedPlanId}"]`);
    if (!btn) return;
    const scrollLeft = btn.offsetLeft - container.offsetWidth / 2 + btn.offsetWidth / 2;
    container.scrollTo({ left: scrollLeft, behavior: "smooth" });
  }, [selectedPlanId, plans]);

  const billingCycle = searchParams.get("billing") === "ANNUAL" ? "ANNUAL" as const : "MONTHLY" as const;
  const planPrice = billingCycle === "ANNUAL" && selectedPlan?.annualPriceBdt != null
    ? selectedPlan.annualPriceBdt : selectedPlan?.priceBdt ?? 0;
  const payableAmount = appliedCoupon?.finalAmount ?? planPrice;

  const handleApplyCoupon = async () => {
    if (!selectedPlan || !couponCode.trim()) { setNotice(t("upgrade.errors.enterCoupon")); return; }
    setIsSubmitting(true);
    try {
      const result = await applyCoupon(couponCode.trim(), selectedPlan.id, planPrice);
      setAppliedCoupon(result);
      setNotice(t("upgrade.couponApplied"));
    } catch (error) {
      setAppliedCoupon(null);
      setNotice(error instanceof Error ? error.message : t("upgrade.errors.couponFailed"));
    } finally { setIsSubmitting(false); }
  };

  const handleContinueToPayment = async () => {
    if (!selectedPlan) return;
    setIsSubmitting(true);
    try {
      const intent = await initializePaymentIntent({
        planId: selectedPlan.id, amount: payableAmount, mfsMethod: checkoutMethod,
        couponCode: appliedCoupon?.code ?? (couponCode.trim() || undefined), billingCycle,
      });
      clearPendingUpgradePlan();
      clearPendingPlan().catch(() => { });
      /* Store checkout data + intent ID in sessionStorage for cross-page detection */
      sessionStorage.setItem("payment_checkout", JSON.stringify({
        paymentIntentId: intent.paymentIntentId,
        receiverNumber: intent.receiverNumber,
        amount: intent.amount,
        mfsMethod: checkoutMethod,
        expiresAt: intent.expiresAt,
      }));
      router.push(`/subscription/payment/${intent.paymentIntentId}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("upgrade.errors.paymentInitFailed"));
    } finally { setIsSubmitting(false); }
  };

  const isTrialPlan = selectedPlan?.isTrial === true;
  const isCurrentPlan = selectedPlan != null && selectedPlan.id === currentSubscription?.planId;
  const [showTrialConfirm, setShowTrialConfirm] = useState(false);
  const planScrollRef = useRef<HTMLDivElement>(null);

  const handleCtaClick = () => {
    if (isTrialPlan) {
      setShowTrialConfirm(true);
    } else {
      handleContinueToPayment();
    }
  };

  const handleTrialConfirm = async () => {
    if (!selectedPlan) return;
    setIsSubmitting(true);
    try {
      await consentTrialPlan(selectedPlan.id);
      clearPendingUpgradePlan();
      clearPendingPlan().catch(() => { });
      setShowTrialConfirm(false);
      router.push("/onboarding");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("upgrade.errors.paymentInitFailed"));
    } finally { setIsSubmitting(false); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8faf6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[#003727]/20 border-t-[#003727] rounded-full animate-spin" />
          <p className="text-[#404944] font-['Hind_Siliguri','Manrope',sans-serif]">{t("upgrade.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf6] font-['Hind_Siliguri','Manrope',sans-serif] antialiased">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-[#f2f4f0] flex items-center justify-between px-4 sm:px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#191c1a] hover:bg-[#ecefeb] transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
          </button>
          <span className="font-['Manrope',sans-serif] font-bold text-xl text-[#003727]">DokaniAI</span>
        </div>
        <span className="text-sm font-semibold text-[#404944]">
          {isBn ? "ধাপ ২ / ৩" : "Step 2 of 3"}
        </span>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Notice */}
        {notice && (
          <div className="mb-6 rounded-xl bg-[#ecefeb] px-5 py-3 text-sm text-[#191c1a]">{notice}</div>
        )}

        {/* Referral Banner */}
        {referralStatus?.referredBy && referralStatus.referredDiscountType && referralStatus.referredDiscountValue && (
          <div className="mb-6 rounded-xl bg-[#00503a]/10 px-5 py-4">
            <p className="text-sm font-semibold text-[#003727]">
              {referralStatus.referredDiscountType === "DISCOUNT_PERCENT"
                ? t("upgrade.referralDiscount", { value: referralStatus.referredDiscountValue })
                : referralStatus.referredDiscountType === "FLAT_AMOUNT"
                  ? t("upgrade.referralDiscountFlat", { value: referralStatus.referredDiscountValue })
                  : t("upgrade.referralDiscountFreeDays", { value: referralStatus.referredDiscountValue })}
            </p>
            <p className="text-xs text-[#404944] mt-1">{t("upgrade.bestDiscountNote")}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Plan Selection + Comparison */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            {/* Title */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#191c1a] leading-tight mb-2">
                {selectedPlan ? getPlanDisplayName(selectedPlan, isBn) : t("upgrade.title")}
              </h1>
              <p className="text-base sm:text-lg text-[#404944] leading-relaxed">{t("upgrade.subtitle")}</p>
            </div>

            {/* Plan Selector Cards */}
            <div ref={planScrollRef} className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-hide">
              {plans.map((plan) => {
                const isSelected = plan.id === selectedPlanId;
                const isCurrent = plan.id === currentSubscription?.planId;
                return (
                  <button
                    key={plan.id}
                    data-plan-id={plan.id}
                    onClick={() => { setSelectedPlanId(plan.id); setAppliedCoupon(null); }}
                    className={`min-w-[150px] flex-1 p-4 rounded-xl transition-all snap-start cursor-pointer relative overflow-hidden
                      ${isSelected
                        ? "bg-[#00503a] shadow-lg scale-[1.02]"
                        : "bg-white shadow-sm hover:shadow-md hover:bg-[#f2f4f0]"
                      }`}
                  >
                    {isSelected && (
                      <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#003727] opacity-20 rounded-full blur-xl" />
                    )}
                    <div className={`text-xs font-semibold mb-1 flex items-center justify-between ${isSelected ? "text-[#91d4b7]" : "text-[#404944]"}`}>
                      <span>{getPlanDisplayName(plan, isBn)}</span>
                      {isSelected && <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                    </div>
                    <div className={`text-xl font-bold ${isSelected ? "text-white" : "text-[#191c1a]"}`}>
                      {plan.customPricing
                        ? (isBn ? "কাস্টম" : "Custom")
                        : `৳${formatPrice(plan.priceBdt, locale)}`}
                      <span className={`text-xs font-normal ${isSelected ? "text-white/70" : "text-[#404944]"}`}>
                        {plan.customPricing ? "" : `/${isBn ? "মাস" : "mo"}`}
                      </span>
                    </div>
                    {isCurrent && (
                      <div className={`text-[10px] mt-1 font-medium ${isSelected ? "text-[#91d4b7]" : "text-[#003727]"}`}>
                        {t("pricing.currentPlan")}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Plan Comparison: Current → New */}
            {selectedPlan && currentPlan && selectedPlan.id !== currentPlan.id && (
              <div className="grid grid-cols-2 gap-4 relative">
                {/* Current Plan */}
                <div className="bg-[#ecefeb] rounded-xl p-5 flex flex-col gap-4">
                  <div>
                    <span className="text-xs text-[#404944] mb-1 block">{t("upgrade.currentPlan")}</span>
                    <h2 className="text-xl font-semibold text-[#191c1a]">{getPlanDisplayName(currentPlan, isBn)}</h2>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[11px] text-[#404944]">{isBn ? "ব্যবসা" : "Businesses"}</span>
                      <div className="text-2xl font-bold text-[#191c1a] font-['Manrope',sans-serif]">{currentPlan.maxBusinesses}</div>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#404944]">{isBn ? "পণ্য/ব্যবসা" : "Products/biz"}</span>
                      <div className="text-2xl font-bold text-[#191c1a] font-['Manrope',sans-serif]">
                        {currentPlan.maxProductsPerBusiness === -1
                          ? (isBn ? "∞" : "∞")
                          : currentPlan.maxProductsPerBusiness}
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#404944]">AI/{isBn ? "দিন" : "day"}</span>
                      <div className="text-2xl font-bold text-[#191c1a] font-['Manrope',sans-serif]">
                        {currentPlan.aiQueriesPerDay === -1 ? "∞" : currentPlan.aiQueriesPerDay}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="hidden sm:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white rounded-full items-center justify-center shadow-[0_4px_24px_rgba(25,28,26,0.08)]">
                  <span className="material-symbols-outlined text-[#003727] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_forward</span>
                </div>

                {/* New Plan */}
                <div className="bg-white rounded-xl p-5 flex flex-col gap-4 shadow-[0_8px_30px_rgba(25,28,26,0.04)] relative">
                  <div>
                    <span className="text-xs font-medium text-[#003727] mb-1 block">{isBn ? "নতুন প্ল্যান" : "New Plan"}</span>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-[#003727] to-[#00503a] bg-clip-text text-transparent">
                      {getPlanDisplayName(selectedPlan, isBn)}
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {(() => {
                      const diffBiz = selectedPlan.maxBusinesses - currentPlan.maxBusinesses;
                      const diffProd = (selectedPlan.maxProductsPerBusiness ?? 0) - (currentPlan.maxProductsPerBusiness ?? 0);
                      const diffAi = (selectedPlan.aiQueriesPerDay ?? 0) - (currentPlan.aiQueriesPerDay ?? 0);
                      return (
                        <>
                          <div>
                            <span className="text-[11px] text-[#404944]">{isBn ? "ব্যবসা" : "Businesses"}</span>
                            <div className="flex items-end gap-1.5">
                              <span className="text-2xl font-bold text-[#003727] font-['Manrope',sans-serif]">{selectedPlan.maxBusinesses}</span>
                              {diffBiz > 0 && <span className="text-xs text-[#003727] mb-0.5 flex items-center gap-0.5"><span className="material-symbols-outlined text-[14px]">arrow_upward</span>+{diffBiz}</span>}
                            </div>
                          </div>
                          <div>
                            <span className="text-[11px] text-[#404944]">{isBn ? "পণ্য/ব্যবসা" : "Products/biz"}</span>                            <div className="flex items-end gap-1.5">
                              <span className="text-2xl font-bold text-[#003727] font-['Manrope',sans-serif]">
                                {selectedPlan.maxProductsPerBusiness === -1 ? "∞" : selectedPlan.maxProductsPerBusiness}
                              </span>
                              {diffProd > 0 && <span className="text-xs text-[#003727] mb-0.5 flex items-center gap-0.5"><span className="material-symbols-outlined text-[14px]">arrow_upward</span>+{diffProd}</span>}
                            </div>
                          </div>
                          <div>
                            <span className="text-[11px] text-[#404944]">AI/{isBn ? "দিন" : "day"}</span>
                            <div className="flex items-end gap-1.5">
                              <span className="text-2xl font-bold text-[#003727] font-['Manrope',sans-serif]">
                                {selectedPlan.aiQueriesPerDay === -1 ? "∞" : selectedPlan.aiQueriesPerDay}
                              </span>
                              {diffAi > 0 && <span className="text-xs text-[#003727] mb-0.5 flex items-center gap-0.5"><span className="material-symbols-outlined text-[14px]">arrow_upward</span>+{diffAi}</span>}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Features List */}
            {selectedPlan && (
              <div className="bg-[#f2f4f0] rounded-xl p-6">
                <h3 className="text-base font-semibold text-[#191c1a] mb-4">
                  {isBn ? "এই প্ল্যানে যা যা পাবেন:" : "Everything in this plan:"}
                </h3>
                <ul className="space-y-3">
                  {getFeatureList(selectedPlan, isBn).map((feat, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-[#003727] mt-0.5 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{feat.icon}</span>
                      <span className="text-[#404944]">{feat.label}</span>
                    </li>
                  ))}
                  {selectedPlan.features && Object.entries(selectedPlan.features).map(([key, val]) =>
                    val ? (
                      <li key={key} className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-[#003727] mt-0.5 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        <span className="text-[#404944]">{key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
                      </li>
                    ) : null
                  )}
                </ul>
              </div>
            )}

            {selectedPlan && (
              <div className="rounded-xl p-6 flex items-start gap-4 relative overflow-hidden" style={{ background: "rgba(225,227,223,0.6)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#adf1d2] rounded-full blur-3xl opacity-30 pointer-events-none" />
                <div className="w-11 h-11 rounded-full bg-[#d1e4ff] flex items-center justify-center text-[#001d36] shrink-0 shadow-[0_8px_24px_rgba(25,28,26,0.08)]">
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                </div>
                <div>
                  <h3 className="font-semibold text-base text-[#191c1a] mb-1">{isBn ? "AI ইনসাইট" : "AI Insight"}</h3>
                  <p className="text-sm text-[#404944] leading-relaxed">
                    {isBn
                      ? `${getPlanDisplayName(selectedPlan, true)} প্ল্যানে আপগ্রেড করলে আপনার ব্যবসার হিসাব রাখা আরও সহজ ও দ্রুত হবে। AI দিয়ে স্মার্ট রিপোর্ট পান।`
                      : `Upgrade to ${getPlanDisplayName(selectedPlan, false)} for smarter business insights and faster bookkeeping.`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary + Payment */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Order Summary */}
            <div className="bg-white rounded-xl p-6 shadow-[0_8px_30px_rgba(25,28,26,0.06)] relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#9fcaff] rounded-full blur-3xl opacity-30 pointer-events-none" />

              <h3 className="text-lg font-semibold text-[#191c1a] mb-5">{isBn ? "অর্ডার সামারি" : "Order Summary"}</h3>

              {/* Line Items */}
              <div className="space-y-3 mb-5">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-[#404944]">{selectedPlan ? getPlanDisplayName(selectedPlan, isBn) : ""} ({isBn ? "মাসিক" : "Monthly"})</span>
                  <span className="text-base font-medium text-[#191c1a] font-['Manrope',sans-serif]">৳{formatPrice(planPrice, locale)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-[#003727]">{isBn ? "কুপন ছাড়" : "Coupon discount"}</span>
                    <span className="text-base font-medium text-[#003727] font-['Manrope',sans-serif]">-৳{formatPrice(appliedCoupon.discountAmount, locale)}</span>
                  </div>
                )}
              </div>

              {/* Coupon Input */}
              <div className="mb-5">
                <div className="bg-[#ecefeb] rounded-full flex items-center pl-1 pr-1 focus-within:ring-2 focus-within:ring-[#91d4b7] transition-all">
                  <span className="material-symbols-outlined text-[#404944] pl-3 pr-2 text-[18px]">local_offer</span>
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder={t("upgrade.couponPlaceholder")}
                    className="bg-transparent border-none focus:ring-0 focus:outline-none text-[#191c1a] w-full py-2.5 text-sm placeholder:text-[#707974]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isSubmitting || !couponCode.trim() || !selectedPlan}
                    className="bg-white text-[#003727] font-semibold text-xs px-4 py-2 rounded-full shadow-sm hover:bg-[#f2f4f0] transition-colors whitespace-nowrap disabled:opacity-40"
                  >
                    {t("upgrade.applyCoupon")}
                  </button>
                </div>
              </div>

              {/* Total */}
              <div className="bg-[#f2f4f0] rounded-xl p-4 flex justify-between items-end mb-6">
                <span className="text-xs font-semibold text-[#404944] uppercase tracking-wider">{isBn ? "সর্বমোট" : "Total Due"}</span>
                <div className="text-right">
                  <span className="text-xs text-[#404944] mr-1 font-['Manrope',sans-serif]">{isBn ? "টাকা" : "BDT"}</span>
                  <span className="text-3xl font-bold text-[#191c1a] font-['Manrope',sans-serif]">৳{formatPrice(payableAmount, locale)}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <span className="text-[11px] text-[#404944] uppercase tracking-wider mb-2 block font-semibold">
                  {isBn ? "পেমেন্ট মাধ্যম নির্বাচন করুন" : "Select Payment Method"}
                </span>
                {MFS_OPTIONS.map((mfs) => {
                  const isSelected = checkoutMethod === mfs.key;
                  return (
                    <button
                      key={mfs.key}
                      type="button"
                      onClick={() => setCheckoutMethod(mfs.key)}
                      className={`w-full flex items-center p-3.5 rounded-xl transition-all relative overflow-hidden cursor-pointer border-2
                        ${isSelected
                          ? "bg-white shadow-md scale-[1.01]"
                          : "bg-white hover:bg-[#f8faf6] border-transparent"
                        }`}
                      style={isSelected ? { borderColor: mfs.color, boxShadow: `0 4px 14px ${mfs.color}20` } : {}}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center transition-all shrink-0 ${isSelected ? "border-[#003727]" : "border-[#bfc9c2]"}`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full" style={{ background: mfs.gradient }} />}
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <span className={`font-semibold ${isSelected ? "text-[#191c1a]" : "text-[#404944]"}`}>
                          {isBn ? mfs.labelBn : mfs.labelEn}
                        </span>
                        <div className="relative h-9 w-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${mfs.color}10` }}>
                          <Image src={mfs.logo} alt={mfs.labelEn} fill className="object-contain p-1" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* CTA Button */}
              <button
                data-testid="continue-to-payment"
                type="button"
                onClick={handleCtaClick}
                disabled={isSubmitting || !selectedPlan || isCurrentPlan}
                className="w-full mt-6 text-white font-bold text-base py-4 rounded-full shadow-[0_4px_14px_rgba(0,55,39,0.25)] hover:shadow-[0_6px_20px_rgba(0,55,39,0.3)] transition-all flex justify-center items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #003727, #00503a)" }}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isCurrentPlan ? (
                  t("pricing.currentPlan")
                ) : isTrialPlan ? (
                  t("pricing.startTrial")
                ) : (
                  <>
                    <span>{isBn ? `৳${formatPrice(payableAmount, locale)} নিরাপদে পরিশোধ করুন` : `Pay ৳${formatPrice(payableAmount, locale)} Securely`}</span>
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-[#404944] mt-3 flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[13px]">verified_user</span>
                {isBn ? "২৫৬-বিট এনক্রিপ্টেড · ১০০% নিরাপদ" : "256-bit Encrypted · 100% Secure"}
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="flex justify-center gap-6 opacity-50">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[#404944] text-[14px]">verified_user</span>
                <span className="text-[11px] text-[#404944]">{isBn ? "এনক্রিপ্টেড" : "Encrypted"}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[#404944] text-[14px]">support_agent</span>
                <span className="text-[11px] text-[#404944]">{isBn ? "২৪/৭ সাপোর্ট" : "24/7 Support"}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Free Trial Confirmation Modal */}
      {showTrialConfirm && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 bg-[#00503a]/10 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[#00503a] text-3xl">rocket_launch</span>
            </div>
            <h3 className="text-lg font-bold text-[#003727]">{t("trialModal.title")}</h3>
            <p className="text-sm text-[#404944]">
              {selectedPlan.durationDays
                ? (isBn ? `${selectedPlan.durationDays} দিনের ফ্রি ট্রায়াল শুরু করতে চান?` : `Start your ${selectedPlan.durationDays}-day free trial?`)
                : t("trialModal.description")}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowTrialConfirm(false)}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl border border-[#003727]/20 text-[#404944] font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isBn ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleTrialConfirm}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #003727, #00503a)" }}
              >
                {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t("trialModal.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubscriptionUpgradePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8faf6] flex items-center justify-center"><div className="w-8 h-8 border-3 border-[#003727]/20 border-t-[#003727] rounded-full animate-spin" /></div>}>
      <SubscriptionUpgradeContent />
    </Suspense>
  );
}
