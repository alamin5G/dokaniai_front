"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import type { PendingDuePaymentItem } from "@/types/duePayment";
import {
    getPendingDuePayments,
    verifyDuePayment,
    rejectDuePayment,
} from "@/lib/duePaymentApi";
import { formatCurrencyBDT } from "@/lib/localeNumber";

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

interface PendingDuePaymentsPanelProps {
    businessId: string;
    onClose: () => void;
    onAction: () => void;
}

export default function PendingDuePaymentsPanel({
    businessId,
    onClose,
    onAction,
}: PendingDuePaymentsPanelProps) {
    const t = useTranslations("shop.duePayment");
    const locale = useLocale();
    const loc = resolveLocale(locale);
    const isBn = locale?.startsWith("bn") ?? false;

    const [payments, setPayments] = useState<PendingDuePaymentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actioningId, setActioningId] = useState<string | null>(null);
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [toast, setToast] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            const data = await getPendingDuePayments(businessId);
            setPayments(data ?? []);
        } catch {
            setError(isBn ? "পেমেন্ট লোড করা যায়নি" : "Failed to load payments");
        } finally {
            setIsLoading(false);
        }
    }, [businessId, isBn]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Auto-clear toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleVerify = async (intentId: string) => {
        setActioningId(intentId);
        try {
            await verifyDuePayment(businessId, intentId);
            setToast(isBn ? "পেমেন্ট যাচাই সফল!" : "Payment verified successfully!");
            setPayments((prev) => prev.filter((p) => p.id !== intentId));
            onAction();
        } catch {
            setToast(isBn ? "যাচাই করতে সমস্যা হয়েছে" : "Failed to verify");
        } finally {
            setActioningId(null);
        }
    };

    const handleReject = async () => {
        if (!rejectId) return;
        setActioningId(rejectId);
        try {
            await rejectDuePayment(businessId, rejectId, rejectReason || undefined);
            setToast(isBn ? "পেমেন্ট প্রত্যাখ্যাত হয়েছে" : "Payment rejected");
            setPayments((prev) => prev.filter((p) => p.id !== rejectId));
            onAction();
        } catch {
            setToast(isBn ? "প্রত্যাখ্যান করতে সমস্যা হয়েছে" : "Failed to reject");
        } finally {
            setActioningId(null);
            setRejectId(null);
            setRejectReason("");
        }
    };

    const formatTime = (dateStr: string): string => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" });
    };

    const getTimeRemaining = (expiresAt: string): string => {
        const now = Date.now();
        const expiry = new Date(expiresAt).getTime();
        const diff = expiry - now;
        if (diff <= 0) return isBn ? "মেয়াদোত্তীর্ণ" : "Expired";
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return isBn ? `${mins} মিনিট বাকি` : `${mins}m left`;
        const hrs = Math.floor(mins / 60);
        return isBn ? `${hrs} ঘণ্টা বাকি` : `${hrs}h left`;
    };

    const mfsLabel = (mfs: string): string => {
        switch (mfs) {
            case "BKASH": return isBn ? "বিকাশ" : "bKash";
            case "NAGAD": return isBn ? "নগদ" : "Nagad";
            case "ROCKET": return isBn ? "রকেট" : "Rocket";
            default: return mfs;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-surface-container-lowest shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-outline-variant/20">
                    <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">pending_actions</span>
                        {t("pendingPayments.title")}
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 hover:bg-surface-container transition-colors"
                    >
                        <span className="material-symbols-outlined text-on-surface-variant">close</span>
                    </button>
                </div>

                {/* Toast */}
                {toast && (
                    <div className="mx-6 mt-4 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white">
                        {toast}
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <span className="material-symbols-outlined animate-spin text-primary text-3xl">
                                progress_activity
                            </span>
                        </div>
                    ) : error ? (
                        <div className="rounded-xl bg-error-container p-6 text-center text-on-error-container">
                            {error}
                            <button
                                onClick={() => { setIsLoading(true); setError(null); loadData(); }}
                                className="mt-3 px-4 py-2 bg-error text-on-error rounded-lg text-sm font-bold"
                            >
                                {isBn ? "আবার চেষ্টা করুন" : "Retry"}
                            </button>
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="py-16 text-center">
                            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4 block">
                                check_circle
                            </span>
                            <p className="text-on-surface-variant font-medium">
                                {t("pendingPayments.empty")}
                            </p>
                        </div>
                    ) : (
                        payments.map((payment) => (
                            <div
                                key={payment.id}
                                className="rounded-2xl bg-surface-container-low p-5 space-y-4"
                            >
                                {/* Customer info */}
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-lg font-bold text-on-surface">
                                            {payment.customerName ?? (isBn ? "অজানা গ্রাহক" : "Unknown Customer")}
                                        </p>
                                        {payment.customerPhone && (
                                            <p className="text-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                                                <span className="material-symbols-outlined text-xs">phone</span>
                                                {payment.customerPhone}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-primary">
                                            {formatCurrencyBDT(payment.amount, locale)}
                                        </p>
                                        <p className="text-xs text-on-surface-variant flex items-center gap-1 justify-end mt-1">
                                            <span className="material-symbols-outlined text-xs">schedule</span>
                                            {getTimeRemaining(payment.expiresAt)}
                                        </p>
                                    </div>
                                </div>

                                {/* Payment details */}
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1.5">
                                        <span className="material-symbols-outlined text-xs">payments</span>
                                        <span className="font-bold">{mfsLabel(payment.mfsMethod)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1.5">
                                        <span className="material-symbols-outlined text-xs">receipt_long</span>
                                        <span className="font-mono font-bold text-xs">{payment.submittedTrxId}</span>
                                    </div>
                                    <div className="text-on-surface-variant text-xs">
                                        {formatTime(payment.createdAt)}
                                    </div>
                                </div>

                                {/* Status badge */}
                                <div className="flex items-center gap-2">
                                    {payment.status === "PENDING" && (
                                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800">
                                            {isBn ? "অপেক্ষমাণ" : "Pending"}
                                        </span>
                                    )}
                                    {payment.status === "MANUAL_REVIEW" && (
                                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                                            {isBn ? "ম্যানুয়াল রিভিউ" : "Manual Review"}
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                {rejectId === payment.id ? (
                                    <div className="space-y-3">
                                        <textarea
                                            value={rejectReason}
                                            onChange={(e) => setRejectReason(e.target.value)}
                                            className="w-full rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface min-h-[60px] resize-y"
                                            placeholder={t("pendingPayments.rejectReasonPlaceholder")}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { setRejectId(null); setRejectReason(""); }}
                                                className="flex-1 rounded-xl bg-surface-container px-4 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                                            >
                                                {isBn ? "বাতিল" : "Cancel"}
                                            </button>
                                            <button
                                                onClick={handleReject}
                                                disabled={actioningId === payment.id}
                                                className="flex-1 rounded-xl bg-error px-4 py-2.5 text-sm font-bold text-white hover:bg-error/90 transition-colors disabled:opacity-50"
                                            >
                                                {actioningId === payment.id
                                                    ? (isBn ? "প্রত্যাখ্যান হচ্ছে..." : "Rejecting...")
                                                    : (isBn ? "প্রত্যাখ্যান করুন" : "Reject")}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleVerify(payment.id)}
                                            disabled={actioningId === payment.id}
                                            className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {actioningId === payment.id ? (
                                                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                                            ) : (
                                                <span className="material-symbols-outlined text-base">check_circle</span>
                                            )}
                                            {t("pendingPayments.verify")}
                                        </button>
                                        <button
                                            onClick={() => setRejectId(payment.id)}
                                            disabled={actioningId === payment.id}
                                            className="rounded-xl bg-error/10 px-4 py-3 text-sm font-bold text-error hover:bg-error/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-base">cancel</span>
                                            {t("pendingPayments.reject")}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-outline-variant/20">
                    <p className="text-xs text-on-surface-variant text-center">
                        {t("pendingPayments.footer")}
                    </p>
                </div>
            </div>
        </div>
    );
}
