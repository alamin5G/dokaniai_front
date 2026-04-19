"use client";

import {
  getAvailablePlans,
  getCurrentSubscription,
  scheduleDowngrade,
  validateDowngrade,
} from "@/lib/subscriptionApi";
import type { DowngradeValidation, Plan, Subscription } from "@/types/subscription";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Suspense, useEffect, useMemo, useState } from "react";

function SubscriptionDowngradeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const isBn = locale.startsWith("bn");
  const t = useTranslations("subscription");

  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [validation, setValidation] = useState<DowngradeValidation | null>(null);
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
      if (!parsed?.state?.accessToken) {
        router.replace("/login");
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [allPlans, current] = await Promise.all([
          getAvailablePlans(),
          getCurrentSubscription(),
        ]);

        if (cancelled) {
          return;
        }

        const activePlans = allPlans.filter((plan) => plan.isActive).sort((a, b) => a.tierLevel - b.tierLevel);
        const currentPlan = current ? activePlans.find((plan) => plan.id === current.planId) ?? null : null;
        const lowerTierPlans = currentPlan == null
          ? []
          : activePlans.filter((plan) => plan.tierLevel < currentPlan.tierLevel && plan.name !== "ENTERPRISE");

        setPlans(activePlans);
        setCurrentSubscription(current);

        const planFromUrl = searchParams.get("plan");
        const fallbackPlanId = lowerTierPlans[lowerTierPlans.length - 1]?.id ?? "";
        const resolvedPlanId = lowerTierPlans.find((plan) => plan.id === planFromUrl)?.id ?? fallbackPlanId;
        setSelectedPlanId(resolvedPlanId);
      } catch (error) {
        if (!cancelled) {
          setNotice(error instanceof Error ? error.message : t("downgrade.errors.loadFailed"));
        }
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
  }, [searchParams, t]);

  const currentPlan = useMemo(
    () => plans.find((plan) => plan.id === currentSubscription?.planId) ?? null,
    [plans, currentSubscription?.planId],
  );

  const downgradePlans = useMemo(() => {
    if (!currentPlan) return [];
    return plans.filter((plan) => plan.tierLevel < currentPlan.tierLevel && plan.name !== "ENTERPRISE");
  }, [currentPlan, plans]);

  const selectedPlan = useMemo(
    () => downgradePlans.find((plan) => plan.id === selectedPlanId) ?? null,
    [downgradePlans, selectedPlanId],
  );

  useEffect(() => {
    if (!selectedPlanId) {
      setValidation(null);
      return;
    }

    let cancelled = false;

    const loadValidation = async () => {
      try {
        const result = await validateDowngrade(selectedPlanId);
        if (!cancelled) {
          setValidation(result);
        }
      } catch (error) {
        if (!cancelled) {
          setValidation(null);
          setNotice(error instanceof Error ? error.message : t("downgrade.errors.validationFailed"));
        }
      }
    };

    void loadValidation();

    return () => {
      cancelled = true;
    };
  }, [selectedPlanId, t]);

  const handleScheduleDowngrade = async () => {
    if (!selectedPlan) {
      return;
    }

    setIsSubmitting(true);
    try {
      await scheduleDowngrade(selectedPlan.id);
      router.push("/account/subscription?downgrade=scheduled");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("downgrade.errors.scheduleFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="rounded-[1.75rem] border border-outline-variant/30 bg-surface p-6">
        <h1 data-testid="subscription-downgrade-title" className="text-2xl font-bold text-on-surface">
          {t("downgrade.title")}
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">{t("downgrade.subtitle")}</p>
      </header>

      {notice ? (
        <div className="rounded-[1rem] border border-outline-variant/30 bg-surface-container px-4 py-3 text-sm text-on-surface">
          {notice}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-[1rem] border border-outline-variant/30 bg-surface p-5 text-sm text-on-surface-variant">
          {t("downgrade.loading")}
        </div>
      ) : downgradePlans.length === 0 ? (
        <div className="rounded-[1rem] border border-outline-variant/30 bg-surface p-5 text-sm text-on-surface-variant">
          {t("downgrade.noLowerPlan")}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-5 space-y-4">
            <h2 className="text-lg font-semibold text-on-surface">{t("downgrade.planSelection")}</h2>
            <p className="text-sm text-on-surface-variant">
              {t("downgrade.currentPlan")}: {currentPlan ? (isBn ? currentPlan.displayNameBn : currentPlan.displayNameEn) : "-"}
            </p>
            <select
              value={selectedPlanId}
              onChange={(event) => setSelectedPlanId(event.target.value)}
              className="w-full rounded-[1rem] bg-surface-container-highest px-4 py-3"
            >
              {downgradePlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {isBn ? plan.displayNameBn : plan.displayNameEn}
                </option>
              ))}
            </select>
            <p className="text-sm text-on-surface-variant">
              {t("downgrade.targetPlan")}: {selectedPlan ? (isBn ? selectedPlan.displayNameBn : selectedPlan.displayNameEn) : "-"}
            </p>
          </section>

          <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-5 space-y-4">
            <h2 className="text-lg font-semibold text-on-surface">{t("downgrade.validationTitle")}</h2>
            {validation ? (
              <>
                <div className="rounded-[1rem] bg-surface-container px-4 py-4 text-sm text-on-surface">
                  <p>{t("downgrade.businessLimitOk")}: {validation.businessLimitOk}</p>
                  <p>{t("downgrade.productLimitOk")}: {validation.productLimitOk}</p>
                </div>

                {validation.warnings.length > 0 ? (
                  <div className="rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                    <p className="font-semibold">{t("downgrade.warnings")}</p>
                    <ul className="mt-2 space-y-1">
                      {validation.warnings.map((warning) => (
                        <li key={warning}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {validation.actions.length > 0 ? (
                  <div className="rounded-[1rem] border border-outline-variant/30 bg-surface-container px-4 py-4 text-sm text-on-surface">
                    <p className="font-semibold">{t("downgrade.actions")}</p>
                    <ul className="mt-2 space-y-1">
                      {validation.actions.map((action) => (
                        <li key={action}>• {action}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <button
                  data-testid="schedule-downgrade"
                  type="button"
                  onClick={handleScheduleDowngrade}
                  disabled={isSubmitting || !validation.canDowngrade || !selectedPlan}
                  className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {t("downgrade.confirm")}
                </button>
              </>
            ) : (
              <div className="rounded-[1rem] border border-outline-variant/30 bg-surface p-5 text-sm text-on-surface-variant">
                {t("downgrade.validationLoading")}
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

export default function SubscriptionDowngradePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>}>
      <SubscriptionDowngradeContent />
    </Suspense>
  );
}
