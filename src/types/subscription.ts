export type SubscriptionStatus =
  | "ACTIVE"
  | "TRIAL"
  | "GRACE"
  | "RESTRICTED"
  | "ARCHIVED"
  | "EXPIRED"
  | "CANCELLED";

export type MfsType = "BKASH" | "NAGAD" | "ROCKET";

export type PaymentIntentStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "MANUAL_REVIEW"
  | "EXPIRED";

export interface Plan {
  id: string;
  name: string;
  tierLevel: number;
  displayNameBn: string;
  displayNameEn: string;
  priceBdt: number;
  annualPriceBdt: number | null;
  durationDays: number;
  maxBusinesses: number;
  maxProductsPerBusiness: number | null;
  aiQueriesPerDay: number | null;
  maxAiTokensPerQuery: number;
  conversationHistoryTurns: number;
  maxQueryCharacters: number;
  features: Record<string, boolean> | null;
  isTrial: boolean;
  isActive: boolean;
  customPricing?: boolean;
  highlight?: boolean;
  badge?: string | null;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  downgradeScheduledTo?: string | null;
  downgradeScheduledAt?: string | null;
}

export interface PlanLimits {
  maxBusinesses: number;
  currentBusinesses: number;
  maxProductsPerBusiness: number;
  aiQueriesPerDay: number;
  maxAiTokensPerQuery: number;
  conversationHistoryTurns: number;
  dueManagementEnabled: boolean;
  discountEnabled: boolean;
  voiceEnabled: boolean;
  textNlpEnabled: boolean;
}

export interface DowngradeValidation {
  canDowngrade: boolean;
  businessLimitOk: number;
  productLimitOk: number;
  warnings: string[];
  actions: string[];
}

export interface CouponValidation {
  valid: boolean;
  error: string | null;
  applicableDiscount: number;
}

export interface AppliedCoupon {
  couponId: string;
  code: string;
  couponType: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  redemptionId: string | null;
}

export interface PaymentInitializeResponse {
  paymentIntentId: string;
  amount: number;
  mfsMethod: MfsType;
  receiverNumber: string;
  expiresAt: string;
  status: PaymentIntentStatus;
}

export interface PaymentIntentStatusResponse {
  paymentIntentId: string;
  status: PaymentIntentStatus;
  verifiedAt: string | null;
  failedAttempts: number | null;
  fraudFlag: boolean | null;
}
