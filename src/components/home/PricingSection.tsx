"use client";

import { getAvailablePlans, getCurrentSubscription } from "@/lib/subscriptionApi";
import { rememberPendingUpgrade } from "@/lib/authFlow";
import type { Plan, Subscription } from "@/types/subscription";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";


function formatPrice(value: number): string {
  return new Intl.NumberFormat("bn-BD").format(value);
}

const FEATURE_ALIASES: Record<string, string[]> = {
  products_sales: ["products_sales"],
  expense_tracking: ["expense_tracking"],
  basic_reports: ["basic_reports"],
  due_management: ["due_management", "dueManagement"],
  discount_management: ["discount_management", "discountManagement"],
  voice_entry: ["voice_entry", "voice_input", "voiceInput"],
  whatsapp_reminder: ["whatsapp_reminder", "whatsappReminder"],
  advanced_reports: ["advanced_reports", "advanced_analytics", "advancedReports", "advancedAnalytics"],
  pdf_export: ["pdf_export", "pdfExport"],
  bulk_import: ["bulk_import", "bulkImport"],
  priority_support: ["priority_support", "prioritySupport"],
  data_export: ["data_export", "dataExport"],
  api_access: ["api_access", "apiAccess"],
};

function hasFeature(plan: Plan, featureKey: string): boolean {
  const featureMap = plan.features;
  if (!featureMap) return false;

  const keys = FEATURE_ALIASES[featureKey] ?? [featureKey];
  return keys.some((key) => featureMap[key] === true);
}

type PlanAction = "LOGIN" | "CURRENT" | "UPGRADE" | "DOWNGRADE";

function isEnterprisePlan(plan: Plan): boolean {
  return plan.customPricing === true || plan.name === "ENTERPRISE";
}

