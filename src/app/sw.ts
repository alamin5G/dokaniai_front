import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry } from "@serwist/precaching";
import {
  Serwist,
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
  ExpirationPlugin,
} from "serwist";
import { Queue } from "@serwist/background-sync";

declare global {
  interface WorkerGlobalScope {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
} & Record<string, unknown>;

// SRS §7.6.2: Custom queue for POST requests with conflict detection
const postQueue = new Queue("dokaniai-post-queue", {
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        const response = await fetch(entry.request.clone());

        // Intercept 409 STOCK_CONFLICT responses during replay
        if (response.status === 409) {
          try {
            const body = await response.json();
            if (body?.error?.code === "STOCK_CONFLICT" && body?.error?.details) {
              // Post conflict details to the main thread so the UI can show the modal
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const sw = self as any;
              const clients: any[] = await sw.clients?.matchAll?.({ type: "window" }) ?? [];
              for (const client of clients) {
                client.postMessage({
                  type: "STOCK_CONFLICT",
                  conflict: body.error.details,
                  requestUrl: entry.request.url,
                });
              }
              // Do not replay this entry — the main thread will handle it
              continue;
            }
          } catch {
            // If we can't parse the body, fall through to treat as failure
          }
        }

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
      } catch (error) {
        // Re-queue for next sync attempt (up to 24h retention)
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
  maxRetentionTime: 24 * 60, // Retry for up to 24 hours (in minutes)
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // SRS §7.6.2: Static assets - Cache-first strategy
    {
      matcher: /\.(?:js|css|woff2?|png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: new CacheFirst({
        cacheName: "dokaniai-static-assets",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          }),
        ],
      }),
    },
    // SRS §7.6.2: API GET calls - Network-first, fallback to cache
    {
      matcher: /\/api\/.*$/i,
      method: "GET",
      handler: new NetworkFirst({
        cacheName: "dokaniai-api-cache",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 5 * 60, // 5 minutes
          }),
        ],
      }),
    },
    // SRS §7.6.2: POST requests - Custom queue with conflict detection
    {
      matcher: /\/api\/.*$/i,
      method: "POST",
      handler: async ({ request }) => {
        try {
          // Try network first
          const response = await fetch(request.clone());

          // If 409 conflict, let it propagate to the caller
          return response;
        } catch {
          // Network failed — queue for background sync
          await postQueue.pushRequest({ request });
          return new Response(
            JSON.stringify({
              success: false,
              error: {
                code: "OFFLINE_QUEUED",
                message: "Request queued for sync when back online.",
              },
            }),
            {
              status: 202,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      },
    },
    // SRS §7.6: View products - Cached data with background sync
    {
      matcher: /\/api\/.*\/products/i,
      method: "GET",
      handler: new StaleWhileRevalidate({
        cacheName: "dokaniai-products-cache",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 60 * 60, // 1 hour
          }),
        ],
      }),
    },
    // SRS §7.6: View recent sales - Last 50 cached
    {
      matcher: /\/api\/.*\/sales/i,
      method: "GET",
      handler: new NetworkFirst({
        cacheName: "dokaniai-sales-cache",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 5 * 60, // 5 minutes
          }),
        ],
      }),
    },
    // Google Fonts - Cache-first
    {
      matcher: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: new CacheFirst({
        cacheName: "dokaniai-google-fonts",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 10,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          }),
        ],
      }),
    },
    {
      matcher: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: new CacheFirst({
        cacheName: "dokaniai-google-fonts-webfiles",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 20,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          }),
        ],
      }),
    },
    // External images - StaleWhileRevalidate
    {
      matcher: /^https:\/\/lh3\.googleusercontent\.com\/.*/i,
      handler: new StaleWhileRevalidate({
        cacheName: "dokaniai-external-images",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 30,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          }),
        ],
      }),
    },
    // Default cache from Serwist/Next
    ...defaultCache,
  ],
});

serwist.addEventListeners();
