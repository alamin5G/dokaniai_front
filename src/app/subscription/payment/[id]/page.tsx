"use client";

import { FormInput } from "@/components/ui/FormPrimitives";
import {
  getPaymentIntentStatus,
  resubmitPaymentIntent,
  submitPaymentTrx,
} from "@/lib/subscriptionApi";
import { setRedirectAfterLogin } from "@/lib/authFlow";
import type { PaymentIntentStatusResponse } from "@/types/subscription";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

function isTerminalStatus(status: string): boolean {
  return status === "COMPLETED" || status === "FAILED" || status === "EXPIRED";
}

export default function SubscriptionPaymentStatusPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const t = useTranslations("subscription");

  const paymentIntentId = params.id;
  const [statusData, setStatusData] = useState<PaymentIntentStatusResponse | null>(null);
  const [trxId, setTrxId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const rawAuth = localStorage.getItem("dokaniai-auth-storage");
      const parsed = rawAuth ? JSON.parse(rawAuth) : null;
      const hasToken = Boolean(parsed?.state?.accessToken);
      if (!hasToken) {
        setRedirectAfterLogin(`/subscription/payment/${encodeURIComponent(paymentIntentId)}`);
        router.replace("/login");
      }
    } catch {
      router.replace("/login");
    }
  }, [paymentIntentId, router]);

  const refreshStatus = useCallback(async () => {
    try {
      const current = await getPaymentIntentStatus(paymentIntentId);
      setStatusData(current);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("payment.errors.statusFetchFailed"));
    }
  }, [paymentIntentId, t]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (!statusData || isTerminalStatus(statusData.status)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshStatus();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshStatus, statusData]);

  const statusLabel = useMemo(() => {
    if (!statusData) {
      return t("payment.status.loading");
    }

    if (statusData.status === "COMPLETED") {
      return t("payment.status.completed");
    }
    if (statusData.status === "MANUAL_REVIEW") {
      return t("payment.status.manualReview");
    }
    if (statusData.status === "FAILED") {
      return t("payment.status.failed");
    }
    if (statusData.status === "EXPIRED") {
      return t("payment.status.expired");
    }
    return t("payment.status.pending");
  }, [statusData, t]);

  const handleSubmitTrx = async () => {
    if (!trxId.trim()) {
      setNotice(t("payment.errors.enterTrx"));
      return;
    }

    setIsSubmitting(true);
    try {
      const next = await submitPaymentTrx(paymentIntentId, trxId.trim());
      setStatusData(next);
      setNotice(t("payment.trxSubmitted"));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("payment.errors.trxSubmitFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResubmit = async () => {
    setIsSubmitting(true);
    try {
      const next = await resubmitPaymentIntent(paymentIntentId);
      setStatusData(next);
      setNotice(t("payment.resubmitted"));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("payment.errors.resubmitFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="rounded-[1.75rem] border border-outline-variant/30 bg-surface p-6">
        <h1 className="text-2xl font-bold text-on-surface">{t("payment.title")}</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          {t("payment.subtitle")}
        </p>
      </header>

      {notice ? (
        <div className="rounded-[1rem] border border-outline-variant/30 bg-surface-container px-4 py-3 text-sm text-on-surface">
          {notice}
        </div>
      ) : null}

      <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-5 space-y-4">
        <p className="text-sm text-on-surface-variant">{t("payment.intentId")}: <span className="font-semibold text-on-surface">{paymentIntentId}</span></p>
        <p className="text-sm text-on-surface-variant">
          {t("payment.currentStatus")}: <span className="font-semibold text-primary">{statusLabel}</span>
        </p>

        <FormInput
          label={t("payment.trxLabel")}
          value={trxId}
          onChange={(event) => setTrxId(event.target.value.toUpperCase())}
          placeholder={t("payment.trxPlaceholder")}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleSubmitTrx}
            disabled={isSubmitting || !trxId.trim()}
            className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {t("payment.submitTrx")}
          </button>
          <button
            type="button"
            onClick={handleResubmit}
            disabled={isSubmitting || statusData?.status === "COMPLETED"}
            className="rounded-full bg-surface-container-high px-5 py-3 text-sm font-semibold text-on-surface disabled:opacity-50"
          >
            {t("payment.resubmit")}
          </button>
        </div>

        <button
          type="button"
          onClick={() => router.push("/account/subscription")}
          className="rounded-full bg-surface-container-high px-5 py-3 text-sm font-semibold text-on-surface"
        >
          {statusData?.status === "COMPLETED"
            ? t("payment.backToSubscription")
            : t("payment.finishLater")}
        </button>
      </section>
    </section>
  );
}
