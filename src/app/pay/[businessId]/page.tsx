"use client";

import {
    createDuePaymentIntent,
    getCustomerDueInfo,
    getDuePaymentIntentStatus,
} from "@/lib/duePaymentApi";
import { formatCurrencyBDT } from "@/lib/localeNumber";
import type {
    CustomerDuePublicInfo,
    DuePaymentIntentStatusResponse,
    MfsType,
} from "@/types/duePayment";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// MFS Provider Themes (reused from subscription payment)
// ---------------------------------------------------------------------------

const MFS_THEMES: Record<
    MfsType,
    {
        primary: string;
        gradient: string;
        lightBg: string;
        logo: string;
        labelBn: string;
        labelEn: string;
        trxPlaceholder: string;
        trxHint: string;
    }
> = {
    BKASH: {
        primary: "#E2136E",
        gradient: "linear-gradient(135deg, #E2136E 0%, #C4105E 100%)",
        lightBg: "#FDE8F1",
        logo: "/icons/payment/bkash.png",
        labelBn: "বিকাশ",
        labelEn: "bKash",
        trxPlaceholder: "যেমন: DDJ8BQBVCM",
        trxHint: "e.g. DDJ8BQBVCM",
    },
    NAGAD: {
        primary: "#F6921E",
        gradient: "linear-gradient(135deg, #F6921E 0%, #ED1C24 100%)",
        lightBg: "#FFF3E0",
        logo: "/icons/payment/nagad.png",
        labelBn: "নগদ",
        labelEn: "Nagad",
        trxPlaceholder: "যেমন: 754PTHMR",
        trxHint: "e.g. 754PTHMR",
    },
    ROCKET: {
        primary: "#8B2F8B",
        gradient: "linear-gradient(135deg, #8B2F8B 0%, #6B1F6B 100%)",
        lightBg: "#F3E5F5",
        logo: "/icons/payment/dbbl_rocket.jpeg",
        labelBn: "রকেট",
        labelEn: "Rocket",
        trxPlaceholder: "যেমন: 4661971574",
        trxHint: "e.g. 4661971574",
    },
};

// ---------------------------------------------------------------------------
// TrxID Validation
// ---------------------------------------------------------------------------

function validateTrxId(trxId: string, mfsMethod: MfsType): string | null {
    const trimmed = trxId.trim();
    if (!trimmed) return null;
    switch (mfsMethod) {
        case "BKASH": {
            if (!/^[A-Z0-9]{10}$/.test(trimmed))
                return "bKash TrxID must be 10 alphanumeric characters";
            return null;
        }
        case "NAGAD": {
            if (!/^[A-Z0-9]{8}$/.test(trimmed))
                return "Nagad TxnID must be 8 alphanumeric characters";
            return null;
        }
        case "ROCKET": {
            if (!/^\d{10}$/.test(trimmed))
                return "Rocket TxnId must be 10 digits";
            return null;
        }
        default:
            return null;
    }
}

function getTrxMaxLength(mfsMethod: MfsType | undefined): number {
    switch (mfsMethod) {
        case "BKASH": return 10;
        case "NAGAD": return 8;
        case "ROCKET": return 10;
        default: return 10;
    }
}

