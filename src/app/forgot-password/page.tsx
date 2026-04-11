"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import apiClient from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import { setAuthContact, setResetContext } from "@/lib/authFlow";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { FormInput, GradientButton } from "@/components/ui/FormPrimitives";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const t = useTranslations("auth.forgotPassword");
  
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      setErrorText(t("errorEmpty"));
      return;
    }
    
    setErrorText("");
    setIsLoading(true);

    try {
      await apiClient.post("/auth/forgot-password", {
        phoneOrEmail: identifier
      });

      setAuthContact(identifier, identifier.includes("@") ? "email" : "phone");
      setResetContext(identifier, Date.now() + 300000); // 300s = 5min TTL
      router.push("/reset-password");
    } catch (error: unknown) {
      setErrorText(getApiErrorMessage(error, t("errorSendFailed")));
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
          label={t("identifierLabel")}
          type="text"
          placeholder={t("identifierPlaceholder")}
          icon="account_circle"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />

        {errorText && <p className="text-error text-sm font-semibold text-center">{errorText}</p>}

        <GradientButton loading={isLoading} type="submit">
          <span>{t("sendOtp")}</span>
          <span className="material-symbols-outlined text-xl" data-icon="send">send</span>
        </GradientButton>
      </form>
      
      <div className="text-center mt-8">
        <button 
          onClick={() => router.push("/login")}
          className="text-on-surface-variant font-medium hover:text-primary transition-colors"
        >
          {t("backToLogin")}
        </button>
      </div>
    </AuthLayout>
  );
}
