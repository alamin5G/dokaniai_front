"use client";

import { getCurrentSubscription } from "@/lib/subscriptionApi";
import { rememberPendingUpgrade } from "@/lib/authFlow";
import { getFeatureMatrixSections, getPlanFeatureCell } from "@/lib/planFeatureDisplay";
import { PlanFeatureList } from "@/components/subscription/PlanFeatureList";
import type { Plan, Subscription } from "@/types/subscription";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import axios from "axios";

const PUBLIC_PLANS_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082/api/v1"}/subscriptions/plans`;


function formatPrice(value: number): string {
  return new Intl.NumberFormat("bn-BD").format(value);
}

type PlanAction = "LOGIN" | "CURRENT" | "UPGRADE" | "DOWNGRADE" | "OFFER_ONLY";

function isEnterprisePlan(plan: Plan): boolean {
  return plan.customPricing === true || plan.name === "ENTERPRISE";
}

function isFt2Plan(plan: Plan): boolean {
  return plan.name === "FREE_TRIAL_2" || plan.tierLevel === 1;
}

function resolvePlanAction(currentPlan: Plan | null, targetPlan: Plan, isAuthenticated: boolean): PlanAction {
  if (isFt2Plan(targetPlan)) {
    return "OFFER_ONLY";
  }

  if (!isAuthenticated) {
    return "LOGIN";
  }

  if (!currentPlan) {
    return "UPGRADE";
  }

  if (currentPlan.id === targetPlan.id) {
    return "CURRENT";
  }

  return targetPlan.tierLevel > currentPlan.tierLevel ? "UPGRADE" : "DOWNGRADE";
}

function formatPlanDuration(plan: Plan, billingAnnual: boolean, t: (key: string) => string, s: (key: string) => string): string {
  if (isEnterprisePlan(plan)) {
    return t("quickReference.yearly");
  }

  if (plan.priceBdt === 0 || plan.isTrial) {
    if (plan.durationDays % 30 === 0 && plan.durationDays < 365) {
      return `/${Math.max(1, Math.round(plan.durationDays / 30))} ${s("pricing.month")}`;
    }
    return `/${plan.durationDays} ${t("quickReference.days")}`;
  }

  if (billingAnnual && plan.annualPriceBdt != null) {
    return `/${t("perYear")}`;
  }

  return `/${s("pricing.month")}`;
}

function formatPlanPrice(plan: Plan, billingAnnual: boolean, s: (key: string) => string): string {
  if (isEnterprisePlan(plan)) {
    return s("pricing.customPrice");
  }

  if (billingAnnual && plan.annualPriceBdt != null && !plan.isTrial && plan.priceBdt > 0) {
    return `৳${formatPrice(plan.annualPriceBdt)}`;
  }

  return plan.priceBdt === 0 ? s("pricing.free") : `৳${formatPrice(plan.priceBdt)}`;
}

function supportsAnnualBilling(plan: Plan): boolean {
  return plan.annualPriceBdt != null && !plan.isTrial && plan.priceBdt > 0 && !isEnterprisePlan(plan);
}

function calcAnnualDiscountPercent(plan: Plan): number | null {
  if (plan.annualPriceBdt == null || plan.priceBdt <= 0 || plan.isTrial) return null;
  const monthlyAnnualized = plan.priceBdt * 12;
  const saved = monthlyAnnualized - plan.annualPriceBdt;
  if (saved <= 0) return null;
  return Math.round((saved / monthlyAnnualized) * 100);
}

function actionLabel(plan: Plan, action: PlanAction, isAuthenticated: boolean, s: (key: string) => string): string {
  if (isEnterprisePlan(plan)) {
    return s("pricing.contactUs");
  }

  if (action === "OFFER_ONLY") return s("pricing.offerOnly");
  if (!isAuthenticated) {
    return plan.isTrial ? s("pricing.startTrial") : s("pricing.buyNow");
  }

  if (action === "CURRENT") return s("pricing.currentPlan");
  if (action === "UPGRADE") return s("pricing.upgrade");
  if (action === "DOWNGRADE") return s("pricing.downgrade");
  return s("pricing.buyNow");
}

