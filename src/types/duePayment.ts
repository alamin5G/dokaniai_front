/**
 * Due Payment Intent Types — Public Customer Due Payment
 * Aligned with plans/due-payment-final-architecture.md
 */

import type { MfsType } from "@/types/subscription";

export type { MfsType };

// ─── Enums ───────────────────────────────────────────────

export type DuePaymentIntentStatus =
    | "PENDING"
    | "AUTO_VERIFIED"
    | "MANUAL_REVIEW"
    | "COMPLETED"
    | "REJECTED"
    | "EXPIRED";

export type PaymentVerificationMethod = "AUTO" | "MANUAL";

// ─── Due Payment Intent ──────────────────────────────────

export interface DuePaymentIntent {
    id: string;
    businessId: string;
    customerId: string | null;
    customerPhone: string | null;
    customerName: string | null;
    amount: number;
    mfsMethod: MfsType;
    submittedTrxId: string;
    status: DuePaymentIntentStatus;
    verificationMethod: PaymentVerificationMethod | null;
    rejectionReason: string | null;
    expiresAt: string;
    verifiedAt: string | null;
    verifiedBy: string | null;
    createdAt: string;
    updatedAt: string;
}

// ─── Create Intent Request ────────────────────────────────

export interface CreateDuePaymentIntentRequest {
    businessId: string;
    customerId?: string;
    customerPhone?: string;
    customerName?: string;
    amount: number;
    mfsMethod: MfsType;
    submittedTrxId: string;
}

// ─── Intent Status Response ──────────────────────────────

export interface DuePaymentIntentStatusResponse {
    id: string;
    status: DuePaymentIntentStatus;
    rejectionReason: string | null;
    newDueBalance: number | null;
    verifiedAt: string | null;
}

// ─── Customer Due Public Info ────────────────────────────

export interface DuePurchaseItem {
    date: string;
    description: string;
    totalAmount: number;
    dueAmount: number;
    paymentsSince: number;
}

export interface MfsPaymentOption {
    mfsType: MfsType;
    number: string;       // masked: 017XXXX1234
    fullNumber: string;   // shown on payment form
}

export interface CustomerDuePublicInfo {
    businessName: string;
    businessType: string;
    customerName: string;
    currentDueBalance: number;
    lastDuePurchases: DuePurchaseItem[];
    finalDueAmount: number;
    mfsPaymentOptions: MfsPaymentOption[];
}

// ─── Business Payment Info (no customer) ──────────────────

export interface BusinessPaymentInfo {
    businessName: string;
    businessType: string;
    mfsPaymentOptions: MfsPaymentOption[];
}

// ─── Pending Payment Item (shop owner view) ──────────────

export interface PendingDuePaymentItem {
    id: string;
    customerId: string | null;
    customerName: string | null;
    customerPhone: string | null;
    amount: number;
    mfsMethod: MfsType;
    submittedTrxId: string;
    status: DuePaymentIntentStatus;
    createdAt: string;
    expiresAt: string;
}
