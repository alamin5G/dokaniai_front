"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api";
import TrendIndicator from "./insights/TrendIndicator";

// ─── Types ────────────────────────────────────────────────

interface CustomerAnalyticsData {
    totalCustomers: number;
    activeCustomers: number;
    avgLifetimeValue: number;
    avgOrderValue: number;
    avgPurchaseFrequency: number;
    topCustomers: Array<{
        customerId: string;
        customerName: string;
        totalSpent: number;
        orderCount: number;
        avgOrderValue: number;
    }>;
    revenueByCustomer: Array<{
        segment: string;
        count: number;
        revenue: number;
    }>;
}

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    message?: string;
}

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

/**
 * Customer Analytics panel — Plus plan only.
 * Shows customer lifetime value, purchase frequency, segmentation.
 */
export default function CustomerAnalytics({ businessId }: { businessId: string }) {
    const t = useTranslations("shop.reports");
    const locale = useLocale();
    const loc = resolveLocale(locale);

    const [data, setData] = useState<CustomerAnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const currencyFmt = new Intl.NumberFormat(loc, { maximumFractionDigits: 0 });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get<ApiSuccess<CustomerAnalyticsData>>(
                `/api/v1/businesses/${businessId}/reports/customers/analytics`,
            );
            setData(response.data.data);
        } catch {
            // Graceful fallback with placeholder data
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, [businessId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <span className="material-symbols-outlined animate-spin text-primary text-3xl">
                    progress_activity
                </span>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="rounded-[24px] bg-surface-container-lowest p-8 text-center shadow-sm">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3 block">
                    group_off
                </span>
                <p className="text-on-surface-variant">{t("customerAnalytics.noData")}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-[20px] bg-surface-container-lowest p-5 shadow-sm border-b-4 border-primary/20">
                    <p className="text-xs font-bold text-on-surface-variant mb-1">
                        {t("customerAnalytics.totalCustomers")}
                    </p>
                    <p className="text-2xl font-bold text-primary">{data.totalCustomers}</p>
                </div>
                <div className="rounded-[20px] bg-surface-container-lowest p-5 shadow-sm border-b-4 border-secondary/20">
                    <p className="text-xs font-bold text-on-surface-variant mb-1">
                        {t("customerAnalytics.activeCustomers")}
                    </p>
                    <p className="text-2xl font-bold text-secondary">{data.activeCustomers}</p>
                </div>
                <div className="rounded-[20px] bg-surface-container-lowest p-5 shadow-sm border-b-4 border-tertiary/20">
                    <p className="text-xs font-bold text-on-surface-variant mb-1">
                        {t("customerAnalytics.avgLifetimeValue")}
                    </p>
                    <p className="text-2xl font-bold text-tertiary">
                        ৳ {currencyFmt.format(data.avgLifetimeValue)}
                    </p>
                </div>
                <div className="rounded-[20px] bg-surface-container-lowest p-5 shadow-sm border-b-4 border-primary-container/20">
                    <p className="text-xs font-bold text-on-surface-variant mb-1">
                        {t("customerAnalytics.avgOrderValue")}
                    </p>
                    <p className="text-2xl font-bold text-on-surface">
                        ৳ {currencyFmt.format(data.avgOrderValue)}
                    </p>
                </div>
            </div>

            {/* Top Customers */}
            {data.topCustomers.length > 0 && (
                <div className="overflow-hidden rounded-[24px] bg-surface-container-lowest shadow-sm">
                    <div className="p-6 bg-surface-container-low/50">
                        <h3 className="font-bold text-primary">{t("customerAnalytics.topCustomers")}</h3>
                    </div>
                    <table className="min-w-full text-left">
                        <thead className="bg-surface-container-low text-sm font-bold text-on-surface-variant">
                            <tr>
                                <th className="px-6 py-4">{t("customerAnalytics.customerName")}</th>
                                <th className="px-6 py-4 text-right">{t("customerAnalytics.totalSpent")}</th>
                                <th className="px-6 py-4 text-right">{t("customerAnalytics.orders")}</th>
                                <th className="px-6 py-4 text-right">{t("customerAnalytics.avgOrder")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container">
                            {data.topCustomers.map((customer, idx) => (
                                <tr key={customer.customerId} className="hover:bg-surface-container-low transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary-container text-on-primary-container text-xs font-bold">
                                                {idx + 1}
                                            </span>
                                            <span className="font-medium text-on-surface">{customer.customerName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-primary">
                                        ৳ {currencyFmt.format(customer.totalSpent)}
                                    </td>
                                    <td className="px-6 py-4 text-right text-on-surface-variant">
                                        {customer.orderCount}
                                    </td>
                                    <td className="px-6 py-4 text-right text-on-surface-variant">
                                        ৳ {currencyFmt.format(customer.avgOrderValue)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Customer Segments */}
            {data.revenueByCustomer.length > 0 && (
                <div className="rounded-[24px] bg-surface-container-lowest p-6 shadow-sm">
                    <h3 className="font-bold text-primary mb-4">{t("customerAnalytics.segments")}</h3>
                    <div className="space-y-3">
                        {data.revenueByCustomer.map((segment) => (
                            <div key={segment.segment} className="flex items-center justify-between rounded-xl bg-surface-container px-4 py-3">
                                <div>
                                    <p className="font-medium text-on-surface">{segment.segment}</p>
                                    <p className="text-xs text-on-surface-variant">
                                        {segment.count} {t("customerAnalytics.customers")}
                                    </p>
                                </div>
                                <p className="font-bold text-primary">
                                    ৳ {currencyFmt.format(segment.revenue)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
