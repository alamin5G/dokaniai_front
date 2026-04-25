"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
    DashboardSummary,
    DailySalesReport,
    PeriodSalesReport,
    ProductProfitReport,
    NetProfitReport,
    DueLedgerReport,
    StockAlertReport,
    TopSellingItem,
    ProductProfitItem,
    StockAlertItem,
    RecentActivity,
} from "@/types/report";
import {
    getDashboardSummary,
    getDailySalesReport,
    getWeeklySalesReport,
    getMonthlySalesReport,
    getProductProfitReport,
    getNetProfitReport,
    getDueLedgerReport,
    getStockAlertReport,
    exportReport,
} from "@/lib/reportApi";
import { trackReportView } from "@/lib/activityTracker";
import type { ReportType } from "@/types/report";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import UpgradeCta from "./UpgradeCta";
import SalesTrendChart from "./charts/SalesTrendChart";
import ProfitBarChart from "./charts/ProfitBarChart";
import ExpensePieChart from "./charts/ExpensePieChart";
import DueAgingChart from "./charts/DueAgingChart";
import ComparisonChart from "./charts/ComparisonChart";
import AIInsightPanel from "./insights/AIInsightPanel";
import CustomerAnalytics from "./CustomerAnalytics";
import DiscountReportTab from "./DiscountReportTab";
import ReturnReportTab from "./ReturnReportTab";

// ─── Helpers ─────────────────────────────────────────────

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

type TabKey = "dashboard" | "sales" | "profit" | "expenses" | "due" | "stock" | "discounts" | "returns" | "advanced";

// ─── Component ───────────────────────────────────────────

