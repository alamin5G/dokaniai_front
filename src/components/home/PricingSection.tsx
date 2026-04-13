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

function formatPlanDuration(plan: Plan, t: (key: string) => string, s: (key: string) => string): string {
  if (isEnterprisePlan(plan)) {
    return t("quickReference.yearly");
  }

  if (plan.durationDays % 30 === 0 && plan.durationDays < 365) {
    return `/${Math.max(1, Math.round(plan.durationDays / 30))} ${s("pricing.month")}`;
  }

  return `/${plan.durationDays} ${t("quickReference.days")}`;
}

function formatPlanPrice(plan: Plan, s: (key: string) => string): string {
  if (isEnterprisePlan(plan)) {
    return s("pricing.customPrice");
  }

  return plan.priceBdt === 0 ? s("pricing.free") : `৳${formatPrice(plan.priceBdt)}`;
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
  const isAuthenticated = useSyncExternalStore(
    () => () => {},
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
      { key: "whatsapp_reminder", label: t("featureMatrix.rows.whatsappReminder") },
      { key: "advanced_reports", label: t("featureMatrix.rows.advancedReports") },
      { key: "pdf_export", label: t("featureMatrix.rows.pdfExport") },
      { key: "bulk_import", label: t("featureMatrix.rows.bulkImport") },
      { key: "priority_support", label: t("featureMatrix.rows.prioritySupport") },
      { key: "data_export", label: t("featureMatrix.rows.dataExport") },
      { key: "api_access", label: t("featureMatrix.rows.apiAccess") },
    ],
    [t],
  );

  const handlePlanAction = (plan: Plan, action: PlanAction) => {
    if (isEnterprisePlan(plan)) {
      if (typeof window !== "undefined") {
        window.open(getEnterpriseContactHref(s("pricing.enterpriseEmail"), s("pricing.enterpriseEmailSubject")), "_self");
      }
      return;
    }

    if (action === "CURRENT") {
      return;
    }

    if (!isAuthenticated) {
      rememberPendingUpgrade(plan.id);
      router.push("/login");
      return;
    }

    const targetPath = action === "DOWNGRADE"
      ? `/subscription/downgrade?plan=${encodeURIComponent(plan.id)}`
      : `/subscription/upgrade?plan=${encodeURIComponent(plan.id)}`;

    router.push(targetPath);
  };


  if (plansStatus === "loading" && plans.length === 0) {
    return (
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <span className="text-secondary font-bold tracking-widest uppercase text-xs">{t("label")}</span>
            <h2 className="text-4xl font-black text-primary font-headline">{t("title")}</h2>
            <p className="text-on-surface-variant text-lg font-medium">{t("subtitle")}</p>
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
        <div className="text-center mb-20 space-y-4">
          <span className="text-secondary font-bold tracking-widest uppercase text-xs">{t("label")}</span>
          <h2 className="text-4xl font-black text-primary font-headline">{t("title")}</h2>
          <p className="text-on-surface-variant text-lg font-medium">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {plans.map((plan) => {
            const isHighlighted = plan.highlight === true;
            const isEnterprise = isEnterprisePlan(plan);
            const action = resolvePlanAction(currentPlan, plan, isAuthenticated);
            const isDisabled = action === "CURRENT";

            return (
              <div
                key={plan.id}
                data-testid={`plan-card-${plan.id.toLowerCase()}`}
                className={`relative p-6 rounded-[1.5rem] flex flex-col justify-between shadow-sm transition-transform hover:scale-[1.02] ${
                  isEnterprise
                    ? "bg-surface-container-low"
                    : isHighlighted
                      ? "bg-primary-container text-on-primary-container shadow-xl border-2 border-primary/30"
                      : "bg-surface-container-lowest"
                }`}
              >
                {plan.badge && (
                  <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-bl-xl rounded-tr-[1.5rem] ${
                    isHighlighted ? "bg-primary text-on-primary" : "bg-secondary text-on-secondary"
                  }`}>
                    {plan.badge}
                  </div>
                )}

                <div>
                  <h4 className="font-bold mb-1">{plan.displayNameBn}</h4>
                  <div className="text-2xl font-black mb-4">
                    {formatPlanPrice(plan, s)} {" "}
                    <span className="text-sm font-normal opacity-75">
                      {formatPlanDuration(plan, t, s)}
                    </span>
                  </div>
                  <ul className="space-y-3 text-sm font-medium">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      {s("pricing.maxBusinesses")}: {plan.maxBusinesses === 0 ? s("pricing.unlimited") : plan.maxBusinesses}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      {s("pricing.maxProducts")}: {getProductsLabel(plan, s)}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      {s("pricing.aiPerDay")}: {plan.aiQueriesPerDay ?? s("pricing.unlimited")}
                    </li>
                  </ul>
                </div>

                <button
                  data-testid={`plan-action-${plan.id.toLowerCase()}`}
                  type="button"
                  disabled={isDisabled || isEnterprise}
                  onClick={() => handlePlanAction(plan, action)}
                  className={`mt-8 w-full py-3 rounded-xl font-bold text-sm shadow-md transition-all text-center ${
                    isDisabled
                      ? "bg-surface-container-high text-on-surface-variant cursor-not-allowed"
                      : isEnterprise
                        ? "bg-secondary text-on-secondary hover:shadow-lg active:scale-95"
                        : "bg-primary text-on-primary hover:shadow-lg active:scale-95"
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
                      <td className="px-3 py-2">{formatPlanPrice(plan, s)}</td>
                      <td className="px-3 py-2">{durationText}</td>
                      <td className="px-3 py-2">{plan.maxBusinesses === 0 ? s("pricing.unlimited") : plan.maxBusinesses}</td>
                      <td className="px-3 py-2">{getProductsLabel(plan, s)}</td>
                      <td className="px-3 py-2">{plan.aiQueriesPerDay ?? s("pricing.unlimited")}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => handlePlanAction(plan, action)}
                          disabled={action === "CURRENT"}
                          className={`inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                            action === "CURRENT"
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
