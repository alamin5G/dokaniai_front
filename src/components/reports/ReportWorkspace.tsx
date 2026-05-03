"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Area,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ComposedChart,
    Legend,
    Line,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import type { DssReportResponse, MisKpi, MisReportResponse } from "@/types/report";
import { exportMisReport, generateMisDssReport, getMisDssReport, getMisReport } from "@/lib/reportApi";
import { trackReportView } from "@/lib/activityTracker";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import UpgradeCta from "./UpgradeCta";
import AIInsightPanel from "./insights/AIInsightPanel";
import CustomerAnalytics from "./CustomerAnalytics";

type TabKey = "dashboard" | "sales" | "profit" | "expenses" | "due" | "stock" | "discounts" | "returns" | "advanced";
type DatePreset = "today" | "last7" | "last30" | "thisMonth" | "lastMonth" | "custom";

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

function toInputDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function getPresetRange(preset: DatePreset): { startDate: string; endDate: string } {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let start = new Date(end);

    if (preset === "today") {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (preset === "last7") {
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
    } else if (preset === "last30") {
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
    } else if (preset === "thisMonth") {
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (preset === "lastMonth") {
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        start = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), 1, 0, 0, 0, 0);
        return { startDate: start.toISOString(), endDate: lastMonthEnd.toISOString() };
    }

    return { startDate: start.toISOString(), endDate: end.toISOString() };
}

