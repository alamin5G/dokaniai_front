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
  | "EXPIRED"
  | "REJECTED";

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
  billingCycle?: "MONTHLY" | "ANNUAL";
  downgradeScheduledTo?: string | null;
  downgradeScheduledAt?: string | null;
}

export interface PlanLimits {
  maxBusinesses: number;
  currentBusinesses: number;
  maxProductsPerBusiness: number;
  aiQueriesPerDay: number;
  maxAiTokensPerQuery: number;
  maxQueryCharacters: number;
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
  submittedTrxId?: string | null;
  verifiedAt: string | null;
  failedAttempts: number | null;
  fraudFlag: boolean | null;
  expiresAt: string | null;
  rejectionReason: string | null;
}

export interface ReferralStatus {
  referralCode: string | null;
  referredBy: string | null;
  earnedCredits: number;
  totalReferrals: number;
  pendingRewardCount: number;
  rewardDays: number;
  maxReferralsTotal: number;
  referredDiscountType: string | null;
  referredDiscountValue: number | null;
}

export interface UpgradeProrationResponse {
  isUpgrade: boolean;
  currentPlanName: string;
  currentPlanPrice: number;
  newPlanName: string;
  newPlanPrice: number;
  totalDaysInPeriod: number;
  remainingDays: number;
  proratedCredit: number;
  upgradeAmount: number;
}

export interface PublicCoupon {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_DAYS";
  value: number;
  displayLabelBn: string | null;
  displayLabelEn: string | null;
  applicablePlans: string[] | null;
  validUntil: string | null;
  description: string | null;
}
