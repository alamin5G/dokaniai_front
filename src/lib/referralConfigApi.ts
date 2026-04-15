/**
 * Referral Config API Client
 * Aligned with backend: ReferralConfigController (/api/v1/admin/referral-config)
 */

import apiClient from "@/lib/api";

// ─── Types ────────────────────────────────────────────────

export interface ReferralConfig {
    id: string;
    referrerRewardType: string;
    referrerRewardValue: number;
    referredDiscountType: string;
    referredDiscountValue: number;
    maxReferralsPerMonth: number | null;
    isActive: boolean;
    updatedBy: string | null;
    updatedAt: string;
    createdAt: string;
}

export interface ReferralConfigUpdateRequest {
    referrerRewardType?: string;
    referrerRewardValue?: number;
    referredDiscountType?: string;
    referredDiscountValue?: number;
    maxReferralsPerMonth?: number | null;
    isActive?: boolean;
}

// ─── Internal helpers ────────────────────────────────────

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    message?: string;
}

function unwrap<T>(response: { data: ApiSuccess<T> }): T {
    return response.data.data;
}

// ─── Get Current Config ──────────────────────────────────

export async function getReferralConfig(): Promise<ReferralConfig> {
    const { data } = await apiClient.get("/api/v1/admin/referral-config");
    return unwrap<ReferralConfig>(data);
}

// ─── Update Config ───────────────────────────────────────

export async function updateReferralConfig(
    request: ReferralConfigUpdateRequest
): Promise<ReferralConfig> {
    const { data } = await apiClient.put("/api/v1/admin/referral-config", request);
    return unwrap<ReferralConfig>(data);
}
