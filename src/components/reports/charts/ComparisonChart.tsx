"use client";

import { useLocale, useTranslations } from "next-intl";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";
import type { DailySalesReport } from "@/types/report";

interface ComparisonChartProps {
    currentPeriod: DailySalesReport[];
    previousPeriod: DailySalesReport[];
}

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

/**
 * Grouped bar chart comparing current period vs previous period daily revenue.
 * Aligns days by index (day 1 vs day 1, day 2 vs day 2, etc.)
 */
export default function ComparisonChart({ currentPeriod, previousPeriod }: ComparisonChartProps) {
    const t = useTranslations("shop.reports");
    const locale = useLocale();
    const loc = resolveLocale(locale);

    if (!currentPeriod.length && !previousPeriod.length) {
        return (
            <div className="flex items-center justify-center h-64 text-on-surface-variant">
                {t("messages.noData")}
            </div>
        );
    }

    const currencyFmt = new Intl.NumberFormat(loc, { maximumFractionDigits: 0 });
    const maxLen = Math.max(currentPeriod.length, previousPeriod.length);

    const data = Array.from({ length: maxLen }, (_, i) => ({
        day: t("charts.day", { n: i + 1 }),
        current: currentPeriod[i]?.totalRevenue ?? 0,
        previous: previousPeriod[i]?.totalRevenue ?? 0,
    }));

    return (
        <div className="rounded-[24px] bg-surface-container-lowest p-6 shadow-sm">
            <h3 className="text-lg font-bold text-primary mb-6">{t("charts.periodComparison")}</h3>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-container)" />
                        <XAxis
                            dataKey="day"
                            tick={{ fontSize: 11, fill: "var(--color-on-surface-variant)" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: "var(--color-on-surface-variant)" }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v: number) => `৳${currencyFmt.format(v)}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "var(--color-surface-container-lowest)",
                                border: "none",
                                borderRadius: "12px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            }}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(value: any, name: any) => [
                                `৳ ${currencyFmt.format(Number(value))}`,
                                name === "current"
                                    ? t("charts.currentPeriod")
                                    : t("charts.previousPeriod"),
                            ]}
                        />
                        <Legend
                            formatter={(value: string) =>
                                value === "current"
                                    ? t("charts.currentPeriod")
                                    : t("charts.previousPeriod")
                            }
                        />
                        <Bar
                            dataKey="current"
                            fill="var(--color-primary)"
                            radius={[6, 6, 0, 0]}
                        />
                        <Bar
                            dataKey="previous"
                            fill="var(--color-surface-container-high)"
                            radius={[6, 6, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
