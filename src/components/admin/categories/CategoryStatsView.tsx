"use client";

import { useTranslations } from "next-intl";
import { useCategoryRequestStats } from "@/hooks/useCategories";

export default function CategoryStatsView() {
  const t = useTranslations("admin.categories.stats");
  const { stats, isLoading } = useCategoryRequestStats();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-container-high border-t-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-surface-container-lowest rounded-2xl p-12 shadow-sm text-center">
        <p className="text-on-surface-variant text-sm">{t("loadError")}</p>
      </div>
    );
  }

  const kpis = [
    { label: t("pending"), value: stats.pending, icon: "schedule", color: "bg-error-container text-on-error-container" },
    { label: t("approvedGlobal"), value: stats.approvedGlobal, icon: "public", color: "bg-emerald-100 text-emerald-700" },
    { label: t("approvedBusiness"), value: stats.approvedBusiness, icon: "storefront", color: "bg-blue-100 text-blue-700" },
    { label: t("rejected"), value: stats.rejected, icon: "block", color: "bg-red-100 text-red-700" },
    { label: t("underReview"), value: stats.underReview, icon: "visibility", color: "bg-amber-100 text-amber-700" },
    { label: t("cancelled"), value: stats.cancelled, icon: "cancel", color: "bg-surface-container-high text-on-surface-variant" },
    { label: t("duplicateSuggested"), value: stats.duplicateSuggested, icon: "content_copy", color: "bg-purple-100 text-purple-700" },
  ];

  const total = kpis.reduce((sum, k) => sum + k.value, 0);

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-on-surface">{t("overview")}</h2>
          <div className="text-sm text-on-surface-variant">
            {t("totalRequests")}: <span className="font-bold text-on-surface">{total}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="bg-surface-container-low rounded-2xl p-4 flex flex-col items-center text-center"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${kpi.color}`}>
                <span className="material-symbols-outlined text-[18px]">{kpi.icon}</span>
              </div>
              <p className="text-2xl font-bold text-on-surface">{kpi.value}</p>
              <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{kpi.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-on-surface mb-4">{t("distribution")}</h3>
        {total === 0 ? (
          <p className="text-sm text-on-surface-variant py-8 text-center">{t("noData")}</p>
        ) : (
          <div className="space-y-3">
            {kpis
              .filter((k) => k.value > 0)
              .sort((a, b) => b.value - a.value)
              .map((kpi) => (
                <div key={kpi.label} className="flex items-center gap-3">
                  <span className="text-xs text-on-surface-variant w-28 text-right shrink-0">{kpi.label}</span>
                  <div className="flex-1 bg-surface-container-low rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full rounded-full flex items-center justify-end pr-2 transition-all ${
                        kpi.label === t("pending") ? "bg-error-container" :
                        kpi.label === t("approvedGlobal") ? "bg-emerald-200" :
                        kpi.label === t("approvedBusiness") ? "bg-blue-200" :
                        kpi.label === t("rejected") ? "bg-red-200" :
                        "bg-surface-container-highest"
                      }`}
                      style={{ width: `${Math.max((kpi.value / total) * 100, 8)}%` }}
                    >
                      <span className="text-[10px] font-bold text-on-surface">{kpi.value}</span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-on-surface-variant w-12">{Math.round((kpi.value / total) * 100)}%</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
