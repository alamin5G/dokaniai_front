"use client";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { FormInput, GradientButton } from "@/components/ui/FormPrimitives";
import { useRedirectIfAuthenticated } from "@/hooks/useAuthRedirect";
import apiClient from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import { setAuthContact } from "@/lib/authFlow";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const { hydrated, isAuthenticated } = useRedirectIfAuthenticated("/dashboard");
  const t = useTranslations("auth.register");
  const tc = useTranslations("common");
  const [tab, setTab] = useState<"phone" | "email">("phone");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setErrorText(t("errorAgree"));
      return;
    }
    setErrorText("");
    setIsLoading(true);

    try {
      const referral = referralCode.trim() || null;

      if (tab === "phone") {
        await apiClient.post("/auth/register/phone", {
          phone,
          name: fullName,
          referralCode: referral,
        });
      } else {
        await apiClient.post("/auth/register/email", {
          email,
          phone,
          name: fullName,
          password,
          referralCode: referral,
        });
      }
      if (tab === "phone") {
        setAuthContact(phone, "phone");
        router.push("/verify-otp");
      } else {
        setAuthContact(email, "email");
        router.push("/verify-email");
      }
    } catch (error: unknown) {
      setErrorText(getApiErrorMessage(error, t("errorGeneric")));
    } finally {
      setIsLoading(false);
    }
  };

  // Wait for hydration, or redirect if authenticated
  if (!hydrated || isAuthenticated) {
    return null;
  }

  return (
    <AuthLayout
      heading={t("heading")}
      subheading={t("subheading")}
    >
      <div className="flex gap-2 p-1.5 bg-surface-container rounded-full mb-8 w-fit mx-auto md:mx-0">
        <button
          type="button"
          onClick={() => setTab("phone")}
          className={`px-6 py-2.5 rounded-full font-bold shadow-sm text-sm transition-colors ${tab === "phone" ? "bg-surface-container-lowest text-primary" : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
        >
          {t("phoneTab")}
        </button>
        <button
          type="button"
          onClick={() => setTab("email")}
          className={`px-6 py-2.5 rounded-full font-bold shadow-sm text-sm transition-colors ${tab === "email" ? "bg-surface-container-lowest text-primary" : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
        >
          {t("emailTab")}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormInput
          label={t("fullNameLabel")}
          type="text"
          placeholder={t("fullNamePlaceholder")}
          icon="badge"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        {tab === "phone" ? (
          <FormInput
            label={t("phoneLabel")}
            type="tel"
            prefixText={t("phonePrefix")}
            placeholder={t("phonePlaceholder")}
            icon="call"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        ) : (
          <>
            <FormInput
              label={t("emailLabel")}
              type="email"
              placeholder={t("emailPlaceholder")}
              icon="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <FormInput
              label={t("phoneLabel")}
              type="tel"
              placeholder={t("phonePlaceholder")}
              icon="call"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </>
        )}

        <FormInput
          label={t("referralCodeLabel")}
          type="text"
          placeholder={t("referralCodePlaceholder")}
          icon="card_giftcard"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
        />

        {tab === "email" && (
          <FormInput
            label={t("passwordLabel")}
            type="password"
            placeholder={t("passwordPlaceholder")}
            icon="lock"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}

        <label className="flex items-start gap-4 p-4 rounded-[1rem] bg-surface-container-low cursor-pointer group">
          <div className="relative flex items-center mt-0.5">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="peer h-5 w-5 rounded border-none bg-surface-container-highest text-primary focus:ring-offset-0 focus:ring-2 focus:ring-primary-fixed-dim cursor-pointer"
            />
          </div>
          <span className="text-sm text-on-surface-variant leading-relaxed select-none">
            {t.rich("agreeTerms", {
              terms: (chunks) => <a className="text-secondary font-semibold hover:underline" href="#">{chunks}</a>,
              privacy: (chunks) => <a className="text-secondary font-semibold hover:underline" href="#">{chunks}</a>,
            })}
          </span>
        </label>

        {errorText && <p className="text-error text-sm font-semibold">{errorText}</p>}

        <GradientButton type="submit" loading={isLoading}>
          <span>{tc("nextStep")}</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </GradientButton>
      </form>

      <div className="mt-8 pt-8 border-t border-outline-variant/20 text-center">
        <p className="text-on-surface-variant">
          {t("alreadyHaveAccount")} <Link href="/login" className="text-primary font-bold hover:underline">{t("loginHere")}</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
