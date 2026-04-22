"use client";

import {
  getPaymentIntentStatus,
  invalidateCurrentSubscriptionCache,
  resubmitPaymentIntent,
  submitPaymentTrx,
} from "@/lib/subscriptionApi";
import { setRedirectAfterLogin } from "@/lib/authFlow";
import { listBusinesses } from "@/lib/businessApi";
import { buildShopPath } from "@/lib/shopRouting";
import type { MfsType, PaymentIntentStatusResponse } from "@/types/subscription";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

/** Shape of checkout data stored in sessionStorage by the upgrade page */
interface CheckoutData {
  paymentIntentId?: string; // optional for backward compatibility
  receiverNumber: string;
  amount: number;
  mfsMethod: MfsType;
  expiresAt: string;
}

/* ── Provider theme config ───────────────────────────────────────── */
const MFS_THEMES: Record<
  MfsType,
  {
    primary: string;
    gradient: string;
    lightBg: string;
    logo: string;
    labelBn: string;
    labelEn: string;
    trxPlaceholder: string;
    trxHint: string;
  }
> = {
  BKASH: {
    primary: "#E2136E",
    gradient: "linear-gradient(135deg, #E2136E 0%, #C4105E 100%)",
    lightBg: "#FDE8F1",
    logo: "/icons/payment/bkash.png",
    labelBn: "বিকাশ",
    labelEn: "bKash",
    trxPlaceholder: "যেমন: DDJ8BQBVCM",
    trxHint: "e.g. DDJ8BQBVCM",
  },
  NAGAD: {
    primary: "#F6921E",
    gradient: "linear-gradient(135deg, #F6921E 0%, #ED1C24 100%)",
    lightBg: "#FFF3E0",
    logo: "/icons/payment/nagad.png",
    labelBn: "নগদ",
    labelEn: "Nagad",
    trxPlaceholder: "যেমন: 754PTHMR",
    trxHint: "e.g. 754PTHMR",
  },
  ROCKET: {
    primary: "#8B2F8B",
    gradient: "linear-gradient(135deg, #8B2F8B 0%, #6B1F6B 100%)",
    lightBg: "#F3E5F5",
    logo: "/icons/payment/dbbl_rocket.jpeg",
    labelBn: "রকেট",
    labelEn: "Rocket",
    trxPlaceholder: "যেমন: 4661971574",
    trxHint: "e.g. 4661971574",
  },
};

/* ── TrxID validation per provider ─────────────────────────────── */
function validateTrxId(trxId: string, mfsMethod: MfsType): string | null {
  const trimmed = trxId.trim();
  if (!trimmed) return null;

  switch (mfsMethod) {
    case "BKASH": {
      if (!/^[A-Z0-9]{10}$/.test(trimmed))
        return "bKash TrxID must be 10 alphanumeric characters (e.g. DDJ8BQBVCM)";
      return null;
    }
    case "NAGAD": {
      if (!/^[A-Z0-9]{8}$/.test(trimmed))
        return "Nagad TxnID must be 8 alphanumeric characters (e.g. 754PTHMR)";
      return null;
    }
    case "ROCKET": {
      if (!/^\d{10}$/.test(trimmed))
        return "Rocket TxnId must be 10 digits (e.g. 4661971574)";
      return null;
    }
    default:
      return null;
  }
}

function formatPrice(value: number, locale: string): string {
  return new Intl.NumberFormat(locale.startsWith("bn") ? "bn-BD" : "en-US").format(value);
}

function isTerminalStatus(status: string): boolean {
  return status === "COMPLETED" || status === "FAILED" || status === "EXPIRED" || status === "REJECTED";
}

export default function SubscriptionPaymentStatusPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const locale = useLocale();
  const isBn = locale.startsWith("bn");
  const t = useTranslations("subscription");

  const paymentIntentId = params.id;
  const [statusData, setStatusData] = useState<PaymentIntentStatusResponse | null>(null);
  const [trxId, setTrxId] = useState("");
  const [trxError, setTrxError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  /* Tracks whether the user has submitted a TrxID — persisted in sessionStorage so it survives refresh */
  const [trxSubmitted, setTrxSubmitted] = useState(false);
  const [submittedTrxId, setSubmittedTrxId] = useState("");
  /* Smart redirect target after payment completion (resolved from business count) */
  const [redirectTarget, setRedirectTarget] = useState("/onboarding");
  /* Copy feedback state */
  const [copiedField, setCopiedField] = useState<string | null>(null);

  /* ── Auth guard ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawAuth = localStorage.getItem("dokaniai-auth-storage");
      const parsed = rawAuth ? JSON.parse(rawAuth) : null;
      if (!parsed?.state?.accessToken) {
        setRedirectAfterLogin(`/subscription/payment/${encodeURIComponent(paymentIntentId)}`);
        router.replace("/login");
      }
    } catch {
      router.replace("/login");
    }
  }, [paymentIntentId, router]);

  /* ── Load checkout data + restore TrxID submitted state ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem("payment_checkout");
      if (raw) setCheckoutData(JSON.parse(raw));
      const saved = sessionStorage.getItem("payment_trx_submitted");
      if (saved) {
        setTrxSubmitted(true);
        setSubmittedTrxId(saved);
      }
    } catch { /* ignore */ }
  }, []);

  /* ── Status polling ── */
  const refreshStatus = useCallback(async () => {
    try {
      const current = await getPaymentIntentStatus(paymentIntentId);
      setStatusData(current);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("payment.errors.statusFetchFailed"));
    }
  }, [paymentIntentId, t]);

  useEffect(() => { void refreshStatus(); }, [refreshStatus]);

  useEffect(() => {
    if (!statusData || isTerminalStatus(statusData.status)) return;
    const intervalId = window.setInterval(() => { void refreshStatus(); }, 5000);
    return () => { window.clearInterval(intervalId); };
  }, [refreshStatus, statusData]);

  /* ── Cleanup on terminal states ── */
  useEffect(() => {
    if (statusData?.status === "COMPLETED") {
      sessionStorage.removeItem("payment_checkout");
      sessionStorage.removeItem("payment_trx_submitted");
      // Invalidate subscription cache so onboarding/dashboard sees the new active subscription
      invalidateCurrentSubscriptionCache();
    }
    if (statusData?.status === "FAILED" || statusData?.status === "EXPIRED" || statusData?.status === "REJECTED") {
      sessionStorage.removeItem("payment_trx_submitted");
    }
  }, [statusData?.status]);

  /* ── Smart redirect after payment completion ──
    *  0 businesses → /onboarding (first-time setup)
    *  1 business   → /shop (direct to their store)
    *  2+ businesses → /businesses (business selector)
    */
  useEffect(() => {
    if (statusData?.status !== "COMPLETED") return;
    window.dispatchEvent(new CustomEvent("dokaniai:subscription-refresh"));
    let cancelled = false;
    const resolveTarget = async () => {
      try {
        const response = await listBusinesses();
        const businesses = response.businesses ?? [];
        if (cancelled) return;
        if (businesses.length === 0) {
          setRedirectTarget("/onboarding");
        } else if (businesses.length === 1) {
          setRedirectTarget(buildShopPath(businesses[0].id));
        } else {
          setRedirectTarget("/businesses");
        }
      } catch {
        if (!cancelled) setRedirectTarget("/onboarding");
      }
    };
    void resolveTarget();
    return () => { cancelled = true; };
  }, [statusData?.status]);

  /* ── Countdown timer ── */
  useEffect(() => {
    const expiryStr = statusData?.expiresAt || checkoutData?.expiresAt;
    if (!expiryStr || isTerminalStatus(statusData?.status ?? "")) return;
    const expiry = new Date(expiryStr).getTime();
    const tick = () => {
      const diff = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setRemainingSeconds(diff);
      if (diff <= 0) void refreshStatus();
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [statusData?.expiresAt, checkoutData?.expiresAt, statusData?.status, refreshStatus]);

  const statusLabel = useMemo(() => {
    if (!statusData) return t("payment.status.loading");
    if (statusData.status === "COMPLETED") return t("payment.status.completed");
    if (statusData.status === "MANUAL_REVIEW") return t("payment.status.manualReview");
    if (statusData.status === "FAILED") return t("payment.status.failed");
    if (statusData.status === "EXPIRED") return t("payment.status.expired");
    if (statusData.status === "REJECTED") return t("payment.status.rejected");
    return t("payment.status.pending");
  }, [statusData, t]);

  /* ── Handlers ── */
  const handleSubmitTrx = async () => {
    if (!trxId.trim()) { setNotice(t("payment.errors.enterTrx")); return; }
    if (checkoutData) {
      const validationError = validateTrxId(trxId, checkoutData.mfsMethod);
      if (validationError) { setTrxError(validationError); return; }
    }
    setTrxError(null);
    setIsSubmitting(true);
    try {
      const next = await submitPaymentTrx(paymentIntentId, trxId.trim());
      setStatusData(next);
      setTrxSubmitted(true);
      setSubmittedTrxId(trxId.trim());
      sessionStorage.setItem("payment_trx_submitted", trxId.trim());
      setNotice(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("payment.errors.trxSubmitFailed"));
    } finally { setIsSubmitting(false); }
  };

  const handleResubmit = async () => {
    setIsSubmitting(true);
    try {
      const next = await resubmitPaymentIntent(paymentIntentId);
      setStatusData(next);
      setTrxSubmitted(false);
      setSubmittedTrxId("");
      sessionStorage.removeItem("payment_trx_submitted");
      setNotice(t("payment.resubmitted"));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("payment.errors.resubmitFailed"));
    } finally { setIsSubmitting(false); }
  };

  /* ── Clipboard helper with fallback for non-HTTPS contexts ── */
  const copyToClipboard = useCallback(async (text: string, fieldId: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for HTTP or older browsers
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      /* silently fail */
    }
  }, []);

  /* ── Derived state ── */
  const theme = checkoutData ? MFS_THEMES[checkoutData.mfsMethod] : null;
  const isCompleted = statusData?.status === "COMPLETED";
  const isPending = !statusData || statusData.status === "PENDING";
  const isManualReview = statusData?.status === "MANUAL_REVIEW";
  const isFailed = statusData?.status === "FAILED" || statusData?.status === "REJECTED";
  const isExpired = statusData?.status === "EXPIRED";
  const showVerificationUI = isManualReview || (trxSubmitted && isPending);
  /* Display TrxID: prefer local state, fallback to API response */
  const displayTrxId = submittedTrxId || statusData?.submittedTrxId || "";

  /* ══════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#f8faf6] font-['Hind_Siliguri','Manrope',sans-serif] antialiased">
      <header className="sticky top-0 z-40 bg-[#f2f4f0] flex items-center justify-between px-4 sm:px-6 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#191c1a] hover:bg-[#ecefeb] transition-colors shadow-sm">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
          </button>
          <span className="font-['Manrope',sans-serif] font-bold text-xl text-[#003727]">DokaniAI</span>
        </div>
        <span className="text-sm font-semibold text-[#404944]">{isBn ? "ধাপ ৩ / ৩" : "Step 3 of 3"}</span>
      </header>

      <main className="max-w-lg mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        {notice && !trxSubmitted && (
          <div className="rounded-xl bg-[#ecefeb] px-5 py-3 text-sm text-[#191c1a]">{notice}</div>
        )}

        {/* ══════ COMPLETED ══════ */}
        {isCompleted ? (
          <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgba(25,28,26,0.06)] text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#00503a]/10 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[#003727] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <h2 className="text-2xl font-bold text-[#191c1a]">{isBn ? "পেমেন্ট সফল!" : "Payment Successful!"}</h2>
            <p className="text-sm text-[#404944]">{isBn ? "আপনার সাবস্ক্রিপশন সক্রিয় হয়েছে।" : "Your subscription is now active."}</p>
            {/* Smart CTA: routes to onboarding / shop / business list based on count */}
            <button onClick={() => router.push(redirectTarget)} className="w-full py-3.5 text-white font-bold text-base rounded-full shadow-lg" style={{ background: "linear-gradient(135deg, #003727, #00503a)" }}>
              {redirectTarget === "/onboarding"
                ? (isBn ? "অনবোর্ডিং শুরু করুন" : "Start Onboarding")
                : redirectTarget === "/businesses"
                  ? (isBn ? "ব্যবসা নির্বাচন করুন" : "Select Business")
                  : (isBn ? "দোকানে যান" : "Go to Shop")}
            </button>
          </div>

          /* ══════ VERIFICATION WAITING UI (glassy card) ══════ */
        ) : showVerificationUI ? (
          <div className="space-y-5">
            {/* Glassy verification card */}
            <div className="relative rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(25,28,26,0.10)] border border-white/40">
              <div className="absolute inset-0 bg-white/70 backdrop-blur-xl" />
              <div className="relative h-2 overflow-hidden" style={{ background: theme?.gradient ?? "linear-gradient(135deg, #003727, #00503a)" }}>
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              </div>
              <div className="relative p-8 space-y-6">
                {/* Animated pending icon */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute -inset-3 rounded-full animate-ping opacity-15" style={{ background: theme?.primary ?? "#003727", animationDuration: "2s" }} />
                    <div className="absolute -inset-1.5 rounded-full animate-ping opacity-10" style={{ background: theme?.primary ?? "#003727", animationDuration: "2.5s" }} />
                    <div className="relative w-24 h-24 rounded-full flex items-center justify-center shadow-lg" style={{ background: theme?.gradient ?? "linear-gradient(135deg, #003727, #00503a)" }}>
                      {isManualReview ? (
                        <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>person_search</span>
                      ) : (
                        <svg className="w-10 h-10 text-white animate-spin" style={{ animationDuration: "3s" }} viewBox="0 0 24 24" fill="none">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor" opacity="0.3" />
                          <path d="M12 2C6.48 2 2 6.48 2 12h2c0-4.41 3.59-8 8-8V2z" fill="currentColor" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status text */}
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-bold text-[#191c1a]">
                    {isManualReview
                      ? (isBn ? "ম্যানুয়াল রিভিউতে আছে" : "Under Manual Review")
                      : (isBn ? "পেমেন্ট যাচাই হচ্ছে..." : "Verifying Payment...")}
                  </h2>
                  <p className="text-sm text-[#404944]">
                    {isManualReview
                      ? (isBn ? "আপনার পেমেন্ট এডমিন যাচাই করছেন। কিছুক্ষণের মধ্যে কনফার্ম হবে।" : "An admin is verifying your payment. It will be confirmed shortly.")
                      : (isBn ? "আপনার পেমেন্ট স্বয়ংক্রিয়ভাবে যাচাই করা হচ্ছে। অনুগ্রহ করে অপেক্ষা করুন।" : "Your payment is being auto-verified. Please wait.")}
                  </p>
                </div>

                {/* TrxID + Amount info — uses displayTrxId which falls back to API response */}
                <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#707974]">{isBn ? "ট্রানজেকশন আইডি" : "Transaction ID"}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold font-['Manrope',sans-serif] tracking-wider" style={{ color: theme?.primary ?? "#191c1a" }}>{displayTrxId || (isBn ? "লোড হচ্ছে..." : "Loading...")}</span>
                      {displayTrxId && (
                        <button onClick={() => copyToClipboard(displayTrxId, "trxid")} className="rounded p-0.5 hover:bg-white/60 transition-colors" title={isBn ? "কপি করুন" : "Copy"}>
                          <span className="material-symbols-outlined text-sm" style={{ color: copiedField === "trxid" ? "#00503a" : (theme?.primary ?? "#707974") }}>
                            {copiedField === "trxid" ? "check" : "content_copy"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                  {checkoutData && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#707974]">{isBn ? "পরিমাণ" : "Amount"}</span>
                      <span className="text-sm font-bold font-['Manrope',sans-serif]" style={{ color: theme?.primary }}>৳{formatPrice(checkoutData.amount, locale)}</span>
                    </div>
                  )}
                  {checkoutData && theme && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#707974]">{isBn ? "পদ্ধতি" : "Method"}</span>
                      <div className="flex items-center gap-2">
                        <div className="relative w-5 h-5 rounded overflow-hidden">
                          <Image src={theme.logo} alt={theme.labelEn} fill className="object-contain" />
                        </div>
                        <span className="text-sm font-medium text-[#191c1a]">{isBn ? theme.labelBn : theme.labelEn}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Live polling dots */}
                <div className="flex items-center justify-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: theme?.primary ?? "#003727", animationDelay: "0ms", animationDuration: "1s" }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: theme?.primary ?? "#003727", animationDelay: "150ms", animationDuration: "1s" }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: theme?.primary ?? "#003727", animationDelay: "300ms", animationDuration: "1s" }} />
                  </div>
                  <span className="text-xs text-[#707974]">{isBn ? "স্বয়ংক্রিয়ভাবে আপডেট হচ্ছে" : "Auto-updating"}</span>
                </div>
              </div>
            </div>

            {/* Countdown timer — always visible in verification UI */}
            {remainingSeconds !== null && remainingSeconds > 0 && (
              <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-full mx-auto w-fit" style={{ backgroundColor: theme ? `${theme.primary}10` : "#00372710" }}>
                <span className="material-symbols-outlined text-base" style={{ color: theme?.primary ?? "#003727" }}>timer</span>
                <span className="text-sm" style={{ color: theme?.primary ?? "#003727" }}>{isBn ? "সেশন মেয়াদোত্তীর্ণ হবে" : "Session expires in"} </span>
                <span className="font-bold font-['Manrope',sans-serif] tabular-nums" style={{ color: theme?.primary ?? "#003727" }}>
                  {String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:{String(remainingSeconds % 60).padStart(2, "0")}
                </span>
              </div>
            )}

            {/* NO "Go Back" or "Check Later" buttons — user MUST stay on verification UI
                until payment is verified or rejected. This is by design. */}

            <p className="text-center text-[11px] text-[#707974] flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[13px]">lock</span>
              {isBn ? "এই পৃষ্ঠাটি খোলা রাখুন — পেমেন্ট কনফার্ম হলে স্বয়ংক্রিয়ভাবে আপডেট হবে" : "Keep this page open — it will auto-update when payment is confirmed"}
            </p>
          </div>

          /* ══════ FAILED / REJECTED ══════ */
        ) : isFailed ? (
          <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgba(25,28,26,0.06)] text-center space-y-4 border border-[#ffdad6]/50">
            <div className="w-16 h-16 rounded-full bg-[#ba1a1a]/10 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[#ba1a1a] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                {statusData?.status === "REJECTED" ? "block" : "cancel"}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#ba1a1a]">
              {statusData?.status === "REJECTED"
                ? (isBn ? "পেমেন্ট প্রত্যাখ্যাত হয়েছে" : "Payment Rejected")
                : (isBn ? "পেমেন্ট ব্যর্থ হয়েছে" : "Payment Failed")}
            </h2>
            <p className="text-sm text-[#404944]">
              {statusData?.status === "REJECTED"
                ? (isBn ? "আপনার পেমেন্ট যাচাই করা যায়নি।" : "Your payment could not be verified.")
                : (isBn ? "আপনার পেমেন্ট যাচাই করা যায়নি। আবার চেষ্টা করুন।" : "Your payment could not be verified. Please try again.")}
            </p>
            {statusData?.status === "REJECTED" && statusData.rejectionReason && (
              <div className="rounded-xl bg-[#ffdad6]/30 px-4 py-3 text-left space-y-1">
                <p className="text-xs font-semibold text-[#ba1a1a]">{isBn ? "কারণ:" : "Reason:"}</p>
                <p className="text-sm text-[#404944]">{statusData.rejectionReason}</p>
              </div>
            )}
            {statusData?.status === "REJECTED" ? (
              <button onClick={() => router.push("/subscription/upgrade")} className="w-full py-3.5 text-white font-bold text-base rounded-full shadow-lg flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #003727, #00503a)" }}>
                <span className="material-symbols-outlined text-lg">payments</span>
                <span>{isBn ? "নতুন পেমেন্ট শুরু করুন" : "Start New Payment"}</span>
              </button>
            ) : (
              <button onClick={handleResubmit} disabled={isSubmitting} className="w-full py-3.5 text-white font-bold text-base rounded-full shadow-lg disabled:opacity-40 flex items-center justify-center gap-2" style={theme ? { background: theme.gradient } : { background: "linear-gradient(135deg, #003727, #00503a)" }}>
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">refresh</span>
                    <span>{isBn ? "আবার চেষ্টা করুন" : "Try Again"}</span>
                  </>
                )}
              </button>
            )}
            <button onClick={() => router.push("/subscription/upgrade")} className="w-full py-2.5 text-sm font-medium text-[#404944] hover:text-[#191c1a] transition-colors">
              {isBn ? "← ফিরে যান" : "← Go Back"}
            </button>
          </div>

          /* ══════ EXPIRED ══════ */
        ) : isExpired ? (
          <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgba(25,28,26,0.06)] text-center space-y-4 border border-[#e5e7e4]">
            <div className="w-16 h-16 rounded-full bg-[#707974]/10 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[#707974] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>timer_off</span>
            </div>
            <h2 className="text-xl font-bold text-[#191c1a]">{isBn ? "সেশন মেয়াদোত্তীর্ণ" : "Session Expired"}</h2>
            <p className="text-sm text-[#404944]">{isBn ? "পেমেন্ট সেশনের সময় শেষ হয়ে গেছে। নতুন করে শুরু করুন।" : "The payment session has expired. Please start over."}</p>
            <button onClick={() => router.push("/")} className="w-full py-3.5 text-white font-bold text-base rounded-full shadow-lg" style={{ background: "linear-gradient(135deg, #003727, #00503a)" }}>
              {isBn ? "হোম পেজে যান" : "Go to Home"}
            </button>
          </div>

          /* ══════ DEFAULT — Payment instruction card + TrxID input ══════ */
        ) : (
          <>
            {checkoutData && theme && isPending && (
              <div className="rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(25,28,26,0.08)] border border-[#e5e7e4]">
                {/* Provider header banner */}
                <div className="relative px-6 py-5 flex items-center gap-4" style={{ background: theme.gradient }}>
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
                  <div className="relative w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center p-1.5 shadow-lg">
                    <Image src={theme.logo} alt={theme.labelEn} width={36} height={36} className="object-contain" />
                  </div>
                  <div className="relative flex-1">
                    <h3 className="font-bold text-white text-lg">{isBn ? theme.labelBn : theme.labelEn} {isBn ? "পেমেন্ট" : "Payment"}</h3>
                    <p className="text-xs text-white/80">{isBn ? "নিচের নির্দেশনা অনুসরণ করুন" : "Follow the instructions below"}</p>
                  </div>
                  {remainingSeconds !== null && remainingSeconds > 0 && (
                    <div className="relative flex flex-col items-center">
                      <div className="flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3.5 py-2">
                        <span className="material-symbols-outlined text-white text-base">timer</span>
                        <span className="text-white font-bold text-sm tabular-nums tracking-wide">
                          {String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:{String(remainingSeconds % 60).padStart(2, "0")}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/70 mt-0.5">{isBn ? "সময় বাকি" : "remaining"}</span>
                    </div>
                  )}
                  {remainingSeconds === 0 && (
                    <div className="relative flex flex-col items-center">
                      <div className="flex items-center gap-1.5 rounded-full bg-white/30 backdrop-blur-sm px-3.5 py-2">
                        <span className="material-symbols-outlined text-white text-base">warning</span>
                        <span className="text-white font-bold text-sm">{isBn ? "মেয়াদ শেষ!" : "Expired!"}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Steps */}
                <div className="bg-white p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-white shadow-sm" style={{ background: theme.gradient }}>1</div>
                    <p className="text-sm text-[#191c1a] pt-0.5">
                      {isBn ? `${theme.labelBn} অ্যাপ খুলুন → "সেন্ড মানি" এ যান` : `Open ${theme.labelEn} App \u2192 Go to "Send Money"`}
                    </p>
                  </div>
                  <div className="ml-3.5 border-l-2 border-dashed border-[#e5e7e4] h-2" />
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-white shadow-sm" style={{ background: theme.gradient }}>2</div>
                    <div className="text-sm text-[#191c1a] flex-1">
                      <p className="mb-1.5">{isBn ? "এই নম্বরে পাঠান:" : "Send to this number:"}</p>
                      <div className="rounded-xl px-4 py-3 flex items-center justify-between border" style={{ backgroundColor: theme.lightBg, borderColor: `${theme.primary}30` }}>
                        <span className="text-lg font-bold font-['Manrope',sans-serif] tracking-wider" style={{ color: theme.primary }}>{checkoutData.receiverNumber}</span>
                        <button onClick={() => copyToClipboard(checkoutData.receiverNumber, "receiver")} className="rounded-lg p-1.5 transition-colors hover:bg-white/60" style={{ color: copiedField === "receiver" ? "#00503a" : theme.primary }} title={isBn ? "কপি করুন" : "Copy"}>
                          <span className="material-symbols-outlined text-xl">{copiedField === "receiver" ? "check" : "content_copy"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="ml-3.5 border-l-2 border-dashed border-[#e5e7e4] h-2" />
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-white shadow-sm" style={{ background: theme.gradient }}>3</div>
                    <div className="text-sm text-[#191c1a] flex-1">
                      <p className="mb-1.5">{isBn ? "পরিমাণ:" : "Amount:"}</p>
                      <div className="rounded-xl px-4 py-3 border" style={{ backgroundColor: theme.lightBg, borderColor: `${theme.primary}30` }}>
                        <span className="text-2xl font-black font-['Manrope',sans-serif]" style={{ color: theme.primary }}>৳{formatPrice(checkoutData.amount, locale)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-3.5 border-l-2 border-dashed border-[#e5e7e4] h-2" />
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-white shadow-sm" style={{ background: theme.gradient }}>4</div>
                    <p className="text-sm text-[#191c1a] pt-0.5">
                      {isBn ? "PIN দিয়ে কনফার্ম করুন এবং Transaction ID কপি করুন" : "Confirm with PIN and copy the Transaction ID"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Transaction status + TrxID input ── */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgba(25,28,26,0.06)] space-y-4 border border-[#e5e7e4]">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#191c1a]">{isBn ? "লেনদেনের অবস্থা" : "Transaction Status"}</h3>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isPending ? "bg-[#d1e4ff]/40 text-[#0061a4]" : "bg-[#ffdad6]/50 text-[#ba1a1a]"}`}>
                  {statusLabel}
                </span>
              </div>

              {isPending && (
                <>
                  <div className={`rounded-xl px-4 py-3 flex items-center gap-3 border-2 transition-colors ${trxError ? "border-[#ba1a1a]/50 bg-[#ffdad6]/20" : "bg-[#f8faf6]"}`} style={!trxError && theme ? { borderColor: `${theme.primary}40` } : trxError ? {} : { borderColor: "#e5e7e4" }}>
                    <span className="material-symbols-outlined text-[#707974] text-lg">label</span>
                    <div className="flex-1">
                      <span className="text-xs text-[#404944]">{isBn ? "Transaction ID লিখুন" : "Enter Transaction ID"}</span>
                      <input
                        value={trxId}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setTrxId(val);
                          setTrxError(null);
                        }}
                        placeholder={isBn ? theme?.trxPlaceholder ?? "যেমন: TXN123456789" : theme?.trxHint ?? "e.g. TXN123456789"}
                        className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-[#191c1a] text-base font-semibold placeholder:text-[#707974] placeholder:font-normal mt-0.5"
                      />
                    </div>
                  </div>

                  {trxError && (
                    <p className="text-xs text-[#ba1a1a] flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      {trxError}
                    </p>
                  )}

                  {theme && !trxError && (
                    <p className="text-[11px] text-[#707974] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">info</span>
                      {checkoutData?.mfsMethod === "BKASH" && (isBn ? "bKash TrxID: ১০ অক্ষরের আলফানিউমেরিক (যেমন DDJ8BQBVCM)" : "bKash TrxID: 10 alphanumeric characters (e.g. DDJ8BQBVCM)")}
                      {checkoutData?.mfsMethod === "NAGAD" && (isBn ? "Nagad TxnID: ৮ অক্ষরের আলফানিউমেরিক (যেমন 754PTHMR)" : "Nagad TxnID: 8 alphanumeric characters (e.g. 754PTHMR)")}
                      {checkoutData?.mfsMethod === "ROCKET" && (isBn ? "Rocket TxnId: ১০ সংখ্যার ডিজিট (যেমন 4661971574)" : "Rocket TxnId: 10 digit number (e.g. 4661971574)")}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleSubmitTrx}
                    disabled={isSubmitting || !trxId.trim()}
                    className="w-full py-3.5 text-white font-bold text-base rounded-full shadow-lg disabled:opacity-40 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                    style={theme ? { background: theme.gradient } : { background: "linear-gradient(135deg, #003727, #00503a)" }}
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg">verified</span>
                        <span>{isBn ? "TrxID জমা দিন" : "Submit TrxID"}</span>
                      </>
                    )}
                  </button>
                </>
              )}

            </div>

            <p className="text-center text-[11px] text-[#404944] flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[13px]">lock</span>
              {isBn ? "পেমেন্ট নিশ্চিত হলে স্বয়ংক্রিয়ভাবে ভেরিফাই হবে" : "Payment will be auto-verified when confirmed"}
            </p>
          </>
        )}
      </main>
    </div>
  );
}
