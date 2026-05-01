"use client";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { FormInput, GradientButton } from "@/components/ui/FormPrimitives";
import { useRedirectIfAuthenticated } from "@/hooks/useAuthRedirect";
import { getApiErrorCode, getApiFieldErrors } from "@/lib/apiError";
import apiClient from "@/lib/api";
import { consumeRedirectAfterLogin, getPendingUpgradePlan, isPendingPlanTrial, setRedirectAfterLogin } from "@/lib/authFlow";
import { getClientDeviceContext } from "@/lib/device";
import { getPreferredWorkspacePath } from "@/lib/shopRouting";
import { getPendingPlan as getPendingPlanFromDb } from "@/lib/subscriptionApi";
import { useAuthStore } from "@/store/authStore";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Shape of the token data returned by the login API. */
interface TokenData {
  accessToken: string;
  refreshToken: string;
  userId: string;
  status: string;
}

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("auth.login");
  const tc = useTranslations("common");
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUserRole = useAuthStore((state) => state.setUserRole);
  const { hydrated, isAuthenticated } = useRedirectIfAuthenticated();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setErrorText("");

    const localErrors: Record<string, string> = {};
    if (!identifier.trim()) localErrors.identifier = t("errorIdentifierRequired");
    if (!password) localErrors.password = t("errorPasswordRequired");
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      return;
    }

    try {
      setIsLoading(true);
      const deviceContext = getClientDeviceContext();
      const res = await apiClient.post("/auth/login", {
        phoneOrEmail: identifier,
        password,
        ...deviceContext,
      });

      const { accessToken, refreshToken, userId, status } = res.data.data as TokenData;
      const tokens: TokenData = { accessToken, refreshToken, userId: userId || "", status };

      let role: string | null = null;
      try {
        const meResponse = await apiClient.get("/users/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        role = meResponse.data?.data?.role ?? null;
      } catch {
        role = null;
      }

      if (role === "ADMIN" || role === "SUPER_ADMIN") {
        setTokens(tokens.accessToken, tokens.refreshToken, tokens.userId, tokens.status);
        setUserRole(role);
        router.push("/admin");
      } else if (isPendingPlanTrial()) {
        setTokens(tokens.accessToken, tokens.refreshToken, tokens.userId, tokens.status);
        setUserRole(role);
        const pendingPlan = getPendingUpgradePlan();
        router.push(pendingPlan ? `/subscription/upgrade?plan=${encodeURIComponent(pendingPlan)}` : "/subscription/upgrade");
      } else {
        const pendingRedirect = consumeRedirectAfterLogin();
        if (pendingRedirect) {
          setTokens(tokens.accessToken, tokens.refreshToken, tokens.userId, tokens.status);
          setUserRole(role);
          router.push(pendingRedirect);
        } else {
          let dbPendingPlan: { planId?: string; isTrial?: boolean } | null = null;
          try {
            dbPendingPlan = await getPendingPlanFromDb();
          } catch { /* ignore */ }

          if (dbPendingPlan?.planId) {
            setTokens(tokens.accessToken, tokens.refreshToken, tokens.userId, tokens.status);
            setUserRole(role);
            router.push(`/subscription/upgrade?plan=${dbPendingPlan.planId}`);
          } else {
            try {
              const subRes = await apiClient.get("/subscriptions/current", {
                headers: { Authorization: `Bearer ${tokens.accessToken}` },
              });
              const subStatus = subRes.data?.data?.status;
              if (!["ACTIVE", "TRIAL", "GRACE"].includes(subStatus)) {
                setTokens(tokens.accessToken, tokens.refreshToken, tokens.userId, tokens.status);
                setUserRole(role);
                router.push("/subscription/upgrade");
                return;
              }
            } catch {
              setTokens(tokens.accessToken, tokens.refreshToken, tokens.userId, tokens.status);
              setUserRole(role);
              router.push("/subscription/upgrade");
              return;
            }
            try {
              const bizRes = await apiClient.get("/businesses", {
                headers: { Authorization: `Bearer ${tokens.accessToken}` },
              });
              const businesses: Array<{ id: string }> = bizRes.data?.data?.businesses ?? [];
              setTokens(tokens.accessToken, tokens.refreshToken, tokens.userId, tokens.status);
              setUserRole(role);
              if (businesses.length === 0) {
                router.push("/onboarding");
              } else {
                router.push(getPreferredWorkspacePath());
              }
            } catch {
              setTokens(tokens.accessToken, tokens.refreshToken, tokens.userId, tokens.status);
              setUserRole(role);
              router.push(getPreferredWorkspacePath());
            }
          }
        }
      }
    } catch (error: unknown) {
      const fields = getApiFieldErrors(error);
      if (Object.keys(fields).length > 0) {
        setFieldErrors(fields);
      } else {
        setErrorText(t("errorInvalid"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!hydrated || isAuthenticated) {
    return null;
  }

  return (
    <AuthLayout
      heading={t("heading")}
      subheading={t("subheading")}
    >
      <form onSubmit={handleLoginSubmit} className="space-y-5">
        <FormInput
          label={t("identifierLabel")}
          type="text"
          placeholder={t("identifierPlaceholder")}
          icon="account_circle"
          value={identifier}
          onChange={(e) => { setIdentifier(e.target.value); setFieldErrors((p) => { const n = { ...p }; delete n.identifier; return n; }); }}
          error={fieldErrors.identifier}
        />

        <div className="space-y-1">
          <div className="flex items-center justify-end -mb-2">
            <Link href="/forgot-password" className="text-secondary text-xs font-bold tracking-wide hover:underline z-10 mr-4">
              {t("forgotPassword")}
            </Link>
          </div>
          <FormInput
            label={t("passwordLabel")}
            type="password"
            placeholder={t("passwordPlaceholder")}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => { const n = { ...p }; delete n.password; return n; }); }}
            error={fieldErrors.password}
          />
        </div>

        {errorText && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-error/5 border border-error/10">
            <span className="material-symbols-outlined text-error text-lg">error_circle</span>
            <p className="text-error text-sm font-semibold">{errorText}</p>
          </div>
        )}

        <GradientButton loading={isLoading} type="submit">
          <span>{t("submit")}</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </GradientButton>
      </form>

      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-grow bg-gradient-to-r from-transparent via-outline-variant/20 to-transparent"></div>
        <span className="text-on-surface-variant/50 text-xs font-bold uppercase tracking-widest">{tc("or")}</span>
        <div className="h-px flex-grow bg-gradient-to-l from-transparent via-outline-variant/20 to-transparent"></div>
      </div>

      <div className="text-center">
        <p className="text-on-surface-variant text-sm font-medium">
          {t("newAccount")}{" "}
          <Link href="/register" className="text-primary font-bold hover:underline inline-flex items-center gap-1 group">
            {t("registerHere")}
            <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}