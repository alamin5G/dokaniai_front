/**
 * Masks a phone number or email for safe display.
 * Phone: 01581741783 → 015*****783
 * Email: user@example.com → u***@example.com
 */
export function maskContact(contact: string): string {
  if (!contact) return "";
  
  // Email masking
  if (contact.includes("@")) {
    const [local, domain] = contact.split("@");
    if (!local || !domain) return "***";
    const visible = local.length <= 2 ? local[0] : local.slice(0, 2);
    return `${visible}***@${domain}`;
  }
  
  // Phone masking: show first 3 and last 3 digits
  const digits = contact.replace(/\D/g, "");
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
