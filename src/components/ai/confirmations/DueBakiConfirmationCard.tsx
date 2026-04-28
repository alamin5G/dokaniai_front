"use client";

import { useTranslations } from "next-intl";
import { formatCurrencyBDT } from "@/lib/localeNumber";

interface DueBakiData {
    customer_name?: string;
    customerName?: string;
    amount?: number;
    items?: string;
    description?: string;
    dueDate?: string;
}

export default function DueBakiConfirmationCard({ data }: { data: DueBakiData }) {
    const t = useTranslations("shop.ai.confirmation");

    const customer = data.customer_name ?? data.customerName ?? "—";
    const amount = data.amount ?? 0;
    const items = data.items ?? data.description ?? "";

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
            {items && (
                <div>
                    <span className="text-xs text-on-surface-variant">{t("items")}</span>
                    <p className="font-bold text-on-surface">{items}</p>
                </div>
            )}
        </div>
    );
}