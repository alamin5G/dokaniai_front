"use client";

import { getAvailablePlans, getCurrentSubscription } from "@/lib/subscriptionApi";
import { rememberPendingUpgrade } from "@/lib/authFlow";
import type { Plan, Subscription } from "@/types/subscription";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("bn-BD").format(value);
}

type PlanAction = "LOGIN" | "CURRENT" | "UPGRADE" | "DOWNGRADE";

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

function actionLabel(action: PlanAction, s: (key: string) => string): string {
  if (action === "CURRENT") return s("pricing.currentPlan");
  if (action === "UPGRADE") return s("pricing.upgrade");
  if (action === "DOWNGRADE") return s("pricing.downgrade");
  return s("pricing.getStarted");
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [plansStatus, setPlansStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    setIsAuthenticated(hasAccessToken());
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPlans = async () => {
      try {
        const data = await getAvailablePlans();
        if (cancelled) return;
        setPlans(data.filter((plan) => plan.isActive).sort((a, b) => a.tierLevel - b.tierLevel));
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

  const handlePlanAction = (plan: Plan, action: PlanAction) => {
    if (plan.name === "ENTERPRISE") {
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

    router.push(`/subscription/upgrade?plan=${encodeURIComponent(plan.id)}`);
  };

  if (plansStatus === "error") {
    return (
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <span className="text-secondary font-bold tracking-widest uppercase text-xs">{t("label")}</span>
            <h2 className="text-4xl font-black text-primary font-headline">{t("title")}</h2>
            <p className="text-on-surface-variant text-lg font-medium">{t("subtitle")}</p>
          </div>
          <div className="rounded-2xl bg-surface-container-low p-8 text-center text-sm text-on-surface-variant">
            {s("pricing.unavailable")}
          </div>
        </div>
      </section>
    );
  }

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
            const isEnterprise = plan.id === "ENTERPRISE";
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
                    {plan.priceBdt === 0 ? s("pricing.free") : `৳${formatPrice(plan.priceBdt)}`} {" "}
                    <span className="text-sm font-normal opacity-75">
                      /{Math.max(1, Math.round(plan.durationDays / 30))} {s("pricing.month")}
                    </span>
                  </div>
                  <ul className="space-y-3 text-sm font-medium">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      {s("pricing.maxBusinesses")}: {plan.maxBusinesses === 0 ? s("pricing.unlimited") : plan.maxBusinesses}
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
                    isDisabled || isEnterprise
                      ? "bg-surface-container-high text-on-surface-variant cursor-not-allowed"
                      : "bg-primary text-on-primary hover:shadow-lg active:scale-95"
                  }`}
                >
                  {isEnterprise ? s("pricing.contactUs") : actionLabel(action, s)}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
