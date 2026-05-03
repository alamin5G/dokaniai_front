"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

const QUICK_ACTIONS = [
    { href: "/admin?tab=users", icon: "👤", labelKey: "actions.manageUsers" },
    { href: "/admin/plan-features", icon: "📦", labelKey: "actions.subscriptions" },
    { href: "/admin?tab=tickets", icon: "🎫", labelKey: "actions.supportTickets" },
    { href: "/admin?tab=payments", icon: "💳", labelKey: "actions.payments" },
    { href: "/admin?tab=referral", icon: "🔗", labelKey: "actions.referralConfig" },
    { href: "/admin?tab=notifications", icon: "🔔", labelKey: "actions.notifications" },
] as const;

/**
 * Grid of quick-action cards linking to admin tabs.
 */
export function QuickActionGrid() {
    const t = useTranslations("AdminDashboard");

    return (
        <div className="rounded-2xl bg-surface-container p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-on-surface mb-4">
                {t("actions.title")}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {QUICK_ACTIONS.map((action) => (
                    <Link
                        key={action.href}
                        href={action.href}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-on-surface/5 hover:bg-on-surface/10 transition-colors"
                    >
                        <span className="text-xl">{action.icon}</span>
                        <span className="text-xs text-on-surface text-center leading-tight">
                            {t(action.labelKey)}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
