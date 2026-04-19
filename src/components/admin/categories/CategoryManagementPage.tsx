"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import CategoryTaxonomyView from "./CategoryTaxonomyView";
import ModerationDashboard from "./ModerationDashboard";
import CategoryStatsView from "./CategoryStatsView";
import { useCategoryRequestStats } from "@/hooks/useCategories";

type Tab = "taxonomy" | "moderation" | "stats";

export default function CategoryManagementPage() {
  const t = useTranslations("admin.categories");
  const [activeTab, setActiveTab] = useState<Tab>("taxonomy");
  const { stats, isLoading: statsLoading } = useCategoryRequestStats();

  const tabs: { key: Tab; icon: string; label: string; badge?: number }[] = [
    { key: "taxonomy", icon: "account_tree", label: t("tabs.taxonomy") },
    { key: "moderation", icon: "pending_actions", label: t("tabs.moderation"), badge: stats?.pending ?? 0 },
    { key: "stats", icon: "bar_chart", label: t("tabs.stats") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface tracking-tight">
            {t("pageTitle")}
          </h1>
          <p className="text-on-surface-variant font-body mt-1 text-sm">
            {t("pageSubtitle")}
          </p>
        </div>
      </div>

      <div className="flex gap-1 bg-surface-container-low rounded-2xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-1 justify-center ${
              activeTab === tab.key
                ? "bg-surface-container-lowest text-on-surface shadow-sm"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {tab.icon}
            </span>
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-error text-on-error text-[10px] font-bold">
                {tab.badge > 99 ? "99+" : tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "taxonomy" && <CategoryTaxonomyView />}
        {activeTab === "moderation" && <ModerationDashboard />}
        {activeTab === "stats" && <CategoryStatsView />}
      </div>
    </div>
  );
}
