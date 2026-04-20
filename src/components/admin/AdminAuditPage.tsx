"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as adminApi from "@/lib/adminApi";
import type { AuditLog, AuditLogParams, AuditLogSummary } from "@/types/admin";

const ACTION_OPTIONS = [
    "LOGIN",
    "LOGIN_FAILED",
    "LOGOUT",
    "PASSWORD_CHANGE",
    "PASSWORD_RESET",
    "STATUS_CHANGE",
    "ROLE_CHANGE",
    "SUBSCRIPTION_CHANGE",
    "DATA_EXPORT",
    "EXPORT_USERS",
    "ASSIGN_TICKET",
    "RESPOND_TICKET",
    "ESCALATE_TICKET",
    "CREATE",
];

const SEVERITY_OPTIONS = ["INFO", "WARNING", "ERROR", "CRITICAL"];
const STATUS_OPTIONS = ["SUCCESS", "FAILED", "ERROR", "BLOCKED"];

function emptySummary(): AuditLogSummary {
    return {
        totalLogs: 0,
        warningCount: 0,
        criticalCount: 0,
        failedCount: 0,
        authEventCount: 0,
        exportCount: 0,
        uniqueActors: 0,
        topActions: [],
        topEntities: [],
        highlights: [],
    };
}

function formatDate(value: string | null | undefined): string {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
}

function formatForInput(value: string | null | undefined): string {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset();
    const adjusted = new Date(date.getTime() - offset * 60_000);
    return adjusted.toISOString().slice(0, 16);
}

function toIsoOrUndefined(value: string): string | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;
    return date.toISOString();
}

function normalizeFilters(filters: AuditLogParams): AuditLogParams {
    return {
        search: filters.search?.trim() || undefined,
        actorId: filters.actorId?.trim() || undefined,
        targetUserId: filters.targetUserId?.trim() || undefined,
        action: filters.action || undefined,
        severity: filters.severity || undefined,
        status: filters.status || undefined,
        targetEntity: filters.targetEntity?.trim() || undefined,
        ipAddress: filters.ipAddress?.trim() || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
    };
}

function severityClasses(severity: string): string {
    const map: Record<string, string> = {
        INFO: "bg-emerald-50 text-emerald-700 border-emerald-200",
        WARNING: "bg-amber-50 text-amber-700 border-amber-200",
        ERROR: "bg-rose-50 text-rose-700 border-rose-200",
        CRITICAL: "bg-rose-100 text-rose-800 border-rose-300",
    };
    return map[severity] || "bg-surface-container-low text-on-surface-variant border-outline-variant/20";
}

function statusClasses(status: string): string {
    const map: Record<string, string> = {
        SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
        FAILED: "bg-rose-50 text-rose-700 border-rose-200",
        ERROR: "bg-rose-50 text-rose-700 border-rose-200",
        BLOCKED: "bg-amber-50 text-amber-700 border-amber-200",
    };
    return map[status] || "bg-surface-container-low text-on-surface-variant border-outline-variant/20";
}

function actionIcon(action: string): string {
    if (action.includes("LOGIN")) return "login";
    if (action.includes("LOGOUT")) return "logout";
    if (action.includes("PASSWORD")) return "password";
    if (action.includes("EXPORT")) return "download";
    if (action.includes("ROLE")) return "admin_panel_settings";
    if (action.includes("STATUS")) return "manage_accounts";
    if (action.includes("SUBSCRIPTION")) return "swap_horiz";
    if (action.includes("TICKET")) return "support_agent";
    return "history";
}

function StatCard({
    eyebrow,
    value,
    label,
    tone,
    icon,
}: {
    eyebrow: string;
    value: string;
    label: string;
    tone: string;
    icon: string;
}) {
    return (
        <div className={`rounded-[28px] border p-5 shadow-sm ${tone}`}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold opacity-70">{eyebrow}</p>
                    <p className="mt-3 text-3xl font-black tracking-tight">{value}</p>
                    <p className="mt-2 text-sm leading-6 opacity-80">{label}</p>
                </div>
                <span className="material-symbols-outlined text-3xl opacity-80">{icon}</span>
            </div>
        </div>
    );
}

