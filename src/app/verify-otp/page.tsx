"use client";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { FormInput, GradientButton } from "@/components/ui/FormPrimitives";
import apiClient from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import { clearAuthContact, getAuthContact, maskContact } from "@/lib/authFlow";
import { useAuthStore } from "@/store/authStore";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function VerifyOtpForm() {
  const router = useRouter();
  const { contact, method } = getAuthContact();
  const t = useTranslations("auth.verifyOtp");

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendOtp = async () => {
  if (!contact) {
      setErrorText(t("errorNoContact"));
      return;
    }

    setErrorText("");
    setSuccessText("");
    try {
      await apiClient.post("/auth/resend/phone-otp", {
        phone: contact,
      });
      setCountdown(60);
      setSuccessText(t("resendSuccess"));
    } catch (error: unknown) {
      setErrorText(getApiErrorMessage(error, t("errorResendFailed")));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setErrorText(t("errorInvalidOtp"));
      return;
    }

    setErrorText("");
    setIsLoading(true);

    try {
      const res = await apiClient.post("/auth/verify/phone", {
        phone: contact,
        otp,
      });

      clearAuthContact();

      const { accessToken, refreshToken, userId, status } = (res.data?.data ?? {}) as {
        accessToken?: string;
        refreshToken?: string;
        userId?: string;
        status?: string;
      };

      if (status === "PASSWORD_SETUP_REQUIRED" && accessToken) {
        // Phone registration without password — auto-login to allow set-password flow.
        // The user cannot log in through the normal login form yet because they
        // have no password set, so we must keep the session alive.
        const setTokens = useAuthStore.getState().setTokens;
        setTokens(accessToken, refreshToken ?? "", userId ?? "", status);
        setSuccessText(t("successMessage"));
        setTimeout(() => {
          router.push("/set-password");
        }, 2000);
      } else {
        // Normal verification (AUTHENTICATED) — redirect to login page.
        // User must login explicitly so that post-login plan-aware redirect
        // logic (trial modal / paid upgrade) runs correctly.
        setSuccessText(t("successMessage"));
        setTimeout(() => {
          router.push("/login?verified=true");
        }, 2000);
      }
    } catch (error: unknown) {
      setErrorText(getApiErrorMessage(error, t("errorVerificationFailed")));
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

  if (!contact || method !== "phone") {
    return (
      <div className="text-center space-y-4">
        <p className="text-on-surface-variant">{t("errorNoContact")}</p>
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
          {t("otpSent", { contact: maskContact(contact) })}
        </p>
      </div>

      <FormInput
        label={t("otpLabel")}
        type="text"
        placeholder="----"
        icon="pin"
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
      />

      {errorText && <p className="text-error text-sm font-semibold">{errorText}</p>}
      {successText && <p className="text-primary text-sm font-semibold">{successText}</p>}

      <GradientButton type="submit" loading={isLoading}>
        <span>{t("verify")}</span>
        <span className="material-symbols-outlined">check_circle</span>
      </GradientButton>

      <div className="text-center mt-6">
        <button
          type="button"
          disabled={countdown > 0}
          onClick={handleResendOtp}
          className={`font-bold transition-colors ${countdown > 0 ? "text-on-surface-variant opacity-50 cursor-not-allowed" : "text-primary hover:underline"}`}
        >
          {countdown > 0 ? t("resendOtpCountdown", { countdown }) : t("resendOtp")}
        </button>
      </div>
    </form>
  );
}

export default function VerifyOtpPage() {
  const t = useTranslations("auth.verifyOtp");

  return (
    <AuthLayout
      heading={t("heading")}
      subheading={t("subheading")}
    >
      <Suspense fallback={<div className="text-center text-on-surface-variant">{t("loading")}</div>}>
        <VerifyOtpForm />
      </Suspense>
    </AuthLayout>
  );
}
