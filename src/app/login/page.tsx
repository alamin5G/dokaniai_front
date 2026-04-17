"use client";

import { FreeTrialModal } from "@/components/auth/FreeTrialModal";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { FormInput, GradientButton } from "@/components/ui/FormPrimitives";
import { useRedirectIfAuthenticated } from "@/hooks/useAuthRedirect";
import apiClient from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import { clearPendingUpgradePlan, consumeRedirectAfterLogin, isPendingPlanTrial } from "@/lib/authFlow";
import { getClientDeviceContext } from "@/lib/device";
import { getPreferredWorkspacePath } from "@/lib/shopRouting";
import { useAuthStore } from "@/store/authStore";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

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
  const [showTrialModal, setShowTrialModal] = useState(false);

  // Deferred token data — stored here when trial modal is needed so that
  // setTokens is NOT called until the user confirms the modal.  This
  // prevents useRedirectIfAuthenticated from detecting isAuthenticated=true
  // and redirecting away before the modal can render.
  const deferredTokens = useRef<TokenData | null>(null);

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
        // Trial plan — DEFER setTokens to prevent useRedirectIfAuthenticated
        // from redirecting before the modal renders.  The modal's onConfirm
        // will commit the tokens and navigate to /onboarding.
        deferredTokens.current = tokens;
        setUserRole(role);
        setShowTrialModal(true);
      } else {
        const pendingRedirect = consumeRedirectAfterLogin();
        if (pendingRedirect) {
          setTokens(tokens.accessToken, tokens.refreshToken, tokens.userId, tokens.status);
          setUserRole(role);
          router.push(pendingRedirect);
        } else {
          try {
            const bizRes = await apiClient.get("/businesses", {
              headers: { Authorization: `Bearer ${tokens.accessToken}` },
            });
            const businesses: Array<{ id: string }> = bizRes.data?.data?.businesses ?? [];
            if (businesses.length === 0) {
              deferredTokens.current = tokens;
              setUserRole(role);
              setShowTrialModal(true);
            } else {
              setTokens(tokens.accessToken, tokens.refreshToken, tokens.userId, tokens.status);
              setUserRole(role);
              router.push(getPreferredWorkspacePath());
            }
          } catch {
            setTokens(tokens.accessToken, tokens.refreshToken, tokens.userId, tokens.status);
            setUserRole(role);
            router.push(getPreferredWorkspacePath());
          }
        }
      }
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error, t("errorInvalid"));
      setErrorText(msg);
    } finally {
      setIsLoading(false);
    }
  };

  /** Called when the user confirms the FreeTrialModal. */
  const handleTrialConfirm = () => {
    const tokens = deferredTokens.current;
    if (tokens) {
      setTokens(tokens.accessToken, tokens.refreshToken, tokens.userId, tokens.status);
      deferredTokens.current = null;
    }
    clearPendingUpgradePlan();
    router.push("/onboarding");
  };

  // Show trial modal overlay after successful login — must take priority
  // over the authenticated redirect, otherwise isAuthenticated=true causes
  // an early return null and the modal never renders.
  if (showTrialModal) {
    return <FreeTrialModal onConfirm={handleTrialConfirm} />;
  }

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
