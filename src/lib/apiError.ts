import axios from "axios";

/* ------------------------------------------------------------------ */
/*  Types matching the DokaniAI API_Design.md response format          */
/* ------------------------------------------------------------------ */

/** The `error` object inside a failed API response */
type ApiErrorObject = {
  code?: string;
  message?: string;
  details?: unknown; // string | string[] | Record<string, string> | null
};

/** Top-level response body for any API call */
type ApiResponseBody = {
  success?: boolean;
  data?: unknown;
  message?: string; // sometimes at top level
  error?: string | ApiErrorObject; // string OR { code, message, details }
  errors?: Array<{ field?: string; message?: string; defaultMessage?: string }>;
  status?: number;
  timestamp?: string;
  path?: string;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Safely converts a `details` field to a displayable string.
 * Handles string, string[], Record<string,string>, and null.
 */
function detailsToString(details: unknown): string | null {
  if (!details) return null;
  if (typeof details === "string") return details;
  if (Array.isArray(details)) return details.join(" | ");
  if (typeof details === "object") {
    // { fieldName: "error message", ... }
    return Object.values(details)
      .map((v) => (typeof v === "string" ? v : String(v)))
      .join(" | ");
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Main error extractor                                               */
/* ------------------------------------------------------------------ */

/**
 * Extracts a human-readable error message from an API error response.
 *
 * Handles these formats (per API_Design.md + Spring Boot defaults):
 *
 *  1. `{ success:false, error: { code, message, details } }` — DokaniAI standard
 *  2. `{ message: "..." }` — top-level message
 *  3. `{ errors: [{ field, defaultMessage }] }` — Spring Boot @Valid
 *  4. `{ error: "string" }` — simple string error
 *  5. Network / timeout / status-code fallbacks
 */
export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  // Not an Axios error — return JS error message or fallback
  if (!axios.isAxiosError<ApiResponseBody>(error)) {
    return error instanceof Error ? error.message : fallbackMessage;
  }

  const resData = error.response?.data;

  // No response body (network error, timeout, etc.)
  if (!resData) {
    if (error.code === "ERR_NETWORK") return "নেটওয়ার্ক সমস্যা। ইন্টারনেট সংযোগ পরীক্ষা করুন।";
    if (error.code === "ECONNABORTED") return "সার্ভার সময়মতো সাড়া দিচ্ছে না। আবার চেষ্টা করুন।";
    return fallbackMessage;
  }

  // ── 1. DokaniAI standard: { success:false, error: { code, message, details } } ──
  if (resData.error && typeof resData.error === "object" && !Array.isArray(resData.error)) {
    const errObj = resData.error as ApiErrorObject;
    if (errObj.message && typeof errObj.message === "string") {
      const details = detailsToString(errObj.details);
      return details ? `${errObj.message}: ${details}` : errObj.message;
    }
  }

  // ── 2. Top-level message (some endpoints) ──
  if (resData.message && typeof resData.message === "string") {
    const details = detailsToString((resData as Record<string, unknown>).details);
    return details ? `${resData.message}: ${details}` : resData.message;
  }

  // ── 3. Spring Boot @Valid: { errors: [{ field, defaultMessage }] } ──
  if (resData.errors && Array.isArray(resData.errors) && resData.errors.length > 0) {
    const messages = resData.errors
      .map((e) => e.message || e.defaultMessage || "")
      .filter(Boolean);
    if (messages.length > 0) return messages.join(" | ");
  }

  // ── 4. Simple string error field ──
  if (resData.error && typeof resData.error === "string") {
    return resData.error;
  }

  // ── 5. Status-based fallback ──
  const status = error.response?.status;
  if (status === 401) return "অননুমোদিত। আবার লগইন করুন।";
  if (status === 403) return "প্রবেশাধিকার অস্বীকৃত।";
  if (status === 404) return "পৃষ্ঠা বা রিসোর্স পাওয়া যায়নি।";
  if (status === 409) return "এই তথ্য ইতিমধ্যে ব্যবহৃত হয়েছে।";
  if (status === 429) return "অনেকবার চেষ্টা করেছেন। কিছুক্ষণ পর আবার চেষ্টা করুন।";
  if (status === 500) return "সার্ভার সমস্যা। পরে আবার চেষ্টা করুন।";

  return fallbackMessage;
}

/* ------------------------------------------------------------------ */
/*  Field-level error extractor                                        */
/* ------------------------------------------------------------------ */

/**
 * Extract field-specific validation errors from API response.
 * Handles two formats:
 *  - `{ errors: [{ field, message }] }` — Spring Boot @Valid
 *  - `{ error: { code, message, details: ["field: msg", ...] } }` — DokaniAI VALIDATION_ERROR
 * Returns a map of { fieldName: errorMessage }.
 */
export function getApiFieldErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError<ApiResponseBody>(error)) return {};

  const resData = error.response?.data;
  if (!resData) return {};

  const fieldErrors: Record<string, string> = {};

  // Spring Boot @Valid format: { errors: [{ field, message }] }
  if (resData.errors && Array.isArray(resData.errors)) {
    for (const e of resData.errors) {
      if (e.field && (e.message || e.defaultMessage)) {
        fieldErrors[e.field] = e.message || e.defaultMessage || "";
      }
    }
  }

  // DokaniAI VALIDATION_ERROR format: { error: { details: ["field: message", ...] } }
  if (resData.error && typeof resData.error === "object" && !Array.isArray(resData.error)) {
    const details = resData.error.details;
    if (Array.isArray(details)) {
      for (const entry of details) {
        if (typeof entry === "string") {
          const colonIdx = entry.indexOf(": ");
          if (colonIdx > 0) {
            const field = entry.substring(0, colonIdx).trim();
            const msg = entry.substring(colonIdx + 2).trim();
            if (field && msg && !fieldErrors[field]) {
              fieldErrors[field] = msg;
            }
          }
        }
      }
    }
  }

  return fieldErrors;
}

/**
 * Extract the error code from the API response.
 * Returns null if not found.
 */
export function getApiErrorCode(error: unknown): string | null {
  if (!axios.isAxiosError<ApiResponseBody>(error)) return null;
  const resData = error.response?.data;
  if (resData?.error && typeof resData.error === "object" && !Array.isArray(resData.error)) {
    return resData.error.code ?? null;
  }
  return null;
}
