"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import type {
    ManualReviewPaymentItem,
    AdminDevice,
    SmsReportItem,
    PaymentSummary,
    MfsNumberResponse,
    PaymentSettingsResponse,
} from "@/types/paymentAdmin";
import {
    getManualReviewQueue,
    getFraudFlaggedPayments,
    verifyPaymentIntent,
    rejectPaymentIntent,
    getAllDevices,
    revokeDevice,
    getUnmatchedSmsPool,
    getPaymentSummary,
    getPendingMfsNumbers,
    approveMfsNumber,
    rejectMfsNumber,
    getPaymentSettings,
    updatePaymentSettings,
    createBootstrap,
} from "@/lib/paymentAdminApi";

type InternalTab = "review" | "devices" | "smsPool" | "mfsNumbers" | "settings";

function MfsBadge({ method }: { method: string }) {
    const config: Record<string, { bg: string; text: string; label: string; initial: string }> = {
        BKASH: { bg: "bg-[#E2136E]/10", text: "text-[#E2136E]", label: "bKash", initial: "bK" },
        NAGAD: { bg: "bg-[#F37021]/10", text: "text-[#F37021]", label: "Nagad", initial: "Ng" },
        ROCKET: { bg: "bg-purple-100", text: "text-purple-700", label: "Rocket", initial: "Rk" },
    };
    const c = config[method] || { bg: "bg-gray-100", text: "text-gray-800", label: method, initial: "??" };
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${c.bg} ${c.text}`}>
            <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] font-bold shadow-sm">{c.initial}</span>
            {c.label}
        </span>
    );
}

function MfsIconCircle({ method, size = "md" }: { method: string; size?: "sm" | "md" }) {
    const sizeClass = size === "sm" ? "w-6 h-6 text-[8px]" : "w-8 h-8 text-xs";
    const config: Record<string, { bg: string; text: string; initial: string }> = {
        BKASH: { bg: "bg-[#E2136E]/10", text: "text-[#E2136E]", initial: "bK" },
        NAGAD: { bg: "bg-[#F37021]/10", text: "text-[#F37021]", initial: "Ng" },
        ROCKET: { bg: "bg-purple-100", text: "text-purple-700", initial: "Rk" },
    };
    const c = config[method] || { bg: "bg-gray-100", text: "text-gray-600", initial: "??" };
    return (
        <div className={`${sizeClass} rounded-full ${c.bg} ${c.text} font-bold flex items-center justify-center shrink-0`}>
            {c.initial}
        </div>
    );
}

function DeviceStatusBadge({ status }: { status: string }) {
    const config: Record<string, { dot: string; label: string }> = {
        ACTIVE: { dot: "bg-green-500", label: "Online" },
        SUSPENDED: { dot: "bg-yellow-500", label: "Suspended" },
        REVOKED: { dot: "bg-red-500", label: "Revoked" },
    };
    const c = config[status] || { dot: "bg-gray-400", label: status };
    return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold">
            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
}

function MatchStatusBadge({ status }: { status: string }) {
    const config: Record<string, string> = {
        MATCHED: "bg-green-100 text-green-800",
        UNMATCHED: "bg-yellow-100 text-yellow-800",
        IGNORED: "bg-gray-100 text-gray-600",
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config[status] || "bg-gray-100 text-gray-800"}`}>
            {status}
        </span>
    );
}

function AvatarInitials({ name }: { name: string }) {
    const parts = name.trim().split(/\s+/);
    const initials = parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase();
    return (
        <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm shrink-0">
            {initials}
        </div>
    );
}

