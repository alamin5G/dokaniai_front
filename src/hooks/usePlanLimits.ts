"use client";

import { useCallback, useEffect, useState } from "react";
import { getPlanLimits } from "@/lib/subscriptionApi";
import type { PlanLimits } from "@/types/subscription";

const DEFAULT_MAX_QUERY_CHARACTERS = 150;

/**
 * Hook to fetch and cache plan limits for the current user.
 * Used to enforce subscription-based character limits on AI input fields.
 */
export function usePlanLimits() {
    const [limits, setLimits] = useState<PlanLimits | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchLimits = useCallback(async () => {
        try {
            const data = await getPlanLimits();
            setLimits(data);
        } catch {
            // Not authenticated or error — use defaults
            setLimits(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchLimits();
    }, [fetchLimits]);

    const maxQueryCharacters = limits?.maxQueryCharacters ?? DEFAULT_MAX_QUERY_CHARACTERS;

    return { limits, maxQueryCharacters, loading, refetch: fetchLimits };
}
