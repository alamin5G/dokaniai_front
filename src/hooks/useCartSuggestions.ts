/**
 * Custom hook for cart product suggestions.
 * SRP: Separates data fetching + caching from presentation.
 */

import { useEffect, useState, useCallback } from "react";
import { fetchCartSuggestions } from "@/lib/cartIntelligenceApi";
import type { CartSuggestion } from "@/lib/cartIntelligenceApi";

/** Configuration constants — no magic numbers */
const SUGGESTION_LIMIT = 6;
const DEBOUNCE_MS = 500;

interface UseCartSuggestionsResult {
    suggestions: CartSuggestion[];
    loading: boolean;
    error: string | null;
    /** Imperative reload */
    refresh: () => void;
}

export function useCartSuggestions(
    businessId: string,
    cartProductIds: string[],
    limit: number = SUGGESTION_LIMIT,
): UseCartSuggestionsResult {
    const [suggestions, setSuggestions] = useState<CartSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!businessId) return;
        setLoading(true);
        setError(null);
        try {
            const result = await fetchCartSuggestions(businessId, cartProductIds, limit);
            setSuggestions(result);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load suggestions";
            setError(message);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    }, [businessId, cartProductIds, limit]);

    useEffect(() => {
        const timer = setTimeout(load, DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [load]);

    return { suggestions, loading, error, refresh: load };
}