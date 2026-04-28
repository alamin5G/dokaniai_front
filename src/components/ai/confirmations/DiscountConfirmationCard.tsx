"use client";

import { useTranslations } from "next-intl";
import { formatCurrencyBDT, formatLocalizedNumber } from "@/lib/localeNumber";

interface DiscountData {
    discount_type?: string;
    discountType?: string;
    discount_method?: string;
    discountMethod?: string;
    discount_value?: number;
    discountValue?: number;
    discount_calc?: string;
    discountCalc?: string;
    product_name?: string;
    productName?: string;
    percentage?: number;
    fixedAmount?: number;
}

export default function DiscountConfirmationCard({ data }: { data: DiscountData }) {
    const t = useTranslations("shop.ai.confirmation");

    const discountType = data.discount_type ?? data.discountType ?? "—";
    const method = data.discount_method ?? data.discountMethod ?? "PERCENTAGE";
    const value = data.discount_value ?? data.discountValue ?? data.percentage ?? data.fixedAmount ?? 0;
    const calc = data.discount_calc ?? data.discountCalc ?? "";

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div>
                <span className="text-xs text-on-surface-variant">{t("discountType")}</span>
                <p className="font-bold text-on-surface">{discountType}</p>
            </div>
            <div>
                <span className="text-xs text-on-surface-variant">{t("discountMethod")}</span>
                <p className="font-bold text-on-surface">
                    {method === "PERCENTAGE" || method === "percentage" ? "%" : t("cash")}
                </p>
            </div>
            <div>
                <span className="text-xs text-on-surface-variant">{t("discountValue")}</span>
                <p className="font-bold text-primary text-lg">
                    {method === "PERCENTAGE" || method === "percentage"
                        ? `${formatLocalizedNumber(value)}%`
                        : formatCurrencyBDT(value)}
                </p>
            </div>
            {calc && (
                <div>
                    <span className="text-xs text-on-surface-variant">{t("discountCalc")}</span>
                    <p className="font-bold text-on-surface">{calc}</p>
                </div>
            )}
        </div>
    );
}