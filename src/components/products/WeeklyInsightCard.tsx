"use client";

import { useTranslations } from "next-intl";
import { useWeeklyInsight } from "@/hooks/useWeeklyInsight";
import type {
    WeeklyBusinessInsight,
    SalesAnalysis,
    ProfitAnalysis,
    StockRecommendation,
    ImprovementTip,
    ProductSuggestion,
} from "@/types/weeklyInsight";

// ─── Props ──────────────────────────────────────────────
interface WeeklyInsightCardProps {
    businessId: string;
}

// ─── Main Component ─────────────────────────────────────
export default function WeeklyInsightCard({ businessId }: WeeklyInsightCardProps) {
    const t = useTranslations("weeklyInsight");
    const { insight, loading, refreshing, error, refresh } = useWeeklyInsight(businessId);

    // Loading state
    if (loading) {
        return (
            <div className="space-y-4">
                <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-8 w-8 animate-pulse rounded-full bg-surface-container" />
                        <div className="h-6 w-48 animate-pulse rounded-lg bg-surface-container" />
                    </div>
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="mb-4 space-y-2">
                            <div className="h-5 w-32 animate-pulse rounded bg-surface-container" />
                            <div className="h-20 w-full animate-pulse rounded-xl bg-surface-container" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (error && !insight) {
        return (
            <div className="rounded-2xl bg-rose-50 p-6 text-center">
                <p className="text-sm text-rose-700">{t("loadError")}</p>
            </div>
        );
    }

    // No data state
    if (!insight) return null;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🤖</span>
                        <div>
                            <h3 className="text-lg font-bold text-on-surface">
                                {t("title")}
                            </h3>
                            {insight.weekStart && insight.weekEnd && (
                                <p className="text-xs text-on-surface-variant">
                                    {insight.weekStart} → {insight.weekEnd}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={refresh}
                        disabled={refreshing}
                        className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-primary shadow-sm transition hover:bg-primary/5 disabled:opacity-50"
                    >
                        {refreshing ? "..." : t("refresh")}
                    </button>
                </div>

                {/* Status message */}
                <p className="mt-2 text-sm text-on-surface-variant">
                    {insight.message}
                </p>

                {/* Error banner */}
                {error && (
                    <p className="mt-2 text-xs text-rose-600">{error}</p>
                )}
            </div>

            {/* NO_DATA or EXPIRED — show countdown only */}
            {(insight.status === "NO_DATA" || insight.status === "EXPIRED") && (
                <CountdownFooter
                    daysUntilNext={insight.daysUntilNext}
                    hoursUntilNext={insight.hoursUntilNext}
                    label={t("nextInsight")}
                />
            )}

            {/* AVAILABLE — show all 5 sections */}
            {insight.status === "AVAILABLE" && (
                <>
                    {/* 1. Sales Analysis */}
                    {insight.salesAnalysis && (
                        <SectionCard
                            icon="📊"
                            title={t("salesAnalysis")}
                            color="blue"
                        >
                            <SalesSection data={insight.salesAnalysis} />
                        </SectionCard>
                    )}

                    {/* 2. Profit Analysis */}
                    {insight.profitAnalysis && (
                        <SectionCard
                            icon="💰"
                            title={t("profitAnalysis")}
                            color="emerald"
                        >
                            <ProfitSection data={insight.profitAnalysis} />
                        </SectionCard>
                    )}

                    {/* 3. Stock Recommendations */}
                    {insight.stockRecommendations && insight.stockRecommendations.length > 0 && (
                        <SectionCard
                            icon="📦"
                            title={t("stockRecommendations")}
                            color="amber"
                        >
                            <StockSection items={insight.stockRecommendations} />
                        </SectionCard>
                    )}

                    {/* 4. Improvement Tips */}
                    {insight.improvementTips && insight.improvementTips.length > 0 && (
                        <SectionCard
                            icon="💡"
                            title={t("improvementTips")}
                            color="purple"
                        >
                            <TipsSection items={insight.improvementTips} />
                        </SectionCard>
                    )}

                    {/* 5. Product Suggestions */}
                    {insight.productSuggestions && insight.productSuggestions.length > 0 && (
                        <SectionCard
                            icon="🆕"
                            title={t("productSuggestions")}
                            color="teal"
                        >
                            <SuggestionsSection items={insight.productSuggestions} />
                        </SectionCard>
                    )}

                    {/* Countdown footer */}
                    <CountdownFooter
                        daysUntilNext={insight.daysUntilNext}
                        hoursUntilNext={insight.hoursUntilNext}
                        label={t("nextInsight")}
                    />

                    {/* AI metadata */}
                    <div className="text-center text-[10px] text-on-surface-variant/50">
                        AI: {insight.aiModel}
                        {insight.tokenUsage && (
                            <> · Tokens: {insight.tokenUsage.input}↓ {insight.tokenUsage.output}↑</>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Section Card Wrapper ───────────────────────────────
function SectionCard({
    icon,
    title,
    color,
    children,
}: {
    icon: string;
    title: string;
    color: string;
    children: React.ReactNode;
}) {
    const borderColors: Record<string, string> = {
        blue: "border-l-blue-500",
        emerald: "border-l-emerald-500",
        amber: "border-l-amber-500",
        purple: "border-l-purple-500",
        teal: "border-l-teal-500",
    };

    return (
        <div
            className={`rounded-2xl bg-surface-container-lowest p-5 shadow-sm border-l-4 ${borderColors[color] || "border-l-slate-300"}`}
        >
            <div className="flex items-center gap-2 mb-3">
                <span>{icon}</span>
                <h4 className="text-sm font-bold text-on-surface">{title}</h4>
            </div>
            {children}
        </div>
    );
}

// ─── Sales Section ──────────────────────────────────────
function SalesSection({ data }: { data: SalesAnalysis }) {
    return (
        <div className="space-y-3">
            <p className="text-sm text-on-surface-variant">{data.summary}</p>

            {/* KPI row */}
            <div className="grid grid-cols-2 gap-3">
                <KpiBox label="বিক্রি" value={String(data.total_items_sold)} unit="টি" />
                <KpiBox label="আয়" value={formatTk(data.total_revenue)} />
            </div>

            {/* Top products */}
            {data.top_selling_products && data.top_selling_products.length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-on-surface-variant">
                        সেরা বিক্রি:
                    </p>
                    {data.top_selling_products.slice(0, 5).map((p, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between rounded-lg bg-surface-container px-3 py-2"
                        >
                            <span className="text-sm text-on-surface">{p.name}</span>
                            <span className="text-xs font-semibold text-on-surface-variant">
                                {p.quantity}টি · ৳{p.revenue}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {data.suggestion && (
                <p className="text-xs text-primary font-medium">💡 {data.suggestion}</p>
            )}
        </div>
    );
}

// ─── Profit Section ─────────────────────────────────────
function ProfitSection({ data }: { data: ProfitAnalysis }) {
    const marginColor =
        data.profit_margin_percent >= 20
            ? "text-emerald-600"
            : data.profit_margin_percent >= 10
                ? "text-amber-600"
                : "text-rose-600";

    return (
        <div className="space-y-3">
            <p className="text-sm text-on-surface-variant">{data.summary}</p>

            <div className="grid grid-cols-3 gap-3">
                <KpiBox label="লাভ" value={formatTk(data.total_profit)} />
                <KpiBox label="আয়" value={formatTk(data.total_revenue)} />
                <div className="rounded-xl bg-surface-container px-3 py-2 text-center">
                    <p className="text-[10px] text-on-surface-variant">মার্জিন</p>
                    <p className={`text-sm font-bold ${marginColor}`}>
                        {data.profit_margin_percent.toFixed(1)}%
                    </p>
                </div>
            </div>

            {/* Profitable products */}
            {data.profitable_products && data.profitable_products.length > 0 && (
                <div className="space-y-1">
                    <p className="text-xs font-semibold text-emerald-700">✅ লাভজনক:</p>
                    {data.profitable_products.slice(0, 3).map((p, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between text-sm px-2 py-1"
                        >
                            <span className="text-on-surface">{p.name}</span>
                            <span className="text-emerald-600 font-semibold">
                                ৳{p.profit} ({p.margin_percent.toFixed(0)}%)
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Loss products */}
            {data.loss_products && data.loss_products.length > 0 && (
                <div className="space-y-1">
                    <p className="text-xs font-semibold text-rose-700">⚠️ ক্ষতি:</p>
                    {data.loss_products.slice(0, 3).map((p, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between text-sm px-2 py-1"
                        >
                            <span className="text-on-surface">{p.name}</span>
                            <span className="text-rose-600 font-semibold">
                                -৳{p.loss}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {data.suggestion && (
                <p className="text-xs text-primary font-medium">💡 {data.suggestion}</p>
            )}
        </div>
    );
}

// ─── Stock Recommendations Section ──────────────────────
function StockSection({ items }: { items: StockRecommendation[] }) {
    const priorityColors: Record<string, string> = {
        CRITICAL: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
        HIGH: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
        MEDIUM: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    };

    return (
        <div className="space-y-2">
            {items.map((item, i) => (
                <div
                    key={i}
                    className="rounded-xl bg-surface-container px-4 py-3 space-y-1"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-on-surface">
                            {item.product}
                        </span>
                        <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityColors[item.priority] || ""}`}
                        >
                            {item.priority}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                        <span>মজুদ: {item.current_stock}</span>
                        <span>→ অর্ডার: {item.suggested_restock}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant">{item.reason}</p>
                </div>
            ))}
        </div>
    );
}

// ─── Improvement Tips Section ───────────────────────────
function TipsSection({ items }: { items: ImprovementTip[] }) {
    const impactColors: Record<string, string> = {
        HIGH: "text-emerald-600",
        MEDIUM: "text-amber-600",
        LOW: "text-slate-500",
    };

    return (
        <div className="space-y-2">
            {items.map((tip, i) => (
                <div
                    key={i}
                    className="rounded-xl bg-surface-container px-4 py-3"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-on-surface">
                            {tip.title}
                        </span>
                        <span
                            className={`text-[10px] font-bold ${impactColors[tip.impact] || ""}`}
                        >
                            [{tip.impact}]
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-on-surface-variant">
                        {tip.description}
                    </p>
                </div>
            ))}
        </div>
    );
}

// ─── Product Suggestions Section ────────────────────────
function SuggestionsSection({ items }: { items: ProductSuggestion[] }) {
    return (
        <div className="space-y-2">
            {items.map((s, i) => (
                <div
                    key={i}
                    className="rounded-xl bg-surface-container px-4 py-3"
                >
                    <p className="text-sm font-semibold text-on-surface">{s.name}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{s.reason}</p>
                    <div className="mt-1 flex gap-3 text-[10px] text-on-surface-variant">
                        <span>চাহিদা: {s.estimated_demand}</span>
                        <span>বিশ্বাস: {s.confidence}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Countdown Footer ───────────────────────────────────
function CountdownFooter({
    daysUntilNext,
    hoursUntilNext,
    label,
}: {
    daysUntilNext: number;
    hoursUntilNext: number;
    label: string;
}) {
    // Progress: 0% (just generated) → 100% (about to generate next)
    const totalHoursInWeek = 168; // 7 days
    const elapsed = totalHoursInWeek - hoursUntilNext;
    const progress = Math.min(100, Math.max(0, (elapsed / totalHoursInWeek) * 100));

    return (
        <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">{label}</span>
                <span className="font-bold text-primary">
                    {daysUntilNext > 0
                        ? `${daysUntilNext} দিন ${Math.floor(hoursUntilNext % 24)} ঘণ্টা`
                        : `${hoursUntilNext} ঘণ্টা`}
                </span>
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-1.5 w-full rounded-full bg-surface-container overflow-hidden">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary-container transition-all duration-500"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

// ─── Helpers ────────────────────────────────────────────
function KpiBox({ label, value, unit }: { label: string; value: string; unit?: string }) {
    return (
        <div className="rounded-xl bg-surface-container px-3 py-2 text-center">
            <p className="text-[10px] text-on-surface-variant">{label}</p>
            <p className="text-sm font-bold text-on-surface">
                {value}
                {unit && <span className="text-xs font-normal text-on-surface-variant"> {unit}</span>}
            </p>
        </div>
    );
}

function formatTk(amount: number): string {
    return `৳${amount.toLocaleString("bn-BD", { maximumFractionDigits: 0 })}`;
}