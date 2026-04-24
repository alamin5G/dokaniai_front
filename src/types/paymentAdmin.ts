/**
 * Payment Admin Module Types
 * Aligned with backend: PaymentAdminController (/payments/admin/*)
 */

import type { MfsType, PaymentIntentStatus } from "@/types/subscription";

// Re-export for convenience
export type { MfsType, PaymentIntentStatus } from "@/types/subscription";

// ─── Manual Review Payment Item ────────────────────────────────────────────

export type PaymentVerificationMethod = "AUTO" | "MANUAL";

export interface ManualReviewPaymentItem {
    paymentIntentId: string;
    userId: string;
    subscriptionId: string;
    amount: number;
    mfsMethod: MfsType;
    submittedTrxId: string;
    failedAttempts: number;
    fraudFlag: boolean;
    submittedAt: string;
    expiresAt: string;
    userName: string;
    userPhone: string;
    rejectionReason: string | null;
    reviewedByName: string | null;
    reviewedAt: string | null;
    verifiedAt: string | null;
    planName: string | null;
    billingCycle: string | null;
    couponCode: string | null;
    discountAmount: number | null;
    verificationMethod: PaymentVerificationMethod | null;
}

// ─── Admin Device ──────────────────────────────────────────────────────────

export interface AdminDevice {
    id: string;
    userId: string;
    userName: string;
    deviceFingerprint: string;
    deviceName: string;
    appVariant: string;
    status: string;
    lastReportAt: string;
    registeredAt: string;
    nodeId: string | null;
    batteryLevel: number | null;
}

// ─── SMS Report Item ───────────────────────────────────────────────────────

export interface SmsReportItem {
    id: string;
    deviceId: string;
    mfsType: MfsType;
    senderNumber: string;
    receiverNumber: string;
    amount: number;
    trxId: string;
    smsReceivedAt: string;
    matchStatus: string;
}

// ─── Payment Summary ───────────────────────────────────────────────────────

export interface PaymentSummary {
    totalCompleted: number;
    totalManualReview: number;
    totalFailed: number;
    totalFraudFlags: number;
    totalRejected: number;
    autoVerifiedRate: number;
    todayCompleted: number;
    todayRevenue: number;
}

// ─── MFS Number Registration (v1.1) ────────────────────────────────────────

export interface MfsNumberResponse {
    id: string;
    userId: string;
    userName: string;
    userPhone: string;
    mfsType: MfsType;
    mfsNumber: string;
    simSlot: number | null;
    accountType?: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    approvedByName: string | null;
    approvedAt: string | null;
    rejectionReason: string | null;
    createdAt: string;
}

export interface MfsNumberRegistrationRequest {
    mfsType: MfsType;
    mfsNumber: string;
    simSlot?: number;
}

export interface PaymentSettingsResponse {
    bkash: string;
    nagad: string;
    rocket: string;
}

export interface PaymentSettingsRequest {
    bkash: string;
    nagad: string;
    rocket: string;
}

// ─── Device Bootstrap ────────────────────────────────────────────────────

export interface AdminDeviceBootstrapResponse {
    bootstrapToken: string;
    deepLinkUrl: string;
    expiresAt: string;
    appVariant: string;
}
