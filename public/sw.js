/**
 * DokaniAI Service Worker
 * Purpose: Handle Web Push notifications in the background
 * SRS Reference: Section 11.3.7 - Delivery Channels (Web App)
 *
 * This service worker listens for push events and displays notifications
 * even when the app is not in the foreground.
 */

// ─── Push Event ─────────────────────────────────────────────
self.addEventListener('push', (event) => {
    let data = {
        title: 'DokaniAI',
        icon: '/icons/icon.svg',
        body: 'You have a new notification.',
        url: '/dashboard',
    };

    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch {
            // If JSON parsing fails, use text as body
            const text = event.data.text();
            if (text) data.body = text;
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || '/icons/icon.svg',
        badge: '/icons/apple-icon-180.png',
        data: {
            url: data.url || '/dashboard',
        },
        vibrate: [100, 50, 100],
        tag: 'dokaniai-notification',
        renotify: true,
        actions: [
            { action: 'open', title: 'Open' },
            { action: 'dismiss', title: 'Dismiss' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// ─── Notification Click ──────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    const targetUrl = event.notification.data?.url || '/dashboard';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Focus existing window if available
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }
            // Open new window
            return self.clients.openWindow(targetUrl);
        })
    );
});

// ─── Install & Activate ──────────────────────────────────────
self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});
