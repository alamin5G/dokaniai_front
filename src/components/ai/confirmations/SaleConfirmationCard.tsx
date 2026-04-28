"use client";

import { useTranslations } from "next-intl";
import { formatCurrencyBDT, formatLocalizedNumber } from "@/lib/localeNumber";

interface SaleItem {
    product_name?: string;
    name?: string;
    quantity?: number;
    unit?: string;
    unit_price?: number;
    price?: number;
    total_price?: number;
    total?: number;
}

interface SaleData {
    items?: SaleItem[];
    payment_type?: string;
    paymentType?: string;
    total_amount?: number;
    totalAmount?: number;
    customer_name?: string;
    customerName?: string;
    discount?: number;
}

export default function SaleConfirmationCard({ data }: { data: SaleData }) {
    const t = useTranslations("shop.ai.confirmation");

    const items = data.items ?? [];
    const paymentType = data.payment_type ?? data.paymentType ?? "CASH";
    const totalAmount = data.total_amount ?? data.totalAmount ?? 0;

    return (
        <div className="space-y-3">
            {/* Items */}
            {items.length > 0 ? (
                <div className="space-y-2">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                        {t("items")}
                    </p>
                    {items.map((item, i) => (
                        <div
                            key={i}
                            className="grid grid-cols-1 sm:grid-cols-4 gap-2 rounded-xl bg-surface-container p-3 text-sm"
                        >
                            <div>
                                <span className="text-xs text-on-surface-variant">{t("product")}</span>
                                <p className="font-bold text-on-surface">
                                    {item.product_name ?? item.name ?? "—"}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs text-on-surface-variant">{t("quantity")}</span>
                                <p className="font-bold text-on-surface">
                                    {formatLocalizedNumber(item.quantity ?? 0)} {item.unit ?? ""}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs text-on-surface-variant">{t("unitPrice")}</span>
                                <p className="font-bold text-on-surface">
                                    {formatCurrencyBDT(item.unit_price ?? item.price ?? 0)}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs text-on-surface-variant">{t("total")}</span>
                                <p className="font-bold text-primary">
                                    {formatCurrencyBDT(item.total_price ?? item.total ?? 0)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-xl bg-surface-container p-3 text-sm text-on-surface-variant">
                    {formatCurrencyBDT(totalAmount)}
                </div>
            )}

            {/* Summary row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                    <span className="text-xs text-on-surface-variant">{t("total")}</span>
                    <p className="font-bold text-primary text-lg">
                        {formatCurrencyBDT(totalAmount)}
                    </p>
                </div>
                <div>
                    <span className="text-xs text-on-surface-variant">{t("payment")}</span>
                    <p className="font-bold text-on-surface">
                        {paymentType === "CREDIT" || paymentType === "credit"
                            ? t("credit")
                            : t("cash")}
                    </p>
                </div>
                {(data.customer_name ?? data.customerName) && (
                    <div>
                        <span className="text-xs text-on-surface-variant">{t("customer")}</span>
                        <p className="font-bold text-on-surface">
                            {data.customer_name ?? data.customerName}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}