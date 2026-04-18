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
import { useCallback, useEffect, useMemo, useState } from "react";

interface CheckoutData {
  receiverNumber: string;
  amount: number;
  mfsMethod: MfsType;
  expiresAt: string;
}

const MFS_STEPS: Record<MfsType, { color: string; labelBn: string; labelEn: string; icon: string }> = {
  BKASH: { color: "#E2136E", labelBn: "বিকাশ", labelEn: "bKash", icon: "phone_iphone" },
  NAGAD: { color: "#ED1C24", labelBn: "নগদ", labelEn: "Nagad", icon: "phone_iphone" },
  ROCKET: { color: "#8B2F8B", labelBn: "রকেট", labelEn: "Rocket", icon: "phone_iphone" },
};

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
    } catch {}
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

  const mfs = checkoutData ? MFS_STEPS[checkoutData.mfsMethod] : null;
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
          <div className="bg-white rounded-xl p-8 shadow-[0_8px_30px_rgba(25,28,26,0.06)] text-center space-y-4">
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
            {checkoutData && mfs && isPending && (
              <div className="bg-white rounded-xl overflow-hidden shadow-[0_8px_30px_rgba(25,28,26,0.06)]">
                <div className="px-6 py-4 flex items-center gap-3" style={{ backgroundColor: `${mfs.color}10` }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${mfs.color}20` }}>
                    <span className="material-symbols-outlined" style={{ color: mfs.color, fontVariationSettings: "'FILL' 1" }}>{mfs.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#191c1a]">{isBn ? mfs.labelBn : mfs.labelEn} {isBn ? "পেমেন্ট" : "Payment"}</h3>
                    <p className="text-xs text-[#404944]">{isBn ? "নিচের নির্দেশনা অনুসরণ করুন" : "Follow the instructions below"}</p>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#ecefeb] flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-[#003727]">1</span>
                      </div>
                      <p className="text-sm text-[#191c1a]">
                        {isBn
                          ? `${mfs.labelBn} অ্যাপ খুলুন → ${isBn ? "\"সেন্ড মানি\"" : "\"Send Money\""} এ যান`
                          : `Open ${mfs.labelEn} App → Go to "Send Money"`}
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#ecefeb] flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-[#003727]">2</span>
                      </div>
                      <div className="text-sm text-[#191c1a]">
                        <p>{isBn ? "এই নম্বরে পাঠান:" : "Send to this number:"}</p>
                        <div className="mt-1.5 bg-[#f2f4f0] rounded-lg px-4 py-3 flex items-center justify-between">
                          <span className="text-lg font-bold font-['Manrope',sans-serif] tracking-wider">{checkoutData.receiverNumber}</span>
                          <button
                            onClick={() => navigator.clipboard?.writeText(checkoutData.receiverNumber)}
                            className="text-[#003727] hover:text-[#00503a] transition-colors"
                            title={isBn ? "কপি করুন" : "Copy"}
                          >
                            <span className="material-symbols-outlined text-xl">content_copy</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#ecefeb] flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-[#003727]">3</span>
                      </div>
                      <div className="text-sm text-[#191c1a]">
                        <p>{isBn ? "পরিমাণ:" : "Amount:"}</p>
                        <div className="mt-1.5 bg-[#00503a]/5 rounded-lg px-4 py-3">
                          <span className="text-2xl font-black text-[#003727] font-['Manrope',sans-serif]">৳{formatPrice(checkoutData.amount, locale)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#ecefeb] flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-[#003727]">4</span>
                      </div>
                      <p className="text-sm text-[#191c1a]">
                        {isBn ? "PIN দিয়ে কনফার্ম করুন এবং Transaction ID কপি করুন" : "Confirm with PIN and copy the Transaction ID"}
                      </p>
                    </div>
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

            <div className="bg-white rounded-xl p-6 shadow-[0_8px_30px_rgba(25,28,26,0.06)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#191c1a]">{isBn ? "লেনদেনের অবস্থা" : "Transaction Status"}</h3>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isPending ? "bg-[#d1e4ff]/40 text-[#0061a4]" : isCompleted ? "bg-[#00503a]/10 text-[#003727]" : "bg-[#ffdad6]/50 text-[#ba1a1a]"}`}>
                  {statusLabel}
                </span>
              </div>

              {isPending && (
                <>
                  <div className="bg-[#f2f4f0] rounded-xl px-4 py-3 flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#003727] text-lg">label</span>
                    <div className="flex-1">
                      <span className="text-xs text-[#404944]">{isBn ? "Transaction ID লিখুন" : "Enter Transaction ID"}</span>
                      <input
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                        placeholder={isBn ? "যেমন: TXN123456789" : "e.g. TXN123456789"}
                        className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-[#191c1a] text-base font-semibold placeholder:text-[#707974] placeholder:font-normal mt-0.5"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmitTrx}
                    disabled={isSubmitting || !trxId.trim()}
                    className="w-full py-3.5 text-white font-bold text-base rounded-full shadow-lg disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, #003727, #00503a)" }}
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