export default function ReportWorkspace({ businessId }: { businessId: string }) {
    const t = useTranslations("shop.reports");
    const locale = useLocale();
    const loc = resolveLocale(locale);
    const plan = usePlanFeatures();

    const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
    const [datePreset, setDatePreset] = useState<DatePreset>("last30");
    const [customStart, setCustomStart] = useState(toInputDate(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)));
    const [customEnd, setCustomEnd] = useState(toInputDate(new Date()));
    const [report, setReport] = useState<MisReportResponse | null>(null);
    const [dssReport, setDssReport] = useState<DssReportResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingDss, setIsGeneratingDss] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currencyFmt = useMemo(() => new Intl.NumberFormat(loc, { maximumFractionDigits: 0 }), [loc]);
    const pctFmt = useMemo(() => new Intl.NumberFormat(loc, { minimumFractionDigits: 1, maximumFractionDigits: 1 }), [loc]);

    const reportRange = useMemo(() => {
        if (datePreset !== "custom") {
            return getPresetRange(datePreset);
        }
        const start = customStart ? new Date(`${customStart}T00:00:00`) : new Date();
        const end = customEnd ? new Date(`${customEnd}T23:59:59`) : new Date();
        return { startDate: start.toISOString(), endDate: end.toISOString() };
    }, [datePreset, customStart, customEnd]);

    function formatMoney(value: number | null | undefined): string {
        return currencyFmt.format(value ?? 0);
    }

    function formatPct(value: number | null | undefined): string {
        return pctFmt.format(value ?? 0) + "%";
    }

    const loadReport = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (activeTab === "advanced") {
                setReport(null);
                if (plan.aiInsights) {
                    setDssReport(await getMisDssReport(businessId, reportRange.startDate, reportRange.endDate));
                }
                return;
            }
            const data = await getMisReport(businessId, activeTab, reportRange.startDate, reportRange.endDate);
            setReport(data);
            setDssReport(null);
        } catch (err) {
            console.error("[Reports] load failed:", err);
            setError(t("messages.loadError"));
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, businessId, plan.aiInsights, reportRange.startDate, reportRange.endDate, t]);

    useEffect(() => {
        loadReport();
    }, [loadReport]);

    useEffect(() => {
        trackReportView({
            businessId,
            reportType: activeTab === "advanced" ? "ADVANCED_REPORTS" : `MIS_${activeTab.toUpperCase()}`,
            tab: activeTab,
        });
    }, [activeTab, businessId]);

    async function handleExport(format: string) {
        try {
            const tab = activeTab === "advanced" ? "dashboard" : activeTab;
            const blob = await exportMisReport(businessId, tab, format, reportRange.startDate, reportRange.endDate);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `mis_${tab}_${new Date().toISOString().slice(0, 10)}.${format}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            setError(t("messages.exportError"));
        }
    }

    async function handleGenerateDss() {
        setIsGeneratingDss(true);
        setError(null);
        try {
            setDssReport(await generateMisDssReport(businessId, reportRange.startDate, reportRange.endDate));
        } catch {
            setError(t("insights.generateError"));
        } finally {
            setIsGeneratingDss(false);
        }
    }

    const tabs: { key: TabKey; icon: string; proOnly?: boolean }[] = [
        { key: "dashboard", icon: "dashboard" },
        { key: "sales", icon: "receipt_long" },
        { key: "profit", icon: "trending_up", proOnly: true },
        { key: "expenses", icon: "payments" },
        { key: "due", icon: "menu_book" },
        { key: "stock", icon: "inventory_2" },
        { key: "discounts", icon: "sell" },
        { key: "returns", icon: "undo" },
        { key: "advanced", icon: "auto_awesome", proOnly: true },
    ];

    return (
        <div className="space-y-6">
            <header className="flex justify-end">
                <div className="flex items-center gap-2">
                    <button onClick={() => handleExport("csv")} className="bg-surface-container text-on-surface-variant px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-surface-container-high transition-colors">
                        <span className="material-symbols-outlined text-sm">download</span>
                        {t("export.csv")}
                    </button>
                    <button onClick={() => handleExport("pdf")} className="bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors">
                        <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                        {t("export.pdf")}
                    </button>
                </div>
            </header>

            <ReportFilterBar
                t={t}
                datePreset={datePreset}
                setDatePreset={setDatePreset}
                customStart={customStart}
                setCustomStart={setCustomStart}
                customEnd={customEnd}
                setCustomEnd={setCustomEnd}
            />

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

            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
                </div>
            )}

            {error && !isLoading && (
                <div className="rounded-2xl bg-error-container p-6 text-center text-on-error-container">
                    {error}
                </div>
            )}

            {!isLoading && !error && activeTab !== "advanced" && report && (
                <MisReportPanel report={report} formatMoney={formatMoney} formatPct={formatPct} t={t} />
            )}

            {!isLoading && !error && activeTab === "advanced" && (
                plan.advancedReports ? (
                    <div className="space-y-6">
                        {plan.aiInsights && dssReport && (
                            <DssDecisionBoard
                                report={dssReport}
                                onGenerate={handleGenerateDss}
                                isGenerating={isGeneratingDss}
                            />
                        )}
                        {plan.aiInsights && <AIInsightPanel businessId={businessId} />}
                        {plan.customerAnalytics ? (
                            <section>
                                <h3 className="text-lg font-bold text-primary mb-4">{t("customerAnalytics.title")}</h3>
                                <CustomerAnalytics businessId={businessId} />
                            </section>
                        ) : (
                            <UpgradeCta feature="customerAnalytics" />
                        )}
                    </div>
                ) : (
                    <UpgradeCta feature="advancedReports" />
                )
            )}
        </div>
    );
}

function ReportFilterBar({
    t,
    datePreset,
    setDatePreset,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
}: {
    t: (key: string) => string;
    datePreset: DatePreset;
    setDatePreset: (preset: DatePreset) => void;
    customStart: string;
    setCustomStart: (value: string) => void;
    customEnd: string;
    setCustomEnd: (value: string) => void;
}) {
    const presets: Array<{ key: DatePreset; label: string }> = [
        { key: "today", label: t("dateRange.today") },
        { key: "last7", label: t("dateRange.last7") },
        { key: "last30", label: t("dateRange.last30Days") },
        { key: "thisMonth", label: t("dateRange.thisMonth") },
        { key: "lastMonth", label: t("dateRange.lastMonth") },
        { key: "custom", label: t("dateRange.custom") },
    ];

    return (
        <section className="rounded-2xl bg-surface-container-lowest p-3 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex gap-1 overflow-x-auto rounded-xl bg-surface-container p-1">
                    {presets.map((preset) => (
                        <button
                            key={preset.key}
                            onClick={() => setDatePreset(preset.key)}
                            className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-colors ${datePreset === preset.key ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container-high"}`}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
                {datePreset === "custom" && (
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="text-xs font-medium text-on-surface-variant">{t("dateRange.startDate")}</label>
                        <input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
                        <label className="text-xs font-medium text-on-surface-variant">{t("dateRange.endDate")}</label>
                        <input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                )}
            </div>
        </section>
    );
}

