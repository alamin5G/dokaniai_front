/**
 * Payment Admin Module API
 * Aligned with backend: PaymentAdminController (/payments/admin/*)
 */

import apiClient from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import type {
    ManualReviewPaymentItem,
    AdminDevice,
    SmsReportItem,
    PaymentSummary,
    MfsNumberResponse,
    MfsNumberRegistrationRequest,
    PaymentSettingsResponse,
    PaymentSettingsRequest,
    AdminDeviceBootstrapResponse,
} from "@/types/paymentAdmin";
import type { PaymentIntentStatusResponse } from "@/types/subscription";

// ─── Manual Review Queue ───────────────────────────────────────────────────

export async function getManualReviewQueue(): Promise<ManualReviewPaymentItem[]> {
    try {
        const { data } = await apiClient.get("/payments/admin/manual-review");
        return data.data;
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to load manual review queue."));
    }
}

// ─── Fraud Flagged Payments ────────────────────────────────────────────────

export async function getFraudFlaggedPayments(): Promise<ManualReviewPaymentItem[]> {
    try {
        const { data } = await apiClient.get("/payments/admin/fraud-flags");
        return data.data;
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to load fraud flagged payments."));
    }
}

// ─── Rejected Payments ─────────────────────────────────────────────────────

export async function getRejectedPayments(): Promise<ManualReviewPaymentItem[]> {
    try {
        const { data } = await apiClient.get("/payments/admin/rejected");
        return data.data;
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to load rejected payments."));
    }
}

// ─── Verify Payment Intent ─────────────────────────────────────────────────

export async function verifyPaymentIntent(
    paymentIntentId: string,
    smsReportId: string,
): Promise<PaymentIntentStatusResponse> {
    try {
        const { data } = await apiClient.post(
            `/payments/admin/${paymentIntentId}/verify`,
            { smsReportId },
        );
        return data.data;
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to verify payment intent."));
    }
}

// ─── Reject Payment Intent ─────────────────────────────────────────────────

export async function rejectPaymentIntent(
    paymentIntentId: string,
    reason?: string,
): Promise<PaymentIntentStatusResponse> {
    try {
        const query = reason ? `?reason=${encodeURIComponent(reason)}` : "";
        const { data } = await apiClient.post(
            `/payments/admin/${paymentIntentId}/reject${query}`,
        );
        return data.data;
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to reject payment intent."));
    }
}

// ─── Device Management ─────────────────────────────────────────────────────

export async function getCompletedPayments(): Promise<ManualReviewPaymentItem[]> {
    try {
        const { data } = await apiClient.get("/payments/admin/completed");
        return data.data;
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to load completed payments."));
    }
}

export async function getAllDevices(): Promise<AdminDevice[]> {
    try {
        const { data } = await apiClient.get("/payments/admin/devices");
        return data.data;
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to load registered devices."));
    }
}

export async function revokeDevice(
    deviceId: string,
    reason?: string,
): Promise<void> {
    try {
        const query = reason ? `?reason=${encodeURIComponent(reason)}` : "";
        await apiClient.post(`/payments/admin/devices/${deviceId}/revoke${query}`);
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to revoke device."));
    }
}

// ─── SMS Pool ──────────────────────────────────────────────────────────────

export async function getUnmatchedSmsPool(): Promise<SmsReportItem[]> {
    try {
        const { data } = await apiClient.get("/payments/admin/sms-pool");
        return data.data;
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to load unmatched SMS pool."));
    }
}

export async function deleteSmsReport(reportId: string): Promise<void> {
    try {
        await apiClient.delete(`/payments/admin/sms-pool/${reportId}`);
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to delete SMS report."));
    }
}

// ─── Payment Summary ───────────────────────────────────────────────────────

export async function getPaymentSummary(): Promise<PaymentSummary> {
    try {
        const { data } = await apiClient.get("/payments/admin/summary");
        return data.data;
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to load payment summary."));
    }
}

// ─── MFS Number Registration (v1.1) ────────────────────────────────────────

export async function registerMfsNumber(
    request: MfsNumberRegistrationRequest,
): Promise<MfsNumberResponse> {
    try {
        const { data } = await apiClient.post("/payments/mfs-numbers/register", request);
        return data.data;
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to register MFS number."));
    }
}

export async function getMyMfsNumbers(): Promise<MfsNumberResponse[]> {
    try {
        const { data } = await apiClient.get("/payments/mfs-numbers");
        return data.data;
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to load MFS numbers."));
    }
}

// ─── Admin MFS Number Management (v1.1) ────────────────────────────────────

export async function getPendingMfsNumbers(): Promise<MfsNumberResponse[]> {
    try {
        const { data } = await apiClient.get("/payments/admin/mfs-numbers/pending");
        return data.data;
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to load pending MFS numbers."));
    }
}

export async function approveMfsNumber(mfsNumberId: string): Promise<MfsNumberResponse> {
    try {
        const { data } = await apiClient.post(
            `/payments/admin/mfs-numbers/${mfsNumberId}/approve`,
        );
        return data.data;
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to approve MFS number."));
    }
}

export async function rejectMfsNumber(
    mfsNumberId: string,
    reason?: string,
): Promise<MfsNumberResponse> {
    try {
        const { data } = await apiClient.post(
            `/payments/admin/mfs-numbers/${mfsNumberId}/reject`,
            { reason },
        );
        return data.data;
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to reject MFS number."));
    }
}

export async function getPaymentSettings(): Promise<PaymentSettingsResponse> {
    try {
        const { data } = await apiClient.get("/payments/admin/settings");
        return data.data;
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to get payment settings."));
    }
}

export async function updatePaymentSettings(
    request: PaymentSettingsRequest,
): Promise<PaymentSettingsResponse> {
    try {
        const { data } = await apiClient.put("/payments/admin/settings", request);
        return data.data;
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to update payment settings."));
    }
}

// ─── Device Bootstrap ────────────────────────────────────────────────────

export async function createBootstrap(): Promise<AdminDeviceBootstrapResponse> {
    try {
        const { data } = await apiClient.post("/admin/payment-helper/bootstrap");
        return data.data;
    } catch (error) {
        throw new Error(getApiErrorMessage(error, "Failed to create bootstrap token."));
    }
}
