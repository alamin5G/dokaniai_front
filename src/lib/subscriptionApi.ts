import apiClient from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import type {
  AppliedCoupon,
  CouponValidation,
  DowngradeValidation,
  MfsType,
  PaymentInitializeResponse,
  PaymentIntentStatusResponse,
  Plan,
  PlanLimits,
  ReferralStatus,
  Subscription,
} from "@/types/subscription";

interface ApiSuccess<T> {
  success: boolean;
  data: T;
  message?: string;
}

function unwrap<T>(response: { data: ApiSuccess<T> }): T {
  return response.data.data;
}

export async function getAvailablePlans(): Promise<Plan[]> {
  const response = await apiClient.get<ApiSuccess<Plan[]>>("/subscriptions/plans");
  return unwrap(response);
}

export async function getCurrentSubscription(): Promise<Subscription> {
  const response = await apiClient.get<ApiSuccess<Subscription>>("/subscriptions/current");
  return unwrap(response);
}

export async function getPlanLimits(): Promise<PlanLimits> {
  const response = await apiClient.get<ApiSuccess<PlanLimits>>("/subscriptions/limits");
  return unwrap(response);
}

export async function validateDowngrade(planId: string): Promise<DowngradeValidation> {
  const response = await apiClient.post<ApiSuccess<DowngradeValidation>>("/subscriptions/validate-downgrade", {
    planId,
  });
  return unwrap(response);
}

export async function scheduleDowngrade(planId: string): Promise<Subscription> {
  const response = await apiClient.post<ApiSuccess<Subscription>>("/subscriptions/downgrade", {
    planId,
    archiveStrategy: "ARCHIVE",
  });
  return unwrap(response);
}

export async function validateCoupon(
  code: string,
  planId: string,
  purchaseAmount: number,
): Promise<CouponValidation> {
  try {
    const response = await apiClient.post<ApiSuccess<CouponValidation>>("/coupons/validate", {
      code,
      planId,
      purchaseAmount: purchaseAmount.toString(),
    });
    return unwrap(response);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "কুপন যাচাই করা যায়নি।"));
  }
}

export async function applyCoupon(
  code: string,
  planId: string,
  purchaseAmount: number,
): Promise<AppliedCoupon> {
  try {
    const response = await apiClient.post<ApiSuccess<AppliedCoupon>>("/coupons/apply", {
      code,
      planId,
      purchaseAmount: purchaseAmount.toString(),
    });
    return unwrap(response);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "কুপন প্রয়োগ করা যায়নি।"));
  }
}

export interface InitializePaymentInput {
  planId: string;
  amount: number;
  mfsMethod: MfsType;
  couponCode?: string;
  billingCycle?: "MONTHLY" | "ANNUAL";
}

export async function initializePaymentIntent(
  payload: InitializePaymentInput,
): Promise<PaymentInitializeResponse> {
  try {
    const response = await apiClient.post<ApiSuccess<PaymentInitializeResponse>>("/payments/initialize", {
      subscriptionId: null,
      planId: payload.planId,
      businessId: null,
      couponCode: payload.couponCode?.trim() || null,
      amount: payload.amount,
      mfsMethod: payload.mfsMethod,
      idempotencyKey: crypto.randomUUID(),
      billingCycle: payload.billingCycle || "MONTHLY",
    });
    return unwrap(response);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "পেমেন্ট শুরু করা যায়নি।"));
  }
}

export async function submitPaymentTrx(
  paymentIntentId: string,
  trxId: string,
): Promise<PaymentIntentStatusResponse> {
  try {
    const response = await apiClient.post<ApiSuccess<PaymentIntentStatusResponse>>(
      `/payments/${paymentIntentId}/submit-trx`,
      { trxId },
    );
    return unwrap(response);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "TrxID পাঠানো যায়নি।"));
  }
}

export async function getPaymentIntentStatus(
  paymentIntentId: string,
): Promise<PaymentIntentStatusResponse> {
  try {
    const response = await apiClient.get<ApiSuccess<PaymentIntentStatusResponse>>(
      `/payments/${paymentIntentId}/status`,
    );
    return unwrap(response);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "পেমেন্ট স্ট্যাটাস আনা যায়নি।"));
  }
}

export async function resubmitPaymentIntent(
  paymentIntentId: string,
): Promise<PaymentIntentStatusResponse> {
  try {
    const response = await apiClient.post<ApiSuccess<PaymentIntentStatusResponse>>(
      `/payments/${paymentIntentId}/resubmit`,
    );
    return unwrap(response);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "পেমেন্ট পুনরায় সাবমিট করা যায়নি।"));
  }
}

export async function getReferralStatus(): Promise<ReferralStatus> {
  const response = await apiClient.get<ApiSuccess<ReferralStatus>>("/subscriptions/referral-status");
  return unwrap(response);
}

export async function savePendingPlan(planId: string): Promise<void> {
  await apiClient.post("/subscriptions/pending-plan", { planId });
}

export async function getPendingPlan(): Promise<{ planId?: string; isTrial?: boolean } | null> {
  try {
    const response = await apiClient.get<ApiSuccess<{ planId?: string; isTrial?: boolean }>>("/subscriptions/pending-plan");
    return unwrap(response);
  } catch {
    return null;
  }
}

export async function consentTrialPlan(planId: string): Promise<void> {
  await apiClient.post("/subscriptions/consent-trial", { planId });
}

export async function clearPendingPlan(): Promise<void> {
  await apiClient.delete("/subscriptions/pending-plan");
}
