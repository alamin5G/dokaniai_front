/**
 * Centralised SWR Cache Duration Config
 *
 * All client-side cache durations in one place.
 * Backend Redis TTL is configured in application.yml (ai.gemini.category-insight-cache-days).
 *
 * Hierarchy: SWR (browser memory) → Redis (server, 14 days) → Gemini API (token cost)
 *
 * SSE-driven optimistic updates bypass revalidation for stock alerts,
 * so these TTLs mainly control initial-load and background-refresh timing.
 */

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;
const SECOND = 1000;

export const SWR_CACHE = {
    // ─── Products ──────────────────────────────────────────────
    /** Product list — SSE pushes status/stock changes in real-time.
     *  5 min dedup is safe: only prevents duplicate in-flight requests.
     *  Freshness is maintained by SSE optimistic patches. */
    productList: 5 * MINUTE,       // 5 minutes

    /** Product stats (total, low-stock count) — SSE invalidates after 3s deferred sync.
     *  Stats change rarely between SSE events. */
    productStats: 2 * MINUTE,      // 2 minutes

    /** Low-stock / out-of-stock products — SSE patches this list optimistically.
     *  Without SSE, 1 min would be needed. With SSE, 5 min is safe. */
    lowStockProducts: 5 * MINUTE,  // 5 minutes

    /** Stock alert report (inventory tab) — SSE invalidates on stock changes.
     *  Only fetched when user opens the inventory tab. */
    stockAlerts: 5 * MINUTE,       // 5 minutes

    // ─── AI / Insights ────────────────────────────────────────
    /** AI-generated category market insight — changes rarely, Redis caches 14 days */
    categoryInsight: 24 * HOUR,    // 24 hours

    /** Restock intelligence predictions — daily scheduler updates */
    restockInsight: 6 * HOUR,      // 6 hours

    // ─── Global SWR defaults (used in SWRProvider) ────────────
    /** Global dedup — prevents parallel identical requests.
     *  10 sec is safe for 100-1000 users with multiple tabs. */
    globalDedup: 10 * SECOND,      // 10 seconds

    /** Global error retry interval — slightly longer to reduce server pressure */
    globalErrorRetry: 5 * SECOND,  // 5 seconds
} as const;