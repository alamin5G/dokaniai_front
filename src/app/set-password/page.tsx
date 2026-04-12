"use client";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { FormInput, GradientButton } from "@/components/ui/FormPrimitives";
import apiClient from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import { useAuthStore } from "@/store/authStore";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SetPasswordPage() {
  const router = useRouter();
  const t = useTranslations("auth.setPassword");
  const tc = useTranslations("common");
  const clearTokens = useAuthStore((state) => state.clearTokens);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorText(t("errorMismatch"));
      return;
    }
    if (password.length < 8 || password.length > 16) {
      setErrorText(t("errorLength"));
      return;
    }

    setErrorText("");
    setIsLoading(true);

    try {
      await apiClient.post("/auth/set-password", {
        newPassword: password,
        confirmPassword: confirmPassword
      });

      clearTokens();
      router.push("/login?passwordSet=true");
    } catch (error: unknown) {
      setErrorText(getApiErrorMessage(error, t("errorGeneric")));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      heading={t("heading")}
      subheading={t("subheading")}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormInput
          label={t("newPasswordLabel")}
          type="password"
          placeholder={t("newPasswordPlaceholder")}
          icon="lock"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          <span>{tc("save")}</span>
          <span className="material-symbols-outlined">save</span>
        </GradientButton>
      </form>
    </AuthLayout>
  );
}