export default function PaymentsTab() {
    const t = useTranslations("admin.payments");

    const [activeInternalTab, setActiveInternalTab] = useState<InternalTab>("review");
    const [reviewQueue, setReviewQueue] = useState<ManualReviewPaymentItem[]>([]);
    const [fraudFlags, setFraudFlags] = useState<ManualReviewPaymentItem[]>([]);
    const [devices, setDevices] = useState<AdminDevice[]>([]);
    const [smsPool, setSmsPool] = useState<SmsReportItem[]>([]);
    const [summary, setSummary] = useState<PaymentSummary | null>(null);
    const [mfsNumbers, setMfsNumbers] = useState<MfsNumberResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [verifyModalItem, setVerifyModalItem] = useState<ManualReviewPaymentItem | null>(null);
    const [rejectModalItem, setRejectModalItem] = useState<ManualReviewPaymentItem | null>(null);
    const [revokeModalDevice, setRevokeModalDevice] = useState<AdminDevice | null>(null);
    const [selectedSmsId, setSelectedSmsId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [revokeReason, setRevokeReason] = useState("");

    const [showBootstrapModal, setShowBootstrapModal] = useState(false);
    const [bootstrapQrDataUrl, setBootstrapQrDataUrl] = useState<string | null>(null);
    const [bootstrapDeepLink, setBootstrapDeepLink] = useState<string | null>(null);
    const [bootstrapExpiresAt, setBootstrapExpiresAt] = useState<Date | null>(null);
    const [bootstrapCountdown, setBootstrapCountdown] = useState<string | null>(null);
    const [bootstrapLoading, setBootstrapLoading] = useState(false);
    const bootstrapTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [smsSearch, setSmsSearch] = useState("");
    const [mfsFilter, setMfsFilter] = useState<string>("ALL");

    const [paymentSettings, setPaymentSettings] = useState<PaymentSettingsResponse | null>(null);
    const [settingsForm, setSettingsForm] = useState({ bkash: "", nagad: "", rocket: "" });
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsSaved, setSettingsSaved] = useState(false);

    const [notice, setNotice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [review, fraud, dev, sms, sum, mfs, settings] = await Promise.all([
                getManualReviewQueue(),
                getFraudFlaggedPayments(),
                getAllDevices(),
                getUnmatchedSmsPool(),
                getPaymentSummary(),
                getPendingMfsNumbers(),
                getPaymentSettings(),
            ]);
            setReviewQueue(review);
            setFraudFlags(fraud);
            setDevices(dev);
            setSmsPool(sms);
            setSummary(sum);
            setMfsNumbers(mfs);
            setPaymentSettings(settings);
            setSettingsForm({ bkash: settings.bkash, nagad: settings.nagad, rocket: settings.rocket });
        } catch {
            setError(t("messages.loadFailed"));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => { loadAll(); }, [loadAll]);

    const filteredSmsPool = useMemo(() => {
        let pool = smsPool;
        if (mfsFilter !== "ALL") pool = pool.filter((s) => s.mfsType === mfsFilter);
        if (smsSearch.trim()) {
            const q = smsSearch.toLowerCase();
            pool = pool.filter((s) => s.trxId.toLowerCase().includes(q) || s.senderNumber.toLowerCase().includes(q) || s.receiverNumber.toLowerCase().includes(q) || String(s.amount).includes(q));
        }
        return pool;
    }, [smsPool, mfsFilter, smsSearch]);

    const unmatchedSmsForVerify = useMemo(() => {
        if (!verifyModalItem) return [];
        return smsPool.filter((s) => s.matchStatus === "UNMATCHED" && s.mfsType === verifyModalItem.mfsMethod);
    }, [smsPool, verifyModalItem]);

    async function handleVerify() {
        if (!verifyModalItem || !selectedSmsId) return;
        setActionLoading(true);
        setError(null);
        try {
            await verifyPaymentIntent(verifyModalItem.paymentIntentId, selectedSmsId);
            setNotice(t("messages.verifySuccess"));
            setVerifyModalItem(null);
            setSelectedSmsId(null);
            await loadAll();
        } catch { setError(t("messages.loadFailed")); } finally { setActionLoading(false); }
    }

    async function handleReject() {
        if (!rejectModalItem || !rejectReason.trim()) return;
        setActionLoading(true);
        setError(null);
        try {
            await rejectPaymentIntent(rejectModalItem.paymentIntentId, rejectReason);
            setNotice(t("messages.rejectSuccess"));
            setRejectModalItem(null);
            setRejectReason("");
            await loadAll();
        } catch { setError(t("messages.loadFailed")); } finally { setActionLoading(false); }
    }

    async function handleRevoke() {
        if (!revokeModalDevice) return;
        setActionLoading(true);
        setError(null);
        try {
            await revokeDevice(revokeModalDevice.id, revokeReason || undefined);
            setNotice(t("messages.revokeSuccess"));
            setRevokeModalDevice(null);
            setRevokeReason("");
            await loadAll();
        } catch { setError(t("messages.loadFailed")); } finally { setActionLoading(false); }
    }

    function startBootstrapCountdown(expiresAt: Date) {
        if (bootstrapTimerRef.current) clearInterval(bootstrapTimerRef.current);
        function tick() {
            const diff = new Date(expiresAt).getTime() - Date.now();
            if (diff <= 0) {
                setBootstrapCountdown(t("modal.bootstrapExpired"));
                if (bootstrapTimerRef.current) clearInterval(bootstrapTimerRef.current);
                return;
            }
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setBootstrapCountdown(`${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
        }
        tick();
        bootstrapTimerRef.current = setInterval(tick, 1000);
    }

    function closeBootstrapModal() {
        setShowBootstrapModal(false);
        setBootstrapQrDataUrl(null);
        setBootstrapDeepLink(null);
        setBootstrapExpiresAt(null);
        setBootstrapCountdown(null);
        if (bootstrapTimerRef.current) { clearInterval(bootstrapTimerRef.current); bootstrapTimerRef.current = null; }
    }

    async function handleBootstrapDevice() {
        setBootstrapLoading(true);
        setError(null);
        try {
            const res = await createBootstrap();
            const qrDataUrl = await QRCode.toDataURL(res.deepLinkUrl, { width: 280, margin: 2, color: { dark: "#003727", light: "#FFFFFF" } });
            const expires = new Date(res.expiresAt);
            setBootstrapQrDataUrl(qrDataUrl);
            setBootstrapDeepLink(res.deepLinkUrl);
            setBootstrapExpiresAt(expires);
            setShowBootstrapModal(true);
            startBootstrapCountdown(expires);
        } catch { setError(t("messages.bootstrapFailed")); } finally { setBootstrapLoading(false); }
    }

    useEffect(() => { return () => { if (bootstrapTimerRef.current) clearInterval(bootstrapTimerRef.current); }; }, []);

    const activeDevices = devices.filter((d) => d.status === "ACTIVE").length;
    const pendingVolume = reviewQueue.reduce((s, i) => s + i.amount, 0);
    const highRiskCount = reviewQueue.filter((i) => i.fraudFlag).length;

    const internalTabs: { key: InternalTab; label: string; icon: string }[] = [
        { key: "review", label: t("tabs.review"), icon: "rate_review" },
        { key: "devices", label: t("tabs.devices"), icon: "screenshot_monitor" },
        { key: "smsPool", label: t("tabs.smsPool"), icon: "sms_failed" },
        { key: "mfsNumbers", label: t("tabs.mfsNumbers"), icon: "verified_user" },
        { key: "settings", label: t("tabs.settings"), icon: "tune" },
    ];

    return (
        <div className="space-y-6">
            {notice && (
                <div className="rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700 animate-in fade-in slide-in-from-top-2">
                    {notice}
                </div>
            )}
            {error && (
                <div className="rounded-2xl bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 animate-in fade-in slide-in-from-top-2">
                    {error}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <p className="font-body text-sm text-on-surface-variant">{t("subtitle")}</p>
                <button onClick={loadAll} disabled={loading} className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-on-primary hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm self-start md:self-auto">
                    <span className="material-symbols-outlined text-lg">refresh</span>
                    {t("summary.refresh")}
                </button>
            </div>

            {/* KPI Summary Row — per payment_management_manual/code.html */}
            {summary && (
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-fixed/20 rounded-bl-full -mr-10 -mt-10 blur-2xl" />
                        <div className="text-on-surface-variant font-label text-sm mb-4">{t("summary.autoVerified")}</div>
                        <div className="font-headline text-4xl font-bold text-primary">{Math.round(summary.autoVerifiedRate)}%</div>
                    </div>
                    <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
                        <div className="text-on-surface-variant font-label text-sm mb-4">{t("summary.pendingVolume")}</div>
                        <div className="font-headline text-4xl font-bold text-on-surface">৳ {pendingVolume.toLocaleString()}</div>
                        <div className="text-on-surface-variant text-xs mt-2 font-medium">{t("summary.acrossTransactions", { count: reviewQueue.length })}</div>
                    </div>
                    <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-error rounded-l-2xl" />
                        <div className="text-on-surface-variant font-label text-sm mb-4 pl-2">{t("summary.highRiskFlags")}</div>
                        <div className="font-headline text-4xl font-bold text-error pl-2">{highRiskCount}</div>
                        <div className="text-error text-xs mt-2 pl-2 flex items-center gap-1 font-medium">
                            <span className="material-symbols-outlined text-sm">warning</span> {t("summary.immediateReview")}
                        </div>
                    </div>
                </section>
            )}

            {/* Internal Tab Navigation */}
            <nav className="flex gap-2 overflow-x-auto pb-2">
                {internalTabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveInternalTab(tab.key)}
                        className={`flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${activeInternalTab === tab.key
                            ? "bg-primary-fixed text-on-primary-fixed shadow-sm"
                            : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                            }`}
                    >
                        <span className="material-symbols-outlined text-lg" style={activeInternalTab === tab.key ? { fontVariationSettings: "'FILL' 1" } : undefined}>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </nav>

            {/* Loading */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-surface-container-high border-t-primary" />
                </div>
            ) : (
                <>
                    {/* ═══════════════════════════════════════════════════ */}
                    {/* REVIEW TAB — per payment_management_manual/code.html */}
                    {/* ═══════════════════════════════════════════════════ */}
                    {activeInternalTab === "review" && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Main: Review Queue */}
                            <section className="lg:col-span-8 bg-surface-container-lowest rounded-3xl p-8 shadow-[0_4px_40px_rgb(0,0,0,0.02)]">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="font-headline text-2xl font-bold text-primary">{t("review.title")}</h2>
                                    <div className="flex gap-2">
                                        <button className="px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label text-sm font-semibold">All</button>
                                        <button className="px-4 py-1.5 rounded-full bg-surface-container-high text-on-surface font-label text-sm hover:bg-surface-container-highest transition-colors">High Risk</button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {reviewQueue.length === 0 ? (
                                        <div className="py-12 text-center text-on-surface-variant">{t("messages.noPayments")}</div>
                                    ) : (
                                        reviewQueue.map((item) => (
                                            <div key={item.paymentIntentId} className={`group p-5 rounded-2xl transition-colors duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${item.fraudFlag ? "bg-error-container/30 hover:bg-error-container/50 relative overflow-hidden" : "bg-surface-container-low hover:bg-surface-container"}`}>
                                                {item.fraudFlag && <div className="absolute left-0 top-0 bottom-0 w-1 bg-error" />}
                                                <div className={`flex items-center gap-4 ${item.fraudFlag ? "pl-2" : ""}`}>
                                                    <AvatarInitials name={item.userName} />
                                                    <div>
                                                        <div className="font-headline font-bold text-on-surface flex items-center gap-2">
                                                            {item.userName}
                                                            {item.fraudFlag && (
                                                                <span className="bg-error text-on-error text-[10px] px-2 py-0.5 rounded-full font-label uppercase tracking-widest">{t("review.flagged")}</span>
                                                            )}
                                                        </div>
                                                        <div className="font-body text-xs text-on-surface-variant">{item.userPhone}</div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col sm:items-end gap-1">
                                                    <div className="font-headline font-bold text-lg text-primary">৳ {item.amount.toLocaleString()}</div>
                                                    <div className="font-label text-xs text-on-surface-variant tracking-wider">TRX: {item.submittedTrxId}</div>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                                    <MfsBadge method={item.mfsMethod} />
                                                    <button onClick={() => { setVerifyModalItem(item); setSelectedSmsId(null); setSmsSearch(""); }} className="px-5 py-2 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full font-label text-sm font-semibold hover:shadow-md transition-all">
                                                        {t("actions.verify")}
                                                    </button>
                                                    <button onClick={() => { setRejectModalItem(item); setRejectReason(""); }} className="p-2 text-error hover:bg-error-container rounded-full transition-colors">
                                                        <span className="material-symbols-outlined">block</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {reviewQueue.length > 0 && (
                                    <button className="w-full mt-6 py-4 text-primary font-label font-semibold hover:bg-surface-container-low rounded-xl transition-colors flex items-center justify-center gap-2">
                                        {t("review.loadMore")} <span className="material-symbols-outlined text-sm">expand_more</span>
                                    </button>
                                )}
                            </section>

                            {/* Sidebar: Devices + AI Insight */}
                            <section className="lg:col-span-4 flex flex-col gap-6">
                                {/* Companion Devices */}
                                <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_4px_40px_rgb(0,0,0,0.02)]">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-headline text-lg font-bold text-on-surface">{t("review.devices")}</h3>
                                        <span className="material-symbols-outlined text-on-surface-variant">devices</span>
                                    </div>
                                    <div className="space-y-4">
                                        {devices.length === 0 ? (
                                            <p className="text-sm text-on-surface-variant text-center py-4">{t("messages.noDevices")}</p>
                                        ) : (
                                            devices.slice(0, 4).map((device) => (
                                                <div key={device.id} className="bg-surface-container-low p-4 rounded-xl">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="font-headline font-semibold text-sm">{device.deviceName}</div>
                                                        <DeviceStatusBadge status={device.status} />
                                                    </div>
                                                    <div className="flex justify-between text-xs text-on-surface-variant font-label mt-3">
                                                        <div className={`flex items-center gap-1 ${device.batteryLevel !== null && device.batteryLevel < 20 ? "text-error" : ""}`}>
                                                            <span className="material-symbols-outlined text-[14px]">{device.batteryLevel !== null ? (device.batteryLevel > 50 ? "battery_charging_80" : device.batteryLevel > 20 ? "battery_4_bar" : "battery_alert") : "battery_unknown"}</span>
                                                            {device.batteryLevel !== null ? `${device.batteryLevel}%` : "N/A"}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[14px]">{device.status === "ACTIVE" ? "sync" : "sync_problem"}</span>
                                                            {device.lastReportAt ? `${Math.floor((Date.now() - new Date(device.lastReportAt).getTime()) / 60000)}m ago` : "Never"}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[14px]">category</span>
                                                            {device.appVariant || "—"}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <button onClick={() => setActiveInternalTab("devices")} className="w-full mt-4 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-full font-label text-sm font-medium transition-colors">
                                        {t("review.manageDevices")}
                                    </button>
                                </div>

                                {/* AI Insight Glass Card */}
                                <div className="relative overflow-hidden rounded-3xl p-6 bg-surface-container-lowest/60 backdrop-blur-xl border border-outline-variant/10 shadow-lg">
                                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-secondary-container/30 rounded-full blur-3xl" />
                                    <div className="flex items-center gap-2 mb-4 relative z-10">
                                        <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                        <h3 className="font-headline font-bold text-secondary">{t("review.aiInsight")}</h3>
                                    </div>
                                    <p className="font-body text-sm text-on-surface-variant relative z-10 leading-relaxed">
                                        {t("review.aiInsightDesc")}
                                    </p>
                                    <div className="mt-4 flex gap-2 relative z-10">
                                        <button className="px-4 py-2 bg-secondary text-on-secondary rounded-full font-label text-xs font-semibold">{t("review.applyThreshold")}</button>
                                        <button className="px-4 py-2 bg-surface text-on-surface rounded-full font-label text-xs font-medium">{t("review.dismiss")}</button>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════ */}
                    {/* DEVICES TAB — per device_bootstrap_qr/code.html */}
                    {/* ═══════════════════════════════════════════════════ */}
                    {activeInternalTab === "devices" && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* Main: QR Bootstrap */}
                            <div className="lg:col-span-8 space-y-8">
                                <div className="bg-surface-container-lowest rounded-3xl p-8 md:p-12 relative overflow-hidden group">
                                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-fixed opacity-20 rounded-full blur-[60px] pointer-events-none transition-opacity duration-500 group-hover:opacity-30" />
                                    <div className="flex flex-col md:flex-row gap-12 items-center md:items-start relative z-10">
                                        {/* QR Display */}
                                        <div className="shrink-0 flex flex-col items-center gap-4">
                                            {bootstrapQrDataUrl ? (
                                                <div className="w-64 h-64 bg-white p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-center relative">
                                                    <img src={bootstrapQrDataUrl} alt="Bootstrap QR" className="w-full h-full object-contain" />
                                                    <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                                                    <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                                                    <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                                                    <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                                                </div>
                                            ) : (
                                                <div className="w-64 h-64 bg-white/60 border-2 border-dashed border-outline-variant/40 rounded-3xl flex flex-col items-center justify-center gap-3">
                                                    <span className="material-symbols-outlined text-5xl text-on-surface-variant/40">qr_code_scanner</span>
                                                    <p className="text-xs text-on-surface-variant/60 text-center px-4 font-label">{t("devices.scanHint")}</p>
                                                </div>
                                            )}
                                            {bootstrapCountdown && (
                                                <div className="flex items-center gap-2 text-on-surface-variant font-label text-sm bg-surface-container-low px-4 py-2 rounded-full">
                                                    <span className="material-symbols-outlined text-[16px] text-primary">timer</span>
                                                    <span>Expires in <strong className="text-on-surface">{bootstrapCountdown}</strong></span>
                                                </div>
                                            )}
                                            {/* Generate QR button — directly below QR area */}
                                            <button onClick={handleBootstrapDevice} disabled={bootstrapLoading} className="w-full max-w-[16rem] py-3 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-label font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm">
                                                <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
                                                {bootstrapLoading ? "..." : t("actions.bootstrapDevice")}
                                            </button>
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 w-full space-y-8">
                                            <div>
                                                <h3 className="font-headline text-2xl font-bold text-on-surface mb-2">{t("devices.bootstrapTitle")}</h3>
                                                <p className="font-body text-on-surface-variant leading-relaxed">{t("devices.bootstrapDesc")}</p>
                                            </div>
                                            <div className="bg-surface-container-low rounded-2xl p-6">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h4 className="font-label font-semibold text-sm text-on-surface-variant uppercase tracking-wider">{t("devices.sessionDetails")}</h4>
                                                    <button onClick={() => { if (bootstrapDeepLink) { navigator.clipboard.writeText(bootstrapDeepLink); setNotice(t("modal.bootstrapCopied")); } }} className="text-primary hover:text-primary-container p-1 rounded-lg hover:bg-surface-container-highest transition-colors">
                                                        <span className="material-symbols-outlined text-[20px]">content_copy</span>
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-y-6">
                                                    <div>
                                                        <p className="font-label text-xs text-on-surface-variant mb-1">{t("devices.nodeId")}</p>
                                                        <p className="font-headline text-lg font-bold text-on-surface">{devices.find(d => d.nodeId)?.nodeId || "—"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-label text-xs text-on-surface-variant mb-1">{t("devices.environment")}</p>
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary-fixed-dim/20 text-on-primary-fixed-variant font-label text-xs font-semibold">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${process.env.NODE_ENV === "production" ? "bg-primary" : "bg-tertiary"}`} />
                                                            {process.env.NODE_ENV === "production" ? "Production" : "Development"}
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <p className="font-label text-xs text-on-surface-variant mb-1">{t("devices.bootstrapToken")}</p>
                                                        <p className="font-body text-sm font-mono text-on-surface bg-surface-container-highest px-3 py-2 rounded-lg truncate">{bootstrapDeepLink || "—"}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* How to Link Steps */}
                                <div className="bg-surface-container-low rounded-3xl p-8">
                                    <h3 className="font-headline text-xl font-bold text-on-surface mb-6">{t("devices.howToLink")}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[
                                            { step: "1", title: t("devices.step1Title"), desc: t("devices.step1Desc") },
                                            { step: "2", title: t("devices.step2Title"), desc: t("devices.step2Desc") },
                                            { step: "3", title: t("devices.step3Title"), desc: t("devices.step3Desc"), highlight: true },
                                        ].map((s) => (
                                            <div key={s.step} className={`bg-surface-container-lowest p-6 rounded-2xl relative overflow-hidden ${s.highlight ? "" : ""}`}>
                                                {s.highlight && <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed/10 to-transparent pointer-events-none" />}
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 font-headline font-bold text-lg relative z-10 ${s.highlight ? "bg-primary text-on-primary" : "bg-surface-container-high text-primary"}`}>{s.step}</div>
                                                <h4 className={`font-headline font-semibold text-on-surface mb-2 relative z-10`}>{s.title}</h4>
                                                <p className="font-body text-sm text-on-surface-variant relative z-10">{s.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar: Device List */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-primary text-on-primary rounded-3xl p-8 relative overflow-hidden">
                                    <div className="absolute -bottom-10 -right-10 text-primary-container opacity-50 pointer-events-none">
                                        <span className="material-symbols-outlined text-[120px]">devices</span>
                                    </div>
                                    <div className="relative z-10">
                                        <p className="font-label text-sm text-primary-fixed-dim uppercase tracking-wider mb-2">{t("devices.activeFleet")}</p>
                                        <h3 className="font-headline text-5xl font-extrabold mb-1">{activeDevices}</h3>
                                        <p className="font-body text-sm text-outline-variant">{t("devices.connectedNodes")}</p>
                                    </div>
                                </div>

                                <div className="bg-surface-container-lowest rounded-3xl p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-headline font-bold text-lg text-on-surface">{t("devices.recentDevices")}</h3>
                                        <button onClick={loadAll} className="font-label text-sm font-semibold text-primary hover:text-primary-container">{t("devices.refresh")}</button>
                                    </div>
                                    <div className="space-y-4">
                                        {devices.length === 0 ? (
                                            <p className="text-sm text-on-surface-variant text-center py-4">{t("messages.noDevices")}</p>
                                        ) : (
                                            devices.slice(0, 5).map((device) => (
                                                <div key={device.id} className={`flex items-center gap-4 p-3 rounded-2xl hover:bg-surface-container-low transition-colors group ${device.status !== "ACTIVE" ? "opacity-70" : ""}`}>
                                                    <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                                                        <span className="material-symbols-outlined">{device.status === "ACTIVE" ? "smartphone" : "phonelink_erase"}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-headline font-semibold text-sm text-on-surface truncate">{device.deviceName}</h4>
                                                        <p className="font-body text-xs text-on-surface-variant truncate">{device.userName}</p>
                                                    </div>
                                                    {device.status === "ACTIVE" ? (
                                                        <button
                                                            onClick={() => { setRevokeModalDevice(device); setRevokeReason(""); }}
                                                            className="p-2 rounded-full text-on-surface-variant hover:bg-error-container hover:text-error transition-colors"
                                                            title={t("actions.revoke")}
                                                        >
                                                            <span className="material-symbols-outlined text-lg">phonelink_erase</span>
                                                        </button>
                                                    ) : (
                                                        <div className="w-2 h-2 rounded-full bg-error" />
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════ */}
                    {/* SMS POOL TAB */}
                    {/* ═══════════════════════════════════════════════════ */}
                    {activeInternalTab === "smsPool" && (
                        <div className="space-y-6">
                            <div className="bg-surface-container-lowest p-2 rounded-2xl flex items-center gap-2 shadow-sm">
                                <div className="flex-1 relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-4 text-outline">search</span>
                                    <input type="text" value={smsSearch} onChange={(e) => setSmsSearch(e.target.value)} placeholder={t("smsPool.searchPlaceholder")} className="w-full bg-transparent border-none py-3 pl-12 pr-4 text-on-surface font-medium focus:ring-0 placeholder:text-on-surface-variant outline-none" />
                                </div>
                                <div className="h-8 w-px bg-surface-container" />
                                <select value={mfsFilter} onChange={(e) => setMfsFilter(e.target.value)} className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors bg-transparent border-none outline-none cursor-pointer">
                                    <option value="ALL">{t("smsPool.allMfs")}</option>
                                    <option value="BKASH">bKash</option>
                                    <option value="NAGAD">Nagad</option>
                                    <option value="ROCKET">Rocket</option>
                                </select>
                            </div>

                            <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left">
                                        <thead className="bg-surface-container-low text-sm font-bold text-on-surface-variant">
                                            <tr>
                                                <th className="px-6 py-4">{t("table.trxId")}</th>
                                                <th className="px-6 py-4">{t("table.amount")}</th>
                                                <th className="px-6 py-4">{t("table.mfsMethod")}</th>
                                                <th className="px-6 py-4">{t("table.sender")}</th>
                                                <th className="px-6 py-4">{t("table.receiver")}</th>
                                                <th className="px-6 py-4">{t("table.receivedAt")}</th>
                                                <th className="px-6 py-4">{t("table.matchStatus")}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-surface-container">
                                            {filteredSmsPool.length === 0 ? (
                                                <tr><td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant">{t("messages.noSms")}</td></tr>
                                            ) : (
                                                filteredSmsPool.map((sms) => (
                                                    <tr key={sms.id} className="hover:bg-surface-container-low transition-colors">
                                                        <td className="px-6 py-4 text-sm font-mono text-on-surface">{sms.trxId}</td>
                                                        <td className="px-6 py-4 text-sm font-medium text-on-surface">৳ {sms.amount.toLocaleString()}</td>
                                                        <td className="px-6 py-4"><MfsBadge method={sms.mfsType} /></td>
                                                        <td className="px-6 py-4 text-sm text-on-surface-variant">{sms.senderNumber}</td>
                                                        <td className="px-6 py-4 text-sm text-on-surface-variant">{sms.receiverNumber}</td>
                                                        <td className="px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap">{new Date(sms.smsReceivedAt).toLocaleString()}</td>
                                                        <td className="px-6 py-4"><MatchStatusBadge status={sms.matchStatus} /></td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════ */}
                    {/* MFS APPROVAL TAB — per mfs_approval_management/code.html */}
                    {/* ═══════════════════════════════════════════════════ */}
                    {activeInternalTab === "mfsNumbers" && (
                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            <div className="flex-1 w-full space-y-6">
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <h3 className="font-headline font-bold text-lg text-primary tracking-tight">{t("mfsNumbers.pendingTitle")}</h3>
                                        <p className="text-xs font-body text-on-surface-variant font-medium mt-1">{t("mfsNumbers.v1Subtitle")}</p>
                                        <p className="text-sm text-on-surface-variant font-body mt-0.5">{t("mfsNumbers.reviewingCount", { count: mfsNumbers.length })}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="relative hidden sm:flex items-center">
                                            <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-sm">search</span>
                                            <input className="bg-surface-container rounded-full py-2 pl-9 pr-4 text-sm font-body focus:outline-none focus:ring-0 border-none w-56 placeholder:text-on-surface-variant" placeholder={t("mfsNumbers.searchPlaceholder")} type="text" />
                                        </div>
                                        <button className="px-4 py-2 rounded-full bg-surface-container-high text-sm font-semibold text-on-surface flex items-center gap-2 hover:bg-surface-container-highest transition-colors">
                                            <span className="material-symbols-outlined text-sm">filter_list</span>
                                            {t("mfsNumbers.filter")}
                                        </button>
                                    </div>
                                </div>

                                {mfsNumbers.length === 0 ? (
                                    <div className="rounded-2xl bg-surface-container-lowest p-12 text-center text-on-surface-variant">{t("mfsNumbers.noPending")}</div>
                                ) : (
                                    mfsNumbers.map((mfs) => {
                                        const isMismatch = mfs.userPhone && mfs.mfsNumber && mfs.userPhone !== mfs.mfsNumber;
                                        return (
                                            <div key={mfs.id} className="bg-surface-container-lowest rounded-xl p-6 transition-all hover:bg-surface relative overflow-hidden group">
                                                <div className={`absolute top-0 left-0 w-1 h-full ${isMismatch ? "bg-orange-200" : "bg-secondary-container"}`} />
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0">
                                                            <span className="material-symbols-outlined">storefront</span>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-headline font-bold text-on-surface text-base">{mfs.userName || "Unknown"}</h4>
                                                            <p className="text-sm text-on-surface-variant font-body flex items-center gap-1 mt-0.5">
                                                                <span className="material-symbols-outlined text-[16px]">call</span>
                                                                {mfs.userPhone || "—"}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-xs font-semibold text-on-surface flex items-center gap-1">
                                                                    <span className="w-2 h-2 rounded-full bg-green-500" /> {t("mfsNumbers.active")}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-surface p-4 rounded-lg flex-1 sm:max-w-xs border border-surface-container-highest/30">
                                                        <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider mb-2">{t("mfsNumbers.submittedNumber")}</p>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <MfsIconCircle method={mfs.mfsType} />
                                                                <div>
                                                                    <p className="font-headline font-extrabold text-primary text-lg tracking-tight">{mfs.mfsNumber}</p>
                                                                    <p className={`text-xs font-medium flex items-center gap-1 ${isMismatch ? "text-orange-600" : "text-on-surface-variant"}`}>
                                                                        <span className="material-symbols-outlined text-[14px]">{isMismatch ? "warning" : "sim_card"}</span>
                                                                        {isMismatch ? t("mfsNumbers.mismatch") : `SIM ${mfs.simSlot !== null ? mfs.simSlot + 1 : "?"}`}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex sm:flex-col gap-2 shrink-0">
                                                        <button onClick={async () => { setActionLoading(true); try { await approveMfsNumber(mfs.id); setNotice(t("mfsNumbers.approved")); loadAll(); } catch { setError(t("messages.actionFailed")); } finally { setActionLoading(false); } }} disabled={actionLoading} className="flex-1 sm:flex-none px-6 py-2.5 rounded-full bg-primary text-on-primary font-semibold text-sm hover:bg-primary-container transition-colors flex items-center justify-center gap-2">
                                                            <span className="material-symbols-outlined text-sm">check_circle</span>
                                                            {t("mfsNumbers.approve")}
                                                        </button>
                                                        <button onClick={async () => { const reason = prompt(t("mfsNumbers.rejectReasonPrompt")); if (reason === null) return; setActionLoading(true); try { await rejectMfsNumber(mfs.id, reason || undefined); setNotice(t("mfsNumbers.rejected")); loadAll(); } catch { setError(t("messages.actionFailed")); } finally { setActionLoading(false); } }} disabled={actionLoading} className="flex-1 sm:flex-none px-6 py-2.5 rounded-full bg-error-container text-on-error-container font-semibold text-sm hover:bg-red-200 transition-colors flex items-center justify-center gap-2">
                                                            <span className="material-symbols-outlined text-sm">cancel</span>
                                                            {t("mfsNumbers.reject")}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Policy Sidebar */}
                            <aside className="w-full lg:w-80 shrink-0">
                                <div className="bg-surface-container-lowest/70 backdrop-blur-xl rounded-xl p-6 relative overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-fixed rounded-full blur-3xl opacity-30" />
                                    <div className="flex items-center gap-3 mb-6 relative z-10">
                                        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary shrink-0">
                                            <span className="material-symbols-outlined">policy</span>
                                        </div>
                                        <h3 className="font-headline font-bold text-primary text-lg">{t("mfsNumbers.policyTitle")}</h3>
                                    </div>
                                    <div className="space-y-4 relative z-10">
                                        <div className="bg-surface/50 rounded-lg p-4 border border-surface-container-highest/50">
                                            <h4 className="font-semibold text-sm text-on-surface mb-1">{t("mfsNumbers.policy1Title")}</h4>
                                            <p className="text-xs text-on-surface-variant font-body leading-relaxed">{t("mfsNumbers.policy1Desc")}</p>
                                        </div>
                                        <div className="bg-surface/50 rounded-lg p-4 border border-surface-container-highest/50">
                                            <h4 className="font-semibold text-sm text-on-surface mb-1">{t("mfsNumbers.policy2Title")}</h4>
                                            <p className="text-xs text-on-surface-variant font-body leading-relaxed">{t("mfsNumbers.policy2Desc")}</p>
                                        </div>
                                    </div>
                                    <div className="mt-6 pt-6 border-t border-surface-container-highest/50 relative z-10">
                                        <p className="text-xs text-on-surface-variant flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px] text-primary">info</span>
                                            {t("mfsNumbers.escalationNote")}
                                        </p>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════ */}
                    {/* SETTINGS TAB */}
                    {/* ═══════════════════════════════════════════════════ */}
                    {activeInternalTab === "settings" && (
                        <section className="space-y-6">
                            <div className="bg-surface-container-lowest rounded-3xl p-8">
                                <h3 className="font-headline text-xl font-bold text-on-surface mb-2">{t("settings.title")}</h3>
                                <p className="font-body text-sm text-on-surface-variant mb-6">{t("settings.subtitle")}</p>
                                {settingsSaved && <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{t("settings.saved")}</div>}
                                <div className="space-y-4">
                                    {(["bkash", "nagad", "rocket"] as const).map((key) => {
                                        const icons: Record<string, { bg: string; text: string; initial: string }> = { bkash: { bg: "bg-[#E2136E]/10", text: "text-[#E2136E]", initial: "bK" }, nagad: { bg: "bg-[#F37021]/10", text: "text-[#F37021]", initial: "Ng" }, rocket: { bg: "bg-purple-100", text: "text-purple-700", initial: "Rk" } };
                                        const ic = icons[key];
                                        const val = settingsForm[key];
                                        const isInvalid = val.length > 0 && !/^01[3-9]\d{8}$/.test(val);
                                        return (
                                            <div key={key} className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                                                    <span className={`text-sm font-bold ${ic.text}`}>{ic.initial}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-sm font-semibold text-on-surface capitalize">{key} {t("settings.receiverNumber")}</label>
                                                    <input type="tel" value={val} onChange={(e) => { setSettingsForm({ ...settingsForm, [key]: e.target.value }); setSettingsSaved(false); }} placeholder="01XXXXXXXXX" maxLength={11} className={`mt-1 w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-1 outline-none border-none ${isInvalid ? "ring-1 ring-error focus:ring-error" : "focus:ring-primary"}`} />
                                                    {isInvalid && <p className="text-xs text-error mt-1">Must be 11 digits starting with 01 (e.g., 017XXXXXXXX)</p>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button type="button" onClick={async () => { const invalidKeys = (["bkash", "nagad", "rocket"] as const).filter(k => settingsForm[k].length > 0 && !/^01[3-9]\d{8}$/.test(settingsForm[k])); if (invalidKeys.length > 0) { setError(`Invalid number(s): ${invalidKeys.join(", ")}. Must be 11 digits starting with 01.`); return; } setSettingsLoading(true); setSettingsSaved(false); setError(null); try { const updated = await updatePaymentSettings(settingsForm); setPaymentSettings(updated); setSettingsSaved(true); setNotice(t("settings.saved")); } catch (err) { setError(err instanceof Error ? err.message : t("settings.saveFailed")); } finally { setSettingsLoading(false); } }} disabled={settingsLoading} className="mt-6 rounded-full bg-gradient-to-r from-primary to-primary-container px-8 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
                                    {settingsLoading ? t("settings.saving") : t("settings.save")}
                                </button>
                            </div>
                        </section>
                    )}
                </>
            )}

            {/* ═══════════════════════════════════════════════════ */}
            {/* VERIFY MODAL — per manual_review_detail/code.html */}
            {/* ═══════════════════════════════════════════════════ */}
            {verifyModalItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-surface-container-lowest p-6 md:p-8 shadow-xl">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[14px]">flag</span>
                                        {verifyModalItem.fraudFlag ? t("review.flagged") : t("modal.verifyTitle")}
                                    </span>
                                </div>
                                <h2 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">Payment Detail</h2>
                            </div>
                            <button onClick={() => { setVerifyModalItem(null); setSelectedSmsId(null); }} className="p-2 rounded-full hover:bg-surface-container-low transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                            {/* Left: Payment Info */}
                            <div className="xl:col-span-5 flex flex-col gap-6">
                                <div className="bg-surface-container-lowest rounded-3xl p-8 relative overflow-hidden">
                                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-error-container rounded-full blur-3xl opacity-50" />
                                    <div className="flex flex-col gap-6 relative z-10">
                                        <div>
                                            <p className="text-sm font-medium text-outline mb-1">{t("table.trxId")}</p>
                                            <div className="font-headline text-2xl md:text-3xl font-bold text-on-surface flex items-center gap-3">
                                                {verifyModalItem.submittedTrxId}
                                                <button onClick={() => { navigator.clipboard.writeText(verifyModalItem.submittedTrxId); setNotice(t("modal.copied")); }} className="text-secondary hover:bg-surface-container p-1 rounded-md transition-colors" title="Copy">
                                                    <span className="material-symbols-outlined text-[20px]">content_copy</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-headline text-4xl md:text-5xl font-black tracking-tighter bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">৳ {verifyModalItem.amount.toLocaleString()}</span>
                                            <span className="text-outline font-medium">.00</span>
                                        </div>
                                        <div className="bg-surface-container-low rounded-2xl p-5 flex flex-col gap-4">
                                            <div className="flex justify-between items-center"><span className="text-sm font-medium text-outline">{t("modal.reportedSource")}</span><span className="text-sm font-bold text-on-surface">{verifyModalItem.mfsMethod === "BKASH" ? "bKash Personal" : verifyModalItem.mfsMethod === "NAGAD" ? "Nagad" : "Rocket"}</span></div>
                                            <div className="flex justify-between items-center"><span className="text-sm font-medium text-outline">{t("table.submittedAt")}</span><span className="text-sm font-semibold text-on-surface">{new Date(verifyModalItem.submittedAt).toLocaleString()}</span></div>
                                            <div className="flex justify-between items-center"><span className="text-sm font-medium text-outline">{t("modal.systemMatch")}</span><span className="text-sm font-bold text-error flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">close</span>{t("modal.matchFailed")}</span></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payer Profile — per manual_review_detail/code.html */}
                                <div className="bg-surface-container-low rounded-3xl p-8">
                                    <h3 className="font-headline text-xl font-bold mb-6 text-on-surface">{t("modal.payerProfile")}</h3>
                                    <div className="flex items-center gap-5 mb-6">
                                        <AvatarInitials name={verifyModalItem.userName} />
                                        <div>
                                            <h4 className="font-bold text-lg text-on-surface">{verifyModalItem.userName}</h4>
                                            <p className="text-sm text-outline font-medium">UID: {verifyModalItem.userId.slice(0, 8).toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-surface-container-lowest p-4 rounded-xl">
                                            <span className="text-xs font-medium text-outline block mb-1">{t("modal.trustScore")}</span>
                                            <span className="font-bold text-primary flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[16px]">verified</span>
                                                {t("modal.trustHigh")}
                                            </span>
                                        </div>
                                        <div className="bg-surface-container-lowest p-4 rounded-xl">
                                            <span className="text-xs font-medium text-outline block mb-1">{t("modal.totalOrders")}</span>
                                            <span className="font-bold text-on-surface">{verifyModalItem.failedAttempts > 0 ? `${verifyModalItem.failedAttempts} failed` : "—"}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Resolution Actions — per manual_review_detail/code.html */}
                                <div className="bg-surface-container-lowest rounded-3xl p-8 ambient-shadow mt-auto">
                                    <h3 className="font-headline text-lg font-bold mb-4 text-on-surface">{t("modal.resolution")}</h3>
                                    <p className="text-sm text-outline mb-6">{t("modal.selectSms")}</p>
                                    <div className="flex flex-col gap-3">
                                        <button onClick={handleVerify} disabled={actionLoading || !selectedSmsId} className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-3.5 rounded-full font-bold shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity flex justify-center items-center gap-2 disabled:opacity-50">
                                            <span className="material-symbols-outlined">check_circle</span>
                                            {t("modal.confirmVerify")}
                                        </button>
                                        <button onClick={() => { setRejectModalItem(verifyModalItem); setRejectReason(""); setVerifyModalItem(null); setSelectedSmsId(null); }} className="w-full bg-error-container text-on-error-container py-3.5 rounded-full font-bold hover:bg-tertiary-fixed transition-colors flex justify-center items-center gap-2">
                                            <span className="material-symbols-outlined">block</span>
                                            {t("modal.confirmReject")}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right: SMS Pool Alignment */}
                            <div className="xl:col-span-7 flex flex-col gap-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <h3 className="font-headline text-2xl font-extrabold text-on-surface">{t("modal.smsPoolAlignment")}</h3>
                                        <p className="text-sm text-outline mt-1 font-medium">{t("modal.findReceipt")}</p>
                                    </div>
                                    {unmatchedSmsForVerify.length > 0 && (
                                        <div className="bg-surface-container-lowest/70 backdrop-blur-xl px-4 py-2 rounded-full border border-primary-fixed flex items-center gap-2 shadow-sm">
                                            <span className="material-symbols-outlined text-primary text-[18px]">auto_awesome</span>
                                            <span className="text-sm font-bold text-primary">{unmatchedSmsForVerify.length} {t("modal.probMatch")}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-surface-container-lowest p-2 rounded-2xl flex items-center gap-2 shadow-sm">
                                    <div className="flex-1 relative flex items-center">
                                        <span className="material-symbols-outlined absolute left-4 text-outline">search</span>
                                        <input type="text" value={smsSearch} onChange={(e) => setSmsSearch(e.target.value)} placeholder={t("modal.searchSms")} className="w-full bg-transparent border-none py-3 pl-12 pr-4 text-on-surface font-medium focus:ring-0 placeholder:text-on-surface-variant outline-none" />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto">
                                    {unmatchedSmsForVerify.length === 0 ? (
                                        <p className="py-8 text-center text-sm text-on-surface-variant">{t("modal.noSmsFound")}</p>
                                    ) : (
                                        unmatchedSmsForVerify.map((sms) => (
                                            <button key={sms.id} type="button" onClick={() => setSelectedSmsId(sms.id)} className={`rounded-3xl p-6 cursor-pointer transition-all text-left ${selectedSmsId === sms.id ? "bg-primary-fixed" : "bg-surface-container-lowest hover:bg-surface-container-low border border-transparent"}`}>
                                                {selectedSmsId === sms.id && <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white/20 to-transparent" />}
                                                <div className="flex justify-between items-start mb-4 relative z-10">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedSmsId === sms.id ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>
                                                            <span className="material-symbols-outlined text-[20px]">sms</span>
                                                        </div>
                                                        <div>
                                                            {selectedSmsId === sms.id && <span className="bg-white/30 text-on-primary-fixed px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 inline-block">{t("modal.aiRecommended")}</span>}
                                                            <h4 className={`font-bold ${selectedSmsId === sms.id ? "text-on-primary-fixed" : "text-on-surface"}`}>{sms.mfsType === "BKASH" ? "bKash" : sms.mfsType === "NAGAD" ? "Nagad" : "Rocket"}</h4>
                                                        </div>
                                                    </div>
                                                    <span className={`text-sm font-semibold ${selectedSmsId === sms.id ? "text-on-primary-fixed opacity-80" : "text-outline"}`}>{new Date(sms.smsReceivedAt).toLocaleString()}</span>
                                                </div>
                                                <div className={`font-medium text-sm leading-relaxed mb-4 relative z-10 ${selectedSmsId === sms.id ? "text-on-primary-fixed opacity-90" : "text-on-surface-variant"}`}>
                                                    {t("modal.smsPreview", { amount: sms.amount, sender: sms.senderNumber, trxId: sms.trxId })}
                                                </div>
                                                <div className="flex justify-between items-end relative z-10">
                                                    <div className="flex gap-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-bold text-on-surface-variant opacity-70 uppercase tracking-wider">Amount</span>
                                                            <span className={`font-headline font-bold text-lg ${selectedSmsId === sms.id ? "text-on-primary-fixed" : "text-on-surface"}`}>৳ {sms.amount.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-bold text-on-surface-variant opacity-70 uppercase tracking-wider">TrxID</span>
                                                            <span className={`font-headline font-bold text-lg ${selectedSmsId === sms.id ? "text-on-primary-fixed" : "text-on-surface"}`}>{sms.trxId}</span>
                                                        </div>
                                                    </div>
                                                    {selectedSmsId === sms.id && (
                                                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-on-primary text-[14px]">check</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════ */}
            {/* REJECT MODAL */}
            {/* ═══════════════════════════════════════════════════ */}
            {rejectModalItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-surface-container-lowest p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-on-surface">{t("modal.rejectTitle")}</h3>
                        <div className="mt-4 space-y-3 rounded-xl bg-surface-container-low p-4">
                            <p className="text-xs font-semibold text-on-surface-variant uppercase">{t("modal.paymentDetails")}</p>
                            <div className="flex justify-between"><span className="text-sm text-on-surface-variant">{t("table.userName")}</span><span className="text-sm font-medium text-on-surface">{rejectModalItem.userName}</span></div>
                            <div className="flex justify-between"><span className="text-sm text-on-surface-variant">{t("table.amount")}</span><span className="text-sm font-medium text-on-surface">৳ {rejectModalItem.amount.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-sm text-on-surface-variant">{t("table.trxId")}</span><span className="text-sm font-mono text-on-surface">{rejectModalItem.submittedTrxId}</span></div>
                        </div>
                        <div className="mt-5">
                            <label className="block"><span className="text-sm font-medium text-on-surface-variant">{t("modal.rejectionReason")}</span>
                                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder={t("modal.reasonPlaceholder")} className="mt-1 w-full rounded-xl bg-surface-container-low p-3 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none resize-none" />
                            </label>
                        </div>
                        <div className="mt-6 flex gap-3 justify-end">
                            <button onClick={() => { setRejectModalItem(null); setRejectReason(""); }} className="rounded-xl px-5 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors">{t("actions.cancel")}</button>
                            <button onClick={handleReject} disabled={actionLoading || !rejectReason.trim()} className="rounded-xl bg-error-container text-on-error-container px-5 py-2.5 text-sm font-bold hover:bg-red-200 disabled:opacity-50 transition-colors">{actionLoading ? "..." : t("modal.confirmReject")}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════ */}
            {/* REVOKE MODAL */}
            {/* ═══════════════════════════════════════════════════ */}
            {revokeModalDevice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-surface-container-lowest p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-on-surface">{t("modal.revokeTitle")}</h3>
                        <div className="mt-4 space-y-3 rounded-xl bg-surface-container-low p-4">
                            <div className="flex justify-between"><span className="text-sm text-on-surface-variant">{t("table.deviceName")}</span><span className="text-sm font-medium text-on-surface">{revokeModalDevice.deviceName}</span></div>
                            <div className="flex justify-between"><span className="text-sm text-on-surface-variant">{t("table.user")}</span><span className="text-sm font-medium text-on-surface">{revokeModalDevice.userName}</span></div>
                            <div className="flex justify-between"><span className="text-sm text-on-surface-variant">{t("table.status")}</span><DeviceStatusBadge status={revokeModalDevice.status} /></div>
                        </div>
                        <div className="mt-5"><label className="block"><span className="text-sm font-medium text-on-surface-variant">{t("modal.revokeReason")}</span><textarea value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)} rows={2} placeholder={t("modal.reasonPlaceholder")} className="mt-1 w-full rounded-xl bg-surface-container-low p-3 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none resize-none" /></label></div>
                        <div className="mt-6 flex gap-3 justify-end">
                            <button onClick={() => { setRevokeModalDevice(null); setRevokeReason(""); }} className="rounded-xl px-5 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors">{t("actions.cancel")}</button>
                            <button onClick={handleRevoke} disabled={actionLoading} className="rounded-xl bg-error-container text-on-error-container px-5 py-2.5 text-sm font-bold hover:bg-red-200 disabled:opacity-50 transition-colors">{actionLoading ? "..." : t("modal.confirmRevoke")}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════ */}
            {/* BOOTSTRAP QR MODAL — per device_bootstrap_qr/code.html */}
            {/* ═══════════════════════════════════════════════════ */}
            {showBootstrapModal && bootstrapQrDataUrl && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-surface-container-lowest p-6 md:p-10 shadow-2xl ring-1 ring-outline-variant/10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="font-label text-sm text-primary font-semibold tracking-wider uppercase mb-2">{t("devices.bootstrapTitle")}</p>
                                <h2 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight leading-tight">Bootstrap Node</h2>
                            </div>
                            <button onClick={closeBootstrapModal} className="p-2 rounded-full hover:bg-surface-container-low transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex flex-col gap-8">
                            <div className="bg-surface-container-low rounded-3xl p-6 md:p-10 relative overflow-hidden">
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-fixed opacity-20 rounded-full blur-[60px] pointer-events-none" />
                                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
                                    <div className="shrink-0 flex flex-col items-center gap-4">
                                        <div className="w-48 h-48 md:w-56 md:h-56 bg-white p-3 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-center relative">
                                            <img src={bootstrapQrDataUrl} alt="Bootstrap QR" className="w-full h-full object-contain" />
                                            <div className="absolute top-3 left-3 w-5 h-5 border-t-3 border-l-3 border-primary rounded-tl-lg" />
                                            <div className="absolute top-3 right-3 w-5 h-5 border-t-3 border-r-3 border-primary rounded-tr-lg" />
                                            <div className="absolute bottom-3 left-3 w-5 h-5 border-b-3 border-l-3 border-primary rounded-bl-lg" />
                                            <div className="absolute bottom-3 right-3 w-5 h-5 border-b-3 border-r-3 border-primary rounded-br-lg" />
                                        </div>
                                        {bootstrapCountdown && (
                                            <div className="flex items-center gap-2 text-on-surface-variant font-label text-sm bg-surface-container-highest px-4 py-2 rounded-full">
                                                <span className="material-symbols-outlined text-[16px] text-primary">timer</span>
                                                <span>Expires in <strong className="text-on-surface">{bootstrapCountdown}</strong></span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 w-full space-y-6">
                                        <div>
                                            <h3 className="font-headline text-xl md:text-2xl font-bold text-on-surface mb-2">{t("devices.scanWithApp")}</h3>
                                            <p className="font-body text-on-surface-variant leading-relaxed">{t("devices.bootstrapDesc")}</p>
                                        </div>
                                        <div className="bg-surface-container-lowest rounded-2xl p-5 ring-1 ring-outline-variant/10">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-label font-semibold text-sm text-on-surface-variant uppercase tracking-wider">{t("devices.sessionDetails")}</h4>
                                                {bootstrapDeepLink && (
                                                    <button onClick={() => { navigator.clipboard.writeText(bootstrapDeepLink); setNotice(t("modal.bootstrapCopied")); }} className="text-primary hover:text-primary-container p-1 rounded-lg hover:bg-surface-container-highest transition-colors">
                                                        <span className="material-symbols-outlined text-[20px]">content_copy</span>
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 gap-y-5">
                                                <div>
                                                    <p className="font-label text-xs text-on-surface-variant mb-1">{t("devices.environment")}</p>
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary-fixed-dim/20 text-on-primary-fixed-variant font-label text-xs font-semibold">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                        Production
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-label text-xs text-on-surface-variant mb-1">{t("modal.bootstrapDeepLink")}</p>
                                                    <p className="font-body text-sm font-mono text-on-surface bg-surface-container-highest px-3 py-2 rounded-lg truncate">{bootstrapDeepLink}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
