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
    Cell,
} from "recharts";
import type { DueLedgerReport } from "@/types/report";

interface DueAgingChartProps {
    dueReport: DueLedgerReport | null;
}

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

/**
 * Horizontal bar chart showing top customers by due amount.
 * Since DueLedgerReport doesn't have aging buckets, we visualize per-customer dues.
 */
export default function DueAgingChart({ dueReport }: DueAgingChartProps) {
    const t = useTranslations("shop.reports");
    const locale = useLocale();
    const loc = resolveLocale(locale);

    if (!dueReport || dueReport.customers.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-on-surface-variant">
                {t("messages.noData")}
            </div>
        );
    }

    const currencyFmt = new Intl.NumberFormat(loc, { maximumFractionDigits: 0 });

    // Take top 8 customers by due amount
    const sortedCustomers = [...dueReport.customers]
        .sort((a, b) => b.dueAmount - a.dueAmount)
        .slice(0, 8);

    const maxDue = Math.max(...sortedCustomers.map((c) => c.dueAmount));

    const data = sortedCustomers.map((customer) => ({
        name: customer.customerName.length > 12
            ? customer.customerName.slice(0, 12) + "…"
            : customer.customerName,
        amount: customer.dueAmount,
        fill: customer.dueAmount > maxDue * 0.7
            ? "var(--color-error)"
            : customer.dueAmount > maxDue * 0.3
                ? "var(--color-tertiary)"
                : "var(--color-primary)",
    }));

    return (
        <div className="rounded-[24px] bg-surface-container-lowest p-6 shadow-sm">
            <h3 className="text-lg font-bold text-primary mb-6">{t("charts.dueByCustomer")}</h3>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-container)" />
                        <XAxis
                            type="number"
                            tick={{ fontSize: 12, fill: "var(--color-on-surface-variant)" }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v: number) => `৳${currencyFmt.format(v)}`}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fontSize: 11, fill: "var(--color-on-surface-variant)" }}
                            axisLine={false}
                            tickLine={false}
                            width={90}
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
                        <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
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
