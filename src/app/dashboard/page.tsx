"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useBusinessStore } from "@/store/businessStore";

import KpiCard, { KpiCardSkeleton } from "@/components/dashboard/KpiCard";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import StockAlerts from "@/components/dashboard/StockAlerts";
import DueLedgerWidget from "@/components/dashboard/DueLedgerWidget";
import AiCommandBar from "@/components/dashboard/AiCommandBar";

// ---------------------------------------------------------------------------
// Inline SVG Icons for KPI cards
// ---------------------------------------------------------------------------

function IconTrendingUp({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"
      />
    </svg>
  );
}

function IconHistory({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

function IconWallet({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
      />
    </svg>
  );
}

function IconBox({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
      />
    </svg>
  );
}

function IconCalendar({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
      />
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
// Dashboard Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { activeBusiness, activeBusinessId, stats, loadStats, isLoading } =
    useBusinessStore();

  // Load stats on mount
  useEffect(() => {
    if (activeBusinessId) {
      loadStats(activeBusinessId);
    }
  }, [activeBusinessId, loadStats]);

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

  return (
    <div className="space-y-8">
      {/* ---- Welcome Section ---- */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
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

      {/* ---- AI Command Bar ---- */}
      <AiCommandBar />

      {/* ---- KPI Cards ---- */}
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

      {/* ---- Quick Actions ---- */}
      <QuickActions />

      {/* ---- Main Content: Two Columns ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Transactions */}
        <div className="lg:col-span-8 space-y-8">
          <RecentTransactions />
        </div>

        {/* Right Column: Stock Alerts + Due Ledger */}
        <div className="lg:col-span-4 space-y-8">
          <StockAlerts />
          <DueLedgerWidget />
        </div>
      </div>
    </div>
  );
}
