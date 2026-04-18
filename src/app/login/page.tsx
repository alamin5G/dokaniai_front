"use client";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { FormInput, GradientButton } from "@/components/ui/FormPrimitives";
import { useRedirectIfAuthenticated } from "@/hooks/useAuthRedirect";
import apiClient from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import axios from "axios";
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
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");

    if (!identifier || !password) {
      setErrorText(t("errorEmptyFields"));
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
        const meResponse = await apiClient.get("/users/me");
        role = meResponse.data?.data?.role ?? null;
      } catch {
        role = null;
      }

      if (role === "ADMIN" || role === "SUPER_ADMIN") {
        // Admin — commit tokens immediately and redirect
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
      const errorCode = axios.isAxiosError(error) && typeof error.response?.data === "object" && error.response?.data !== null
        ? (error.response.data as Record<string, unknown>).error != null && typeof (error.response.data as Record<string, unknown>).error === "object"
          ? ((error.response.data as Record<string, unknown>).error as Record<string, unknown>)?.code
          : null
        : null;
      const useTranslated = errorCode === "AUTH_001" || errorCode === "AUTH_002";
      const msg = useTranslated ? t("errorInvalid") : getApiErrorMessage(error, t("errorInvalid"));
      setErrorText(msg);
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
      <form onSubmit={handleLoginSubmit} className="space-y-6">
        <FormInput
          label={t("identifierLabel")}
          type="text"
          placeholder={t("identifierPlaceholder")}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-on-surface-variant flex-grow">{t("passwordLabel")}</label>
            <Link href="/forgot-password" className="text-secondary font-bold text-sm tracking-wide hover:underline text-right shrink-0">
              {t("forgotPassword")}
            </Link>
          </div>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors text-xl" data-icon="lock">
              lock
            </span>
            <input
              type={showPassword ? "text" : "password"}
              className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary/20 focus:bg-surface-container-lowest rounded-xl py-3.5 pl-12 pr-12 text-on-surface placeholder:text-on-surface-variant/40 font-medium transition-all shadow-sm group-focus-within:shadow-md outline-none"
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <span className="material-symbols-outlined text-xl">{showPassword ? "visibility_off" : "visibility"}</span>
            </button>
          </div>
        </div>

        {errorText && <p className="text-error text-sm font-semibold text-center">{errorText}</p>}

        <GradientButton loading={isLoading} type="submit">
          <span>{t("submit")}</span>
          <span className="material-symbols-outlined text-xl" data-icon="arrow_forward">arrow_forward</span>
        </GradientButton>
      </form>

      <div className="my-8 flex items-center gap-4">
        <div className="h-[1px] flex-grow bg-outline-variant opacity-20"></div>
        <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">{tc("or")}</span>
        <div className="h-[1px] flex-grow bg-outline-variant opacity-20"></div>
      </div>

      <div className="text-center">
        <p className="text-on-surface-variant font-medium">
          {t("newAccount")}
          <Link href="/register" className="text-secondary font-bold hover:underline ml-1">{t("registerHere")}</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
