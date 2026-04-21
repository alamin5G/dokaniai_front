"use client";

import {
  getPaymentIntentStatus,
  resubmitPaymentIntent,
  submitPaymentTrx,
} from "@/lib/subscriptionApi";
import { setRedirectAfterLogin } from "@/lib/authFlow";
import type { MfsType, PaymentIntentStatusResponse } from "@/types/subscription";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

interface CheckoutData {
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
  if (!trimmed) return null; // empty handled elsewhere

  switch (mfsMethod) {
    case "BKASH": {
      // bKash: ~10 alphanumeric uppercase
      if (!/^[A-Z0-9]{10}$/.test(trimmed))
        return "bKash TrxID must be 10 alphanumeric characters (e.g. DDJ8BQBVCM)";
      return null;
    }
    case "NAGAD": {
      // Nagad: ~8 alphanumeric uppercase
      if (!/^[A-Z0-9]{8}$/.test(trimmed))
        return "Nagad TxnID must be 8 alphanumeric characters (e.g. 754PTHMR)";
      return null;
    }
    case "ROCKET": {
      // Rocket: 10 digit numeric
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
  return status === "COMPLETED" || status === "FAILED" || status === "EXPIRED";
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem("payment_checkout");
      if (raw) setCheckoutData(JSON.parse(raw));
    } catch { }
  }, []);

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

  useEffect(() => {
    if (statusData?.status === "COMPLETED") {
      sessionStorage.removeItem("payment_checkout");
    }
  }, [statusData?.status]);

  const statusLabel = useMemo(() => {
    if (!statusData) return t("payment.status.loading");
    if (statusData.status === "COMPLETED") return t("payment.status.completed");
    if (statusData.status === "MANUAL_REVIEW") return t("payment.status.manualReview");
    if (statusData.status === "FAILED") return t("payment.status.failed");
    if (statusData.status === "EXPIRED") return t("payment.status.expired");
    return t("payment.status.pending");
  }, [statusData, t]);

  const handleSubmitTrx = async () => {
    if (!trxId.trim()) { setNotice(t("payment.errors.enterTrx")); return; }

    // Validate TrxID format per provider
    if (checkoutData) {
      const validationError = validateTrxId(trxId, checkoutData.mfsMethod);
      if (validationError) {
        setTrxError(validationError);
        return;
      }
    }
    setTrxError(null);
    setIsSubmitting(true);
    try {
      const next = await submitPaymentTrx(paymentIntentId, trxId.trim());
      setStatusData(next);
      setNotice(t("payment.trxSubmitted"));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("payment.errors.trxSubmitFailed"));
    } finally { setIsSubmitting(false); }
  };

  const handleResubmit = async () => {
    setIsSubmitting(true);
    try {
      const next = await resubmitPaymentIntent(paymentIntentId);
      setStatusData(next);
      setNotice(t("payment.resubmitted"));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("payment.errors.resubmitFailed"));
    } finally { setIsSubmitting(false); }
  };

  const theme = checkoutData ? MFS_THEMES[checkoutData.mfsMethod] : null;
  const isCompleted = statusData?.status === "COMPLETED";
  const isPending = !statusData || statusData.status === "PENDING";

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
        {notice && (
          <div className="rounded-xl bg-[#ecefeb] px-5 py-3 text-sm text-[#191c1a]">{notice}</div>
        )}

        {isCompleted ? (
          <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgba(25,28,26,0.06)] text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#00503a]/10 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[#003727] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <h2 className="text-2xl font-bold text-[#191c1a]">{isBn ? "পেমেন্ট সফল!" : "Payment Successful!"}</h2>
            <p className="text-sm text-[#404944]">{isBn ? "আপনার সাবস্ক্রিপশন সক্রিয় হয়েছে। এখন আপনার ব্যবসা সেটআপ করুন।" : "Your subscription is now active. Let's set up your business."}</p>
            <button onClick={() => router.push("/onboarding")} className="w-full py-3.5 text-white font-bold text-base rounded-full shadow-lg" style={{ background: "linear-gradient(135deg, #003727, #00503a)" }}>
              {isBn ? "অনবোর্ডিং শুরু করুন" : "Start Onboarding"}
            </button>
          </div>
        ) : (
          <>
            {/* ── Provider-branded payment instruction card ── */}
            {checkoutData && theme && isPending && (
              <div className="rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(25,28,26,0.08)] border border-[#e5e7e4]">
                {/* Provider header banner */}
                <div className="relative px-6 py-5 flex items-center gap-4" style={{ background: theme.gradient }}>
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
                  <div className="relative w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center p-1.5 shadow-lg">
                    <Image src={theme.logo} alt={theme.labelEn} width={36} height={36} className="object-contain" />
                  </div>
                  <div className="relative">
                    <h3 className="font-bold text-white text-lg">{isBn ? theme.labelBn : theme.labelEn} {isBn ? "পেমেন্ট" : "Payment"}</h3>
                    <p className="text-xs text-white/80">{isBn ? "নিচের নির্দেশনা অনুসরণ করুন" : "Follow the instructions below"}</p>
                  </div>
                </div>

                {/* Steps */}
                <div className="bg-white p-6 space-y-4">
                  {/* Step 1 */}
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-white shadow-sm" style={{ background: theme.gradient }}>
                      1
                    </div>
                    <p className="text-sm text-[#191c1a] pt-0.5">
                      {isBn
                        ? `${theme.labelBn} অ্যাপ খুলুন → "সেন্ড মানি" এ যান`
                        : `Open ${theme.labelEn} App → Go to "Send Money"`}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="ml-3.5 border-l-2 border-dashed border-[#e5e7e4] h-2" />

                  {/* Step 2 */}
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-white shadow-sm" style={{ background: theme.gradient }}>
                      2
                    </div>
                    <div className="text-sm text-[#191c1a] flex-1">
                      <p className="mb-1.5">{isBn ? "এই নম্বরে পাঠান:" : "Send to this number:"}</p>
                      <div className="rounded-xl px-4 py-3 flex items-center justify-between border" style={{ backgroundColor: theme.lightBg, borderColor: `${theme.primary}30` }}>
                        <span className="text-lg font-bold font-['Manrope',sans-serif] tracking-wider" style={{ color: theme.primary }}>{checkoutData.receiverNumber}</span>
                        <button
                          onClick={() => navigator.clipboard?.writeText(checkoutData.receiverNumber)}
                          className="rounded-lg p-1.5 transition-colors hover:bg-white/60"
                          style={{ color: theme.primary }}
                          title={isBn ? "কপি করুন" : "Copy"}
                        >
                          <span className="material-symbols-outlined text-xl">content_copy</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="ml-3.5 border-l-2 border-dashed border-[#e5e7e4] h-2" />

                  {/* Step 3 */}
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-white shadow-sm" style={{ background: theme.gradient }}>
                      3
                    </div>
                    <div className="text-sm text-[#191c1a] flex-1">
                      <p className="mb-1.5">{isBn ? "পরিমাণ:" : "Amount:"}</p>
                      <div className="rounded-xl px-4 py-3 border" style={{ backgroundColor: theme.lightBg, borderColor: `${theme.primary}30` }}>
                        <span className="text-2xl font-black font-['Manrope',sans-serif]" style={{ color: theme.primary }}>৳{formatPrice(checkoutData.amount, locale)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="ml-3.5 border-l-2 border-dashed border-[#e5e7e4] h-2" />

                  {/* Step 4 */}
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-white shadow-sm" style={{ background: theme.gradient }}>
                      4
                    </div>
                    <p className="text-sm text-[#191c1a] pt-0.5">
                      {isBn ? "PIN দিয়ে কনফার্ম করুন এবং Transaction ID কপি করুন" : "Confirm with PIN and copy the Transaction ID"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {statusData?.status === "MANUAL_REVIEW" && (
              <div className="bg-[#d1e4ff]/30 rounded-xl p-5 flex items-start gap-3">
                <span className="material-symbols-outlined text-[#0061a4] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                <div>
                  <p className="text-sm font-semibold text-[#191c1a]">{isBn ? "ম্যানুয়াল রিভিউতে আছে" : "Under Manual Review"}</p>
                  <p className="text-xs text-[#404944] mt-1">{isBn ? "আপনার পেমেন্ট যাচাই করা হচ্ছে। কিছুক্ষণের মধ্যে কনফার্ম হবে।" : "Your payment is being verified. It will be confirmed shortly."}</p>
                </div>
              </div>
            )}

            {/* ── Transaction status + TrxID input ── */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgba(25,28,26,0.06)] space-y-4 border border-[#e5e7e4]">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#191c1a]">{isBn ? "লেনদেনের অবস্থা" : "Transaction Status"}</h3>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isPending ? "bg-[#d1e4ff]/40 text-[#0061a4]" : isCompleted ? "bg-[#00503a]/10 text-[#003727]" : "bg-[#ffdad6]/50 text-[#ba1a1a]"}`}>
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

                  {/* Validation error message */}
                  {trxError && (
                    <p className="text-xs text-[#ba1a1a] flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      {trxError}
                    </p>
                  )}

                  {/* Provider-specific hint */}
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

              <button
                type="button"
                onClick={() => router.push("/subscription/upgrade")}
                className="w-full py-3 text-sm font-semibold text-[#404944] hover:text-[#191c1a] transition-colors"
              >
                {isBn ? "← ফিরে যান" : "← Go Back"}
              </button>

              {!isCompleted && (
                <button
                  type="button"
                  onClick={handleResubmit}
                  disabled={isSubmitting}
                  className="w-full py-2.5 text-sm font-medium text-[#404944] hover:text-[#191c1a] transition-colors"
                >
                  {isBn ? "পরে সম্পন্ন করব" : "Finish Later"}
                </button>
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

