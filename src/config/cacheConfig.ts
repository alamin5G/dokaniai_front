/**
 * Centralised SWR Cache Duration Config
 *
 * All client-side cache durations in one place.
 * Backend Redis TTL is configured in application.yml (ai.gemini.category-insight-cache-days).
 *
 * Hierarchy: SWR (browser memory) → Redis (server, 14 days) → Gemini API (token cost)
 */

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

export const SWR_CACHE = {
    /** AI-generated category market insight — changes rarely, Redis caches 14 days */
    categoryInsight: 24 * HOUR, // 24 hours

    /** Product list — inventory changes frequently */
    productList: 2 * MINUTE, // 2 minutes

    /** Restock intelligence predictions — daily scheduler updates */
    restockInsight: 6 * HOUR, // 6 hours
} as const;