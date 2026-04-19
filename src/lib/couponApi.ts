/**
 * Coupon Management API Client
 * Aligned with backend: CouponController (/coupons)
 * SRS Reference: §6.12 FR-PROMO-01 to FR-PROMO-04
 */

import apiClient from "@/lib/api";
import type {
    AppliedCoupon,
    Coupon,
    CouponCreateRequest,
    CouponStats,
    CouponUpdateRequest,
    CouponValidation,
    ListCouponsParams,
    PagedCoupons,
} from "@/types/coupon";

// ─── Internal helpers ────────────────────────────────────

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    message?: string;
}

function unwrap<T>(body: ApiSuccess<T>): T {
    return body.data;
}

// ─── List Coupons ────────────────────────────────────────

export async function listCoupons(
    params: ListCouponsParams = {}
): Promise<PagedCoupons> {
    const { data } = await apiClient.get("/coupons", { params });
    return unwrap<PagedCoupons>(data);
}

// ─── Create Coupon ───────────────────────────────────────

export async function createCoupon(
    request: CouponCreateRequest
): Promise<Coupon> {
    const { data } = await apiClient.post("/coupons", request);
    return unwrap<Coupon>(data);
}

// ─── Get Coupon ──────────────────────────────────────────

export async function getCoupon(couponId: string): Promise<Coupon> {
    const { data } = await apiClient.get(`/coupons/${couponId}`);
    return unwrap<Coupon>(data);
}

// ─── Update Coupon ───────────────────────────────────────

export async function updateCoupon(
    couponId: string,
    request: CouponUpdateRequest
): Promise<Coupon> {
    const { data } = await apiClient.put(`/coupons/${couponId}`, request);
    return unwrap<Coupon>(data);
}

// ─── Delete Coupon ───────────────────────────────────────

export async function deleteCoupon(couponId: string): Promise<void> {
    await apiClient.delete(`/coupons/${couponId}`);
}

// ─── Validate Coupon ─────────────────────────────────────

export async function validateCoupon(
    code: string,
    planId?: string,
    purchaseAmount?: number
): Promise<CouponValidation> {
    const body: Record<string, string> = { code };
    if (planId) body.planId = planId;
    if (purchaseAmount !== undefined) body.purchaseAmount = String(purchaseAmount);

    const { data } = await apiClient.post("/coupons/validate", body);
    return unwrap<CouponValidation>(data);
}

// ─── Apply Coupon ────────────────────────────────────────

export async function applyCoupon(
    code: string,
    planId?: string,
    purchaseAmount?: number
): Promise<AppliedCoupon> {
    const body: Record<string, string> = { code };
    if (planId) body.planId = planId;
    if (purchaseAmount !== undefined) body.purchaseAmount = String(purchaseAmount);

    const { data } = await apiClient.post("/coupons/apply", body);
    return unwrap<AppliedCoupon>(data);
}

// ─── Get Coupon Stats ────────────────────────────────────

export async function getCouponStats(couponId: string): Promise<CouponStats> {
    const { data } = await apiClient.get(`/coupons/${couponId}/stats`);
    return unwrap<CouponStats>(data);
}

// ─── Activate Coupon ─────────────────────────────────────

export async function activateCoupon(couponId: string): Promise<void> {
    await apiClient.post(`/coupons/${couponId}/activate`);
}

// ─── Deactivate Coupon ───────────────────────────────────

export async function deactivateCoupon(couponId: string): Promise<void> {
    await apiClient.post(`/coupons/${couponId}/deactivate`);
}
