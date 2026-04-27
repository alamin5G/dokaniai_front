"use client";

import { useTranslations } from "next-intl";
import { useCartSuggestions } from "@/hooks/useCartSuggestions";
import { logCartEvent } from "@/lib/cartIntelligenceApi";
import type { CartSuggestion } from "@/lib/cartIntelligenceApi";

/** Max product name length before truncation */
const PRODUCT_NAME_MAX_WIDTH = 100;

interface CartSuggestionChipsProps {
    businessId: string;
    cartProductIds: string[];
    sessionId: string | null;
    onAddSuggestion: (product: CartSuggestion) => void;
}

/**
 * Pure presentation component for cart product suggestion chips.
 * SRP: Only renders UI — data fetching delegated to useCartSuggestions hook.
 * OCP: i18n via useTranslations with fallback labels.
 */
export default function CartSuggestionChips({
    businessId,
    cartProductIds,
    sessionId,
    onAddSuggestion,
}: CartSuggestionChipsProps) {
    const t = useTranslations("shop.sales");
    const { suggestions, loading } = useCartSuggestions(businessId, cartProductIds);

    const handleAdd = async (suggestion: CartSuggestion) => {
        onAddSuggestion(suggestion);
        if (sessionId) {
            logCartEvent(businessId, {
                sessionId,
                eventType: "ITEM_ADDED",
                productId: suggestion.productId,
                quantity: 1,
                metadata: `suggestion:${suggestion.source}`,
            }).catch(() => { /* non-critical fire-and-forget */ });
        }
    };

    if (loading && suggestions.length === 0) {
        return (
            <div className="px-3 py-2 text-xs text-gray-400 animate-pulse">
                {t("loadingSuggestions", { fallback: "Loading suggestions..." })}
            </div>
        );
    }

    if (suggestions.length === 0) return null;

    return (
        <div className="px-3 py-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1.5">
                {t("frequentlyBought", { fallback: "💡 Frequently bought together" })}
            </p>
            <div className="flex flex-wrap gap-1.5">
                {suggestions.map(renderChip)}
            </div>
        </div>
    );

    function renderChip(suggestion: CartSuggestion) {
        return (
            <button
                key={suggestion.productId}
                onClick={() => handleAdd(suggestion)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs
                    bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full
                    transition-colors border border-blue-200"
                title={`${suggestion.productName} — ৳${suggestion.unitPrice}`}
            >
                <span className={`max-w-[${PRODUCT_NAME_MAX_WIDTH}px] truncate`}>
                    {suggestion.productName}
                </span>
                {suggestion.confidenceScore != null && (
                    <span className="text-[10px] text-blue-400">
                        {Math.round(suggestion.confidenceScore * 100)}%
                    </span>
                )}
                <span className="text-blue-400">+</span>
            </button>
        );
    }
}