export default function ReportWorkspace({
    businessId,
}: {
    businessId: string;
}) {
    const t = useTranslations("shop.reports");
    const locale = useLocale();
    const loc = resolveLocale(locale);
    const plan = usePlanFeatures();

    const currencyFmt = new Intl.NumberFormat(loc, { maximumFractionDigits: 0 });
    const pctFmt = new Intl.NumberFormat(loc, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

    function formatMoney(value: number | null | undefined): string {
        return currencyFmt.format(value ?? 0);
    }
    function formatPct(value: number | null | undefined): string {
        return pctFmt.format(value ?? 0) + "%";
    }

    // ── State ──
    const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ── Report data ──
    const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
    const [dailySales, setDailySales] = useState<DailySalesReport | null>(null);
    const [weeklySales, setWeeklySales] = useState<PeriodSalesReport | null>(null);
    const [monthlySales, setMonthlySales] = useState<PeriodSalesReport | null>(null);
    const [productProfit, setProductProfit] = useState<ProductProfitReport | null>(null);
    const [netProfit, setNetProfit] = useState<NetProfitReport | null>(null);
    const [dueReport, setDueReport] = useState<DueLedgerReport | null>(null);
    const [stockAlert, setStockAlert] = useState<StockAlertReport | null>(null);

    // ── Sales period ──
    const [salesPeriod, setSalesPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

    // ── Load data ──
    const loadDashboard = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getDashboardSummary(businessId);
            setDashboard(data);
        } catch {
            setError(t("messages.loadError"));
        } finally {
            setIsLoading(false);
        }
    }, [businessId, t]);

    const loadSalesReport = useCallback(async () => {
        setIsLoading(true);
        try {
            if (salesPeriod === "daily") {
                const data = await getDailySalesReport(businessId);
                setDailySales(data);
            } else if (salesPeriod === "weekly") {
                const data = await getWeeklySalesReport(businessId);
                setWeeklySales(data);
            } else {
                const data = await getMonthlySalesReport(businessId);
                setMonthlySales(data);
            }
        } catch {
            setError(t("messages.loadError"));
        } finally {
            setIsLoading(false);
        }
    }, [businessId, salesPeriod, t]);

    const loadProfitReport = useCallback(async () => {
        setIsLoading(true);
        try {
            const [profit, net] = await Promise.all([
                getProductProfitReport(businessId),
                getNetProfitReport(businessId),
            ]);
            setProductProfit(profit);
            setNetProfit(net);
        } catch {
            setError(t("messages.loadError"));
        } finally {
            setIsLoading(false);
        }
    }, [businessId, t]);

    const loadDueReport = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getDueLedgerReport(businessId);
            setDueReport(data);
        } catch {
            setError(t("messages.loadError"));
        } finally {
            setIsLoading(false);
        }
    }, [businessId, t]);

    const loadStockReport = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getStockAlertReport(businessId);
            setStockAlert(data);
        } catch {
            setError(t("messages.loadError"));
        } finally {
            setIsLoading(false);
        }
    }, [businessId, t]);

    // Load based on active tab
    useEffect(() => {
        switch (activeTab) {
            case "dashboard":
                loadDashboard();
                break;
            case "sales":
                loadSalesReport();
                break;
            case "profit":
                loadProfitReport();
                break;
            case "due":
                loadDueReport();
                break;
            case "stock":
                loadStockReport();
                break;
            case "expenses":
                loadProfitReport(); // reuse profit report which has expense data
                break;
        }
    }, [activeTab, loadDashboard, loadSalesReport, loadProfitReport, loadDueReport, loadStockReport]);

    useEffect(() => {
        const reportTypeMap: Record<TabKey, string> = {
            dashboard: "DASHBOARD",
            sales: salesPeriod === "daily" ? "DAILY_SALES" : salesPeriod === "weekly" ? "WEEKLY_SALES" : "MONTHLY_SALES",
            profit: "NET_PROFIT",
            expenses: "EXPENSE_BREAKDOWN",
            due: "DUE_LEDGER",
            stock: "STOCK_ALERT",
            discounts: "DISCOUNT_REPORT",
            returns: "RETURN_REPORT",
            advanced: "ADVANCED_REPORTS",
        };

        trackReportView({
            businessId,
            reportType: reportTypeMap[activeTab],
            tab: activeTab,
            period: activeTab === "sales" ? salesPeriod : undefined,
        });
    }, [activeTab, businessId, salesPeriod]);

    // ── Export handler ──
    async function handleExport(format: string) {
        try {
            const typeMap: Record<TabKey, ReportType> = {
                dashboard: "DAILY_SALES",
                sales: "DAILY_SALES",
                profit: "NET_PROFIT",
                expenses: "EXPENSE_BREAKDOWN",
                due: "DUE_LEDGER",
                stock: "STOCK_ALERT",
                discounts: "CUSTOM",
                returns: "CUSTOM",
                advanced: "CUSTOM",
            };
            const blob = await exportReport(businessId, typeMap[activeTab], format);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `report_${activeTab}.${format}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            setError(t("messages.exportError"));
        }
    }

    // ── Tabs config ──
    const tabs: { key: TabKey; icon: string; proOnly?: boolean; plusOnly?: boolean }[] = [
        { key: "dashboard", icon: "dashboard" },
        { key: "sales", icon: "receipt_long" },
        { key: "profit", icon: "trending_up" },
        { key: "expenses", icon: "payments" },
        { key: "due", icon: "menu_book" },
        { key: "stock", icon: "inventory_2" },
        { key: "discounts", icon: "sell" },
        { key: "returns", icon: "undo" },
        { key: "advanced", icon: "auto_awesome", proOnly: true },
    ];

    // ════════════════════════════════════════════════════════
    // RENDER
    // ════════════════════════════════════════════════════════
    return (
        <div className="space-y-6">
            {/* ── Header — export buttons only ── */}
            <header className="flex justify-end">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleExport("csv")}
                        className="bg-surface-container text-on-surface-variant px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-surface-container-high transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">download</span>
                        {t("export.csv")}
                    </button>
                    <button
                        onClick={() => handleExport("pdf")}
                        className="bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                        {t("export.pdf")}
                    </button>
                </div>
            </header>

            {/* ── Tab Navigation ── */}
            <div className="flex gap-1 overflow-x-auto rounded-2xl bg-surface-container p-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${activeTab === tab.key
                            ? "bg-surface-container-lowest text-primary shadow-sm"
                            : "text-on-surface-variant hover:bg-surface-container-low"
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                        {t(`tabs.${tab.key}`)}
                        {tab.proOnly && !plan.advancedReports && (
                            <span className="material-symbols-outlined text-xs text-tertiary">lock</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Loading / Error ── */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <span className="material-symbols-outlined animate-spin text-primary text-3xl">
                        progress_activity
                    </span>
                </div>
            )}
            {error && !isLoading && (
                <div className="rounded-2xl bg-error-container p-6 text-center text-on-error-container">
                    {error}
                </div>
            )}

            {/* ── Tab Content ── */}
            {!isLoading && !error && (
                <>
                    {/* ────── DASHBOARD TAB ────── */}
                    {activeTab === "dashboard" && dashboard && (
                        <DashboardTab dashboard={dashboard} t={t} formatMoney={formatMoney} loc={loc} />
                    )}

                    {/* ────── SALES TAB ────── */}
                    {activeTab === "sales" && (
                        <SalesTab
                            salesPeriod={salesPeriod}
                            setSalesPeriod={setSalesPeriod}
                            dailySales={dailySales}
                            weeklySales={weeklySales}
                            monthlySales={monthlySales}
                            t={t}
                            formatMoney={formatMoney}
                            loc={loc}
                        />
                    )}

                    {/* ────── PROFIT TAB ────── */}
                    {activeTab === "profit" && productProfit && netProfit && (
                        <ProfitTab
                            productProfit={productProfit}
                            netProfit={netProfit}
                            t={t}
                            formatMoney={formatMoney}
                            formatPct={formatPct}
                            loc={loc}
                        />
                    )}

                    {/* ────── EXPENSES TAB ────── */}
                    {activeTab === "expenses" && netProfit && (
                        <ExpensesTab netProfit={netProfit} t={t} formatMoney={formatMoney} />
                    )}

                    {/* ────── DUE TAB ────── */}
                    {activeTab === "due" && dueReport && (
                        <DueTab dueReport={dueReport} t={t} formatMoney={formatMoney} loc={loc} />
                    )}

                    {/* ────── STOCK TAB ────── */}
                    {activeTab === "stock" && stockAlert && (
                        <StockTab stockAlert={stockAlert} t={t} formatMoney={formatMoney} />
                    )}

                    {/* ────── DISCOUNTS TAB ────── */}
                    {activeTab === "discounts" && (
                        <DiscountReportTab businessId={businessId} />
                    )}

                    {/* ────── RETURNS TAB ────── */}
                    {activeTab === "returns" && (
                        <ReturnReportTab businessId={businessId} />
                    )}

                    {/* ────── ADVANCED TAB ────── */}
                    {activeTab === "advanced" && (
                        plan.advancedReports ? (
                            <div className="space-y-6">
                                {/* Charts row 1: Sales Trend + Profit Analysis */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <SalesTrendChart
                                        weeklySales={weeklySales}
                                        monthlySales={monthlySales}
                                    />
                                    <ProfitBarChart netProfit={netProfit} />
                                </div>

                                {/* Charts row 2: Expense Distribution + Due by Customer */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <ExpensePieChart netProfit={netProfit} />
                                    <DueAgingChart dueReport={dueReport} />
                                </div>

                                {/* Period Comparison */}
                                {weeklySales?.dailyBreakdown && (
                                    <ComparisonChart
                                        currentPeriod={weeklySales.dailyBreakdown}
                                        previousPeriod={[]}
                                    />
                                )}

                                {/* AI Insights (Pro+) */}
                                {plan.aiInsights && (
                                    <AIInsightPanel businessId={businessId} />
                                )}

                                {/* Customer Analytics (Plus only) */}
                                {plan.customerAnalytics ? (
                                    <div>
                                        <h3 className="text-lg font-bold text-primary mb-4">
                                            {t("customerAnalytics.title")}
                                        </h3>
                                        <CustomerAnalytics businessId={businessId} />
                                    </div>
                                ) : (
                                    <UpgradeCta feature="customerAnalytics" />
                                )}
                            </div>
                        ) : (
                            <UpgradeCta feature="advancedReports" />
                        )
                    )}
                </>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════

// ─── Dashboard Tab ───────────────────────────────────────

function DashboardTab({
    dashboard,
    t,
    formatMoney,
    loc,
}: {
    dashboard: DashboardSummary;
    t: (key: string) => string;
    formatMoney: (v: number | null | undefined) => string;
    loc: string;
}) {
    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard label={t("dashboard.todaySales")} value={`৳ ${formatMoney(dashboard.todaySales)}`} icon="receipt_long" color="primary" />
                <KpiCard label={t("dashboard.todayProfit")} value={`৳ ${formatMoney(dashboard.todayProfit)}`} icon="trending_up" color="secondary" />
                <KpiCard label={t("dashboard.monthSales")} value={`৳ ${formatMoney(dashboard.monthSales)}`} icon="calendar_month" color="primary" />
                <KpiCard label={t("dashboard.monthProfit")} value={`৳ ${formatMoney(dashboard.monthProfit)}`} icon="savings" color="secondary" />
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard label={t("dashboard.totalDue")} value={`৳ ${formatMoney(dashboard.totalDue)}`} icon="menu_book" color="tertiary" />
                <KpiCard label={t("dashboard.customersWithDue")} value={String(dashboard.customersWithDue)} icon="group" color="tertiary" />
                <KpiCard label={t("dashboard.lowStock")} value={String(dashboard.lowStockItems)} icon="warning" color="error" />
                <KpiCard label={t("dashboard.reorderNeeded")} value={String(dashboard.reorderNeededItems)} icon="shopping_cart" color="error" />
            </div>

            {/* Top Selling Today */}
            {dashboard.topSellingToday.length > 0 && (
                <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-primary mb-4">{t("dashboard.topSelling")}</h3>
                    <div className="space-y-3">
                        {dashboard.topSellingToday.map((item: TopSellingItem, idx: number) => (
                            <div key={item.productId} className="flex items-center justify-between rounded-xl bg-surface-container px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-container text-on-primary-container text-sm font-bold">
                                        {idx + 1}
                                    </span>
                                    <span className="font-medium text-on-surface">{item.productName}</span>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-primary">৳ {formatMoney(item.revenue)}</p>
                                    <p className="text-xs text-on-surface-variant">{item.quantitySold} sold</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Activity */}
            {dashboard.recentActivities.length > 0 && (
                <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-primary mb-4">{t("dashboard.recentActivity")}</h3>
                    <div className="space-y-3">
                        {dashboard.recentActivities.map((activity: RecentActivity, idx: number) => (
                            <div key={idx} className="flex items-center justify-between rounded-xl bg-surface-container px-4 py-3">
                                <div>
                                    <p className="font-medium text-on-surface">{activity.description}</p>
                                    <p className="text-xs text-on-surface-variant">
                                        {new Date(activity.timestamp).toLocaleDateString(loc)}
                                    </p>
                                </div>
                                {activity.amount && (
                                    <p className="font-bold text-primary">৳ {formatMoney(activity.amount)}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Sales Tab ───────────────────────────────────────────

function SalesTab({
    salesPeriod,
    setSalesPeriod,
    dailySales,
    weeklySales,
    monthlySales,
    t,
    formatMoney,
    loc,
}: {
    salesPeriod: "daily" | "weekly" | "monthly";
    setSalesPeriod: (p: "daily" | "weekly" | "monthly") => void;
    dailySales: DailySalesReport | null;
    weeklySales: PeriodSalesReport | null;
    monthlySales: PeriodSalesReport | null;
    t: (key: string) => string;
    formatMoney: (v: number | null | undefined) => string;
    loc: string;
}) {
    const current = salesPeriod === "daily" ? dailySales : salesPeriod === "weekly" ? weeklySales : monthlySales;

    return (
        <div className="space-y-6">
            {/* Period selector */}
            <div className="flex gap-2">
                {(["daily", "weekly", "monthly"] as const).map((p) => (
                    <button
                        key={p}
                        onClick={() => setSalesPeriod(p)}
                        className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${salesPeriod === p
                            ? "bg-primary text-white"
                            : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                            }`}
                    >
                        {t(`sales.${p}`)}
                    </button>
                ))}
            </div>

            {/* KPI Cards */}
            {current && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard label={t("sales.totalRevenue")} value={`৳ ${formatMoney(current.totalRevenue)}`} icon="payments" color="primary" />
                    <KpiCard label={t("sales.totalProfit")} value={`৳ ${formatMoney(current.totalProfit)}`} icon="trending_up" color="secondary" />
                    <KpiCard label={t("sales.totalSales")} value={String(current.totalSales)} icon="receipt_long" color="primary" />
                    {dailySales && (
                        <KpiCard label={t("sales.itemsSold")} value={String(dailySales.itemsSold)} icon="shopping_bag" color="secondary" />
                    )}
                </div>
            )}

            {/* Daily breakdown for period reports */}
            {((salesPeriod === "weekly" && weeklySales?.dailyBreakdown) ||
                (salesPeriod === "monthly" && monthlySales?.dailyBreakdown)) && (
                    <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
                        <div className="p-6 bg-surface-container-low/50">
                            <h3 className="font-bold text-primary">{t("sales.dailyBreakdown")}</h3>
                        </div>
                        <table className="min-w-full text-left">
                            <thead className="bg-surface-container-low text-sm font-bold text-on-surface-variant">
                                <tr>
                                    <th className="px-6 py-4">{t("sales.date")}</th>
                                    <th className="px-6 py-4 text-right">{t("sales.revenue")}</th>
                                    <th className="px-6 py-4 text-right">{t("sales.profit")}</th>
                                    <th className="px-6 py-4 text-right">{t("sales.sales")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-container">
                                {(salesPeriod === "weekly" ? weeklySales : monthlySales)?.dailyBreakdown.map((day) => (
                                    <tr key={day.date} className="hover:bg-surface-container-low transition-colors">
                                        <td className="px-6 py-4 text-sm text-on-surface">
                                            {new Date(day.date).toLocaleDateString(loc)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-primary">
                                            ৳ {formatMoney(day.totalRevenue)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-secondary">
                                            ৳ {formatMoney(day.totalProfit)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-on-surface-variant">
                                            {day.totalSales}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            {/* Top items for daily */}
            {salesPeriod === "daily" && dailySales?.topItems && dailySales.topItems.length > 0 && (
                <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-primary mb-4">{t("sales.topItems")}</h3>
                    <div className="space-y-3">
                        {dailySales.topItems.map((item: TopSellingItem) => (
                            <div key={item.productId} className="flex items-center justify-between rounded-xl bg-surface-container px-4 py-3">
                                <span className="font-medium text-on-surface">{item.productName}</span>
                                <div className="text-right">
                                    <span className="font-bold text-primary">৳ {formatMoney(item.revenue)}</span>
                                    <span className="ml-3 text-sm text-on-surface-variant">{item.quantitySold} {t("sales.quantity")}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Profit Tab ──────────────────────────────────────────

function ProfitTab({
    productProfit,
    netProfit,
    t,
    formatMoney,
    formatPct,
    loc,
}: {
    productProfit: ProductProfitReport;
    netProfit: NetProfitReport;
    t: (key: string) => string;
    formatMoney: (v: number | null | undefined) => string;
    formatPct: (v: number | null | undefined) => string;
    loc: string;
}) {
    return (
        <div className="space-y-6">
            {/* Net Profit Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard label={t("profit.totalRevenue")} value={`৳ ${formatMoney(netProfit.totalRevenue)}`} icon="payments" color="primary" />
                <KpiCard label={t("profit.grossProfit")} value={`৳ ${formatMoney(netProfit.grossProfit)}`} icon="trending_up" color="secondary" />
                <KpiCard label={t("profit.netProfit")} value={`৳ ${formatMoney(netProfit.netProfit)}`} icon="savings" color="primary" />
                <KpiCard label={t("profit.profitMargin")} value={formatPct(netProfit.profitMargin)} icon="speed" color="secondary" />
            </div>

            {/* Profit breakdown bar */}
            <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
                <h3 className="text-lg font-bold text-primary mb-4">{t("profit.title")}</h3>
                <div className="space-y-3">
                    <ProfitBar label={t("profit.totalRevenue")} value={netProfit.totalRevenue} max={netProfit.totalRevenue} color="bg-primary" formatMoney={formatMoney} />
                    <ProfitBar label={t("profit.cogs")} value={netProfit.cogs} max={netProfit.totalRevenue} color="bg-tertiary" formatMoney={formatMoney} />
                    <ProfitBar label={t("profit.grossProfit")} value={netProfit.grossProfit} max={netProfit.totalRevenue} color="bg-secondary" formatMoney={formatMoney} />
                    <ProfitBar label={t("profit.totalExpenses")} value={netProfit.totalExpenses} max={netProfit.totalRevenue} color="bg-error" formatMoney={formatMoney} />
                    <ProfitBar label={t("profit.netProfit")} value={netProfit.netProfit} max={netProfit.totalRevenue} color="bg-primary" formatMoney={formatMoney} />
                </div>
            </div>

            {/* Product Profit Table */}
            {productProfit.products.length > 0 && (
                <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
                    <div className="p-6 bg-surface-container-low/50">
                        <h3 className="font-bold text-primary">{t("profit.title")} — {t("sales.topItems")}</h3>
                    </div>
                    <table className="min-w-full text-left">
                        <thead className="bg-surface-container-low text-sm font-bold text-on-surface-variant">
                            <tr>
                                <th className="px-6 py-4">{t("profit.product")}</th>
                                <th className="px-6 py-4 text-right">{t("profit.quantity")}</th>
                                <th className="px-6 py-4 text-right">{t("profit.revenue")}</th>
                                <th className="px-6 py-4 text-right">{t("profit.cost")}</th>
                                <th className="px-6 py-4 text-right">{t("profit.profit")}</th>
                                <th className="px-6 py-4 text-right">{t("profit.margin")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container">
                            {productProfit.products.map((item: ProductProfitItem) => (
                                <tr key={item.productId} className="hover:bg-surface-container-low transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-on-surface">{item.productName}</td>
                                    <td className="px-6 py-4 text-right text-on-surface-variant">{item.quantitySold}</td>
                                    <td className="px-6 py-4 text-right font-bold text-primary">৳ {formatMoney(item.revenue)}</td>
                                    <td className="px-6 py-4 text-right text-on-surface-variant">৳ {formatMoney(item.cost)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-secondary">৳ {formatMoney(item.profit)}</td>
                                    <td className="px-6 py-4 text-right text-on-surface-variant">{formatPct(item.profitMargin)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ─── Expenses Tab ────────────────────────────────────────

function ExpensesTab({
    netProfit,
    t,
    formatMoney,
}: {
    netProfit: NetProfitReport;
    t: (key: string) => string;
    formatMoney: (v: number | null | undefined) => string;
}) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <KpiCard label={t("profit.totalRevenue")} value={`৳ ${formatMoney(netProfit.totalRevenue)}`} icon="payments" color="primary" />
                <KpiCard label={t("profit.totalExpenses")} value={`৳ ${formatMoney(netProfit.totalExpenses)}`} icon="payments" color="error" />
                <KpiCard label={t("profit.netProfit")} value={`৳ ${formatMoney(netProfit.netProfit)}`} icon="savings" color="secondary" />
            </div>

            <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
                <h3 className="text-lg font-bold text-primary mb-4">{t("expenses.title")}</h3>
                <div className="space-y-3">
                    <ProfitBar label={t("profit.totalRevenue")} value={netProfit.totalRevenue} max={netProfit.totalRevenue} color="bg-primary" formatMoney={formatMoney} />
                    <ProfitBar label={t("profit.cogs")} value={netProfit.cogs} max={netProfit.totalRevenue} color="bg-tertiary" formatMoney={formatMoney} />
                    <ProfitBar label={t("profit.totalExpenses")} value={netProfit.totalExpenses} max={netProfit.totalRevenue} color="bg-error" formatMoney={formatMoney} />
                    <ProfitBar label={t("profit.netProfit")} value={netProfit.netProfit} max={netProfit.totalRevenue} color="bg-secondary" formatMoney={formatMoney} />
                </div>
            </div>
        </div>
    );
}

// ─── Due Tab ─────────────────────────────────────────────

function DueTab({
    dueReport,
    t,
    formatMoney,
    loc,
}: {
    dueReport: DueLedgerReport;
    t: (key: string) => string;
    formatMoney: (v: number | null | undefined) => string;
    loc: string;
}) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <KpiCard label={t("due.totalDue")} value={`৳ ${formatMoney(dueReport.totalDue)}`} icon="menu_book" color="tertiary" />
                <KpiCard label={t("due.customersWithDue")} value={String(dueReport.customersWithDue)} icon="group" color="tertiary" />
            </div>

            {dueReport.customers.length > 0 && (
                <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
                    <table className="min-w-full text-left">
                        <thead className="bg-surface-container-low text-sm font-bold text-on-surface-variant">
                            <tr>
                                <th className="px-6 py-4">{t("due.customer")}</th>
                                <th className="px-6 py-4">{t("due.phone")}</th>
                                <th className="px-6 py-4 text-right">{t("due.dueAmount")}</th>
                                <th className="px-6 py-4 text-right">{t("due.lastTransaction")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container">
                            {dueReport.customers.map((c) => (
                                <tr key={c.customerId} className="hover:bg-surface-container-low transition-colors">
                                    <td className="px-6 py-4 font-medium text-on-surface">{c.customerName}</td>
                                    <td className="px-6 py-4 text-sm text-on-surface-variant">{c.phone || "—"}</td>
                                    <td className="px-6 py-4 text-right font-bold text-tertiary">৳ {formatMoney(c.dueAmount)}</td>
                                    <td className="px-6 py-4 text-right text-sm text-on-surface-variant">
                                        {c.lastTransactionDate
                                            ? new Date(c.lastTransactionDate).toLocaleDateString(loc)
                                            : "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ─── Stock Tab ───────────────────────────────────────────

function StockTab({
    stockAlert,
    t,
    formatMoney,
}: {
    stockAlert: StockAlertReport;
    t: (key: string) => string;
    formatMoney: (v: number | null | undefined) => string;
}) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
                <KpiCard label={t("stock.lowStock")} value={String(stockAlert.lowStockCount)} icon="warning" color="tertiary" />
                <KpiCard label={t("stock.outOfStock")} value={String(stockAlert.outOfStockCount)} icon="cancel" color="error" />
                <KpiCard label={t("stock.reorderNeeded")} value={String(stockAlert.reorderNeededCount)} icon="shopping_cart" color="error" />
            </div>

            {stockAlert.items.length > 0 && (
                <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
                    <table className="min-w-full text-left">
                        <thead className="bg-surface-container-low text-sm font-bold text-on-surface-variant">
                            <tr>
                                <th className="px-6 py-4">{t("stock.product")}</th>
                                <th className="px-6 py-4">{t("stock.sku")}</th>
                                <th className="px-6 py-4 text-right">{t("stock.currentStock")}</th>
                                <th className="px-6 py-4 text-right">{t("stock.reorderPoint")}</th>
                                <th className="px-6 py-4">{t("stock.status")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container">
                            {stockAlert.items.map((item: StockAlertItem) => (
                                <tr key={item.productId} className="hover:bg-surface-container-low transition-colors">
                                    <td className="px-6 py-4 font-medium text-on-surface">{item.productName}</td>
                                    <td className="px-6 py-4 text-sm text-on-surface-variant">{item.sku || "—"}</td>
                                    <td className="px-6 py-4 text-right font-bold text-on-surface">{formatMoney(item.currentStock)}</td>
                                    <td className="px-6 py-4 text-right text-on-surface-variant">{formatMoney(item.reorderPoint)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${item.status === "OUT_OF_STOCK"
                                            ? "bg-error-container text-on-error-container"
                                            : item.status === "LOW_STOCK"
                                                ? "bg-tertiary-container text-on-tertiary-container"
                                                : "bg-surface-container-high text-on-surface-variant"
                                            }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// UTILITY COMPONENTS
// ═══════════════════════════════════════════════════════════

function KpiCard({
    label,
    value,
    icon,
    color,
}: {
    label: string;
    value: string;
    icon: string;
    color: "primary" | "secondary" | "tertiary" | "error";
}) {
    const colorClasses = {
        primary: "bg-primary-container/10 text-primary group-hover:bg-primary",
        secondary: "bg-secondary-container/10 text-secondary group-hover:bg-secondary",
        tertiary: "bg-tertiary-container/10 text-tertiary group-hover:bg-tertiary",
        error: "bg-error-container/10 text-error group-hover:bg-error",
    };

    return (
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm group hover:bg-primary transition-colors">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <p className="text-on-surface-variant text-sm font-medium group-hover:text-white/80">{label}</p>
                    <p className="text-2xl font-black text-on-surface group-hover:text-white tracking-tight">{value}</p>
                </div>
                <div className={`p-3 rounded-full ${colorClasses[color]} group-hover:text-white transition-colors`}>
                    <span className="material-symbols-outlined text-2xl">{icon}</span>
                </div>
            </div>
        </div>
    );
}

function ProfitBar({
    label,
    value,
    max,
    color,
    formatMoney,
}: {
    label: string;
    value: number;
    max: number;
    color: string;
    formatMoney: (v: number | null | undefined) => string;
}) {
    const pct = max > 0 ? Math.min(100, (Math.abs(value) / max) * 100) : 0;

    return (
        <div className="flex items-center gap-4">
            <span className="w-36 text-sm text-on-surface-variant shrink-0">{label}</span>
            <div className="flex-1 bg-surface-container h-3 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-bold text-on-surface w-28 text-right shrink-0">৳ {formatMoney(value)}</span>
        </div>
    );
}
