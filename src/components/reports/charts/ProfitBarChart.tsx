"use client";

import { useLocale, useTranslations } from "next-intl";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";
import type { NetProfitReport } from "@/types/report";

interface ProfitBarChartProps {
    netProfit: NetProfitReport | null;
}

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

/**
 * Bar chart showing revenue, COGS, expenses, and net profit breakdown.
 */
export default function ProfitBarChart({ netProfit }: ProfitBarChartProps) {
    const t = useTranslations("shop.reports");
    const locale = useLocale();
    const loc = resolveLocale(locale);

    if (!netProfit) {
        return (
            <div className="flex items-center justify-center h-64 text-on-surface-variant">
                {t("messages.noData")}
            </div>
        );
    }

    const currencyFmt = new Intl.NumberFormat(loc, { maximumFractionDigits: 0 });

    // Build breakdown data from net profit report
    const data = [
        {
            name: t("charts.revenue"),
            amount: netProfit.totalRevenue,
            fill: "var(--color-primary)",
        },
        {
            name: t("charts.cogs"),
            amount: netProfit.cogs,
            fill: "var(--color-tertiary)",
        },
        {
            name: t("charts.expenses"),
            amount: netProfit.totalExpenses,
            fill: "var(--color-error)",
        },
        {
            name: t("charts.profit"),
            amount: netProfit.netProfit,
            fill: "var(--color-secondary)",
        },
    ];

    return (
        <div className="rounded-[24px] bg-surface-container-lowest p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-primary">{t("charts.profitAnalysis")}</h3>
                <span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-bold text-on-secondary-container">
                    {t("charts.margin", { value: (netProfit.profitMargin * 100).toFixed(1) })}
                </span>
            </div>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-container)" />
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12, fill: "var(--color-on-surface-variant)" }}
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
                            formatter={(value: any) => [
                                `৳ ${currencyFmt.format(Number(value))}`,
                                t("charts.amount"),
                            ]}
                        />
                        <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

