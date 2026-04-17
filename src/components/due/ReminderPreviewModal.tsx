"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import type { CustomerDueSummary } from "@/types/due";
import { generateDueReminder, generateAiReminder } from "@/lib/dueApi";

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

interface ReminderPreviewModalProps {
    businessId: string;
    customer: CustomerDueSummary;
    onClose: () => void;
    onSent: () => void;
}

export default function ReminderPreviewModal({
    businessId,
    customer,
    onClose,
    onSent,
}: ReminderPreviewModalProps) {
    const t = useTranslations("shop.dueLedger");
    const locale = useLocale();
    const loc = resolveLocale(locale);

    const currencyFmt = new Intl.NumberFormat(loc, { maximumFractionDigits: 0 });
    function formatMoney(value: number | null | undefined): string {
        return currencyFmt.format(value ?? 0);
    }

    const [customMessage, setCustomMessage] = useState("");
    const [useCustom, setUseCustom] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [previewMessage, setPreviewMessage] = useState<string | null>(null);
    const [alreadySentToday, setAlreadySentToday] = useState(false);
    const [resetAt, setResetAt] = useState<string | null>(null);
    const [aiGenerated, setAiGenerated] = useState(false);

    useEffect(() => {
        handlePreview();
    }, []);

    async function handlePreview() {
        setIsLoading(true);
        try {
            if (useCustom && customMessage.trim()) {
                const link = await generateDueReminder(
                    businessId,
                    customer.customerId,
                    customMessage.trim()
                );
                setPreviewMessage(link.message);
                setAiGenerated(false);
            } else {
                const res = await generateAiReminder(businessId, customer.customerId);
                setPreviewMessage(res.message);
                setAiGenerated(res.contextType !== undefined);
                if (res.alreadySentToday) {
                    setAlreadySentToday(true);
                    setResetAt(res.resetAt);
                }
            }
        } catch {
            const link = await generateDueReminder(businessId, customer.customerId);
            setPreviewMessage(link.message);
            setAiGenerated(false);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSend() {
        setIsLoading(true);
        try {
            if (useCustom && customMessage.trim()) {
                const link = await generateDueReminder(
                    businessId,
                    customer.customerId,
                    customMessage.trim()
                );
                if (link.link) window.open(link.link, "_blank");
            } else {
                const res = await generateAiReminder(businessId, customer.customerId);
                if (res.link) window.open(res.link, "_blank");
                if (res.alreadySentToday) {
                    setAlreadySentToday(true);
                    setResetAt(res.resetAt);
                }
            }
            onSent();
        } catch {
        } finally {
            setIsLoading(false);
        }
    }

    function formatResetTime(iso: string | null): string {
        if (!iso) return "";
        const d = new Date(iso);
        const now = new Date();
        const hours = Math.max(1, Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60)));
        return locale?.startsWith("bn")
            ? `কাল সকালে আবার পাঠাতে পারবেন (${hours} ঘণ্টা বাকি)`
            : `Available tomorrow morning (${hours}h remaining)`;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-surface-container-lowest p-6 shadow-2xl space-y-5">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                        <svg className="w-6 h-6 fill-[#25D366]" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.628 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        {t("reminder.title")}
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 hover:bg-surface-container transition-colors"
                    >
                        <span className="material-symbols-outlined text-on-surface-variant">close</span>
                    </button>
                </div>

                <div className="rounded-xl bg-surface-container p-4 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-on-surface-variant">
                            {t("reminder.customer")}
                        </span>
                        <span className="text-sm font-bold text-on-surface">
                            {customer.customerName}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-on-surface-variant">
                            {t("reminder.dueAmount")}
                        </span>
                        <span className="text-lg font-bold text-error">
                            ৳{formatMoney(customer.currentBalance)}
                        </span>
                    </div>
                </div>

                <div className="rounded-xl bg-primary-container/30 p-4 flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary mt-0.5">info</span>
                    <div>
                        <p className="text-sm font-bold text-on-surface">
                            {t("reminder.mfsNumber")}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-1">
                            {t("reminder.mfsNumberHint")}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => { setUseCustom(false); setAlreadySentToday(false); }}
                        className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${!useCustom
                                ? "bg-primary text-white"
                                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                            }`}
                    >
                        <span className="flex items-center justify-center gap-1.5">
                            <span className="material-symbols-outlined text-base">smart_toy</span>
                            {locale?.startsWith("bn") ? "AI রিমাইন্ডার" : "AI Reminder"}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setUseCustom(true)}
                        className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${useCustom
                                ? "bg-primary text-white"
                                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                            }`}
                    >
                        {t("reminder.customMessage")}
                    </button>
                </div>

                {useCustom && (
                    <textarea
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        className="w-full rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface min-h-[80px] resize-y"
                        placeholder={t("reminder.customMessagePlaceholder")}
                    />
                )}

                {alreadySentToday && !useCustom && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-600 text-base">schedule</span>
                        <p className="text-xs text-amber-800">
                            {locale?.startsWith("bn")
                                ? "আজ ইতিমধ্যে এই গ্রাহককে রিমাইন্ডার পাঠানো হয়েছে। তবে WhatsApp এ যেতে পারবেন।"
                                : "Already sent today. You can still open WhatsApp."}
                        </p>
                    </div>
                )}

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-on-surface-variant">
                            {t("reminder.preview")}
                        </span>
                        {aiGenerated && previewMessage && (
                            <span className="text-[10px] font-bold text-primary bg-primary-container/50 rounded-full px-2 py-0.5">
                                AI
                            </span>
                        )}
                    </div>
                    {isLoading && !previewMessage && (
                        <div className="rounded-xl bg-surface-container p-4 flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined animate-spin text-primary text-base">progress_activity</span>
                            <span className="text-xs text-on-surface-variant">
                                {locale?.startsWith("bn") ? "AI মেসেজ তৈরি হচ্ছে..." : "Generating AI message..."}
                            </span>
                        </div>
                    )}
                    {previewMessage && (
                        <div className="rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 p-4">
                            <p className="text-sm text-on-surface whitespace-pre-wrap">{previewMessage}</p>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-xl bg-surface-container px-4 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                    >
                        {t("reminder.close")}
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={isLoading}
                        className="flex-1 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white hover:bg-[#25D366]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.628 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        {isLoading ? t("reminder.sending") : t("reminder.send")}
                    </button>
                </div>
            </div>
        </div>
    );
}
