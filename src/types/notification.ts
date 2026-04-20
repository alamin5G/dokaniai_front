export type NotificationType =
    | 'LOW_STOCK'
    | 'REORDER_NEEDED'
    | 'DISCOUNT'
    | 'PAYMENT'
    | 'TRIAL_ENDING'
    | 'FT2_OFFER'
    | 'GRACE_PERIOD'
    | 'DUE_REMINDER'
    | 'CATEGORY_REQUEST'
    | 'SYSTEM'
    | 'SUBSCRIPTION'
    | 'SUPPORT'
    | 'MARKETING'
    // AI Notification types (v8.0)
    | 'DAILY_SUMMARY'
    | 'AI_TIP'
    | 'PATTERN_ALERT';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';

export type NotificationTone = 'FRIENDLY' | 'URGENT' | 'WARNING' | 'INFO' | 'ENCOURAGING';

export interface NotificationItem {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    channel: NotificationChannel;
    isRead: boolean;
    readAt: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
    // AI Notification fields (v8.0)
    aiGenerated?: boolean;
    tone?: NotificationTone;
    scheduledAt?: string | null;
    actionTaken?: string | null;
    aiContext?: {
        triggerType?: string;
        aiGenerated?: boolean;
        fallback?: boolean;
        actionLabel?: string;
        [key: string]: unknown;
    } | null;
}

export interface NotificationPage {
    content: NotificationItem[];
    number: number;
    totalElements: number;
    totalPages: number;
    size: number;
    last: boolean;
}

export interface NotificationPreferences {
    emailEnabled: boolean;
    pushEnabled: boolean;
    inAppEnabled: boolean;
    lowStockAlerts: boolean;
    paymentReminders: boolean;
    dueReminders: boolean;
    promotionalEmails: boolean;
    weeklySummary: boolean;
}

// Web Push subscription types (v8.0)
export interface PushSubscriptionPayload {
    endpoint: string;
    p256dhKey: string;
    authKey: string;
    userAgent?: string;
}

export interface VapidKeyResponse {
    enabled: boolean;
    publicKey: string;
}