export default function AdminAuditPage() {
    const t = useTranslations("admin.audit");
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [summary, setSummary] = useState<AuditLogSummary>(emptySummary());
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [draftFilters, setDraftFilters] = useState<AuditLogParams>({
        search: "",
        actorId: "",
        targetUserId: "",
        action: "",
        severity: "",
        status: "",
        targetEntity: "",
        ipAddress: "",
        startDate: "",
        endDate: "",
    });
    const [activeFilters, setActiveFilters] = useState<AuditLogParams>({});

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const params = normalizeFilters(activeFilters);
            const [paged, summaryData] = await Promise.all([
                adminApi.getAuditLogs({ ...params, page, size: 25 }),
                adminApi.getAuditLogSummary(params),
            ]);
            setLogs(paged.content);
            setTotalPages(paged.totalPages);
            setSummary(summaryData);
            setSelectedLog((current) => {
                if (current) {
                    const matching = paged.content.find((log) => log.id === current.id);
                    if (matching) {
                        return matching;
                    }
                }
                return paged.content[0] || null;
            });
        } catch {
            setNotice(t("loadError"));
        } finally {
            setLoading(false);
        }
    }, [activeFilters, page, t]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (!notice) return undefined;
        const timer = window.setTimeout(() => setNotice(null), 3500);
        return () => window.clearTimeout(timer);
    }, [notice]);

    const appliedFilterCount = useMemo(
        () => Object.values(normalizeFilters(activeFilters)).filter(Boolean).length,
        [activeFilters]
    );

    const exportCsv = useCallback(async () => {
        setExporting(true);
        try {
            const blob = await adminApi.downloadAuditLogsCsv(normalizeFilters(activeFilters));
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
            anchor.click();
            window.URL.revokeObjectURL(url);
        } catch {
            setNotice(t("exportFailed"));
        } finally {
            setExporting(false);
        }
    }, [activeFilters, t]);

    return (
        <div className="space-y-6 text-on-surface">
            <section className="relative overflow-hidden rounded-[32px] border border-emerald-200/60 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_32%),linear-gradient(135deg,_#f8fff9,_#eef6f1_45%,_#f8fafc)] p-6 md:p-8">
                <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-300/20 blur-3xl" />
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl">
                        <p className="text-sm font-bold text-emerald-700/80">{t("eyebrow")}</p>
                        <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-emerald-950 md:text-5xl">{t("title")}</h1>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-950/70 md:text-base">{t("subtitle")}</p>
                        <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-emerald-900/80">
                            <span className="rounded-full bg-white/80 px-3 py-1.5">{t("retention")}</span>
                            <span className="rounded-full bg-white/80 px-3 py-1.5">{t("scope")}</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={exportCsv}
                            disabled={exporting}
                            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-50 disabled:opacity-60"
                        >
                            <span className="material-symbols-outlined text-lg">download</span>
                            {exporting ? t("exporting") : t("exportCsv")}
                        </button>
                    </div>
                </div>
            </section>

            {notice && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {notice}
                </div>
            )}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard eyebrow={t("stats.inScope")} value={summary.totalLogs.toLocaleString()} label={t("stats.inScopeDesc")} tone="border-emerald-200 bg-white text-emerald-950" icon="receipt_long" />
                <StatCard eyebrow={t("stats.security")} value={(summary.warningCount + summary.criticalCount).toLocaleString()} label={t("stats.securityDesc")} tone="border-amber-200 bg-amber-50/70 text-amber-950" icon="shield" />
                <StatCard eyebrow={t("stats.auth")} value={summary.authEventCount.toLocaleString()} label={t("stats.authDesc")} tone="border-sky-200 bg-sky-50/70 text-sky-950" icon="vpn_key" />
                <StatCard eyebrow={t("stats.exports")} value={summary.exportCount.toLocaleString()} label={t("stats.exportsDesc")} tone="border-violet-200 bg-violet-50/70 text-violet-950" icon="database" />
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
                <div className="space-y-6">
                    <div className="rounded-[28px] border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
                        <div className="flex flex-col gap-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <p className="text-lg font-black tracking-tight text-on-surface">{t("filtersTitle")}</p>
                                    <p className="text-sm text-on-surface-variant">{t("filtersSubtitle", { count: appliedFilterCount })}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDraftFilters({
                                                search: "",
                                                actorId: "",
                                                targetUserId: "",
                                                action: "",
                                                severity: "",
                                                status: "",
                                                targetEntity: "",
                                                ipAddress: "",
                                                startDate: "",
                                                endDate: "",
                                            });
                                            setActiveFilters({});
                                            setPage(0);
                                        }}
                                        className="rounded-full border border-outline-variant/20 px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-low"
                                    >
                                        {t("clear")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveFilters({
                                                ...draftFilters,
                                                startDate: toIsoOrUndefined(draftFilters.startDate || ""),
                                                endDate: toIsoOrUndefined(draftFilters.endDate || ""),
                                            });
                                            setPage(0);
                                        }}
                                        className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                                    >
                                        {t("apply")}
                                    </button>
                                </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-on-surface-variant">{t("searchLabel")}</span>
                                    <input value={draftFilters.search || ""} onChange={(e) => setDraftFilters((prev) => ({ ...prev, search: e.target.value }))} placeholder={t("searchPlaceholder")} className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary" />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-on-surface-variant">{t("actorId")}</span>
                                    <input value={draftFilters.actorId || ""} onChange={(e) => setDraftFilters((prev) => ({ ...prev, actorId: e.target.value }))} placeholder={t("actorPlaceholder")} className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary" />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-on-surface-variant">{t("targetUserId")}</span>
                                    <input value={draftFilters.targetUserId || ""} onChange={(e) => setDraftFilters((prev) => ({ ...prev, targetUserId: e.target.value }))} placeholder={t("targetPlaceholder")} className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary" />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-on-surface-variant">{t("actionLabel")}</span>
                                    <select value={draftFilters.action || ""} onChange={(e) => setDraftFilters((prev) => ({ ...prev, action: e.target.value }))} className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary">
                                        <option value="">{t("allActions")}</option>
                                        {ACTION_OPTIONS.map((action) => <option key={action} value={action}>{action}</option>)}
                                    </select>
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-on-surface-variant">{t("severityLabel")}</span>
                                    <select value={draftFilters.severity || ""} onChange={(e) => setDraftFilters((prev) => ({ ...prev, severity: e.target.value }))} className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary">
                                        <option value="">{t("allSeverities")}</option>
                                        {SEVERITY_OPTIONS.map((severity) => <option key={severity} value={severity}>{severity}</option>)}
                                    </select>
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-on-surface-variant">{t("statusLabel")}</span>
                                    <select value={draftFilters.status || ""} onChange={(e) => setDraftFilters((prev) => ({ ...prev, status: e.target.value }))} className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary">
                                        <option value="">{t("allStatus")}</option>
                                        {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                                    </select>
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-on-surface-variant">{t("entityLabel")}</span>
                                    <input value={draftFilters.targetEntity || ""} onChange={(e) => setDraftFilters((prev) => ({ ...prev, targetEntity: e.target.value }))} placeholder={t("entityPlaceholder")} className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary" />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-on-surface-variant">{t("ipLabel")}</span>
                                    <input value={draftFilters.ipAddress || ""} onChange={(e) => setDraftFilters((prev) => ({ ...prev, ipAddress: e.target.value }))} placeholder={t("ipPlaceholder")} className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary" />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-on-surface-variant">{t("startDate")}</span>
                                    <input type="datetime-local" value={formatForInput(draftFilters.startDate)} onChange={(e) => setDraftFilters((prev) => ({ ...prev, startDate: e.target.value }))} className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary" />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-on-surface-variant">{t("endDate")}</span>
                                    <input type="datetime-local" value={formatForInput(draftFilters.endDate)} onChange={(e) => setDraftFilters((prev) => ({ ...prev, endDate: e.target.value }))} className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary" />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-[28px] border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-lg font-black tracking-tight">{t("topActions")}</p>
                                    <p className="text-sm text-on-surface-variant">{t("topActionsDesc")}</p>
                                </div>
                                <span className="material-symbols-outlined text-on-surface-variant">tune</span>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {summary.topActions.length === 0 ? (
                                    <p className="text-sm text-on-surface-variant">{t("noSummaryData")}</p>
                                ) : summary.topActions.map((item) => (
                                    <button
                                        key={item.label}
                                        type="button"
                                        onClick={() => {
                                            setDraftFilters((prev) => ({ ...prev, action: item.label }));
                                            setActiveFilters((prev) => ({ ...prev, action: item.label }));
                                            setPage(0);
                                        }}
                                        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                                    >
                                        {item.label} · {item.count}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-[28px] border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-lg font-black tracking-tight">{t("topEntities")}</p>
                                    <p className="text-sm text-on-surface-variant">{t("topEntitiesDesc")}</p>
                                </div>
                                <span className="material-symbols-outlined text-on-surface-variant">category</span>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {summary.topEntities.length === 0 ? (
                                    <p className="text-sm text-on-surface-variant">{t("noSummaryData")}</p>
                                ) : summary.topEntities.map((item) => (
                                    <button
                                        key={item.label}
                                        type="button"
                                        onClick={() => {
                                            setDraftFilters((prev) => ({ ...prev, targetEntity: item.label }));
                                            setActiveFilters((prev) => ({ ...prev, targetEntity: item.label }));
                                            setPage(0);
                                        }}
                                        className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
                                    >
                                        {item.label} · {item.count}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-[28px] border border-outline-variant/15 bg-surface-container-lowest shadow-sm">
                        <div className="flex items-center justify-between border-b border-outline-variant/10 px-5 py-4">
                            <div>
                                <p className="text-lg font-black tracking-tight">{t("tableTitle")}</p>
                                <p className="text-sm text-on-surface-variant">{t("tableSubtitle", { count: summary.totalLogs })}</p>
                            </div>
                            <div className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface-variant">
                                {t("retentionChip")}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left">
                                <thead className="bg-surface-container-low text-xs font-semibold text-on-surface-variant">
                                    <tr>
                                        <th className="px-5 py-4">{t("colTimestamp")}</th>
                                        <th className="px-5 py-4">{t("colActor")}</th>
                                        <th className="px-5 py-4">{t("colAction")}</th>
                                        <th className="px-5 py-4">{t("colEntity")}</th>
                                        <th className="px-5 py-4">{t("colSeverity")}</th>
                                        <th className="px-5 py-4">{t("colStatus")}</th>
                                        <th className="px-5 py-4">{t("colIp")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant/10">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="px-5 py-16 text-center">
                                                <div className="inline-flex items-center gap-3 text-sm text-on-surface-variant">
                                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                                    {t("loading")}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-5 py-16 text-center text-sm text-on-surface-variant">{t("noLogs")}</td>
                                        </tr>
                                    ) : logs.map((log) => (
                                        <tr key={log.id} onClick={() => setSelectedLog(log)} className={`cursor-pointer transition hover:bg-surface-container-low ${selectedLog?.id === log.id ? "bg-emerald-50/60" : ""}`}>
                                            <td className="px-5 py-4 text-sm text-on-surface-variant">{formatDate(log.createdAt)}</td>
                                            <td className="px-5 py-4 text-sm font-mono text-on-surface">{log.actorId.slice(0, 8)}…</td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-2 rounded-full bg-primary-container/15 px-3 py-1.5 text-xs font-bold text-primary">
                                                    <span className="material-symbols-outlined text-sm">{actionIcon(log.action)}</span>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-on-surface">{log.targetEntity || "—"}</td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${severityClasses(log.severity)}`}>{log.severity}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClasses(log.status)}`}>{log.status}</span>
                                            </td>
                                            <td className="px-5 py-4 text-sm font-mono text-on-surface-variant">{log.ipAddress || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-outline-variant/10 px-5 py-4 text-sm">
                                <button type="button" onClick={() => setPage((prev) => Math.max(0, prev - 1))} disabled={page === 0} className="rounded-full border border-outline-variant/20 px-4 py-2 font-semibold text-on-surface-variant transition hover:bg-surface-container-low disabled:opacity-40">
                                    {t("prev")}
                                </button>
                                <span className="text-on-surface-variant">{t("pageInfo", { page: page + 1, total: totalPages })}</span>
                                <button type="button" onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))} disabled={page >= totalPages - 1} className="rounded-full border border-outline-variant/20 px-4 py-2 font-semibold text-on-surface-variant transition hover:bg-surface-container-low disabled:opacity-40">
                                    {t("next")}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-[28px] border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-lg font-black tracking-tight">{t("alertsTitle")}</p>
                                <p className="text-sm text-on-surface-variant">{t("alertsSubtitle")}</p>
                            </div>
                            <span className="material-symbols-outlined text-rose-500">warning</span>
                        </div>
                        <div className="mt-4 space-y-3">
                            {summary.highlights.length === 0 ? (
                                <p className="rounded-2xl bg-surface-container-low px-4 py-6 text-sm text-on-surface-variant">{t("noHighlights")}</p>
                            ) : summary.highlights.map((item) => (
                                <button key={item.id} type="button" onClick={() => {
                                    const found = logs.find((log) => log.id === item.id);
                                    if (found) setSelectedLog(found);
                                }} className="w-full rounded-2xl border border-outline-variant/15 bg-surface px-4 py-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50/40">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${severityClasses(item.severity)}`}>{item.severity}</span>
                                        <span className="text-xs font-mono text-on-surface-variant">{formatDate(item.createdAt)}</span>
                                    </div>
                                    <p className="mt-3 text-sm font-bold text-on-surface">{item.action}</p>
                                    <p className="mt-1 text-sm leading-6 text-on-surface-variant">{item.details || "—"}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm xl:sticky xl:top-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-lg font-black tracking-tight">{t("detailTitle")}</p>
                                <p className="text-sm text-on-surface-variant">{selectedLog ? t("detailSubtitle") : t("detailEmpty")}</p>
                            </div>
                            {selectedLog && (
                                <button
                                    type="button"
                                    onClick={() => navigator.clipboard?.writeText(selectedLog.id)}
                                    className="rounded-full border border-outline-variant/20 px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:bg-surface-container-low"
                                >
                                    {t("copyId")}
                                </button>
                            )}
                        </div>
                        {selectedLog ? (
                            <div className="mt-5 space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${severityClasses(selectedLog.severity)}`}>{selectedLog.severity}</span>
                                    <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${statusClasses(selectedLog.status)}`}>{selectedLog.status}</span>
                                </div>
                                <div className="rounded-2xl bg-surface-container-low p-4">
                                    <p className="text-sm font-semibold text-on-surface-variant">{t("fieldAction")}</p>
                                    <p className="mt-2 text-lg font-black">{selectedLog.action}</p>
                                    <p className="mt-1 text-sm text-on-surface-variant">{selectedLog.details || selectedLog.description || "—"}</p>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {[
                                        [t("fieldTimestamp"), formatDate(selectedLog.createdAt)],
                                        [t("fieldActor"), selectedLog.actorId],
                                        [t("fieldTargetUser"), selectedLog.targetUserId || "—"],
                                        [t("fieldEntity"), selectedLog.targetEntity || "—"],
                                        [t("fieldEntityId"), selectedLog.targetEntityId || "—"],
                                        [t("fieldIp"), selectedLog.ipAddress || "—"],
                                        [t("fieldUserAgent"), selectedLog.userAgent || "—"],
                                        [t("fieldSession"), selectedLog.sessionId || "—"],
                                        [t("fieldBusiness"), selectedLog.businessId || "—"],
                                    ].map(([label, value]) => (
                                        <div key={label} className="rounded-2xl border border-outline-variant/10 bg-white px-4 py-3">
                                            <p className="text-sm font-semibold text-on-surface-variant">{label}</p>
                                            <p className="mt-2 break-all text-sm text-on-surface">{value}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="rounded-2xl border border-outline-variant/10 bg-white px-4 py-3">
                                    <p className="text-sm font-semibold text-on-surface-variant">{t("fieldNotes")}</p>
                                    <pre className="mt-2 whitespace-pre-wrap break-words font-body text-sm text-on-surface">{selectedLog.details || selectedLog.description || "—"}</pre>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-5 rounded-2xl bg-surface-container-low px-4 py-10 text-center text-sm text-on-surface-variant">
                                {t("detailEmpty")}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
