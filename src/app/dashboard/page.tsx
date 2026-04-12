"use client";

import { formatCurrencyBDT, formatLocalizedNumber } from "@/lib/localeNumber";
import { useBusinessStore } from "@/store/businessStore";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import AiCommandBar from "@/components/dashboard/AiCommandBar";
import DueLedgerWidget from "@/components/dashboard/DueLedgerWidget";
import KpiCard, { KpiCardSkeleton } from "@/components/dashboard/KpiCard";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import StockAlerts from "@/components/dashboard/StockAlerts";

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
            <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
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

function getGreetingKey(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "greeting";
    if (hour < 17) return "greetingAfternoon";
    return "greetingEvening";
}

const BUSINESS_TYPE_LABEL_KEYS: Record<string, string> = {
    GROCERY: "grocery",
    FASHION: "clothing",
    ELECTRONICS: "electronics",
    RESTAURANT: "restaurant",
    PHARMACY: "pharmacy",
    STATIONERY: "stationery",
    HARDWARE: "hardware",
    BAKERY: "bakery",
    MOBILE_SHOP: "mobileShop",
    TAILORING: "tailoring",
    SWEETS_SHOP: "sweetsShop",
    COSMETICS: "cosmetics",
    BOOKSHOP: "bookshop",
    JEWELLERY: "jewellery",
    PRINTING: "printing",
    OTHER: "other",
};

const TOTAL_ONBOARDING_STEPS = 7;

export default function DashboardPage() {
    const locale = useLocale();
    const t = useTranslations("dashboard");
    const tb = useTranslations("business");
    const router = useRouter();
    const pathname = usePathname();

    const {
        activeBusiness,
        activeBusinessId,
        stats,
        onboardingData,
        isLoading,
        loadStats,
        loadOnboarding,
    } = useBusinessStore();

    useEffect(() => {
        if (activeBusinessId) {
            loadStats(activeBusinessId);
            loadOnboarding(activeBusinessId);
        }
    }, [activeBusinessId, loadStats, loadOnboarding]);

    useEffect(() => {
        if (pathname === "/dashboard" && activeBusinessId) {
            router.replace(`/shop/${activeBusinessId}`);
        }
    }, [pathname, activeBusinessId, router]);

    if (!activeBusinessId || !activeBusiness) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <button
                    type="button"
                    onClick={() => router.push("/businesses")}
                    className="rounded-xl bg-primary px-6 py-3 font-semibold text-on-primary"
                >
                    {t("shop.selectBusiness")}
                </button>
            </div>
        );
    }

    const greetingKey = getGreetingKey();
    const dateStr = new Date().toLocaleDateString(
        locale?.startsWith("bn") ? "bn-BD" : "en-US",
        {
            year: "numeric",
            month: "long",
            day: "numeric",
        },
    );

    const onboardingProgress = onboardingData?.onboardingCompleted
        ? 100
        : Math.round(((onboardingData?.setupStep ?? 0) / TOTAL_ONBOARDING_STEPS) * 100);

    const fmtCurrency = (n: number | undefined) => formatCurrencyBDT(n ?? 0, locale);
    const businessTypeLabelKey = BUSINESS_TYPE_LABEL_KEYS[activeBusiness.type];
    const businessType = businessTypeLabelKey
        ? tb(`types.${businessTypeLabelKey}` as Parameters<typeof tb>[0])
        : activeBusiness.type;

    return (
        <div className="space-y-8">
            <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <span className="mb-2 inline-block rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-secondary">
                        {businessType}
                    </span>
                    <h2 className="mb-1 text-2xl font-bold text-on-surface md:text-3xl">
                        {t(`welcome.${greetingKey}`, { name: activeBusiness.name })} 👋
                    </h2>
                    <p className="text-base text-on-surface-variant md:text-lg">
                        {t("shop.subtitle")}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 font-semibold text-primary">
                        <IconCalendar className="w-5 h-5" />
                        <span className="text-sm">{t("welcome.dateLabel", { date: dateStr })}</span>
                    </div>

                    <button
                        type="button"
                        onClick={() => router.push("/businesses")}
                        className="rounded-lg bg-surface-container px-4 py-2 text-sm font-semibold text-primary hover:bg-surface-container-high"
                    >
                        {t("shop.switchBusiness")}
                    </button>

                    <button
                        type="button"
                        onClick={() => router.push(`/shop/${activeBusinessId}/settings`)}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:opacity-90"
                    >
                        {t("shop.openSettings")}
                    </button>
                </div>
            </section>

            {!onboardingData?.onboardingCompleted && (
                <section className="rounded-xl bg-surface-container-low p-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="font-bold text-on-surface">{t("shop.onboardingPending")}</p>
                        <span className="text-sm font-semibold text-secondary">{onboardingProgress}%</span>
                    </div>
                    <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                        <div className="h-full rounded-full bg-secondary" style={{ width: `${onboardingProgress}%` }} />
                    </div>
                    <button
                        type="button"
                        onClick={() => router.push("/onboarding")}
                        className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary"
                    >
                        {t("shop.continueOnboarding")}
                    </button>
                </section>
            )}

            <AiCommandBar />

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                            value={fmtCurrency(stats.totalRevenue)}
                            icon={<IconTrendingUp className="w-5 h-5" />}
                            accentColor="text-primary"
                            subtitle={`${stats.totalSales} টি বিক্রয়`}
                        />
                        <KpiCard
                            title={t("kpi.totalDue")}
                            value={fmtCurrency(stats.totalDue)}
                            icon={<IconHistory className="w-5 h-5" />}
                            accentColor="text-tertiary"
                            subtitle={`${stats.activeCustomers} জন ক্রেতা`}
                        />
                        <KpiCard
                            title={t("kpi.todayExpense")}
                            value={fmtCurrency(undefined)}
                            icon={<IconWallet className="w-5 h-5" />}
                            accentColor="text-on-surface"
                        />
                        <KpiCard
                            title={t("kpi.totalProducts")}
                            value={formatLocalizedNumber(stats.totalProducts ?? 0, locale)}
                            icon={<IconBox className="w-5 h-5" />}
                            accentColor="text-secondary"
                            subtitle={t("kpi.count", { count: stats.totalProducts ?? 0 })}
                        />
                    </>
                )}
            </section>

            <QuickActions />

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <div className="space-y-8 lg:col-span-8">
                    <RecentTransactions />
                </div>
                <div className="space-y-8 lg:col-span-4">
                    <StockAlerts />
                    <DueLedgerWidget />
                </div>
            </div>
        </div>
    );
}
