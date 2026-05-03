"use client";

import { useTranslations } from "next-intl";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { ChartErrorBoundary } from "./ChartErrorBoundary";
import { CHART_COLORS } from "./chartColors";

/** Static placeholder — will be replaced by real referral stats */
const REFERRAL_DATA = [
    { name: "Active", value: 65, fill: CHART_COLORS.success },
    { name: "Expired", value: 20, fill: CHART_COLORS.warning },
    { name: "Maxed Out", value: 15, fill: CHART_COLORS.error },
];

/**
 * Donut chart showing referral code health distribution.
 * Currently uses static data — will connect to backend endpoint later.
 */
export function ReferralHealthDonut() {
    const t = useTranslations("AdminDashboard");

    return (
        <ChartErrorBoundary>
            <div className="rounded-2xl bg-surface-container p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-on-surface mb-4">
                    {t("charts.referralHealth")}
                </h3>
                <div className="h-56 sm:h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={REFERRAL_DATA}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {REFERRAL_DATA.map((entry) => (
                                    <Cell key={entry.name} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {REFERRAL_DATA.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-1.5 text-xs text-on-surface/70">
                            <span
                                className="inline-block h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: entry.fill }}
                            />
                            {entry.name} ({entry.value}%)
                        </div>
                    ))}
                </div>
            </div>
        </ChartErrorBoundary>
    );
}