function MisReportPanel({
    report,
    formatMoney,
    formatPct,
    t,
}: {
    report: MisReportResponse;
    formatMoney: (v: number | null | undefined) => string;
    formatPct: (v: number | null | undefined) => string;
    t: (key: string) => string;
}) {
    const comparison = (report.metadata.comparison ?? {}) as Record<string, unknown>;

    return (
        <section className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {report.kpis.map((kpi) => (
                    <MisKpiCard key={`${report.reportType}-${kpi.label}`} kpi={kpi} formatMoney={formatMoney} formatPct={formatPct} t={t} />
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                {report.trend.length > 0 && (
                    <BiTrendChart report={report} formatMoney={formatMoney} t={t} />
                )}

                <ActionQueue actions={report.actions} t={t} />
            </div>

            {Object.keys(comparison).length > 0 && (
                <ComparisonStrip comparison={comparison} formatPct={formatPct} t={t} />
            )}

            {(report.breakdown.length > 0 || report.rows.length > 0) && (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {report.breakdown.length > 0 && (
                        <BreakdownChart report={report} formatMoney={formatMoney} t={t} />
                    )}
                    {report.rows.length > 0 && (
                        <DetailTable report={report} formatMoney={formatMoney} t={t} />
                    )}
                </div>
            )}

            <MetadataIntelligence report={report} formatMoney={formatMoney} formatPct={formatPct} t={t} />
        </section>
    );
}

function BiTrendChart({
    report,
    formatMoney,
    t,
}: {
    report: MisReportResponse;
    formatMoney: (v: number | null | undefined) => string;
    t: (key: string) => string;
}) {
    return (
        <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm xl:col-span-2">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-on-surface">
                <span className="material-symbols-outlined text-base text-primary">monitoring</span>
                {t("mis.trend")}
            </div>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={report.trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={18} />
                        <YAxis tick={{ fontSize: 11 }} width={48} />
                        <Tooltip formatter={(value) => `৳${formatMoney(Number(value))}`} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Area type="monotone" dataKey="revenue" name={t("charts.revenue")} fill="#2563eb" stroke="#2563eb" fillOpacity={0.16} />
                        <Bar dataKey="expenses" name={t("charts.expenses")} fill="#dc2626" radius={[4, 4, 0, 0]} />
                        <Line type="monotone" dataKey="profit" name={t("charts.profit")} stroke="#059669" strokeWidth={2.5} dot={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function BreakdownChart({
    report,
    formatMoney,
    t,
}: {
    report: MisReportResponse;
    formatMoney: (v: number | null | undefined) => string;
    t: (key: string) => string;
}) {
    const colors = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#4b5563", "#be123c"];
    return (
        <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm">
            <div className="mb-3 text-sm font-bold text-on-surface">{t("mis.breakdown")}</div>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    {report.breakdown.length <= 5 ? (
                        <PieChart>
                            <Pie data={report.breakdown} dataKey="value" nameKey="label" innerRadius={52} outerRadius={88} paddingAngle={2}>
                                {report.breakdown.map((_, index) => (
                                    <Cell key={index} fill={colors[index % colors.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `৳${formatMoney(Number(value))}`} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                    ) : (
                        <BarChart data={report.breakdown.slice(0, 8)} layout="vertical" margin={{ top: 4, right: 8, left: 20, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis dataKey="label" type="category" width={92} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(value) => `৳${formatMoney(Number(value))}`} />
                            <Bar dataKey="value" fill="#2563eb" radius={[0, 5, 5, 0]} />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function ComparisonStrip({
    comparison,
    formatPct,
    t,
}: {
    comparison: Record<string, unknown>;
    formatPct: (v: number | null | undefined) => string;
    t: (key: string) => string;
}) {
    return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {Object.entries(comparison).slice(0, 6).map(([key, value]) => {
                const numeric = Number(value ?? 0);
                return (
                    <div key={key} className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm">
                        <p className="text-xs font-bold uppercase text-on-surface-variant">{translateReportKey(key, t)}</p>
                        <p className={`mt-1 text-xl font-black ${numeric < 0 ? "text-error" : "text-primary"}`}>
                            {numeric > 0 ? "+" : ""}{formatPct(numeric)}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}

function MetadataIntelligence({
    report,
    formatMoney,
    formatPct,
    t,
}: {
    report: MisReportResponse;
    formatMoney: (v: number | null | undefined) => string;
    formatPct: (v: number | null | undefined) => string;
    t: (key: string) => string;
}) {
    const items: Array<{ title: string; rows: Array<Record<string, unknown>> }> = [];
    const metadata = report.metadata;

    if (Array.isArray(metadata.profitBridge)) items.push({ title: t("mis.profitBridge"), rows: metadata.profitBridge as Array<Record<string, unknown>> });
    if (Array.isArray(metadata.spikes)) items.push({ title: t("mis.expenseSpikes"), rows: metadata.spikes as Array<Record<string, unknown>> });
    if (Array.isArray(metadata.slowStock)) items.push({ title: t("mis.slowStock"), rows: metadata.slowStock as Array<Record<string, unknown>> });
    if (Array.isArray(metadata.agingBuckets)) items.push({ title: t("mis.dueAging"), rows: metadata.agingBuckets as Array<Record<string, unknown>> });
    if (Array.isArray(metadata.fixedVariable)) items.push({ title: t("mis.fixedVariable"), rows: metadata.fixedVariable as Array<Record<string, unknown>> });

    if (items.length === 0) return null;

    return (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {items.slice(0, 4).map((section) => (
                <div key={section.title} className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm">
                    <p className="mb-3 text-sm font-bold text-on-surface">{section.title}</p>
                    <div className="space-y-2">
                        {section.rows.slice(0, 6).map((row, index) => (
                            <div key={index} className="flex items-center justify-between gap-3 rounded-xl bg-surface-container px-3 py-2">
                                <span className="truncate text-sm font-medium text-on-surface">{String(row.label ?? row.category ?? row.productName ?? row.type ?? t("mis.item"))}</span>
                                <span className="whitespace-nowrap text-xs font-bold text-on-surface-variant">
                                    {formatMetadataValue(row, formatMoney, formatPct)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function MisKpiCard({
    kpi,
    formatMoney,
    formatPct,
    t,
}: {
    kpi: MisKpi;
    formatMoney: (v: number | null | undefined) => string;
    formatPct: (v: number | null | undefined) => string;
    t: (key: string) => string;
}) {
    const toneClass = kpi.tone === "danger" ? "text-error" : kpi.tone === "warning" ? "text-tertiary" : kpi.tone === "good" ? "text-primary" : "text-on-surface";
    const value = kpi.unit === "BDT" ? `৳${formatMoney(kpi.value)}` : kpi.unit === "PERCENT" ? formatPct(kpi.value) : formatMoney(kpi.value);
    return (
        <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-on-surface-variant">{translateReportKey(kpi.label, t)}</p>
            <p className={`mt-2 text-2xl font-black ${toneClass}`}>{value}</p>
        </div>
    );
}

function ActionQueue({ actions, t }: { actions: MisReportResponse["actions"]; t: (key: string) => string }) {
    return (
        <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-on-surface">
                <span className="material-symbols-outlined text-base text-primary">task_alt</span>
                {t("mis.actionQueue")}
            </div>
            <div className="space-y-3">
                {actions.length === 0 && <p className="text-sm text-on-surface-variant">{t("mis.noCriticalAction")}</p>}
                {actions.slice(0, 4).map((action) => (
                    <div key={`${action.actionType}-${action.title}`} className="border-l-4 border-primary pl-3">
                        <p className="text-sm font-bold text-on-surface">{action.title}</p>
                        <p className="text-xs text-on-surface-variant">{action.message}</p>
                        <p className="mt-1 text-[11px] font-bold text-primary">{action.expectedImpact}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function DetailTable({
    report,
    formatMoney,
    t,
}: {
    report: MisReportResponse;
    formatMoney: (v: number | null | undefined) => string;
    t: (key: string) => string;
}) {
    return (
        <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
            <div className="border-b border-outline-variant p-4 text-sm font-bold text-on-surface">{t("mis.topDetails")}</div>
            <div className="max-h-72 overflow-auto">
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-surface-container text-xs text-on-surface-variant">
                        <tr>
                            <th className="px-4 py-2">{t("mis.name")}</th>
                            <th className="px-4 py-2 text-right">{t("charts.amount")}</th>
                            <th className="px-4 py-2 text-right">{t("sales.quantity")}</th>
                            <th className="px-4 py-2 text-right">{t("mis.metric")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {report.rows.slice(0, 14).map((row) => (
                            <tr key={`${row.label}-${row.amount}-${row.quantity}`} className="border-t border-outline-variant">
                                <td className="px-4 py-2 font-medium text-on-surface">{row.label}</td>
                                <td className="px-4 py-2 text-right text-on-surface-variant">{formatMoney(row.amount)}</td>
                                <td className="px-4 py-2 text-right text-on-surface-variant">{row.quantity ?? 0}</td>
                                <td className="px-4 py-2 text-right text-on-surface-variant">{row.metric ?? 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function humanizeKey(key: string): string {
    return key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (char) => char.toUpperCase());
}

function normalizeKey(key: string): string {
    return key
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toLowerCase();
}

function translateReportKey(key: string, t: (key: string) => string): string {
    const normalized = normalizeKey(key);
    const map: Record<string, string> = {
        revenue: "charts.revenue",
        total_revenue: "sales.totalRevenue",
        sales: "tabs.sales",
        total_sales: "sales.totalSales",
        profit: "charts.profit",
        total_profit: "profit.totalProfit",
        gross_profit: "profit.grossProfit",
        net_profit: "profit.netProfit",
        expenses: "charts.expenses",
        total_expenses: "profit.totalExpenses",
        expense_delta: "mis.expenseDelta",
        profit_delta: "mis.profitDelta",
        revenue_delta: "mis.revenueDelta",
        discount: "tabs.discounts",
        discounts: "tabs.discounts",
        returns: "tabs.returns",
        due: "tabs.due",
        stock: "tabs.stock",
        margin: "profit.margin",
        quantity: "sales.quantity",
        count: "expenses.count",
        amount: "charts.amount",
        collection_rate: "mis.collectionRate",
        low_stock_risk: "mis.lowStockRisk",
        business_health_score: "mis.businessHealthScore",
    };
    const translationKey = map[normalized];
    return translationKey ? t(translationKey) : humanizeKey(key);
}

function formatMetadataValue(
    row: Record<string, unknown>,
    formatMoney: (v: number | null | undefined) => string,
    formatPct: (v: number | null | undefined) => string,
): string {
    const value = row.value ?? row.current ?? row.stockQty ?? row.daysOfStock ?? row.spikePercent;
    const numeric = Number(value ?? 0);
    if ("spikePercent" in row || "margin" in row) {
        return formatPct(numeric);
    }
    if ("daysOfStock" in row) {
        return `${numeric.toFixed(1)}d`;
    }
    if ("stockQty" in row || "soldQty" in row) {
        return numeric.toLocaleString();
    }
    return `৳${formatMoney(numeric)}`;
}

function DssDecisionBoard({
    report,
    onGenerate,
    isGenerating,
}: {
    report: DssReportResponse;
    onGenerate: () => void;
    isGenerating: boolean;
}) {
    const t = useTranslations("shop.reports");
    const generatedCount = Number(report.metrics.monthlyGenerated ?? report.insights.length);
    const available = Boolean(report.metrics.generationAvailable) && generatedCount < 2;
    const generationFailed = Boolean(report.metrics.generationFailed);
    const day = new Date().getDate();
    const slotGenerated = Boolean(report.metrics.slotGenerated);
    const nextWindowText = day < 14
        ? t("dss.availableAfterDay13")
        : slotGenerated
            ? t("dss.slotGenerated")
            : generatedCount >= 2
                ? t("dss.monthlyLimitReached")
                : t("dss.generateFresh");

    return (
        <section className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-black text-on-surface">{t("dss.title")}</h3>
                    <p className="text-sm text-on-surface-variant">{t("dss.subtitle")}</p>
                </div>
                <button
                    onClick={onGenerate}
                    disabled={!available || isGenerating}
                    className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${available ? "bg-primary text-on-primary hover:bg-primary/90" : "bg-surface-container text-on-surface-variant"}`}
                >
                    {isGenerating ? t("dss.generating") : nextWindowText}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-xl bg-surface-container p-4 lg:col-span-2">
                    <p className="mb-2 text-xs font-bold uppercase text-on-surface-variant">{t("dss.ragContext")}</p>
                    <p className="text-sm leading-6 text-on-surface">{report.context}</p>
                    {generationFailed && (
                        <p className="mt-3 rounded-lg bg-error-container px-3 py-2 text-xs font-medium text-on-error-container">
                            {t("dss.generationFailed")}
                        </p>
                    )}
                </div>
                <ActionQueue actions={report.actions} t={t} />
            </div>

            {report.insights.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {report.insights.slice(0, 2).map((insight) => (
                        <div key={insight.id} className="rounded-xl bg-surface-container-low p-4">
                            <div className="flex items-center justify-between gap-3">
                                <p className="font-bold text-on-surface">{insight.title}</p>
                                <span className="text-xs font-bold text-primary">{Math.round((insight.confidence ?? 0) * 100)}%</span>
                            </div>
                            <p className="mt-2 line-clamp-3 text-sm text-on-surface-variant">{extractAiSummary(insight.message)}</p>
                            {(insight.aiModel || insight.tokenInput || insight.tokenOutput) && (
                                <p className="mt-2 text-[11px] text-on-surface-variant">
                                    {insight.aiModel ?? t("insights.ai")} · {t("insights.inputTokens")} {insight.tokenInput ?? 0} / {t("insights.outputTokens")} {insight.tokenOutput ?? 0}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

function extractAiSummary(message: string): string {
    const trimmed = message.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("```")) {
        return message;
    }
    try {
        const json = trimmed
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/```$/i, "")
            .trim();
        const parsed = JSON.parse(json) as Record<string, unknown>;
        const primary = parsed.briefing ?? parsed.summary ?? parsed.message ?? parsed.analysis;
        if (primary != null) {
            return String(primary);
        }
    } catch {
        return message;
    }
    return message;
}
