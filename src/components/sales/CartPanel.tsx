"use client";

import { useLocale, useTranslations } from "next-intl";
import type { CartItem, DiscountMethod, PaymentMethod } from "@/types/sale";
import DiscountInput from "./DiscountInput";

interface CartPanelProps {
    cartItems: CartItem[];
    onQuantityChange: (productId: string, delta: number) => void;
    onRemoveItem: (productId: string) => void;
    onClearAll: () => void;
    discountMethod: DiscountMethod;
    onDiscountMethodChange: (method: DiscountMethod) => void;
    discountValue: string;
    onDiscountValueChange: (value: string) => void;
    discountAmount: number;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    isSubmitting: boolean;
    onSubmitCash: () => void;
    onSubmitCredit: () => void;
    error: string | null;
    notice: string | null;
}

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

export default function CartPanel({
    cartItems,
    onQuantityChange,
    onRemoveItem,
    onClearAll,
    discountMethod,
    onDiscountMethodChange,
    discountValue,
    onDiscountValueChange,
    discountAmount,
    subtotal,
    taxRate,
    taxAmount,
    total,
    isSubmitting,
    onSubmitCash,
    onSubmitCredit,
    error,
    notice,
}: CartPanelProps) {
    const t = useTranslations("shop.sales");
    const locale = useLocale();
    const loc = resolveLocale(locale);

    const currencyFormatter = new Intl.NumberFormat(loc, {
        maximumFractionDigits: 2,
    });

    function formatMoney(value: number): string {
        return currencyFormatter.format(value);
    }

    return (
        <aside className="flex w-96 flex-col border-l border-surface-container-low bg-[rgba(255,255,255,0.7)] p-6 shadow-2xl backdrop-blur-xl">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-bold text-primary">
                    <span className="material-symbols-outlined">shopping_cart</span>
                    {t("cart.title")}
                </h2>
                {cartItems.length > 0 ? (
                    <button
                        type="button"
                        onClick={onClearAll}
                        className="text-on-surface-variant transition-colors hover:text-tertiary"
                    >
                        <span className="material-symbols-outlined">delete_sweep</span>
                    </button>
                ) : null}
            </div>

            {/* Cart Items */}
            <div className="mb-6 flex-1 space-y-3 overflow-y-auto pr-2">
                {cartItems.length === 0 ? (
                    <p className="py-8 text-center text-sm text-on-surface-variant">
                        {t("cart.empty")}
                    </p>
                ) : (
                    cartItems.map((item) => (
                        <div
                            key={item.productId}
                            className="flex flex-col gap-2 rounded-xl bg-surface-container-lowest p-3 shadow-sm"
                        >
                            <div className="flex items-start justify-between">
                                <span className="font-semibold text-on-surface">
                                    {item.productName}
                                </span>
                                <span className="font-bold">
                                    ৳ {formatMoney(item.unitPrice * item.quantity)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-on-surface-variant">
                                    {t("cart.perUnit", {
                                        price: formatMoney(item.unitPrice),
                                        unit: item.unit,
                                    })}
                                </span>
                                <div className="flex items-center gap-3 rounded-lg bg-surface-container-low p-1">
                                    <button
                                        type="button"
                                        onClick={() => onQuantityChange(item.productId, -1)}
                                        className="flex h-6 w-6 items-center justify-center rounded bg-white text-primary shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-sm">
                                            remove
                                        </span>
                                    </button>
                                    <span className="w-4 text-center text-sm font-bold">
                                        {item.quantity}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => onQuantityChange(item.productId, 1)}
                                        className="flex h-6 w-6 items-center justify-center rounded bg-white text-primary shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-sm">
                                            add
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Error / Notice */}
            {error ? (
                <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    {error}
                </div>
            ) : null}
            {notice ? (
                <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {notice}
                </div>
            ) : null}

            {/* Discount & Totals */}
            <div className="space-y-4 border-t border-surface-container-low pt-6">
                {/* Discount Input */}
                <DiscountInput
                    method={discountMethod}
                    onMethodChange={onDiscountMethodChange}
                    value={discountValue}
                    onValueChange={onDiscountValueChange}
                />

                {/* Summary */}
                <div className="space-y-2 py-4">
                    <div className="flex justify-between text-sm text-on-surface-variant">
                        <span>{t("cart.subtotal")}</span>
                        <span className="font-medium">৳ {formatMoney(subtotal)}</span>
                    </div>
                    {discountAmount > 0 ? (
                        <div className="flex justify-between text-sm text-on-surface-variant">
                            <span>{t("cart.discount.applied", { amount: formatMoney(discountAmount) })}</span>
                            <span className="font-medium text-tertiary">
                                - ৳ {formatMoney(discountAmount)}
                            </span>
                        </div>
                    ) : null}
                    {taxAmount > 0 ? (
                        <div className="flex justify-between text-sm text-on-surface-variant">
                            <span>{t("cart.vat", { percent: taxRate })}</span>
                            <span className="font-medium">
                                + ৳ {formatMoney(taxAmount)}
                            </span>
                        </div>
                    ) : null}
                    <div className="flex items-end justify-between pt-2">
                        <span className="font-bold text-primary">{t("cart.total")}</span>
                        <div className="text-right">
                            <p className="text-3xl font-black leading-none text-primary">
                                ৳ {formatMoney(total)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 gap-3">
                    <button
                        type="button"
                        onClick={onSubmitCash}
                        disabled={isSubmitting || cartItems.length === 0}
                        className="flex w-full flex-col items-center justify-center rounded-2xl bg-primary py-5 text-white shadow-lg transition-all active:scale-[0.98] hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <span className="text-lg font-bold">
                            {isSubmitting ? t("cart.saving") : t("cart.cashSale")}
                        </span>
                        <span className="text-xs opacity-80">{t("cart.cashSaleDesc")}</span>
                    </button>
                    <button
                        type="button"
                        onClick={onSubmitCredit}
                        disabled={isSubmitting || cartItems.length === 0}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary py-4 font-bold text-white shadow-md transition-all active:scale-[0.98] hover:bg-secondary-container disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <span className="material-symbols-outlined">
                            account_balance_wallet
                        </span>
                        {isSubmitting ? t("cart.saving") : t("cart.creditSale")}
                    </button>
                </div>
            </div>
        </aside>
    );
}
