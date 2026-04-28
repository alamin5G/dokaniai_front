"use client";

import { useTranslations } from "next-intl";
import { formatCurrencyBDT } from "@/lib/localeNumber";

interface DueJomaData {
    customer_name?: string;
    customerName?: string;
    amount?: number;
    payment_method?: string;
    paymentMethod?: string;
}

export default function DueJomaConfirmationCard({ data }: { data: DueJomaData }) {
    const t = useTranslations("shop.ai.confirmation");

    const customer = data.customer_name ?? data.customerName ?? "—";
    const amount = data.amount ?? 0;
    const method = data.payment_method ?? data.paymentMethod ?? "CASH";

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
                <span className="text-xs text-on-surface-variant">{t("customer")}</span>
                <p className="font-bold text-on-surface">{customer}</p>
            </div>
            <div>
                <span className="text-xs text-on-surface-variant">{t("amount")}</span>
                <p className="font-bold text-primary text-lg">{formatCurrencyBDT(amount)}</p>
            </div>
            <div>
                <span className="text-xs text-on-surface-variant">{t("paymentMethod")}</span>
                <p className="font-bold text-on-surface">
                    {method === "CREDIT" || method === "credit" ? t("credit") : t("cash")}
                </p>
            </div>
        </div>
    );
}