function isTerminalStatus(status: string): boolean {
    return status === "COMPLETED" || status === "REJECTED" || status === "EXPIRED";
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function formatPrice(value: number, locale: string | undefined): string {
    return formatCurrencyBDT(value, locale);
}

function getRelativeTime(dateStr: string, isBn: boolean): string {
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now.getTime() - then.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return isBn ? "আজ" : "Today";
    if (diffDays === 1) return isBn ? "গতকাল" : "Yesterday";
    if (diffDays < 7) return isBn ? `${diffDays} দিন আগে` : `${diffDays} days ago`;
    return then.toLocaleDateString(isBn ? "bn-BD" : "en-US", { month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function DuePaymentPage() {
    const locale = useLocale();
    const isBn = locale?.startsWith("bn") ?? false;

    // Extract businessId and customerId from URL
    const businessId = useMemo(() => {
        if (typeof window === "undefined") return "";
        const parts = window.location.pathname.split("/");
        return parts[2] ?? "";
    }, []);

    const customerId = useMemo(() => {
        if (typeof window === "undefined") return "";
        const params = new URLSearchParams(window.location.search);
        return params.get("c") ?? "";
    }, []);

    // State
    const [customerInfo, setCustomerInfo] = useState<CustomerDuePublicInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Payment form state
    const [selectedMfs, setSelectedMfs] = useState<MfsType | null>(null);
    const [amount, setAmount] = useState("");
    const [trxId, setTrxId] = useState("");
    const [trxError, setTrxError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Payment status state
    const [intentId, setIntentId] = useState<string | null>(null);
    const [statusData, setStatusData] = useState<DuePaymentIntentStatusResponse | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Load customer due info
    useEffect(() => {
        if (!businessId || !customerId) {
            setIsLoading(false);
            return;
        }

        getCustomerDueInfo(businessId, customerId)
            .then((data) => {
                setCustomerInfo(data);
                setAmount(String(data.finalDueAmount));
                // Auto-select first MFS option
                if (data.mfsPaymentOptions.length > 0) {
                    setSelectedMfs(data.mfsPaymentOptions[0].mfsType);
                }
            })
            .catch((err) => {
                setError(err instanceof Error ? err.message : "তথ্য লোড করতে সমস্যা হয়েছে");
            })
            .finally(() => setIsLoading(false));
    }, [businessId, customerId]);

    // Status polling after submission
    const refreshStatus = useCallback(async () => {
        if (!intentId) return;
        try {
            const current = await getDuePaymentIntentStatus(intentId);
            setStatusData(current);
        } catch {
            // Silently retry on next poll
        }
    }, [intentId]);

    useEffect(() => {
        if (!intentId || !statusData || isTerminalStatus(statusData.status)) return;
        const intervalId = window.setInterval(() => { void refreshStatus(); }, 5000);
        return () => { window.clearInterval(intervalId); };
    }, [intentId, refreshStatus, statusData]);

    // SSE-driven instant refresh
    useEffect(() => {
        const handleSSEPayment = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail?.paymentIntentId === intentId) {
                void refreshStatus();
            }
        };
        window.addEventListener("sse:due-payment-status-changed", handleSSEPayment);
        return () => window.removeEventListener("sse:due-payment-status-changed", handleSSEPayment);
    }, [intentId, refreshStatus]);

    // TrxID change handler
    const handleTrxIdChange = (value: string) => {
        const upper = value.toUpperCase();
        setTrxId(upper);
        if (selectedMfs) {
            setTrxError(validateTrxId(upper, selectedMfs));
        }
    };

    // Submit payment
    const handleSubmit = useCallback(async () => {
        if (!selectedMfs || !businessId || !customerId) return;

        const trimmedTrx = trxId.trim();
        const validationError = validateTrxId(trimmedTrx, selectedMfs);
        if (validationError) {
            setTrxError(validationError);
            return;
        }

        const parsedAmount = parseFloat(amount);
        if (!parsedAmount || parsedAmount <= 0) {
            setSubmitError(isBn ? "সঠিক পরিমাণ দিন" : "Enter a valid amount");
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const intent = await createDuePaymentIntent({
                businessId,
                customerId,
                amount: parsedAmount,
                mfsMethod: selectedMfs,
                submittedTrxId: trimmedTrx,
            });
            setIntentId(intent.id);
            setStatusData({
                id: intent.id,
                status: intent.status,
                rejectionReason: null,
                newDueBalance: null,
                verifiedAt: null,
            });
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : "পেমেন্ট জমা দিতে সমস্যা হয়েছে");
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedMfs, businessId, customerId, trxId, amount, isBn]);

    // Copy to clipboard
    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        });
    };

    // Get selected MFS option details
    const selectedMfsOption = useMemo(() => {
        if (!selectedMfs || !customerInfo) return null;
        return customerInfo.mfsPaymentOptions.find((o) => o.mfsType === selectedMfs) ?? null;
    }, [selectedMfs, customerInfo]);

    const theme = selectedMfs ? MFS_THEMES[selectedMfs] : null;

    // ─── Render: No customer ID ──────────────────────────
    if (!customerId) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-error/10 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-error">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-on-surface">
                        {isBn ? "গ্রাহক আইডি প্রয়োজন" : "Customer ID Required"}
                    </h1>
                    <p className="text-on-surface-variant text-sm">
                        {isBn
                            ? "এই পেজে অ্যাক্সেস করতে আপনার গ্রাহক আইডি সহ লিঙ্ক প্রয়োজন। দোকান মালিকের কাছ থেকে সঠিক পেমেন্ট লিঙ্ক নিন।"
                            : "This page requires a customer ID in the link. Please get the correct payment link from the shop owner."}
                    </p>
                </div>
            </div>
        );
    }

    // ─── Render: Loading ─────────────────────────────────
    if (isLoading) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-4 border-surface-container-high border-t-primary animate-spin" />
            </div>
        );
    }

    // ─── Render: Error ───────────────────────────────────
    if (error || !customerInfo) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-error/10 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-error">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-on-surface">
                        {isBn ? "তথ্য লোড করা যায়নি" : "Failed to load info"}
                    </h1>
                    <p className="text-on-surface-variant text-sm">{error ?? "Unknown error"}</p>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90"
                    >
                        {isBn ? "আবার চেষ্টা করুন" : "Try Again"}
                    </button>
                </div>
            </div>
        );
    }

    // ─── Render: Payment already submitted (status polling) ─
    if (intentId && statusData) {
        const isCompleted = statusData.status === "COMPLETED";
        const isRejected = statusData.status === "REJECTED";
        const isExpired = statusData.status === "EXPIRED";
        const isPending = !isTerminalStatus(statusData.status);

        return (
            <div className="min-h-screen bg-surface p-4">
                <div className="max-w-md mx-auto space-y-6">
                    {/* Business header */}
                    <div className="text-center">
                        <h1 className="text-lg font-bold text-on-surface">{customerInfo.businessName}</h1>
                    </div>

                    {/* Status card */}
                    <div className={`rounded-2xl p-6 text-center ${isCompleted ? "bg-primary-fixed/20" : isRejected ? "bg-error/10" : isExpired ? "bg-surface-container-high" : "bg-surface-container-low"}`}>
                        {isPending && (
                            <>
                                <div className="w-16 h-16 mx-auto rounded-full border-4 border-surface-container-high border-t-primary animate-spin mb-4" />
                                <h2 className="text-xl font-bold text-on-surface mb-2">
                                    {isBn ? "পেমেন্ট যাচাই হচ্ছে..." : "Verifying payment..."}
                                </h2>
                                <p className="text-sm text-on-surface-variant">
                                    {isBn ? "আপনার পেমেন্ট স্বয়ংক্রিয়ভাবে যাচাই হলে এখানে দেখানো হবে" : "Your payment will be verified automatically"}
                                </p>
                            </>
                        )}

                        {isCompleted && (
                            <>
                                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-primary">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-primary mb-2">
                                    {isBn ? "পেমেন্ট সফল! ✅" : "Payment Verified! ✅"}
                                </h2>
                                {statusData.newDueBalance !== null && (
                                    <p className="text-lg font-bold text-on-surface">
                                        {isBn ? "আপডেট হওয়া বকেয়া: " : "Updated Due: "}
                                        {formatPrice(statusData.newDueBalance, locale)}
                                    </p>
                                )}
                            </>
                        )}

                        {isRejected && (
                            <>
                                <div className="w-16 h-16 mx-auto rounded-full bg-error/10 flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-error">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376-.865-1.9c1.064-2.34 3.22-3.976 5.758-3.976 2.573 0 4.786 1.607 5.878 3.976l-.857 1.9M6.618 20.326A8.816 8.816 0 0 0 12 21.75c2.038 0 3.928-.69 5.438-1.857M9.75 9.75c0-1.147.39-2.221 1.044-3.068M15 9.75c0 1.147-.39 2.221-1.044 3.068" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-error mb-2">
                                    {isBn ? "পেমেন্ট প্রত্যাখ্যাত" : "Payment Rejected"}
                                </h2>
                                {statusData.rejectionReason && (
                                    <p className="text-sm text-on-surface-variant">{statusData.rejectionReason}</p>
                                )}
                            </>
                        )}

                        {isExpired && (
                            <>
                                <div className="w-16 h-16 mx-auto rounded-full bg-surface-container-high flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-on-surface-variant">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-on-surface-variant mb-2">
                                    {isBn ? "সেশন মেয়াদোত্তীর্ণ" : "Session Expired"}
                                </h2>
                                <p className="text-sm text-on-surface-variant">
                                    {isBn ? "অনুগ্রহ করে আবার চেষ্টা করুন" : "Please try again"}
                                </p>
                            </>
                        )}
                    </div>

                    {/* Updated due balance */}
                    {isCompleted && statusData.newDueBalance !== null && statusData.newDueBalance > 0 && (
                        <div className="rounded-2xl bg-surface-container-low p-5">
                            <p className="text-sm text-on-surface-variant mb-1">{isBn ? "বর্তমান বকেয়া" : "Current Due"}</p>
                            <p className="text-2xl font-bold text-on-surface">
                                {formatPrice(statusData.newDueBalance, locale)}
                            </p>
                        </div>
                    )}

                    {/* Back to due info */}
                    {(isCompleted || isRejected || isExpired) && (
                        <button
                            type="button"
                            onClick={() => {
                                setIntentId(null);
                                setStatusData(null);
                                setTrxId("");
                                if (isExpired || isRejected) {
                                    window.location.reload();
                                }
                            }}
                            className="w-full py-3 rounded-xl font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                        >
                            {isBn ? "ফিরে যান" : "Go Back"}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ─── Render: Main payment page ────────────────────────
    return (
        <div className="min-h-screen bg-surface p-4">
            <div className="max-w-md mx-auto space-y-5">
                {/* Business header */}
                <div className="text-center pt-4">
                    <h1 className="text-lg font-bold text-on-surface">{customerInfo.businessName}</h1>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                        {isBn ? "বকেয়া পেমেন্ট" : "Due Payment"}
                    </p>
                </div>

                {/* Due balance card */}
                <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-container p-6 text-center">
                    <p className="text-sm text-on-primary/80 mb-1">
                        {isBn ? `${customerInfo.customerName} এর বকেয়া` : `${customerInfo.customerName}'s Due`}
                    </p>
                    <p className="text-4xl font-extrabold text-on-primary">
                        {formatPrice(customerInfo.finalDueAmount, locale)}
                    </p>
                </div>

                {/* Last 3 due purchases */}
                {customerInfo.lastDuePurchases.length > 0 && (
                    <div className="rounded-2xl bg-surface-container-low p-5 space-y-3">
                        <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">
                            {isBn ? "সাম্প্রতিক বকেয়া কেনাকাটা" : "Recent Due Purchases"}
                        </h3>
                        {customerInfo.lastDuePurchases.map((purchase, idx) => (
                            <div key={idx} className="bg-surface-container-lowest rounded-xl p-4 space-y-1">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-bold text-on-surface">{purchase.description}</p>
                                    <p className="text-sm font-bold text-on-surface">
                                        {formatPrice(purchase.totalAmount, locale)}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                                    <span>{getRelativeTime(purchase.date, isBn)}</span>
                                    <span>
                                        {isBn ? "বকেয়ে: " : "Due: "}
                                        {formatPrice(purchase.dueAmount, locale)}
                                    </span>
                                </div>
                                {purchase.paymentsSince > 0 && (
                                    <p className="text-xs text-primary">
                                        {isBn ? `পরবর্তী পেমেন্ট: ${formatPrice(purchase.paymentsSince, locale)}` : `Paid since: ${formatPrice(purchase.paymentsSince, locale)}`}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Pay Now section */}
                <div className="rounded-2xl bg-surface-container-low p-5 space-y-4">
                    <h3 className="text-lg font-bold text-on-surface">
                        {isBn ? "পেমেন্ট করুন" : "Make Payment"}
                    </h3>

                    {/* MFS Provider Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-on-surface-variant">
                            {isBn ? "পেমেন্ট মাধ্যম নির্বাচন করুন" : "Select Payment Method"}
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {customerInfo.mfsPaymentOptions.map((option) => {
                                const t = MFS_THEMES[option.mfsType];
                                const isSelected = selectedMfs === option.mfsType;
                                return (
                                    <button
                                        key={option.mfsType}
                                        type="button"
                                        onClick={() => {
                                            setSelectedMfs(option.mfsType);
                                            setTrxError(null);
                                        }}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${isSelected
                                                ? "border-primary bg-primary/5"
                                                : "border-surface-container-highest bg-surface-container-lowest hover:border-primary/30"
                                            }`}
                                    >
                                        <Image
                                            src={t.logo}
                                            alt={isBn ? t.labelBn : t.labelEn}
                                            width={36}
                                            height={36}
                                            className="rounded-lg"
                                        />
                                        <span className="text-xs font-bold text-on-surface">
                                            {isBn ? t.labelBn : t.labelEn}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* MFS Number to pay */}
                    {selectedMfsOption && theme && (
                        <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: theme.lightBg }}>
                            <p className="text-sm font-semibold" style={{ color: theme.primary }}>
                                {isBn ? "এই নম্বরে পেমেন্ট পাঠান:" : "Send payment to this number:"}
                            </p>
                            <div className="flex items-center justify-between">
                                <p className="text-lg font-bold" style={{ color: theme.primary }}>
                                    {selectedMfsOption.fullNumber}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(selectedMfsOption.fullNumber, "number")}
                                    className="text-xs font-bold px-3 py-1.5 rounded-lg"
                                    style={{ backgroundColor: theme.primary, color: "white" }}
                                >
                                    {copiedField === "number"
                                        ? (isBn ? "কপি হয়েছে!" : "Copied!")
                                        : (isBn ? "কপি" : "Copy")}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Amount input */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-on-surface-variant">
                            {isBn ? "পরিমাণ (৳)" : "Amount (৳)"}
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl text-base font-medium text-on-surface bg-surface-container-lowest focus:ring-2 focus:ring-primary outline-none border-none"
                            placeholder={isBn ? "পরিমাণ লিখুন" : "Enter amount"}
                        />
                    </div>

                    {/* TrxID input */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-on-surface-variant">
                            {isBn ? "ট্রানজেকশন আইডি" : "Transaction ID"}
                        </label>
                        <input
                            type="text"
                            value={trxId}
                            onChange={(e) => handleTrxIdChange(e.target.value)}
                            maxLength={getTrxMaxLength(selectedMfs ?? undefined)}
                            className={`w-full px-4 py-3 rounded-xl text-base font-mono font-medium text-on-surface bg-surface-container-lowest outline-none border-none uppercase ${trxError ? "ring-2 ring-error" : "focus:ring-2 focus:ring-primary"
                                }`}
                            placeholder={theme ? (isBn ? theme.trxPlaceholder : theme.trxHint) : ""}
                        />
                        {trxError && (
                            <p className="text-xs text-error">{trxError}</p>
                        )}
                    </div>

                    {/* Submit button */}
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedMfs || !trxId.trim() || !amount}
                        className="w-full py-4 rounded-xl text-base font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                            background: theme?.gradient ?? "linear-gradient(135deg, #003727 0%, #00503a 100%)",
                        }}
                    >
                        {isSubmitting
                            ? (isBn ? "জমা দেওয়া হচ্ছে..." : "Submitting...")
                            : (isBn ? "পেমেন্ট জমা দিন" : "Submit Payment")}
                    </button>

                    {submitError && (
                        <p className="text-sm text-error text-center">{submitError}</p>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-on-surface-variant pb-8">
                    {isBn ? "সুরক্ষিত পেমেন্ট — DokaniAI" : "Secure Payment — DokaniAI"}
                </p>
            </div>
        </div>
    );
}
