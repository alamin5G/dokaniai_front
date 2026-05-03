import apiClient from "@/lib/api";

export interface ReferralConfig {
    id: string;
    referrerRewardType: string;
    referrerRewardValue: number;
    referredDiscountType: string;
    referredDiscountValue: number;
    maxReferralsPerMonth: number | null;
    maxReferralsTotal: number;
    isActive: boolean;
    couponValidityDays: number;
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
    maxReferralsTotal?: number;
    isActive?: boolean;
    couponValidityDays?: number;
}

export async function getReferralConfig(): Promise<ReferralConfig> {
    const { data } = await apiClient.get("/admin/referral-config");
    return data.data;
}

export async function updateReferralConfig(
    request: ReferralConfigUpdateRequest
): Promise<ReferralConfig> {
    const { data } = await apiClient.put("/admin/referral-config", request);
    return data.data;
}
