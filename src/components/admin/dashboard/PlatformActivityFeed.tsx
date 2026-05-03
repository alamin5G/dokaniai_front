"use client";

import { useTranslations } from "next-intl";
import { CHART_COLORS } from "./chartColors";

interface ActivityItem {
    id: string;
    type: "user" | "subscription" | "payment" | "ticket";
    message: string;
    time: string;
}

/** Static placeholder — will be replaced by real activity log data */
const RECENT_ACTIVITY: ActivityItem[] = [
    { id: "1", type: "user", message: "New shopkeeper registered: Rahim Store", time: "2 min ago" },
    { id: "2", type: "subscription", message: "Pro plan activated for Karim Electronics", time: "15 min ago" },
    { id: "3", type: "payment", message: "Payment of ৳199 received from Fresh Mart", time: "1 hr ago" },
    { id: "4", type: "ticket", message: "Support ticket #42 resolved", time: "2 hrs ago" },
    { id: "5", type: "user", message: "New shopkeeper registered: Digital Bazar", time: "3 hrs ago" },
];

const TYPE_ICON_MAP: Record<ActivityItem["type"], string> = {
    user: "👤",
    subscription: "📦",
    payment: "💰",
    ticket: "🎫",
};

const TYPE_COLOR_MAP: Record<ActivityItem["type"], string> = {
    user: CHART_COLORS.primary,
    subscription: CHART_COLORS.success,
    payment: CHART_COLORS.warning,
    ticket: CHART_COLORS.secondary,
};

/**
 * Recent platform activity feed with icon, message, and timestamp.
 */
export function PlatformActivityFeed() {
    const t = useTranslations("AdminDashboard");

    return (
        <div className="rounded-2xl bg-surface-container p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-on-surface mb-4">
                {t("activity.title")}
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
                {RECENT_ACTIVITY.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-on-surface/5 transition-colors"
                    >
                        <span
                            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm"
                            style={{ backgroundColor: `${TYPE_COLOR_MAP[item.type]}15` }}
                        >
                            {TYPE_ICON_MAP[item.type]}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm text-on-surface truncate">{item.message}</p>
                            <p className="text-xs text-on-surface/50 mt-0.5">{item.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}