"use client";

import { useLocale, useTranslations } from "next-intl";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";
import type { PeriodSalesReport } from "@/types/report";

interface SalesTrendChartProps {
    weeklySales: PeriodSalesReport | null;
    monthlySales: PeriodSalesReport | null;
}

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

/**
 * Line chart showing daily revenue and profit trends.
 * Uses weekly or monthly sales data depending on what's available.
 */
export default function SalesTrendChart({ weeklySales, monthlySales }: SalesTrendChartProps) {
    const t = useTranslations("shop.reports");
    const locale = useLocale();
    const loc = resolveLocale(locale);

    // Prefer monthly data (more points), fallback to weekly
    const source = monthlySales?.dailyBreakdown?.length
        ? monthlySales
        : weeklySales;

    const data = (source?.dailyBreakdown ?? []).map((day) => ({
        date: new Date(day.date).toLocaleDateString(loc, { day: "numeric", month: "short" }),
        revenue: day.totalRevenue,
        profit: day.totalProfit,
        sales: day.totalSales,
    }));

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-on-surface-variant">
                {t("messages.noData")}
            </div>
        );
    }

    const currencyFmt = new Intl.NumberFormat(loc, { maximumFractionDigits: 0 });

    return (
        <div className="rounded-[24px] bg-surface-container-lowest p-6 shadow-sm">
            <h3 className="text-lg font-bold text-primary mb-6">{t("charts.salesTrend")}</h3>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-container)" />
                        <XAxis
                            dataKey="date"
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
                            formatter={(value: any, name: any) => [
                                `৳ ${currencyFmt.format(Number(value))}`,
                                name === "revenue" ? t("charts.revenue") : t("charts.profit"),
                            ]}
                        />
                        <Legend
                            formatter={(value: string) =>
                                value === "revenue" ? t("charts.revenue") : t("charts.profit")
                            }
                        />
                        <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="var(--color-primary)"
                            strokeWidth={2.5}
                            dot={{ r: 3, fill: "var(--color-primary)" }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="profit"
                            stroke="var(--color-secondary)"
                            strokeWidth={2.5}
                            dot={{ r: 3, fill: "var(--color-secondary)" }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
