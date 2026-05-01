"use client";

import { useDashboardSummary } from "@/hooks/useDashboard";
import { formatCurrencyBDT } from "@/lib/localeNumber";
import { buildShopPath } from "@/lib/shopRouting";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { RecentActivity } from "@/types/report";

// ---------------------------------------------------------------------------
// Inline SVG Icons
// ---------------------------------------------------------------------------

function IconShoppingCart({ className = "w-5 h-5" }: { className?: string }) {
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
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
            />
        </svg>
    );
}

function IconReturn({ className = "w-5 h-5" }: { className?: string }) {
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
                d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
            />
        </svg>
    );
}

function IconBolt({ className = "w-5 h-5" }: { className?: string }) {
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
                d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
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
                d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"
            />
        </svg>
    );
}

function IconTune({ className = "w-5 h-5" }: { className?: string }) {
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
                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
            />
        </svg>
    );
}

// ---------------------------------------------------------------------------
// Activity type config helper
// ---------------------------------------------------------------------------

interface ActivityStyle {
    iconBg: string;
    iconColor: string;
    icon: React.ReactNode;
    amountColor: string;
    badgeKey: string;
    badgeStyle: string;
    amountPrefix: string;
}

function getActivityStyle(type: string): ActivityStyle {
    const upperType = type.toUpperCase();
    switch (upperType) {
        case "SALE":
        case "CASH_SALE":
        case "CREDIT_SALE":
            return {
                iconBg: "bg-primary/10",
                iconColor: "text-primary",
                icon: <IconShoppingCart />,
                amountColor: "text-primary",
                badgeKey: "success",
                badgeStyle: "bg-primary-fixed/40 text-primary",
                amountPrefix: "+",
            };
        case "RETURN":
        case "SALE_RETURN":
            return {
                iconBg: "bg-tertiary/10",
                iconColor: "text-tertiary",
                icon: <IconReturn />,
                amountColor: "text-tertiary",
                badgeKey: "return",
                badgeStyle: "bg-tertiary-fixed/40 text-tertiary",
                amountPrefix: "-",
            };
        case "EXPENSE":
            return {
                iconBg: "bg-secondary-fixed/30",
                iconColor: "text-secondary",
                icon: <IconBolt />,
                amountColor: "text-on-surface",
                badgeKey: "expense",
                badgeStyle: "bg-surface-container-highest text-on-surface-variant",
                amountPrefix: "-",
            };
        case "DUE_PAYMENT":
            return {
                iconBg: "bg-green-100",
                iconColor: "text-green-700",
                icon: <IconWallet />,
                amountColor: "text-green-700",
                badgeKey: "duePayment",
                badgeStyle: "bg-green-100 text-green-700",
                amountPrefix: "+",
            };
        case "DUE_ADJUSTMENT":
            return {
                iconBg: "bg-amber-100",
                iconColor: "text-amber-700",
                icon: <IconTune />,
                amountColor: "text-amber-700",
                badgeKey: "dueAdjustment",
                badgeStyle: "bg-amber-100 text-amber-700",
                amountPrefix: "±",
            };
        default:
            return {
                iconBg: "bg-surface-container-high",
                iconColor: "text-on-surface-variant",
                icon: <IconShoppingCart />,
                amountColor: "text-on-surface",
                badgeKey: "success",
                badgeStyle: "bg-surface-container-highest text-on-surface-variant",
                amountPrefix: "",
            };
    }
}

// ---------------------------------------------------------------------------
// Relative time formatter
// ---------------------------------------------------------------------------

function getRelativeTime(timestamp: string, locale: string | undefined): string {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    const isBn = locale?.startsWith("bn");

    if (diffSeconds < 60) {
        return isBn ? "এইমাত্র" : "just now";
    } else if (diffMinutes < 60) {
        return isBn ? `${toBengaliNum(diffMinutes)} মিনিট আগে` : `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
        return isBn ? `${toBengaliNum(diffHours)} ঘণ্টা আগে` : `${diffHours}h ago`;
    } else if (diffDays < 7) {
        return isBn ? `${toBengaliNum(diffDays)} দিন আগে` : `${diffDays}d ago`;
    } else {
        return then.toLocaleDateString(isBn ? "bn-BD" : "en-US", {
            month: "short",
            day: "numeric",
        });
    }
}

function toBengaliNum(n: number): string {
    const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(n).replace(/\d/g, (d) => bengaliDigits[parseInt(d)]);
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function TransactionSkeleton() {
    return (
        <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-surface-container-highest" />
                <div className="space-y-2">
                    <div className="h-4 w-32 rounded bg-surface-container-highest" />
                    <div className="h-3 w-20 rounded bg-surface-container-highest" />
                </div>
            </div>
            <div className="space-y-2 text-right">
                <div className="h-4 w-16 rounded bg-surface-container-highest ml-auto" />
                <div className="h-3 w-12 rounded bg-surface-container-highest ml-auto" />
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// RecentTransactions Component
// ---------------------------------------------------------------------------

interface RecentTransactionsProps {
    businessId?: string;
}

export default function RecentTransactions({ businessId }: RecentTransactionsProps) {
    const t = useTranslations("dashboard.transactions");
    const locale = useLocale();
    const router = useRouter();

    const { summary, isLoading } = useDashboardSummary(businessId ?? null);

    const activities = summary?.recentActivities ?? [];

    // Map badge keys to translations
    const badgeLabel = (badge: string) => {
        switch (badge) {
            case "success":
                return t("success");
            case "return":
                return t("return");
            case "expense":
                return t("expense");
            case "duePayment":
                return t("duePayment");
            case "dueAdjustment":
                return t("dueAdjustment");
            default:
                return badge;
        }
    };

    const fmtAmount = (amount: number, prefix: string) => {
        const formatted = formatCurrencyBDT(Math.abs(amount), locale);
        return `${prefix}${formatted}`;
    };

    return (
        <section className="bg-surface-container-low rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-bold">{t("title")}</h4>
                <button
                    className="text-primary font-bold text-sm hover:underline"
                    onClick={() => businessId && router.push(buildShopPath(businessId, "/sales"))}
                >
                    {t("viewAll")}
                </button>
            </div>

            {/* Transaction List */}
            <div className="space-y-3">
                {isLoading ? (
                    <>
                        <TransactionSkeleton />
                        <TransactionSkeleton />
                        <TransactionSkeleton />
                    </>
                ) : activities.length === 0 ? (
                    <div className="py-8 text-center text-on-surface-variant">
                        <p className="text-sm">{t("noTransactions") ?? "কোনো সাম্প্রতিক লেনদেন নেই"}</p>
                    </div>
                ) : (
                    activities.slice(0, 5).map((activity, index) => {
                        const style = getActivityStyle(activity.type);
                        return (
                            <div
                                key={`${activity.type}-${index}-${activity.timestamp}`}
                                className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between"
                            >
                                {/* Left: Icon + Details */}
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center ${style.iconBg} ${style.iconColor}`}
                                    >
                                        {style.icon}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{activity.description}</p>
                                        <p className="text-xs text-on-surface-variant">
                                            {getRelativeTime(activity.timestamp, locale)}
                                        </p>
                                    </div>
                                </div>

                                {/* Right: Amount + Badge */}
                                <div className="text-right">
                                    <p className={`font-bold text-sm ${style.amountColor}`}>
                                        {fmtAmount(activity.amount, style.amountPrefix)}
                                    </p>
                                    <p
                                        className={`text-[10px] px-2 py-0.5 rounded-full inline-block mt-1 ${style.badgeStyle}`}
                                    >
                                        {badgeLabel(style.badgeKey)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
}
