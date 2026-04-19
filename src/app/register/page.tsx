"use client";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { FormInput, GradientButton } from "@/components/ui/FormPrimitives";
import { useRedirectIfAuthenticated } from "@/hooks/useAuthRedirect";
import apiClient from "@/lib/api";
import { getApiErrorCode, getApiErrorMessage, getApiFieldErrors } from "@/lib/apiError";
import { setAuthContact } from "@/lib/authFlow";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const { hydrated, isAuthenticated } = useRedirectIfAuthenticated();
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setErrorText("");

    const localErrors: Record<string, string> = {};
    if (!fullName.trim()) localErrors.name = t("errorNameRequired");
    if (!phone.trim()) localErrors.phone = t("errorPhoneRequired");
    if (tab === "email") {
      if (!email.trim()) localErrors.email = t("errorEmailRequired");
      if (!password) localErrors.password = t("errorPasswordRequired");
    }
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      return;
    }

    if (!agreed) {
      setErrorText(t("errorAgree"));
      return;
    }

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
      const fields = getApiFieldErrors(error);
      if (Object.keys(fields).length > 0) {
        setFieldErrors(fields);
        return;
      }

      const code = getApiErrorCode(error);
      if (code === "DUPLICATE_ENTRY") {
        setErrorText(t("errorPhoneExists"));
      } else if (code === "RATE_LIMIT_EXCEEDED") {
        setErrorText(t("errorRateLimited"));
      } else if (code === "BAD_REQUEST") {
        const msg = getApiErrorMessage(error, "").toLowerCase();
        if (msg.includes("referral") || msg.includes("রেফারেল")) {
          setErrorText(t("errorInvalidReferral"));
        } else if (msg.includes("phone") || msg.includes("already") || msg.includes("registered")) {
          setErrorText(t("errorPhoneExists"));
        } else if (msg.includes("email")) {
          setErrorText(t("errorEmailExists"));
        } else {
          setErrorText(t("errorGeneric"));
        }
      } else {
        setErrorText(t("errorGeneric"));
      }
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
          onClick={() => { setTab("phone"); setFieldErrors({}); setErrorText(""); }}
          className={`px-6 py-2.5 rounded-full font-bold shadow-sm text-sm transition-colors ${tab === "phone" ? "bg-surface-container-lowest text-primary" : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
        >
          {t("phoneTab")}
        </button>
        <button
          type="button"
          onClick={() => { setTab("email"); setFieldErrors({}); setErrorText(""); }}
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
          onChange={(e) => { setFullName(e.target.value); setFieldErrors((p) => { const n = {...p}; delete n.name; return n; }); }}
          error={fieldErrors.name}
        />

        {tab === "phone" ? (
          <FormInput
            label={t("phoneLabel")}
            type="tel"
            prefixText={t("phonePrefix")}
            placeholder={t("phonePlaceholder")}
            icon="call"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setFieldErrors((p) => { const n = {...p}; delete n.phone; return n; }); }}
            error={fieldErrors.phone}
          />
        ) : (
          <>
            <FormInput
              label={t("emailLabel")}
              type="email"
              placeholder={t("emailPlaceholder")}
              icon="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => { const n = {...p}; delete n.email; return n; }); }}
              error={fieldErrors.email}
            />
            <FormInput
              label={t("phoneLabel")}
              type="tel"
              placeholder={t("phonePlaceholder")}
              icon="call"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setFieldErrors((p) => { const n = {...p}; delete n.phone; return n; }); }}
              error={fieldErrors.phone}
            />
          </>
        )}

        <FormInput
          label={t("referralCodeLabel")}
          type="text"
          placeholder={t("referralCodePlaceholder")}
          icon="card_giftcard"
          value={referralCode}
          onChange={(e) => { setReferralCode(e.target.value); setFieldErrors((p) => { const n = {...p}; delete n.referralCode; return n; }); }}
          error={fieldErrors.referralCode}
        />

        {tab === "email" && (
          <FormInput
            label={t("passwordLabel")}
            type="password"
            placeholder={t("passwordPlaceholder")}
            icon="lock"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => { const n = {...p}; delete n.password; return n; }); }}
            error={fieldErrors.password}
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
              terms: (chunks) => <a className="text-secondary font-semibold hover:underline" href="/legal/terms">{chunks}</a>,
              privacy: (chunks) => <a className="text-secondary font-semibold hover:underline" href="/legal/privacy">{chunks}</a>,
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
