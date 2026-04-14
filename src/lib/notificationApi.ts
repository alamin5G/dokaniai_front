import apiClient from '@/lib/api';
import type {
    NotificationItem,
    NotificationPage,
    NotificationPreferences,
    NotificationType,
    PushSubscriptionPayload,
    VapidKeyResponse,
} from '@/types/notification';

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    message?: string;
}

interface Paged<T> {
    content: T[];
    number: number;
    totalElements: number;
    totalPages: number;
    size: number;
    last: boolean;
}

function unwrap<T>(response: { data: ApiSuccess<T> }): T {
    return response.data.data;
}

/**
 * List notifications for the current user (paginated, filterable).
 * GET /api/v1/notifications/
 */
export async function listNotifications(
    isRead?: boolean,
    type?: NotificationType,
    page = 0,
    size = 10,
): Promise<NotificationPage> {
    const params = new URLSearchParams();
    if (isRead !== undefined) params.set('isRead', String(isRead));
    if (type) params.set('type', type);
    params.set('page', String(page));
    params.set('size', String(size));

    const response = await apiClient.get<ApiSuccess<Paged<NotificationItem>>>(
        `/notifications?${params.toString()}`
    );
    return unwrap(response);
}

/**
 * Mark a notification as read.
 * PUT /api/v1/notifications/{notificationId}/read
 */
export async function markAsRead(notificationId: string): Promise<void> {
    await apiClient.put(`/notifications/${encodeURIComponent(notificationId)}/read`);
}

/**
 * Mark all notifications as read for the current user.
 * PUT /api/v1/notifications/read-all
 */
export async function markAllAsRead(): Promise<void> {
    await apiClient.put('/notifications/read-all');
}

/**
 * Get unread notification count.
 * GET /api/v1/notifications/unread-count
 */
export async function getUnreadCount(): Promise<number> {
    const response = await apiClient.get<ApiSuccess<number>>('/notifications/unread-count');
    return unwrap(response);
}

/**
 * Delete a notification.
 * DELETE /api/v1/notifications/{notificationId}
 */
export async function deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`/notifications/${encodeURIComponent(notificationId)}`);
}

/**
 * Get notification preferences.
 * GET /api/v1/notifications/preferences
 */
export async function getPreferences(): Promise<NotificationPreferences> {
    const response = await apiClient.get<ApiSuccess<NotificationPreferences>>('/notifications/preferences');
    return unwrap(response);
}

/**
 * Update notification preferences.
 * PUT /api/v1/notifications/preferences
 */
export async function updatePreferences(preferences: NotificationPreferences): Promise<void> {
    await apiClient.put('/notifications/preferences', preferences);
}

// ========== Web Push API (v8.0) ==========

/**
 * Get the VAPID public key for push subscription.
 * GET /api/push/vapid-key
 */
export async function getVapidPublicKey(): Promise<VapidKeyResponse> {
    const response = await apiClient.get<ApiSuccess<VapidKeyResponse>>('/push/vapid-key');
    return unwrap(response);
}

/**
 * Subscribe the browser to push notifications.
 * POST /api/push/subscribe
 */
export async function subscribePush(payload: PushSubscriptionPayload): Promise<string> {
    const response = await apiClient.post<ApiSuccess<{ subscriptionId: string }>>('/push/subscribe', payload);
    return unwrap(response).subscriptionId;
}

/**
 * Unsubscribe the browser from push notifications.
 * DELETE /api/push/unsubscribe
 */
export async function unsubscribePush(endpoint: string): Promise<void> {
    await apiClient.delete('/push/unsubscribe', { data: { endpoint } });
}
