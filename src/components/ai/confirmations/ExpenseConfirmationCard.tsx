"use client";

import { useTranslations } from "next-intl";
import { formatCurrencyBDT } from "@/lib/localeNumber";

interface ExpenseData {
    category?: string;
    expenseCategory?: string;
    amount?: number;
    description?: string;
    note?: string;
    date?: string;
}

export default function ExpenseConfirmationCard({ data }: { data: ExpenseData }) {
    const t = useTranslations("shop.ai.confirmation");

    const category = data.category ?? data.expenseCategory ?? "—";
    const amount = data.amount ?? 0;
    const description = data.description ?? data.note ?? "";

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
                <span className="text-xs text-on-surface-variant">{t("category")}</span>
                <p className="font-bold text-on-surface">{category}</p>
            </div>
            <div>
                <span className="text-xs text-on-surface-variant">{t("amount")}</span>
                <p className="font-bold text-primary text-lg">{formatCurrencyBDT(amount)}</p>
            </div>
            {description && (
                <div>
                    <span className="text-xs text-on-surface-variant">{t("description")}</span>
                    <p className="font-bold text-on-surface">{description}</p>
                </div>
            )}
        </div>
    );
}