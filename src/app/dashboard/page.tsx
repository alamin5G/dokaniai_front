"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useBusinessStore } from "@/store/businessStore";
import type { BusinessResponse } from "@/types/business";

import KpiCard, { KpiCardSkeleton } from "@/components/dashboard/KpiCard";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import StockAlerts from "@/components/dashboard/StockAlerts";
import DueLedgerWidget from "@/components/dashboard/DueLedgerWidget";
import AiCommandBar from "@/components/dashboard/AiCommandBar";

// ---------------------------------------------------------------------------
// Inline SVG Icons (HeroIcons style)
// ---------------------------------------------------------------------------

function IconSwapHoriz({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  );
}

function IconPlusBusiness({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  );
}

function IconSparkles({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function IconArrowForward({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function IconArchive({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

function IconMoreVert({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
    </svg>
  );
}

function IconTrendingUp({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" />
    </svg>
  );
}

function IconHistory({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconWallet({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  );
}

function IconBox({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

function IconCalendar({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Helper: get greeting based on time of day
// ---------------------------------------------------------------------------

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "greeting";
  if (hour < 17) return "greetingAfternoon";
  return "greetingEvening";
}

// ---------------------------------------------------------------------------
// Onboarding progress from real API data
// Total onboarding steps = 7 (matching backend)
// ---------------------------------------------------------------------------

const TOTAL_ONBOARDING_STEPS = 7;

function getOnboardingProgress(
  businessId: string,
  incompleteOnboardings: { businessId: string; onboardingCompleted: boolean; setupStep: number }[],
): number {
  const entry = incompleteOnboardings.find((o) => o.businessId === businessId);
  if (!entry || entry.onboardingCompleted) return 100;
  return Math.round((entry.setupStep / TOTAL_ONBOARDING_STEPS) * 100);
}

// ---------------------------------------------------------------------------
// Dashboard Page — Workspace View
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tb = useTranslations("business");
  const router = useRouter();
  const {
    businesses,
    activeBusiness,
    activeBusinessId,
    stats,
    incompleteOnboardings,
    onboardingStats,
    loadStats,
    loadBusinesses,
    loadIncompleteOnboardings,
    loadOnboardingStats,
    setActiveBusiness,
    isLoading,
  } = useBusinessStore();

  const [showKpiDashboard, setShowKpiDashboard] = useState(false);

  // Load businesses on mount (for workspace view)
  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  // Load onboarding data (endpoints #14 and #15) when businesses are loaded
  useEffect(() => {
    if (businesses.length > 0) {
      loadIncompleteOnboardings();
      loadOnboardingStats();
    }
  }, [businesses.length, loadIncompleteOnboardings, loadOnboardingStats]);

  // Load stats when active business changes
  useEffect(() => {
    if (activeBusinessId) {
      loadStats(activeBusinessId);
    }
  }, [activeBusinessId, loadStats]);

  // Show KPI dashboard if only 1 active business and onboarding complete
  const activeBusinesses = businesses.filter((b) => b.status === "ACTIVE");
  const hasIncompleteOnboarding = activeBusinesses.some(
    (b) => getOnboardingProgress(b.id, incompleteOnboardings) < 100,
  );

  useEffect(() => {
    if (activeBusinesses.length === 1 && !hasIncompleteOnboarding) {
      setShowKpiDashboard(true);
    } else {
      setShowKpiDashboard(false);
    }
  }, [activeBusinesses.length, hasIncompleteOnboarding]);

  const greetingKey = getGreetingKey();
  const businessName = activeBusiness?.name ?? "";

  // Format today's date
  const today = new Date();
  const dateStr = today.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Format number with commas
  const fmt = (n: number | undefined, prefix = "৳") =>
    n != null ? `${prefix} ${n.toLocaleString()}` : `${prefix} ০`;

  const handleSelectBusiness = useCallback(
    (business: BusinessResponse) => {
      setActiveBusiness(business);
      router.push("/dashboard");
    },
    [setActiveBusiness, router]
  );

  const handleManageBusiness = useCallback(
    (business: BusinessResponse) => {
      setActiveBusiness(business);
      router.push("/dashboard/settings");
    },
    [setActiveBusiness, router]
  );

  return (
    <div className="space-y-8">
      {/* ---- Workspace Header ---- */}
      <section className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-2">
            {t("workspace.title")}
          </h1>
          <p className="text-xl text-on-surface-variant">
            {t("workspace.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => router.push("/businesses")}
            className="px-6 py-3 bg-surface-container-lowest text-primary font-semibold rounded-lg flex items-center gap-2 hover:bg-white transition-all"
          >
            <IconSwapHoriz className="w-5 h-5" />
            {t("workspace.switchWorkspace")}
          </button>
          <button
            type="button"
            onClick={() => router.push("/businesses")}
            className="px-6 py-3 text-on-primary font-bold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all"
            style={{ background: "linear-gradient(135deg, #003727 0%, #00503a 100%)" }}
          >
            <IconPlusBusiness className="w-5 h-5" />
            {t("workspace.addBusiness")}
          </button>
        </div>
      </section>

      {/* ---- AI Insight Bento Box — shows when onboarding is incomplete ---- */}
      {hasIncompleteOnboarding && (
        <div
          className="p-8 rounded-xl mb-4 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden"
          style={{ background: "rgba(225, 227, 223, 0.6)", backdropFilter: "blur(20px)" }}
        >
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl" style={{ background: "rgba(0, 97, 164, 0.1)" }} />
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.4)" }}>
            <IconSparkles className="w-8 h-8 text-secondary" />
          </div>
          <div className="flex-1">
            <h3 className="text-secondary font-bold text-lg mb-1">{t("workspace.aiInsight")}</h3>
            <p className="text-on-surface text-xl leading-relaxed">
              {onboardingStats && onboardingStats.incomplete > 0
                ? t("workspace.aiInsightTextDetailed", {
                  incomplete: onboardingStats.incomplete,
                  completed: onboardingStats.completed,
                })
                : t("workspace.aiInsightText")}
            </p>
          </div>
          <button
            onClick={() => router.push("/onboarding")}
            className="px-8 py-3 text-white font-bold rounded-full hover:scale-105 transition-transform active:scale-95"
            style={{ background: "linear-gradient(135deg, #0061a4 0%, #77b7ff 100%)" }}
          >
            {t("workspace.fixNow")}
          </button>
        </div>
      )}

      {/* ---- Business Card Grid ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {activeBusinesses.map((business) => {
          const progress = getOnboardingProgress(business.id, incompleteOnboardings);
          const isActive = activeBusinessId === business.id;
          return (
            <div
              key={business.id}
              className={`bg-surface-container-lowest p-8 rounded-[1rem] group hover:shadow-xl transition-all duration-300 relative overflow-hidden ${isActive ? "ring-2 ring-primary/20" : ""}`}
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <span className="text-xs font-bold text-secondary tracking-widest uppercase mb-2 block">
                    {business.type ? tb(`types.${business.type}` as Parameters<typeof tb>[0]) : ""}
                  </span>
                  <h2 className="text-2xl font-black text-on-surface">{business.name}</h2>
                  <p className="text-on-surface-variant text-sm mt-1">{business.slug}</p>
                </div>
                <div className="flex gap-2">
                  <button className="w-10 h-10 rounded-full flex items-center justify-center text-outline hover:bg-surface-container transition-colors">
                    <IconArchive className="w-5 h-5" />
                  </button>
                  <button className="w-10 h-10 rounded-full flex items-center justify-center text-outline hover:bg-surface-container transition-colors">
                    <IconMoreVert className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Onboarding Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-on-surface-variant">
                    {t("workspace.onboardingStatus")}
                  </span>
                  <span className={`text-sm font-bold ${progress >= 100 ? "text-primary" : progress > 50 ? "text-primary" : "text-tertiary"}`}>
                    {progress}%
                  </span>
                </div>
                <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? "bg-primary-container" : progress > 50 ? "bg-primary-container" : "bg-tertiary-container"}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Manage Button */}
              <button
                onClick={() => handleManageBusiness(business)}
                className="w-full py-4 bg-surface-container-low text-primary font-bold rounded-lg hover:bg-primary-fixed-dim/20 transition-colors flex items-center justify-center gap-2"
              >
                {t("workspace.manageBusiness")}
                <IconArrowForward className="w-4 h-4" />
              </button>
            </div>
          );
        })}

        {/* ---- Empty Add Card ---- */}
        <button
          onClick={() => router.push("/businesses")}
          className="border-2 border-dashed border-outline-variant bg-transparent p-8 rounded-[1rem] group hover:bg-white/50 transition-all duration-300 flex flex-col items-center justify-center gap-4 text-outline hover:text-primary min-h-[280px]"
        >
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-primary-fixed transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <span className="font-bold text-lg">{t("workspace.addNewBusiness")}</span>
        </button>
      </div>

      {/* ---- KPI Dashboard (shown when single business + onboarding complete) ---- */}
      {showKpiDashboard && (
        <>
          {/* Welcome Section */}
          <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-on-surface mb-1">
                {t(`welcome.${greetingKey}`, { name: businessName })} 👋
              </h2>
              <p className="text-on-surface-variant text-base md:text-lg">
                {t("welcome.subtitle")}
              </p>
            </div>
            <div className="bg-surface-container-low px-4 py-2 rounded-full flex items-center gap-2 text-primary font-semibold">
              <IconCalendar className="w-5 h-5" />
              <span className="text-sm">
                {t("welcome.dateLabel", { date: dateStr })}
              </span>
            </div>
          </section>

          {/* AI Command Bar */}
          <AiCommandBar />

          {/* KPI Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading || !stats ? (
              <>
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
              </>
            ) : (
              <>
                <KpiCard
                  title={t("kpi.todaySales")}
                  value={fmt(stats.totalRevenue)}
                  icon={<IconTrendingUp className="w-5 h-5" />}
                  accentColor="text-primary"
                  subtitle={`${stats.totalSales} টি বিক্রয়`}
                />
                <KpiCard
                  title={t("kpi.totalDue")}
                  value={fmt(stats.totalDue)}
                  icon={<IconHistory className="w-5 h-5" />}
                  accentColor="text-tertiary"
                  subtitle={`${stats.activeCustomers} জন ক্রেতা`}
                />
                <KpiCard
                  title={t("kpi.todayExpense")}
                  value={fmt(undefined)}
                  icon={<IconWallet className="w-5 h-5" />}
                  accentColor="text-on-surface"
                />
                <KpiCard
                  title={t("kpi.totalProducts")}
                  value={stats.totalProducts?.toLocaleString() ?? "০"}
                  icon={<IconBox className="w-5 h-5" />}
                  accentColor="text-secondary"
                  subtitle={t("kpi.count", { count: stats.totalProducts ?? 0 })}
                />
              </>
            )}
          </section>

          {/* Quick Actions */}
          <QuickActions />

          {/* Main Content: Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <RecentTransactions />
            </div>
            <div className="lg:col-span-4 space-y-8">
              <StockAlerts />
              <DueLedgerWidget />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
