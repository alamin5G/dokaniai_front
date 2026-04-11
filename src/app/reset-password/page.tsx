"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import apiClient from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import {
  getAuthContact,
  clearAuthContact,
  maskContact,
  getResetContext,
  isOtpExpired,
  setResetContext,
  clearResetContext,
} from "@/lib/authFlow";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { FormInput, GradientButton } from "@/components/ui/FormPrimitives";

function ResetPasswordForm() {
  const router = useRouter();
  const t = useTranslations("auth.resetPassword");
  const tc = useTranslations("common");

  // --- Reload recovery: read reset context on mount ---
  const resetCtx = getResetContext();
  const expiredOnLoad = isOtpExpired();

  // If no context at all, redirect to forgot-password
  useEffect(() => {
    if (!resetCtx) {
      router.replace("/forgot-password");
    }
  }, [resetCtx, router]);

  // Derive contact from reset context (preferred) or legacy auth contact
  const { contact: authContact } = getAuthContact();
  const contact = resetCtx?.phoneOrEmail || authContact;

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [otpExpired, setOtpExpired] = useState(expiredOnLoad ?? false);
  const [countdown, setCountdown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-detect expiry while the page is open
  useEffect(() => {
    const interval = setInterval(() => {
      const expired = isOtpExpired();
      if (expired === true && !otpExpired) {
        setOtpExpired(true);
        setOtp("");
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [otpExpired]);

  const handleResendOtp = useCallback(async () => {
    if (!contact) return;
    setResendLoading(true);
    setErrorText("");
    try {
      await apiClient.post("/auth/forgot-password", {
        phoneOrEmail: contact,
      });
      setResetContext(contact, Date.now() + 300000);
      setOtpExpired(false);
      setOtp("");
      setCountdown(60);
    } catch (error: unknown) {
      setErrorText(getApiErrorMessage(error, t("errorResetFailed")));
    } finally {
      setResendLoading(false);
    }
  }, [contact, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setErrorText(t("errorInvalidOtp"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorText(t("errorMismatch"));
      return;
    }
    if (newPassword.length < 6) {
      setErrorText(t("errorTooShort"));
      return;
    }

    setErrorText("");
    setIsLoading(true);

    try {
      await apiClient.post("/auth/reset-password", {
        phoneOrEmail: contact,
        otp,
        newPassword,
      });

      clearAuthContact();
      clearResetContext();
      router.push("/login?resetSuccess=true");
    } catch (error: unknown) {
      setErrorText(getApiErrorMessage(error, t("errorResetFailed")));
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render the form if there's no context (redirect in progress)
  if (!resetCtx) {
    return (
      <div className="text-center text-on-surface-variant">
        {t("loading")}
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

      {otpExpired && (
        <p className="text-error text-sm font-semibold text-center">
          {t("otpExpired")}
        </p>
      )}

      <FormInput
        label={t("otpLabel")}
        type="text"
        placeholder="----"
        icon="pin"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
      />

      <FormInput
        label={t("newPasswordLabel")}
        type="password"
        placeholder={t("newPasswordPlaceholder")}
        icon="lock"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />

      <FormInput
        label={t("confirmPasswordLabel")}
        type="password"
        placeholder={t("confirmPasswordPlaceholder")}
        icon="lock"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      {errorText && <p className="text-error text-sm font-semibold">{errorText}</p>}

      <GradientButton type="submit" loading={isLoading}>
        <span>{t("resetButton")}</span>
        <span className="material-symbols-outlined">lock_reset</span>
      </GradientButton>

      <div className="text-center mt-6">
        <button
          type="button"
          disabled={countdown > 0 || resendLoading}
          onClick={handleResendOtp}
          className={`font-bold transition-colors ${countdown > 0 || resendLoading ? "text-on-surface-variant opacity-50 cursor-not-allowed" : "text-primary hover:underline"}`}
        >
          {resendLoading
            ? tc("pleaseWait")
            : countdown > 0
              ? t("resendOtpCountdown", { countdown })
              : t("resendOtp")}
        </button>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  const t = useTranslations("auth.resetPassword");

  return (
    <AuthLayout
      heading={t("heading")}
      subheading={t("subheading")}
    >
      <Suspense fallback={<div className="text-center text-on-surface-variant">{t("loading")}</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