function resolvePlanAction(currentPlan: Plan | null, targetPlan: Plan, isAuthenticated: boolean): PlanAction {
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
        const data = await getAvailablePlans();
        if (cancelled) return;
        const active = data.filter((plan) => plan.isActive).sort((a, b) => a.tierLevel - b.tierLevel);
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

  const featureRows = useMemo(
    () => [
      { key: "products_sales", label: t("featureMatrix.rows.productsSales") },
      { key: "expense_tracking", label: t("featureMatrix.rows.expenseTracking") },
      { key: "basic_reports", label: t("featureMatrix.rows.basicReports") },
      { key: "due_management", label: t("featureMatrix.rows.dueManagement") },
      { key: "discount_management", label: t("featureMatrix.rows.discountManagement") },
      { key: "voice_entry", label: t("featureMatrix.rows.voiceInput") },
      { key: "text_nlp", label: t("featureMatrix.rows.textNlp") },
      { key: "whatsapp_reminder", label: t("featureMatrix.rows.whatsappReminder") },
      { key: "smart_notifications", label: t("featureMatrix.rows.smartNotifications") },
      { key: "email_support", label: t("featureMatrix.rows.emailSupport") },
      { key: "advanced_reports", label: t("featureMatrix.rows.advancedReports") },
      { key: "pdf_export", label: t("featureMatrix.rows.pdfExport") },
      { key: "bulk_import", label: t("featureMatrix.rows.bulkImport") },
      { key: "priority_support", label: t("featureMatrix.rows.prioritySupport") },
      { key: "data_export", label: t("featureMatrix.rows.dataExport") },
      { key: "api_access", label: t("featureMatrix.rows.apiAccess") },
    ],
    [t],
  );

  const hasAnyAnnualPrice = useMemo(() => plans.some((p) => p.annualPriceBdt != null && !p.isTrial && p.priceBdt > 0), [plans]);

  const handlePlanAction = (plan: Plan, action: PlanAction) => {
    if (isEnterprisePlan(plan)) {
      if (typeof window !== "undefined") {
        window.location.href = getEnterpriseContactHref(s("pricing.enterpriseEmail"), s("pricing.enterpriseEmailSubject"));
      }
      return;
    }

    if (action === "CURRENT") {
      return;
    }

    if (!isAuthenticated) {
      rememberPendingUpgrade(plan.id);
      router.push("/register");
      return;
    }

    const billingParam = billingAnnual && plan.annualPriceBdt != null ? "&billing=ANNUAL" : "";
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
        {hasAnyAnnualPrice && (
          <div className="flex items-center justify-center mb-10">
            <div className="inline-flex items-center rounded-full bg-surface-container-low p-1 gap-1">
              <button
                type="button"
                onClick={() => setBillingAnnual(false)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${!billingAnnual
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
                  }`}
              >
                {t("monthly")}
              </button>
              <button
                type="button"
                onClick={() => setBillingAnnual(true)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all inline-flex items-center gap-1.5 ${billingAnnual
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
                  }`}
              >
                {t("annual")}
                <span className="text-xs bg-secondary text-on-secondary px-2 py-0.5 rounded-full">
                  {t("annualDiscount")}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Bento-style Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {orderedPlans.map((plan, index) => {
            const isHighlighted = plan.highlight === true;
            const isEnterprise = isEnterprisePlan(plan);
            const action = resolvePlanAction(currentPlan, plan, isAuthenticated);
            const isDisabled = action === "CURRENT";
            const annualDiscount = calcAnnualDiscountPercent(plan);

            // Bento layout offsets
            const offsetClass =
              index === 1 ? "translate-y-4" :
                index === orderedPlans.length - 1 && orderedPlans.length >= 5 ? "translate-y-6" : "";

            // Grid placement for 5+ plans
            const gridPlacement =
              orderedPlans.length >= 5
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
                {isHighlighted && (
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
                  <h3 className={`text-3xl font-bold font-headline mb-6 ${isHighlighted ? "text-white" : ""}`}>
                    {plan.displayNameBn}
                  </h3>

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
                    {billingAnnual && !isEnterprise && annualDiscount != null && (
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
                    <ul className="space-y-4">
                      <li className="flex items-center gap-3 text-sm">
                        <span className={`material-symbols-outlined ${isHighlighted ? "text-inverse-primary" : "text-primary"} scale-75`}>
                          check_circle
                        </span>
                        {s("pricing.maxBusinesses")}: {plan.maxBusinesses === 0 ? s("pricing.unlimited") : plan.maxBusinesses}
                      </li>
                      <li className="flex items-center gap-3 text-sm">
                        <span className={`material-symbols-outlined ${isHighlighted ? "text-inverse-primary" : "text-primary"} scale-75`}>
                          check_circle
                        </span>
                        {s("pricing.maxProducts")}: {getProductsLabel(plan, s)}
                      </li>
                      <li className="flex items-center gap-3 text-sm">
                        <span
                          className={`material-symbols-outlined ${isHighlighted ? "text-inverse-primary" : "text-primary"} scale-75`}
                          style={isHighlighted ? { fontVariationSettings: "'FILL' 1" } : undefined}
                        >
                          {isHighlighted ? "auto_awesome" : "check_circle"}
                        </span>
                        {s("pricing.aiPerDay")}: {plan.aiQueriesPerDay ?? s("pricing.unlimited")}
                      </li>
                    </ul>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  data-testid={`plan-action-${plan.id.toLowerCase()}`}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handlePlanAction(plan, action)}
                  className={`mt-12 w-full py-4 rounded-lg font-bold transition-all text-center ${isDisabled
                    ? isHighlighted
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
                {orderedPlans.map((plan) => {
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
                          disabled={action === "CURRENT"}
                          className={`inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${action === "CURRENT"
                            ? "bg-surface-container-high text-on-surface-variant cursor-not-allowed"
                            : isEnterprisePlan(plan)
                              ? "bg-secondary text-on-secondary"
                              : "bg-primary/10 text-primary hover:bg-primary/15"
                            }`}
                        >
                          {action === "CURRENT" ? `${s("pricing.currentPlan")} ✓` : actionLabel(plan, action, isAuthenticated, s)}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-outline-variant/30 bg-surface p-5">
          <h3 className="text-lg font-bold text-on-surface mb-4">{t("featureMatrix.title")}</h3>
          <div className="overflow-x-auto">
            <table data-testid="feature-matrix-table" className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-outline-variant/30 text-on-surface-variant">
                  <th className="px-3 py-2 font-semibold">{t("featureMatrix.columns.feature")}</th>
                  {orderedPlans.map((plan) => (
                    <th key={`feature-col-${plan.id}`} className="px-3 py-2 font-semibold text-center">
                      {plan.displayNameBn}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureRows.map((row) => (
                  <tr key={row.key} className="border-b border-outline-variant/20 last:border-none">
                    <td className="px-3 py-2 font-medium">{row.label}</td>
                    {orderedPlans.map((plan) => (
                      <td key={`${row.key}-${plan.id}`} className="px-3 py-2 text-center">
                        {hasFeature(plan, row.key) ? t("featureMatrix.included") : t("featureMatrix.excluded")}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-b border-outline-variant/20 last:border-none">
                  <td className="px-3 py-2 font-medium">{t("featureMatrix.rows.aiQueries")}</td>
                  {orderedPlans.map((plan) => (
                    <td key={`ai-${plan.id}`} className="px-3 py-2 text-center">
                      {plan.aiQueriesPerDay == null ? s("pricing.unlimited") : `${plan.aiQueriesPerDay}/${t("quickReference.days")}`}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
