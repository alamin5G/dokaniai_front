"use client";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { FormInput, GradientButton } from "@/components/ui/FormPrimitives";
import apiClient from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import axios from "axios";
import { clearAuthContact, getAuthContact, maskContact } from "@/lib/authFlow";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function VerifyEmailForm() {
  const router = useRouter();
  const { contact, method } = getAuthContact();
  const t = useTranslations("auth.verifyEmail");

  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  const [resendText, setResendText] = useState("");
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendCode = async () => {
    if (!contact) return;
    setErrorText("");
    setResendText("");
    try {
      await apiClient.post("/auth/resend/email-verification", {
        email: contact,
      });
      setCountdown(60);
      setResendText(t("resendSuccess"));
    } catch (error: unknown) {
      setErrorText(getApiErrorMessage(error, t("errorResendFailed")));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setErrorText(t("errorInvalidCode"));
      return;
    }

    setErrorText("");
    setIsLoading(true);

    try {
      await apiClient.post("/auth/verify/email", {
        email: contact,
        token: code,
      });

      clearAuthContact();
      setSuccessText(t("successMessage"));

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login?verified=true");
      }, 2000);
    } catch (error: unknown) {
      const errorCode = axios.isAxiosError(error) && typeof error.response?.data === "object" && error.response?.data !== null
        ? (error.response.data as Record<string, unknown>).error != null && typeof (error.response.data as Record<string, unknown>).error === "object"
          ? ((error.response.data as Record<string, unknown>).error as Record<string, unknown>)?.code
          : null
        : null;
      const useTranslated = errorCode === "AUTH_003" || errorCode === "AUTH_004" || errorCode === "TOKEN_EXPIRED" || errorCode === "INVALID_TOKEN";
      setErrorText(useTranslated ? t("errorVerificationFailed") : getApiErrorMessage(error, t("errorVerificationFailed")));
    } finally {
      setIsLoading(false);
    }
  };

  // Success state — show BEFORE the !contact check, because clearAuthContact()
  // already wiped sessionStorage, so contact would be null here
  if (successText) {
    return (
      <div className="text-center space-y-4">
        <span className="material-symbols-outlined text-primary text-5xl">check_circle</span>
        <p className="text-primary font-bold text-lg">{successText}</p>
      </div>
    );
  }

  // No contact found — redirect to register
  if (!contact) {
    return (
      <div className="text-center space-y-4">
        <p className="text-on-surface-variant">{t("errorVerificationFailed")}</p>
        <button
          onClick={() => router.push("/register")}
          className="text-primary font-bold hover:underline"
        >
          {t("backToRegister")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <p className="text-on-surface-variant font-medium">
          {t("codeSent", { contact: maskContact(contact) })}
        </p>
      </div>

      <FormInput
        label={t("codeLabel")}
        type="text"
        placeholder="------"
        icon="mail"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
      />

      {errorText && <p className="text-error text-sm font-semibold">{errorText}</p>}
      {resendText && <p className="text-primary text-sm font-semibold">{resendText}</p>}

      <GradientButton type="submit" loading={isLoading}>
        <span>{t("verify")}</span>
        <span className="material-symbols-outlined">check_circle</span>
      </GradientButton>

      <div className="text-center mt-6">
        <button
          type="button"
          disabled={countdown > 0}
          onClick={handleResendCode}
          className={`font-bold transition-colors ${countdown > 0 ? "text-on-surface-variant opacity-50 cursor-not-allowed" : "text-primary hover:underline"}`}
        >
          {countdown > 0 ? t("resendCodeCountdown", { countdown }) : t("resendCode")}
        </button>
      </div>
    </form>
  );
}

export default function VerifyEmailPage() {
  const t = useTranslations("auth.verifyEmail");

  return (
    <AuthLayout
      heading={t("heading")}
      subheading={t("subheading")}
    >
      <Suspense fallback={<div className="text-center text-on-surface-variant">{t("loading")}</div>}>
        <VerifyEmailForm />
      </Suspense>
    </AuthLayout>
  );
}
