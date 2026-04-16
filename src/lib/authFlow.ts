import { normalizeLocalizedDigits } from "@/lib/localeNumber";

/**
 * Masks a phone number or email for safe display.
 * Phone: 01581741783 → 015*****783
 * Email: user@example.com → u***@example.com
 */
export function maskContact(contact: string): string {
  if (!contact) return "";

  const normalized = normalizeLocalizedDigits(contact);

  // Email masking
  if (normalized.includes("@")) {
    const [local, domain] = normalized.split("@");
    if (!local || !domain) return "***";
    const visible = local.length <= 2 ? local[0] : local.slice(0, 2);
    return `${visible}***@${domain}`;
  }

  // Phone masking: show first 3 and last 3 digits
  const digits = normalized.replace(/\D/g, "");
  if (digits.length <= 6) return "***";
  return `${digits.slice(0, 3)}*****${digits.slice(-3)}`;
}

// --- sessionStorage helpers for auth flow PII ---

const CONTACT_KEY = "dokaniai-auth-contact";
const METHOD_KEY = "dokaniai-auth-method";
const RESET_CONTEXT_KEY = "dokaniai-password-reset";

/** Store contact info in sessionStorage (cleared after verification) */
export function setAuthContact(contact: string, method: string = "phone") {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CONTACT_KEY, contact);
  sessionStorage.setItem(METHOD_KEY, method);
}

/** Retrieve stored contact info */
export function getAuthContact(): { contact: string; method: string } {
  if (typeof window === "undefined") return { contact: "", method: "phone" };
  return {
    contact: sessionStorage.getItem(CONTACT_KEY) || "",
    method: sessionStorage.getItem(METHOD_KEY) || "phone",
  };
}

/** Clear contact info after successful verification */
export function clearAuthContact() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CONTACT_KEY);
  sessionStorage.removeItem(METHOD_KEY);
}

// --- Password Reset context helpers ---

interface ResetContext {
  phoneOrEmail: string;
  otpExpiresAt: number;
  lastOtpSentAt: number;
}

/** Store password reset context in sessionStorage */
export function setResetContext(phoneOrEmail: string, otpExpiresAt: number): void {
  if (typeof window === "undefined") return;
  const ctx: ResetContext = {
    phoneOrEmail,
    otpExpiresAt,
    lastOtpSentAt: Date.now(),
  };
  sessionStorage.setItem(RESET_CONTEXT_KEY, JSON.stringify(ctx));
}

/** Retrieve password reset context from sessionStorage */
export function getResetContext(): ResetContext | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(RESET_CONTEXT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ResetContext;
  } catch {
    return null;
  }
}

/** Check whether the OTP has expired. Returns `null` when no context exists. */
export function isOtpExpired(): boolean | null {
  const ctx = getResetContext();
  if (!ctx) return null;
  return Date.now() > ctx.otpExpiresAt;
}

/** Clear password reset context from sessionStorage */
export function clearResetContext(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(RESET_CONTEXT_KEY);
}

// --- Subscription upgrade resume helpers ---

const PENDING_UPGRADE_PLAN_KEY = "pending_upgrade_plan";
const PENDING_PLAN_IS_TRIAL_KEY = "pending_plan_is_trial";
const REDIRECT_AFTER_LOGIN_KEY = "redirect_after_login";

function isSafeInternalPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

export function setPendingUpgradePlan(planId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_UPGRADE_PLAN_KEY, planId);
}

export function getPendingUpgradePlan(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(PENDING_UPGRADE_PLAN_KEY);
}

export function clearPendingUpgradePlan(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_UPGRADE_PLAN_KEY);
  sessionStorage.removeItem(PENDING_PLAN_IS_TRIAL_KEY);
}

/** Whether the pending plan is a free trial (vs a paid plan). */
export function isPendingPlanTrial(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(PENDING_PLAN_IS_TRIAL_KEY) === "true";
}

export function setRedirectAfterLogin(path: string): void {
  if (typeof window === "undefined" || !isSafeInternalPath(path)) return;
  sessionStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, path);
}

/**
 * Consume the stored redirect path after login.
 *
 * - Trial plans: return `null` so the caller falls through to the normal
 *   post-login redirect (onboarding / dashboard).  The trial modal is shown
 *   by the login page *before* this is consumed.
 * - Paid plans: return `/subscription/upgrade?plan=...`.
 * - Explicit redirect: honour it (e.g. from `setRedirectAfterLogin`).
 */
export function consumeRedirectAfterLogin(): string | null {
  if (typeof window === "undefined") return null;

  // 1. Explicit redirect takes priority
  const redirectPath = sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY);
  if (redirectPath) {
    sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);
    if (isSafeInternalPath(redirectPath)) {
      return redirectPath;
    }
  }

  // 2. Pending paid plan → upgrade flow
  const pendingPlanId = getPendingUpgradePlan();
  if (!pendingPlanId) {
    return null;
  }

  // 3. Trial plan → let normal redirect handle it (onboarding)
  if (isPendingPlanTrial()) {
    clearPendingUpgradePlan();
    return null;
  }

  // 4. Paid plan → upgrade page
  clearPendingUpgradePlan();
  return `/subscription/upgrade?plan=${encodeURIComponent(pendingPlanId)}`;
}

/**
 * Remember a plan the user selected before registering/logging in.
 * @param planId  The plan UUID
 * @param isTrial Whether the plan is a free trial (default: false)
 */
export function rememberPendingUpgrade(planId: string, isTrial: boolean = false): void {
  setPendingUpgradePlan(planId);
  if (typeof window !== "undefined") {
    sessionStorage.setItem(PENDING_PLAN_IS_TRIAL_KEY, isTrial ? "true" : "false");
  }

  if (isTrial) {
    // Trial plans don't need the upgrade page — clear any stale redirect
    sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);
  } else {
    setRedirectAfterLogin(`/subscription/upgrade?plan=${encodeURIComponent(planId)}`);
  }
}
