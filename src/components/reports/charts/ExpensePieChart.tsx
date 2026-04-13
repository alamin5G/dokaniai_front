"use client";

import { useLocale, useTranslations } from "next-intl";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
} from "recharts";
import type { NetProfitReport } from "@/types/report";

interface ExpensePieChartProps {
    netProfit: NetProfitReport | null;
}

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

// MD3-inspired color palette for pie slices
const COLORS = [
    "var(--color-primary)",
    "var(--color-error)",
    "var(--color-secondary)",
    "var(--color-tertiary)",
];

/**
 * Donut chart showing how revenue is distributed across COGS, expenses, and net profit.
 */
export default function ExpensePieChart({ netProfit }: ExpensePieChartProps) {
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

    // Build pie data from net profit report — show where revenue goes
    const data = [
        { name: t("charts.cogs"), value: netProfit.cogs },
        { name: t("charts.expenses"), value: netProfit.totalExpenses },
        { name: t("charts.profit"), value: netProfit.netProfit },
    ].filter((d) => d.value > 0);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-on-surface-variant">
                {t("messages.noData")}
            </div>
        );
    }

    return (
        <div className="rounded-[24px] bg-surface-container-lowest p-6 shadow-sm">
            <h3 className="text-lg font-bold text-primary mb-6">{t("charts.revenueDistribution")}</h3>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={800}
                        >
                            {data.map((_entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "var(--color-surface-container-lowest)",
                                border: "none",
                                borderRadius: "12px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            }}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(value: any) => [`৳ ${currencyFmt.format(Number(value))}`, ""]}
                        />
                        <Legend
                            verticalAlign="bottom"
                            formatter={(value: string) => value}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
