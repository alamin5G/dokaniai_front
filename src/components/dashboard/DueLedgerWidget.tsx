"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useBusinessStore } from "@/store/businessStore";
import { useCustomersWithDue } from "@/hooks/useDueLedger";
import ReminderPreviewModal from "@/components/due/ReminderPreviewModal";
import type { CustomerDueSummary } from "@/types/due";

// ---------------------------------------------------------------------------
// Inline SVG Icons
// ---------------------------------------------------------------------------

function IconBook({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
        </svg>
    );
}

function IconChat({ className = "w-4 h-4" }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round"
                d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
        </svg>
    );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBDT(amount: number): string {
    return `৳ ${amount.toLocaleString("bn-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function daysSince(dateStr: string | null): number | null {
    if (!dateStr) return null;
    const time = new Date(dateStr).getTime();
    if (Number.isNaN(time)) return null;
    return Math.max(0, Math.floor((Date.now() - time) / 86400000));
}

// ---------------------------------------------------------------------------
// DueLedgerWidget Component
// ---------------------------------------------------------------------------

export default function DueLedgerWidget() {
    const t = useTranslations("dashboard.dueLedger");
    const router = useRouter();
    const activeBusiness = useBusinessStore((s) => s.activeBusiness);
    const businessId = activeBusiness?.id ?? null;

    const { customersWithDue, isLoading, error, mutate } = useCustomersWithDue(businessId);
    const [reminderCustomer, setReminderCustomer] = useState<CustomerDueSummary | null>(null);

    const top5 = customersWithDue.slice(0, 5);
    const totalDue = customersWithDue.reduce((sum, c) => sum + (c.currentBalance ?? 0), 0);
    const dueLedgerHref = businessId ? `/shop/${businessId}/due-ledger` : "/shop";

    function openDueLedger(customerId?: string) {
        if (!businessId) return;
        router.push(customerId ? `${dueLedgerHref}?customer=${customerId}` : dueLedgerHref);
    }

    // ── Loading skeleton ──────────────────────────────────────
    if (isLoading) {
        return (
            <section className="bg-surface-container-lowest rounded-2xl p-6 animate-pulse">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-6 h-6 bg-surface-container-high rounded" />
                    <div className="h-6 w-32 bg-surface-container-high rounded" />
                </div>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-surface-container-high" />
                            <div className="space-y-1">
                                <div className="h-4 w-24 bg-surface-container-high rounded" />
                                <div className="h-3 w-16 bg-surface-container-high rounded" />
                            </div>
                        </div>
                        <div className="h-4 w-16 bg-surface-container-high rounded" />
                    </div>
                ))}
            </section>
        );
    }

    if (error) {
        return (
            <section className="bg-surface-container-lowest rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6 text-secondary">
                    <IconBook className="w-6 h-6" />
                    <h4 className="text-xl font-bold">{t("title")}</h4>
                </div>
                <div className="rounded-xl bg-error-container px-4 py-5 text-center">
                    <p className="text-sm font-bold text-on-error-container">{t("loadError")}</p>
                    <button
                        type="button"
                        onClick={() => mutate()}
                        className="mt-3 rounded-full bg-error px-4 py-2 text-xs font-bold text-on-error"
                    >
                        {t("retry")}
                    </button>
                </div>
            </section>
        );
    }

    // ── Empty state ───────────────────────────────────────────
    if (customersWithDue.length === 0) {
        return (
            <section className="bg-surface-container-lowest rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6 text-secondary">
                    <IconBook className="w-6 h-6" />
                    <h4 className="text-xl font-bold">{t("title")}</h4>
                </div>
                <div className="text-center py-8 text-on-surface-variant">
                    <p className="text-sm font-bold">{t("noDues")}</p>
                    <p className="mt-1 text-xs">{t("noDuesDesc")}</p>
                </div>
                <button
                    type="button"
                    onClick={() => openDueLedger()}
                    disabled={!businessId}
                    className="w-full mt-4 bg-secondary text-on-secondary py-3 rounded-xl font-bold text-sm"
                >
                    {t("viewAll")}
                </button>
            </section>
        );
    }

    // ── Main content ──────────────────────────────────────────
    return (
        <>
            <section className="bg-surface-container-lowest rounded-2xl p-6">
                {/* Header with total */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-secondary">
                        <IconBook className="w-6 h-6" />
                        <h4 className="text-xl font-bold">{t("title")}</h4>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-on-surface-variant">
                            {t("totalDue")}
                        </p>
                        <p className="font-bold text-tertiary text-lg">{formatBDT(totalDue)}</p>
                    </div>
                </div>
                <p className="mb-4 text-xs font-medium text-on-surface-variant">
                    {t("customersCount", { count: customersWithDue.length })}
                </p>

                {/* Customer List */}
                <div className="space-y-4">
                    {top5.map((customer) => {
                        const lastTxDays = daysSince(customer.lastTransactionDate);
                        return (
                            <div
                                key={customer.customerId}
                                className="flex items-center justify-between cursor-pointer hover:bg-surface-container-high/50 rounded-lg px-1 py-0.5 -mx-1 transition-colors"
                                onClick={() => openDueLedger(customer.customerId)}
                            >
                                {/* Left: Avatar + Info */}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant font-bold text-sm">
                                        {(customer.customerName || "?").charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{customer.customerName}</p>
                                        <p className="text-[10px] text-on-surface-variant">
                                            {lastTxDays === null
                                                ? t("lastTransactionUnknown")
                                                : t("lastDue", { days: lastTxDays })}
                                        </p>
                                    </div>
                                </div>

                                {/* Right: Amount + WhatsApp */}
                                <div className="flex items-center gap-3">
                                    <p className="font-bold text-tertiary text-sm">
                                        {formatBDT(customer.currentBalance ?? 0)}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setReminderCustomer(customer);
                                        }}
                                        className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center min-w-[32px] min-h-[32px] hover:bg-primary/20 transition-colors"
                                        aria-label={t("sendReminderAria", { name: customer.customerName })}
                                        title={t("sendReminder")}
                                    >
                                        <IconChat className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* View All Button */}
                <button
                    type="button"
                    onClick={() => openDueLedger()}
                    disabled={!businessId}
                    className="w-full mt-6 bg-secondary text-on-secondary py-3 rounded-xl font-bold text-sm"
                >
                    {t("viewAll")}
                </button>
            </section>

            {/* WhatsApp Reminder Modal */}
            {reminderCustomer && (
                <ReminderPreviewModal
                    businessId={businessId ?? ""}
                    customer={reminderCustomer}
                    onClose={() => setReminderCustomer(null)}
                    onSent={() => {
                        setReminderCustomer(null);
                        mutate();
                    }}
                />
            )}
        </>
    );
}
