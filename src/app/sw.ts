import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry } from "@serwist/precaching";
import {
  Serwist,
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
  ExpirationPlugin,
  BackgroundSyncPlugin,
} from "serwist";

declare global {
  interface WorkerGlobalScope {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: any;

// SRS §7.6.2: POST requests - Queue in IndexedDB, replay when online
const bgSyncPlugin = new BackgroundSyncPlugin("dokaniai-post-queue", {
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
    // SRS §7.6.2: POST requests - Queue in IndexedDB, replay when online
    {
      matcher: /\/api\/.*$/i,
      method: "POST",
      handler: new NetworkFirst({
        cacheName: "dokaniai-post-cache",
        plugins: [bgSyncPlugin],
      }),
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
