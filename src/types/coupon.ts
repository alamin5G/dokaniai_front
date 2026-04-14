/**
 * Coupon Management Types
 * Aligned with backend: CouponController, Coupon entity, CouponRedemption
 * SRS Reference: §6.12 FR-PROMO-01 to FR-PROMO-04
 */

// ─── Enums ───────────────────────────────────────────────

/**
 * Coupon discount types.
 * PERCENTAGE: X% off the purchase amount
 * FIXED_AMOUNT: Fixed ৳ discount
 * FREE_DAYS: Adds free subscription days (no monetary discount)
 */
export type CouponType = "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_DAYS";

// ─── Coupon ──────────────────────────────────────────────

export interface Coupon {
    id: string;
    code: string;
    description: string | null;
    type: CouponType;
    value: number;
    applicablePlans: string[] | null;
    minPurchaseAmount: number | null;
    maxDiscountAmount: number | null;
    firstPurchaseOnly: boolean;
    usageLimit: number | null;
    usedCount: number;
    perUserLimit: number;
    validFrom: string;
    validUntil: string;
    isActive: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

// ─── Paged Coupons ───────────────────────────────────────

export interface PagedCoupons {
    content: Coupon[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
}

// ─── Create / Update Requests ────────────────────────────

export interface CouponCreateRequest {
    code: string;
    description?: string;
    type: CouponType;
    value: number;
    applicablePlans?: string[];
    minPurchaseAmount?: number;
    maxDiscountAmount?: number;
    firstPurchaseOnly?: boolean;
    usageLimit: number;
    perUserLimit: number;
    validFrom: string;
    validUntil: string;
}

export interface CouponUpdateRequest {
    description?: string;
    value?: number;
    applicablePlans?: string[];
    minPurchaseAmount?: number;
    maxDiscountAmount?: number;
    usageLimit?: number;
    validFrom?: string;
    validUntil?: string;
}

// ─── Coupon Stats ────────────────────────────────────────

export interface CouponStats {
    couponId: string;
    code: string;
    totalRedemptions: number;
    usedCount: number;
    remainingUses: number;
    totalDiscountGiven: number;
    recentRedemptions: string[];
}

// ─── Coupon Validation ───────────────────────────────────

export interface CouponValidation {
    valid: boolean;
    error: string | null;
    coupon: Coupon | null;
    applicableDiscount: number | null;
}

// ─── Applied Coupon ──────────────────────────────────────

export interface AppliedCoupon {
    couponId: string;
    code: string;
    type: string;
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    redemptionId: string;
}

// ─── List Params ─────────────────────────────────────────

export interface ListCouponsParams {
    isActive?: boolean;
    type?: CouponType;
    page?: number;
    size?: number;
}