function getProductsLabel(plan: Plan, s: (key: string) => string): string | number {
  return plan.maxProductsPerBusiness == null ? s("pricing.unlimited") : plan.maxProductsPerBusiness;
}

function renderMatrixCell(value: string, isBn: boolean) {
  const normalized = value.trim().toLowerCase();
  if (["yes", "হ্যাঁ"].includes(normalized)) {
    return <span className="text-lg font-bold text-emerald-600">✓</span>;
  }
  if (["no", "না"].includes(normalized)) {
    return <span className="text-lg font-bold text-on-surface-variant/45">✗</span>;
  }
  return <span className="font-medium text-on-surface">{value || (isBn ? "নেই" : "None")}</span>;
}

function getEnterpriseContactHref(email: string, subject: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}

function getCategoryKey(index: number): string {
  const keys = ["starter", "growing", "professional", "established", "enterprise"];
  return keys[index] ?? "enterprise";
}

function hasAccessToken(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const rawAuth = localStorage.getItem("dokaniai-auth-storage");
    const parsed = rawAuth ? JSON.parse(rawAuth) : null;
    return Boolean(parsed?.state?.accessToken);
  } catch {
    return false;
  }
}

export function PricingSection() {
  const t = useTranslations("home.pricing");
  const s = useTranslations("subscription");
  const locale = useLocale();
  const isBn = locale.startsWith("bn");
  const router = useRouter();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [plansStatus, setPlansStatus] = useState<"loading" | "ready" | "error">("loading");
  const [billingAnnual, setBillingAnnual] = useState(false);
  const isAuthenticated = useSyncExternalStore(
    () => () => { },
    () => hasAccessToken(),
    () => false,
  );

  useEffect(() => {
    let cancelled = false;

    const loadPlans = async () => {
      try {
        const { data } = await axios.get(PUBLIC_PLANS_URL, {
          headers: { "Accept-Language": typeof navigator !== "undefined" ? navigator.language : "en" },
        });
        if (cancelled) return;
        const active: Plan[] = (data?.data ?? []).filter((plan: Plan) => plan.isActive).sort((a: Plan, b: Plan) => a.tierLevel - b.tierLevel);
        if (active.length > 0) {
          setPlans(active);
        }
        setPlansStatus("ready");
      } catch {
        if (!cancelled) {
          setPlansStatus("error");
        }
      }
    };

    void loadPlans();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    const loadCurrentSubscription = async () => {
      try {
        const current = await getCurrentSubscription();
        if (!cancelled) {
          setCurrentSubscription(current);
        }
      } catch {
        if (!cancelled) {
          setCurrentSubscription(null);
        }
      }
    };

    void loadCurrentSubscription();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const currentPlan = useMemo(() => {
    if (!currentSubscription) return null;
    return plans.find((plan) => plan.id === currentSubscription.planId) ?? null;
  }, [plans, currentSubscription]);

  const orderedPlans = useMemo(() => [...plans].sort((a, b) => a.tierLevel - b.tierLevel), [plans]);
  const visiblePlans = useMemo(
    () => billingAnnual ? orderedPlans.filter((plan) => !plan.isTrial) : orderedPlans,
    [billingAnnual, orderedPlans],
  );

  const featureSections = useMemo(() => getFeatureMatrixSections(visiblePlans, isBn), [isBn, visiblePlans]);

  const hasAnyAnnualPrice = useMemo(() => plans.some(supportsAnnualBilling), [plans]);

  const handlePlanAction = (plan: Plan, action: PlanAction) => {
    if (isEnterprisePlan(plan)) {
      if (typeof window !== "undefined") {
        window.location.assign(getEnterpriseContactHref(s("pricing.enterpriseEmail"), s("pricing.enterpriseEmailSubject")));
      }
      return;
    }

    if (action === "CURRENT") {
      return;
    }

    if (!isAuthenticated) {
      rememberPendingUpgrade(plan.id, plan.isTrial);
      router.push("/register");
      return;
    }

    const billingParam = billingAnnual && supportsAnnualBilling(plan) ? "&billing=ANNUAL" : "";
    const targetPath = action === "DOWNGRADE"
      ? `/subscription/downgrade?plan=${encodeURIComponent(plan.id)}`
      : `/subscription/upgrade?plan=${encodeURIComponent(plan.id)}${billingParam}`;

    router.push(targetPath);
  };


  if (plansStatus === "loading" && plans.length === 0) {
    return (
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h1 className="text-5xl md:text-7xl font-bold text-primary font-headline mb-6 leading-tight">
              {t("heroTitle")}<br className="hidden md:block" />{" "}
              <span className="text-secondary italic">{t("heroTitleAccent")}</span>
            </h1>
            <p className="text-xl text-on-surface-variant max-w-2xl leading-relaxed">
              {t("heroDescription")}
            </p>
          </div>
          <div className="rounded-2xl bg-surface-container-low p-8 text-center text-sm text-on-surface-variant">
            {s("pricing.loading")}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Editorial Header */}
        <div className="mb-20">
          <h1 className="text-5xl md:text-7xl font-bold text-primary font-headline mb-6 leading-tight">
            {t("heroTitle")}<br className="hidden md:block" />{" "}
            <span className="text-secondary italic">{t("heroTitleAccent")}</span>
          </h1>
          <p className="text-xl text-on-surface-variant max-w-2xl leading-relaxed">
            {t("heroDescription")}
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="mb-10 flex flex-col items-center justify-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-full bg-surface-container-low p-1">
            <button
              type="button"
              onClick={() => setBillingAnnual(false)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${!billingAnnual
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
                }`}
            >
              {t("monthly")}
            </button>
            <button
              type="button"
              onClick={() => setBillingAnnual(true)}
              disabled={!hasAnyAnnualPrice}
              className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold transition-all ${billingAnnual
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
                } ${!hasAnyAnnualPrice ? "cursor-not-allowed opacity-50" : ""}`}
            >
              {t("annual")}
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-on-secondary">
                {t("annualDiscount")}
              </span>
            </button>
          </div>
          {!hasAnyAnnualPrice && (
            <p className="text-xs text-on-surface-variant">
              {isBn ? "বার্ষিক মূল্য অ্যাডমিন প্ল্যান সেটিংসে সেট করলে এখানে সক্রিয় হবে।" : "Annual prices activate here after admin sets annual pricing."}
            </p>
          )}
        </div>

        {/* Bento-style Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {visiblePlans.map((plan, index) => {
            const isHighlighted = plan.highlight === true;
            const isEnterprise = isEnterprisePlan(plan);
            const action = resolvePlanAction(currentPlan, plan, isAuthenticated);
            const isDisabled = action === "CURRENT" || action === "OFFER_ONLY";
            const annualDiscount = calcAnnualDiscountPercent(plan);

            // Bento layout offsets
            const offsetClass =
              index === 1 ? "translate-y-4" :
                index === visiblePlans.length - 1 && visiblePlans.length >= 5 ? "translate-y-6" : "";

            // Grid placement for 5+ plans
            const gridPlacement =
              visiblePlans.length >= 5
                ? index === 3
                  ? "lg:col-start-1 lg:row-start-2"
                  : index === 4
                    ? "lg:col-start-3 lg:row-start-2"
                    : ""
                : "";

            return (
              <div
                key={plan.id}
                data-testid={`plan-card-${plan.id.toLowerCase()}`}
                className={`p-8 rounded-[1rem] flex flex-col justify-between transition-colors ${offsetClass} ${gridPlacement} ${isHighlighted
                  ? "primary-gradient text-white relative overflow-hidden"
                  : "bg-surface-container-low hover:bg-surface-container"
                  }`}
              >
                {/* Best Choice Badge */}
                {(plan.badge || isHighlighted) && (
                  <div className="absolute top-0 right-0 p-4">
                    <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold">
                      {plan.badge || t("bestChoice")}
                    </span>
                  </div>
                )}

                <div>
                  {/* Category Label */}
                  <span
                    className={`text-sm font-label uppercase tracking-widest mb-4 block ${isHighlighted ? "opacity-70" : "text-on-surface-variant"
                      }`}
                  >
                    {t(`categories.${getCategoryKey(index)}`)}
                  </span>

                  {/* Plan Name */}
                  <h3 className={`text-3xl font-bold font-headline mb-1 ${isHighlighted ? "text-white" : ""}`}>
                    {plan.displayNameBn}
                  </h3>

                  {/* FT2 offer note */}
                  {isFt2Plan(plan) && (
                    <p className={`text-xs mb-5 ${isHighlighted ? "text-white/60" : "text-on-surface-variant"}`}>
                      {t("ft2OfferNote")}
                    </p>
                  )}

                  {/* Price */}
                  <div className="mb-8">
                    <span className={`text-5xl font-headline font-extrabold ${isHighlighted ? "" : "text-primary"}`}>
                      {formatPlanPrice(plan, billingAnnual, s)}
                    </span>
                    {!isEnterprise && (
                      <span className={isHighlighted ? "opacity-70" : "text-on-surface-variant"}>
                        {" "}{formatPlanDuration(plan, billingAnnual, t, s)}
                      </span>
                    )}
                    {billingAnnual && !isEnterprise && supportsAnnualBilling(plan) && annualDiscount != null && (
                      <span className="ml-2 text-xs bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-semibold">
                        {t("savePercent", { percent: annualDiscount })}
                      </span>
                    )}
                  </div>

                  {/* Features or Enterprise Description */}
                  {isEnterprise ? (
                    <p className={`text-sm leading-relaxed ${isHighlighted ? "opacity-80" : "text-on-surface-variant"}`}>
                      {t("enterpriseDescription")}
                    </p>
                  ) : (
                    <PlanFeatureList plan={plan} isBn={isBn} maxItems={5} compact inverted={isHighlighted} />
                  )}
                </div>

                {/* CTA Button */}
                <button
                  data-testid={`plan-action-${plan.id.toLowerCase()}`}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handlePlanAction(plan, action)}
                  className={`mt-12 w-full py-4 rounded-lg font-bold transition-all text-center ${isDisabled
                    ? action === "OFFER_ONLY"
                      ? isHighlighted
                        ? "bg-white/15 text-white/50 cursor-not-allowed border border-dashed border-white/30"
                        : "bg-surface-container text-on-surface-variant/50 cursor-not-allowed border border-dashed border-outline-variant"
                      : isHighlighted
                        ? "bg-white/20 text-white/60 cursor-not-allowed"
                        : "bg-surface-container-high text-on-surface-variant cursor-not-allowed"
                    : isHighlighted
                      ? "bg-white text-primary hover:shadow-lg active:scale-95"
                      : isEnterprise
                        ? "bg-primary text-on-primary hover:shadow-lg active:scale-95"
                        : "bg-surface-container-highest text-primary hover:bg-outline-variant"
                    }`}
                >
                  {action === "CURRENT" ? `${s("pricing.currentPlan")} ✓` : actionLabel(plan, action, isAuthenticated, s)}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-14 rounded-[1.5rem] border border-outline-variant/30 bg-surface p-5">
          <h3 className="text-lg font-bold text-on-surface mb-4">{t("quickReference.title")}</h3>
          <div className="overflow-x-auto">
            <table data-testid="quick-reference-table" className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-outline-variant/30 text-on-surface-variant">
                  <th className="px-3 py-2 font-semibold">{t("quickReference.columns.plan")}</th>
                  <th className="px-3 py-2 font-semibold">{t("quickReference.columns.price")}</th>
                  <th className="px-3 py-2 font-semibold">{t("quickReference.columns.duration")}</th>
                  <th className="px-3 py-2 font-semibold">{t("quickReference.columns.businesses")}</th>
                  <th className="px-3 py-2 font-semibold">{t("quickReference.columns.products")}</th>
                  <th className="px-3 py-2 font-semibold">{t("quickReference.columns.aiPerDay")}</th>
                  <th className="px-3 py-2 font-semibold">{t("quickReference.columns.cta")}</th>
                </tr>
              </thead>
              <tbody>
                {visiblePlans.map((plan) => {
                  const action = resolvePlanAction(currentPlan, plan, isAuthenticated);
                  const durationText = isEnterprisePlan(plan)
                    ? t("quickReference.yearly")
                    : plan.durationDays % 30 === 0
                      ? `${Math.max(1, Math.round(plan.durationDays / 30))} ${s("pricing.month")}`
                      : `${plan.durationDays} ${t("quickReference.days")}`;

                  return (
                    <tr key={`quick-${plan.id}`} className="border-b border-outline-variant/20 last:border-none">
                      <td className="px-3 py-2 font-semibold">{plan.displayNameBn}</td>
                      <td className="px-3 py-2">{formatPlanPrice(plan, billingAnnual, s)}</td>
                      <td className="px-3 py-2">{durationText}</td>
                      <td className="px-3 py-2">{plan.maxBusinesses === 0 ? s("pricing.unlimited") : plan.maxBusinesses}</td>
                      <td className="px-3 py-2">{getProductsLabel(plan, s)}</td>
                      <td className="px-3 py-2">{plan.aiQueriesPerDay ?? s("pricing.unlimited")}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => handlePlanAction(plan, action)}
                          disabled={action === "CURRENT" || action === "OFFER_ONLY"}
                          className={`inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${action === "CURRENT" || action === "OFFER_ONLY"
                            ? "bg-surface-container-high text-on-surface-variant cursor-not-allowed"
                            : isEnterprisePlan(plan)
                              ? "bg-secondary text-on-secondary"
                              : "bg-primary/10 text-primary hover:bg-primary/15"
                            }`}
                        >
                          {action === "CURRENT" ? `${s("pricing.currentPlan")} ✓` : action === "OFFER_ONLY" ? s("pricing.offerOnly") : actionLabel(plan, action, isAuthenticated, s)}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <h3 className="text-lg font-bold text-on-surface">{t("featureMatrix.title")}</h3>
          {featureSections.map((section) => (
            <div key={section.key} className="rounded-[1rem] border border-outline-variant/30 bg-surface p-5">
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-on-surface-variant">
                {section.title}
              </h4>
              <div className="overflow-x-auto">
                <table data-testid={`feature-matrix-${section.key}`} className="min-w-[720px] w-full text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/30 text-left text-on-surface-variant">
                      <th className="sticky left-0 z-10 bg-surface px-3 py-2 font-semibold">
                        {t("featureMatrix.columns.feature")}
                      </th>
                      {visiblePlans.map((plan) => (
                        <th key={`feature-col-${section.key}-${plan.id}`} className="px-3 py-2 text-center font-semibold">
                          {isBn ? plan.displayNameBn : plan.displayNameEn}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.rows.map((row) => (
                      <tr key={row.key} className="border-b border-outline-variant/20 last:border-none">
                        <td className="sticky left-0 z-10 bg-surface px-3 py-2 font-medium text-on-surface">
                          {row.label}
                        </td>
                        {visiblePlans.map((plan) => (
                          <td key={`${section.key}-${row.key}-${plan.id}`} className="px-3 py-2 text-center">
                            {renderMatrixCell(getPlanFeatureCell(plan, row.key, isBn), isBn)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
