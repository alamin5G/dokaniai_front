"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
    ManualReviewPaymentItem,
    AdminDevice,
    SmsReportItem,
    PaymentSummary,
    MfsNumberResponse,
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
} from "@/lib/paymentAdminApi";

// ─── Internal Tab Type ────────────────────────────────────

type InternalTab = "review" | "fraud" | "devices" | "smsPool" | "mfsNumbers";

// ─── MFS Badge ────────────────────────────────────────────

function MfsBadge({ method }: { method: string }) {
    const colors: Record<string, string> = {
        BKASH: "bg-pink-100 text-pink-800",
        NAGAD: "bg-orange-100 text-orange-800",
        ROCKET: "bg-purple-100 text-purple-800",
    };
    const labels: Record<string, string> = {
        BKASH: "bKash",
        NAGAD: "Nagad",
        ROCKET: "Rocket",
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[method] || "bg-gray-100 text-gray-800"}`}>
            {labels[method] || method}
        </span>
    );
}

// ─── Device Status Badge ──────────────────────────────────

function DeviceStatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        ACTIVE: "bg-green-100 text-green-800",
        SUSPENDED: "bg-yellow-100 text-yellow-800",
        REVOKED: "bg-red-100 text-red-800",
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}>
            {status}
        </span>
    );
}

// ─── Match Status Badge ───────────────────────────────────

function MatchStatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        MATCHED: "bg-green-100 text-green-800",
        UNMATCHED: "bg-yellow-100 text-yellow-800",
        IGNORED: "bg-gray-100 text-gray-600",
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}>
            {status}
        </span>
    );
}

// ─── Main Component ───────────────────────────────────────

export default function PaymentsTab() {
    const t = useTranslations("shop.admin.payments");

    // Internal tab
    const [activeInternalTab, setActiveInternalTab] = useState<InternalTab>("review");

    // Data
    const [reviewQueue, setReviewQueue] = useState<ManualReviewPaymentItem[]>([]);
    const [fraudFlags, setFraudFlags] = useState<ManualReviewPaymentItem[]>([]);
    const [devices, setDevices] = useState<AdminDevice[]>([]);
    const [smsPool, setSmsPool] = useState<SmsReportItem[]>([]);
    const [summary, setSummary] = useState<PaymentSummary | null>(null);
    const [mfsNumbers, setMfsNumbers] = useState<MfsNumberResponse[]>([]);

    // Loading
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Modals
    const [verifyModalItem, setVerifyModalItem] = useState<ManualReviewPaymentItem | null>(null);
    const [rejectModalItem, setRejectModalItem] = useState<ManualReviewPaymentItem | null>(null);
    const [revokeModalDevice, setRevokeModalDevice] = useState<AdminDevice | null>(null);
    const [selectedSmsId, setSelectedSmsId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [revokeReason, setRevokeReason] = useState("");
    const [smsSearch, setSmsSearch] = useState("");

    // SMS filter
    const [mfsFilter, setMfsFilter] = useState<string>("ALL");

    // Notices
    const [notice, setNotice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // ─── Load All Data ─────────────────────────────────────
    const loadAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [review, fraud, dev, sms, sum, mfs] = await Promise.all([
                getManualReviewQueue(),
                getFraudFlaggedPayments(),
                getAllDevices(),
                getUnmatchedSmsPool(),
                getPaymentSummary(),
                getPendingMfsNumbers(),
            ]);
            setReviewQueue(review);
            setFraudFlags(fraud);
            setDevices(dev);
            setSmsPool(sms);
            setSummary(sum);
            setMfsNumbers(mfs);
        } catch {
            setError(t("messages.loadFailed"));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    // ─── Filtered SMS Pool ─────────────────────────────────
    const filteredSmsPool = useMemo(() => {
        let pool = smsPool;
        if (mfsFilter !== "ALL") {
            pool = pool.filter((s) => s.mfsType === mfsFilter);
        }
        if (smsSearch.trim()) {
            const q = smsSearch.toLowerCase();
            pool = pool.filter(
                (s) =>
                    s.trxId.toLowerCase().includes(q) ||
                    s.senderNumber.toLowerCase().includes(q) ||
                    s.receiverNumber.toLowerCase().includes(q),
            );
        }
        return pool;
    }, [smsPool, mfsFilter, smsSearch]);

    // ─── Unmatched SMS for Verify Modal ────────────────────
    const unmatchedSmsForVerify = useMemo(() => {
        if (!verifyModalItem) return [];
        return smsPool.filter(
            (s) =>
                s.matchStatus === "UNMATCHED" &&
                s.mfsType === verifyModalItem.mfsMethod,
        );
    }, [smsPool, verifyModalItem]);

    // ─── Handlers ──────────────────────────────────────────
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
        } catch {
            setError(t("messages.loadFailed"));
        } finally {
            setActionLoading(false);
        }
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
        } catch {
            setError(t("messages.loadFailed"));
        } finally {
            setActionLoading(false);
        }
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
        } catch {
            setError(t("messages.loadFailed"));
        } finally {
            setActionLoading(false);
        }
    }

    // ─── Internal Tabs Config ──────────────────────────────
    const internalTabs: { key: InternalTab; label: string }[] = [
        { key: "review", label: t("tabs.review") },
        { key: "fraud", label: t("tabs.fraud") },
        { key: "devices", label: t("tabs.devices") },
        { key: "smsPool", label: t("tabs.smsPool") },
        { key: "mfsNumbers", label: t("tabs.mfsNumbers") },
    ];

    // ─── Render ────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Notices */}
            {notice && (
                <div className="rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
                    {notice}
                </div>
            )}
            {error && (
                <div className="rounded-2xl bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
                    {error}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-on-surface">{t("title")}</h2>
                    <p className="text-sm text-on-surface-variant">{t("subtitle")}</p>
                </div>
                <button
                    onClick={loadAll}
                    disabled={loading}
                    className="rounded-xl bg-primary-container/20 px-4 py-2 text-sm font-medium text-primary hover:bg-primary-container/30 transition-colors disabled:opacity-50"
                >
                    {loading ? "…" : t("summary.refresh")}
                </button>
            </div>

            {/* Summary KPIs */}
            {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-outline-variant/10">
                        <p className="text-xs font-medium text-on-surface-variant">{t("summary.todayRevenue")}</p>
                        <p className="mt-2 text-2xl font-bold text-on-surface">৳{summary.todayRevenue.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-outline-variant/10">
                        <p className="text-xs font-medium text-on-surface-variant">{t("summary.totalCompleted")}</p>
                        <p className="mt-2 text-2xl font-bold text-on-surface">{summary.todayCompleted}</p>
                    </div>
                    <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-outline-variant/10">
                        <p className="text-xs font-medium text-on-surface-variant">{t("summary.manualReview")}</p>
                        <p className="mt-2 text-2xl font-bold text-on-surface">{summary.totalManualReview}</p>
                    </div>
                    <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-outline-variant/10">
                        <p className="text-xs font-medium text-on-surface-variant">{t("summary.fraudFlags")}</p>
                        <p className="mt-2 text-2xl font-bold text-on-surface">{summary.totalFraudFlags}</p>
                    </div>
                    <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-outline-variant/10">
                        <p className="text-xs font-medium text-on-surface-variant">{t("summary.autoVerified")}</p>
                        <p className="mt-2 text-2xl font-bold text-on-surface">{Math.round(summary.autoVerifiedRate)}%</p>
                    </div>
                </div>
            )}

            {/* Internal Tab Navigation */}
            <nav className="flex gap-2 overflow-x-auto pb-2">
                {internalTabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveInternalTab(tab.key)}
                        className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${activeInternalTab === tab.key
                            ? "bg-primary text-on-primary shadow-sm"
                            : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            {/* Loading State */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-surface-container-high border-t-primary" />
                </div>
            ) : (
                <>
                    {/* ─── Review Queue Tab ──────────────────────────── */}
                    {activeInternalTab === "review" && (
                        <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left">
                                    <thead className="bg-surface-container-low text-sm font-bold text-on-surface-variant">
                                        <tr>
                                            <th className="px-6 py-4">{t("table.userName")}</th>
                                            <th className="px-6 py-4">{t("table.phone")}</th>
                                            <th className="px-6 py-4">{t("table.amount")}</th>
                                            <th className="px-6 py-4">{t("table.mfsMethod")}</th>
                                            <th className="px-6 py-4">{t("table.trxId")}</th>
                                            <th className="px-6 py-4">{t("table.submittedAt")}</th>
                                            <th className="px-6 py-4">{t("table.failedAttempts")}</th>
                                            <th className="px-6 py-4">{t("table.fraudFlag")}</th>
                                            <th className="px-6 py-4 text-right">{t("table.actions")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-container">
                                        {reviewQueue.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="px-6 py-12 text-center text-on-surface-variant">
                                                    {t("messages.noPayments")}
                                                </td>
                                            </tr>
                                        ) : (
                                            reviewQueue.map((item) => (
                                                <tr key={item.paymentIntentId} className="hover:bg-surface-container-low transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="font-medium text-on-surface">{item.userName}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-on-surface-variant">{item.userPhone}</td>
                                                    <td className="px-6 py-4 text-sm font-medium text-on-surface">৳{item.amount.toLocaleString()}</td>
                                                    <td className="px-6 py-4">
                                                        <MfsBadge method={item.mfsMethod} />
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-on-surface-variant font-mono">{item.submittedTrxId}</td>
                                                    <td className="px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap">
                                                        {new Date(item.submittedAt).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                                                        {item.failedAttempts > 0 ? (
                                                            <span className="text-red-600 font-medium">{item.failedAttempts}</span>
                                                        ) : (
                                                            <span>0</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {item.fraudFlag ? (
                                                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                                                                ⚠ Fraud
                                                            </span>
                                                        ) : (
                                                            <span className="text-on-surface-variant">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                onClick={() => {
                                                                    setVerifyModalItem(item);
                                                                    setSelectedSmsId(null);
                                                                    setSmsSearch("");
                                                                }}
                                                                className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                                                            >
                                                                {t("actions.verify")}
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setRejectModalItem(item);
                                                                    setRejectReason("");
                                                                }}
                                                                className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                                                            >
                                                                {t("actions.reject")}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ─── Fraud Flags Tab ───────────────────────────── */}
                    {activeInternalTab === "fraud" && (
                        <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left">
                                    <thead className="bg-surface-container-low text-sm font-bold text-on-surface-variant">
                                        <tr>
                                            <th className="px-6 py-4">{t("table.userName")}</th>
                                            <th className="px-6 py-4">{t("table.phone")}</th>
                                            <th className="px-6 py-4">{t("table.amount")}</th>
                                            <th className="px-6 py-4">{t("table.mfsMethod")}</th>
                                            <th className="px-6 py-4">{t("table.trxId")}</th>
                                            <th className="px-6 py-4">{t("table.submittedAt")}</th>
                                            <th className="px-6 py-4">{t("table.failedAttempts")}</th>
                                            <th className="px-6 py-4 text-right">{t("table.actions")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-container">
                                        {fraudFlags.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-12 text-center text-on-surface-variant">
                                                    {t("messages.noFraud")}
                                                </td>
                                            </tr>
                                        ) : (
                                            fraudFlags.map((item) => (
                                                <tr key={item.paymentIntentId} className="hover:bg-red-50/30 transition-colors border-l-4 border-l-red-500">
                                                    <td className="px-6 py-4">
                                                        <p className="font-medium text-on-surface">{item.userName}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-on-surface-variant">{item.userPhone}</td>
                                                    <td className="px-6 py-4 text-sm font-medium text-on-surface">৳{item.amount.toLocaleString()}</td>
                                                    <td className="px-6 py-4">
                                                        <MfsBadge method={item.mfsMethod} />
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-on-surface-variant font-mono">{item.submittedTrxId}</td>
                                                    <td className="px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap">
                                                        {new Date(item.submittedAt).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-red-600 font-medium">{item.failedAttempts}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                onClick={() => {
                                                                    setVerifyModalItem(item);
                                                                    setSelectedSmsId(null);
                                                                    setSmsSearch("");
                                                                }}
                                                                className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                                                            >
                                                                {t("actions.verify")}
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setRejectModalItem(item);
                                                                    setRejectReason("");
                                                                }}
                                                                className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                                                            >
                                                                {t("actions.reject")}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ─── Devices Tab ───────────────────────────────── */}
                    {activeInternalTab === "devices" && (
                        <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left">
                                    <thead className="bg-surface-container-low text-sm font-bold text-on-surface-variant">
                                        <tr>
                                            <th className="px-6 py-4">{t("table.deviceName")}</th>
                                            <th className="px-6 py-4">{t("table.user")}</th>
                                            <th className="px-6 py-4">{t("table.appVariant")}</th>
                                            <th className="px-6 py-4">{t("table.status")}</th>
                                            <th className="px-6 py-4">{t("table.lastReport")}</th>
                                            <th className="px-6 py-4">{t("table.registeredAt")}</th>
                                            <th className="px-6 py-4 text-right">{t("table.actions")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-container">
                                        {devices.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant">
                                                    {t("messages.noDevices")}
                                                </td>
                                            </tr>
                                        ) : (
                                            devices.map((device) => (
                                                <tr key={device.id} className="hover:bg-surface-container-low transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="font-medium text-on-surface">{device.deviceName}</p>
                                                            <p className="text-xs text-on-surface-variant font-mono">{device.deviceFingerprint.slice(0, 16)}…</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm text-on-surface">{device.userName}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-on-surface-variant">{device.appVariant}</td>
                                                    <td className="px-6 py-4">
                                                        <DeviceStatusBadge status={device.status} />
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap">
                                                        {device.lastReportAt ? new Date(device.lastReportAt).toLocaleString() : "—"}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap">
                                                        {new Date(device.registeredAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {device.status !== "REVOKED" ? (
                                                            <button
                                                                onClick={() => {
                                                                    setRevokeModalDevice(device);
                                                                    setRevokeReason("");
                                                                }}
                                                                className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                                                            >
                                                                {t("actions.revoke")}
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-on-surface-variant">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ─── SMS Pool Tab ──────────────────────────────── */}
                    {activeInternalTab === "smsPool" && (
                        <div className="space-y-4">
                            {/* Filters */}
                            <div className="flex items-center gap-3">
                                <select
                                    value={mfsFilter}
                                    onChange={(e) => setMfsFilter(e.target.value)}
                                    className="rounded-xl bg-surface-container-low px-4 py-2 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none"
                                >
                                    <option value="ALL">All MFS</option>
                                    <option value="BKASH">bKash</option>
                                    <option value="NAGAD">Nagad</option>
                                    <option value="ROCKET">Rocket</option>
                                </select>
                                <input
                                    type="text"
                                    value={smsSearch}
                                    onChange={(e) => setSmsSearch(e.target.value)}
                                    placeholder={t("actions.search")}
                                    className="rounded-xl bg-surface-container-low px-4 py-2 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none"
                                />
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
                                                <tr>
                                                    <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant">
                                                        {t("messages.noSms")}
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredSmsPool.map((sms) => (
                                                    <tr key={sms.id} className="hover:bg-surface-container-low transition-colors">
                                                        <td className="px-6 py-4 text-sm font-mono text-on-surface">{sms.trxId}</td>
                                                        <td className="px-6 py-4 text-sm font-medium text-on-surface">৳{sms.amount.toLocaleString()}</td>
                                                        <td className="px-6 py-4">
                                                            <MfsBadge method={sms.mfsType} />
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-on-surface-variant">{sms.senderNumber}</td>
                                                        <td className="px-6 py-4 text-sm text-on-surface-variant">{sms.receiverNumber}</td>
                                                        <td className="px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap">
                                                            {new Date(sms.smsReceivedAt).toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <MatchStatusBadge status={sms.matchStatus} />
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ─── MFS Numbers Tab (v1.1) ──────────────────────────── */}
            {activeInternalTab === "mfsNumbers" && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">
                            {t("tabs.mfsNumbers")}
                        </h3>
                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                            {mfsNumbers.length} {t("mfsNumbers.pending")}
                        </span>
                    </div>

                    {mfsNumbers.length === 0 ? (
                        <div className="rounded-2xl bg-surface-container-lowest p-12 text-center">
                            <p className="text-sm text-on-surface-variant">{t("mfsNumbers.noPending")}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl bg-surface-container-lowest">
                            <table className="min-w-full text-left">
                                <thead className="bg-surface-container-low text-sm font-bold text-on-surface-variant">
                                    <tr>
                                        <th className="px-6 py-4">{t("mfsNumbers.table.user")}</th>
                                        <th className="px-6 py-4">{t("mfsNumbers.table.phone")}</th>
                                        <th className="px-6 py-4">{t("mfsNumbers.table.mfsType")}</th>
                                        <th className="px-6 py-4">{t("mfsNumbers.table.mfsNumber")}</th>
                                        <th className="px-6 py-4">{t("mfsNumbers.table.simSlot")}</th>
                                        <th className="px-6 py-4">{t("mfsNumbers.table.submittedAt")}</th>
                                        <th className="px-6 py-4 text-right">{t("table.actions")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-container">
                                    {mfsNumbers.map((mfs) => (
                                        <tr key={mfs.id} className="hover:bg-surface-container-low transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-on-surface">{mfs.userName || "—"}</td>
                                            <td className="px-6 py-4 text-sm text-on-surface-variant">{mfs.userPhone || "—"}</td>
                                            <td className="px-6 py-4"><MfsBadge method={mfs.mfsType} /></td>
                                            <td className="px-6 py-4 text-sm font-mono text-on-surface">{mfs.mfsNumber}</td>
                                            <td className="px-6 py-4 text-sm text-on-surface-variant">SIM {mfs.simSlot ?? "—"}</td>
                                            <td className="px-6 py-4 text-sm text-on-surface-variant">
                                                {mfs.createdAt ? new Date(mfs.createdAt).toLocaleDateString() : "—"}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={async () => {
                                                            setActionLoading(true);
                                                            try {
                                                                await approveMfsNumber(mfs.id);
                                                                setNotice(t("mfsNumbers.approved"));
                                                                loadAll();
                                                            } catch {
                                                                setError(t("messages.actionFailed"));
                                                            } finally {
                                                                setActionLoading(false);
                                                            }
                                                        }}
                                                        disabled={actionLoading}
                                                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                                                    >
                                                        {t("mfsNumbers.approve")}
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            const reason = prompt(t("mfsNumbers.rejectReasonPrompt"));
                                                            if (reason === null) return;
                                                            setActionLoading(true);
                                                            try {
                                                                await rejectMfsNumber(mfs.id, reason || undefined);
                                                                setNotice(t("mfsNumbers.rejected"));
                                                                loadAll();
                                                            } catch {
                                                                setError(t("messages.actionFailed"));
                                                            } finally {
                                                                setActionLoading(false);
                                                            }
                                                        }}
                                                        disabled={actionLoading}
                                                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                                                    >
                                                        {t("mfsNumbers.reject")}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}

            {/* ─── Verify Modal ────────────────────────────────── */}
            {verifyModalItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-surface-container-lowest p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-on-surface">
                            {t("modal.verifyTitle")}
                        </h3>

                        {/* Payment Details */}
                        <div className="mt-4 space-y-3 rounded-xl bg-surface-container-low p-4">
                            <p className="text-xs font-semibold text-on-surface-variant uppercase">{t("modal.paymentDetails")}</p>
                            <div className="flex justify-between">
                                <span className="text-sm text-on-surface-variant">{t("table.userName")}</span>
                                <span className="text-sm font-medium text-on-surface">{verifyModalItem.userName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-on-surface-variant">{t("table.amount")}</span>
                                <span className="text-sm font-medium text-on-surface">৳{verifyModalItem.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-on-surface-variant">{t("table.mfsMethod")}</span>
                                <MfsBadge method={verifyModalItem.mfsMethod} />
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-on-surface-variant">{t("table.trxId")}</span>
                                <span className="text-sm font-mono text-on-surface">{verifyModalItem.submittedTrxId}</span>
                            </div>
                        </div>

                        {/* SMS Report Selection */}
                        <div className="mt-5 space-y-3">
                            <p className="text-sm font-medium text-on-surface-variant">{t("modal.selectSms")}</p>

                            {unmatchedSmsForVerify.length === 0 ? (
                                <p className="py-4 text-center text-sm text-on-surface-variant">
                                    {t("modal.noSmsFound")}
                                </p>
                            ) : (
                                <div className="max-h-56 overflow-y-auto rounded-xl border border-outline-variant/20">
                                    {unmatchedSmsForVerify.map((sms) => (
                                        <button
                                            key={sms.id}
                                            type="button"
                                            onClick={() => setSelectedSmsId(sms.id)}
                                            className={`w-full text-left px-4 py-3 text-sm transition-colors ${selectedSmsId === sms.id
                                                ? "bg-emerald-50 text-emerald-800 font-medium"
                                                : "hover:bg-surface-container-low text-on-surface"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-mono">{sms.trxId}</p>
                                                    <p className="text-xs text-on-surface-variant">
                                                        ৳{sms.amount.toLocaleString()} · {sms.senderNumber} → {sms.receiverNumber}
                                                    </p>
                                                </div>
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${selectedSmsId === sms.id
                                                    ? "bg-emerald-200 text-emerald-800"
                                                    : "bg-surface-container text-on-surface-variant"
                                                    }`}>
                                                    {selectedSmsId === sms.id ? "✓" : t("table.matchStatus")}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setVerifyModalItem(null);
                                    setSelectedSmsId(null);
                                }}
                                className="rounded-xl px-5 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
                            >
                                {t("actions.cancel")}
                            </button>
                            <button
                                onClick={handleVerify}
                                disabled={actionLoading || !selectedSmsId}
                                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                            >
                                {actionLoading ? "…" : t("modal.confirmVerify")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Reject Modal ────────────────────────────────── */}
            {rejectModalItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-surface-container-lowest p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-on-surface">
                            {t("modal.rejectTitle")}
                        </h3>

                        {/* Payment Details */}
                        <div className="mt-4 space-y-3 rounded-xl bg-surface-container-low p-4">
                            <p className="text-xs font-semibold text-on-surface-variant uppercase">{t("modal.paymentDetails")}</p>
                            <div className="flex justify-between">
                                <span className="text-sm text-on-surface-variant">{t("table.userName")}</span>
                                <span className="text-sm font-medium text-on-surface">{rejectModalItem.userName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-on-surface-variant">{t("table.amount")}</span>
                                <span className="text-sm font-medium text-on-surface">৳{rejectModalItem.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-on-surface-variant">{t("table.mfsMethod")}</span>
                                <MfsBadge method={rejectModalItem.mfsMethod} />
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-on-surface-variant">{t("table.trxId")}</span>
                                <span className="text-sm font-mono text-on-surface">{rejectModalItem.submittedTrxId}</span>
                            </div>
                        </div>

                        {/* Rejection Reason */}
                        <div className="mt-5">
                            <label className="block">
                                <span className="text-sm font-medium text-on-surface-variant">{t("modal.rejectionReason")}</span>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    rows={3}
                                    placeholder={t("modal.reasonPlaceholder")}
                                    className="mt-1 w-full rounded-xl bg-red-50 p-3 text-sm text-on-surface border border-red-200 focus:border-red-400 focus:outline-none resize-none"
                                />
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setRejectModalItem(null);
                                    setRejectReason("");
                                }}
                                className="rounded-xl px-5 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
                            >
                                {t("actions.cancel")}
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={actionLoading || !rejectReason.trim()}
                                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                            >
                                {actionLoading ? "…" : t("modal.confirmReject")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Revoke Modal ────────────────────────────────── */}
            {revokeModalDevice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-surface-container-lowest p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-on-surface">
                            {t("modal.revokeTitle")}
                        </h3>

                        {/* Device Details */}
                        <div className="mt-4 space-y-3 rounded-xl bg-surface-container-low p-4">
                            <div className="flex justify-between">
                                <span className="text-sm text-on-surface-variant">{t("table.deviceName")}</span>
                                <span className="text-sm font-medium text-on-surface">{revokeModalDevice.deviceName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-on-surface-variant">{t("table.user")}</span>
                                <span className="text-sm font-medium text-on-surface">{revokeModalDevice.userName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-on-surface-variant">{t("table.status")}</span>
                                <DeviceStatusBadge status={revokeModalDevice.status} />
                            </div>
                        </div>

                        {/* Revoke Reason */}
                        <div className="mt-5">
                            <label className="block">
                                <span className="text-sm font-medium text-on-surface-variant">{t("modal.revokeReason")}</span>
                                <textarea
                                    value={revokeReason}
                                    onChange={(e) => setRevokeReason(e.target.value)}
                                    rows={2}
                                    placeholder={t("modal.reasonPlaceholder")}
                                    className="mt-1 w-full rounded-xl bg-red-50 p-3 text-sm text-on-surface border border-red-200 focus:border-red-400 focus:outline-none resize-none"
                                />
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setRevokeModalDevice(null);
                                    setRevokeReason("");
                                }}
                                className="rounded-xl px-5 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
                            >
                                {t("actions.cancel")}
                            </button>
                            <button
                                onClick={handleRevoke}
                                disabled={actionLoading}
                                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                            >
                                {actionLoading ? "…" : t("modal.confirmRevoke")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
