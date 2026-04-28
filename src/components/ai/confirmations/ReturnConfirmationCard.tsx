"use client";

import { useTranslations } from "next-intl";
import { formatCurrencyBDT, formatLocalizedNumber } from "@/lib/localeNumber";

interface ReturnData {
    product_name?: string;
    productName?: string;
    quantity?: number;
    unit?: string;
    refund_amount?: number;
    refundAmount?: number;
    sale_reference?: string;
    saleReference?: string;
    reason?: string;
}

export default function ReturnConfirmationCard({ data }: { data: ReturnData }) {
    const t = useTranslations("shop.ai.confirmation");

    const product = data.product_name ?? data.productName ?? "—";
    const quantity = data.quantity ?? 0;
    const refundAmount = data.refund_amount ?? data.refundAmount ?? 0;
    const saleRef = data.sale_reference ?? data.saleReference ?? "";

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div>
                <span className="text-xs text-on-surface-variant">{t("product")}</span>
                <p className="font-bold text-on-surface">{product}</p>
            </div>
            <div>
                <span className="text-xs text-on-surface-variant">{t("quantity")}</span>
                <p className="font-bold text-on-surface">
                    {formatLocalizedNumber(quantity)} {data.unit ?? ""}
                </p>
            </div>
            <div>
                <span className="text-xs text-on-surface-variant">{t("refundAmount")}</span>
                <p className="font-bold text-primary text-lg">{formatCurrencyBDT(refundAmount)}</p>
            </div>
            {saleRef && (
                <div>
                    <span className="text-xs text-on-surface-variant">{t("returnRef")}</span>
                    <p className="font-bold text-on-surface">{saleRef}</p>
                </div>
            )}
        </div>
    );
}