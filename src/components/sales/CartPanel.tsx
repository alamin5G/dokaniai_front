"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import type { CartItem, DiscountMethod, PaymentMethod } from "@/types/sale";
import DiscountInput from "./DiscountInput";
import SmartQuantityInput from "./SmartQuantityInput";
import CartSuggestionChips from "./CartSuggestionChips";
import type { CartSuggestion } from "@/lib/cartIntelligenceApi";

interface CartPanelProps {
    cartItems: CartItem[];
    onQuantityChange: (productId: string, delta: number) => void;
    onQuantitySet: (productId: string, newQuantity: number) => void;
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
    givenAmount: string;
    onGivenAmountChange: (value: string) => void;
    isSubmitting: boolean;
    onSubmitCash: () => void;
    onSubmitCredit: () => void;
    error: string | null;
    notice: string | null;
    /** AI Cart Intelligence props */
    businessId: string;
    onAddSuggestion: (suggestion: CartSuggestion) => void;
}

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

export default function CartPanel({
    cartItems,
    onQuantityChange,
    onQuantitySet,
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
    givenAmount,
    onGivenAmountChange,
    isSubmitting,
    onSubmitCash,
    onSubmitCredit,
    error,
    notice,
    businessId,
    onAddSuggestion,
}: CartPanelProps) {
    const t = useTranslations("shop.sales");
    const locale = useLocale();
    const loc = resolveLocale(locale);

    // Auto-scroll cart to bottom when new item is added
    const cartItemsRef = useRef<HTMLDivElement>(null);
    const prevCartCountRef = useRef(cartItems.length);
    useEffect(() => {
        if (cartItems.length > prevCartCountRef.current && cartItemsRef.current) {
            cartItemsRef.current.scrollTop = cartItemsRef.current.scrollHeight;
        }
        prevCartCountRef.current = cartItems.length;
    }, [cartItems.length]);

    const currencyFormatter = new Intl.NumberFormat(loc, {
        maximumFractionDigits: 2,
    });

    function formatMoney(value: number): string {
        return currencyFormatter.format(value);
    }

    return (
        <aside className="flex w-full lg:w-[26rem] shrink-0 max-h-[50vh] lg:max-h-none flex-col border-t lg:border-t-0 lg:border-l border-surface-container-low bg-[rgba(255,255,255,0.7)] p-4 shadow-2xl backdrop-blur-xl">
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-lg font-bold text-primary">
                    <span className="material-symbols-outlined text-xl">shopping_cart</span>
                    {t("cart.title")}
                </h2>
                {cartItems.length > 0 ? (
                    <button
                        type="button"
                        onClick={onClearAll}
                        className="text-on-surface-variant transition-colors hover:text-tertiary"
                    >
                        <span className="material-symbols-outlined text-xl">delete_sweep</span>
                    </button>
                ) : null}
            </div>

            {/* Cart Items — scrollable when content overflows */}
            <div ref={cartItemsRef} className="mb-3 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
                {cartItems.length === 0 ? (
                    <p className="py-6 text-center text-sm text-on-surface-variant">
                        {t("cart.empty")}
                    </p>
                ) : (
                    cartItems.map((item) => (
                        <div
                            key={item.productId}
                            className="flex items-center gap-2 rounded-lg bg-surface-container-lowest px-2.5 py-2 shadow-sm"
                        >
                            {/* Name + unit price */}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-on-surface">
                                    {item.productName}
                                </p>
                                <p className="text-[11px] text-on-surface-variant">
                                    {t("cart.perUnit", {
                                        price: formatMoney(item.unitPrice),
                                        unit: item.unit,
                                    })}
                                </p>
                            </div>
                            {/* Quantity control */}
                            <SmartQuantityInput
                                quantity={item.quantity}
                                unit={item.unit ?? "pcs"}
                                onChange={(newQty) => onQuantitySet(item.productId, newQty)}
                            />
                            {/* Line total + remove */}
                            <div className="flex flex-col items-end gap-0.5">
                                <span className="whitespace-nowrap text-sm font-bold">
                                    ৳{formatMoney(item.unitPrice * item.quantity)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onRemoveItem(item.productId)}
                                    className="text-on-surface-variant/50 transition-colors hover:text-rose-500"
                                    title={t("cart.removeItem")}
                                >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* AI Cart Suggestions — shown when cart has items */}
            {cartItems.length > 0 && (
                <CartSuggestionChips
                    businessId={businessId}
                    cartProductIds={cartItems.map((i) => i.productId)}
                    sessionId={null}
                    onAddSuggestion={onAddSuggestion}
                />
            )}

            {/* Error / Notice */}
            {error ? (
                <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                    {error}
                </div>
            ) : null}
            {notice ? (
                <div className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                    {notice}
                </div>
            ) : null}

            {/* Discount & Totals */}
            <div className="space-y-3 border-t border-surface-container-low pt-3">
                {/* Discount Input */}
                <DiscountInput
                    method={discountMethod}
                    onMethodChange={onDiscountMethodChange}
                    value={discountValue}
                    onValueChange={onDiscountValueChange}
                />

                {/* Summary */}
                <div className="space-y-1 py-2">
                    <div className="flex justify-between text-xs text-on-surface-variant">
                        <span>{t("cart.subtotal")}</span>
                        <span className="font-medium">৳ {formatMoney(subtotal)}</span>
                    </div>
                    {discountAmount > 0 ? (
                        <div className="flex justify-between text-xs text-on-surface-variant">
                            <span>{t("cart.discount.applied", { amount: formatMoney(discountAmount) })}</span>
                            <span className="font-medium text-tertiary">
                                - ৳ {formatMoney(discountAmount)}
                            </span>
                        </div>
                    ) : null}
                    {taxAmount > 0 ? (
                        <div className="flex justify-between text-xs text-on-surface-variant">
                            <span>{t("cart.vat", { percent: taxRate })}</span>
                            <span className="font-medium">
                                + ৳ {formatMoney(taxAmount)}
                            </span>
                        </div>
                    ) : null}
                    <div className="flex items-end justify-between pt-1">
                        <span className="text-sm font-bold text-primary">{t("cart.total")}</span>
                        <div className="text-right">
                            <p className="text-2xl font-black leading-none text-primary">
                                ৳ {formatMoney(total)}
                            </p>
                        </div>
                    </div>

                    {/* Given Amount Input — partial payment */}
                    {cartItems.length > 0 && total > 0 && (
                        <>
                            <div className="flex items-center gap-2 pt-2">
                                <span className="text-xs font-bold text-on-surface-variant shrink-0">
                                    {t("cart.givenAmount")}
                                </span>
                                <div className="flex items-center gap-1 flex-1">
                                    <input
                                        type="number"
                                        min="0"
                                        max={total}
                                        step="1"
                                        value={givenAmount}
                                        onChange={(e) => onGivenAmountChange(e.target.value)}
                                        className="w-full rounded-lg bg-surface-container-low py-1.5 px-3 text-right text-sm font-bold text-on-surface outline-none focus:ring-1 focus:ring-primary"
                                        placeholder={formatMoney(total)}
                                    />
                                    <span className="text-xs font-bold text-on-surface-variant shrink-0">৳</span>
                                </div>
                            </div>
                            {(() => {
                                const parsed = givenAmount === "" ? total : Math.min(Math.max(parseFloat(givenAmount) || 0, 0), total);
                                const due = Math.max(0, total - parsed);
                                return due > 0 ? (
                                    <div className="flex justify-between text-xs pt-1">
                                        <span className="font-bold text-tertiary">{t("cart.dueAmount")}</span>
                                        <span className="font-bold text-tertiary">৳ {formatMoney(due)}</span>
                                    </div>
                                ) : null;
                            })()}
                        </>
                    )}
                </div>

                {/* Action Buttons — compact grid */}
                {(() => {
                    const parsedGiven = givenAmount === "" ? total : Math.min(Math.max(parseFloat(givenAmount) || 0, 0), total);
                    const dueAmount = Math.max(0, total - parsedGiven);
                    const hasDue = dueAmount > 0;
                    const hasItems = cartItems.length > 0;
                    return (
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={onSubmitCash}
                                disabled={isSubmitting || !hasItems || hasDue}
                                className="flex w-full flex-col items-center justify-center rounded-xl bg-primary py-3 text-white shadow-md transition-all active:scale-[0.98] hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <span className="text-sm font-bold">
                                    {isSubmitting ? t("cart.saving") : t("cart.cashSale")}
                                </span>
                                <span className="text-[10px] opacity-80">{t("cart.cashSaleDesc")}</span>
                            </button>
                            <button
                                type="button"
                                onClick={onSubmitCredit}
                                disabled={isSubmitting || !hasItems || !hasDue}
                                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-secondary py-3 text-sm font-bold text-white shadow-md transition-all active:scale-[0.98] hover:bg-secondary-container disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <span className="material-symbols-outlined text-base">
                                    account_balance_wallet
                                </span>
                                {isSubmitting ? t("cart.saving") : t("cart.dueSale")}
                            </button>
                        </div>
                    );
                })()}
            </div>
        </aside>
    );
}
