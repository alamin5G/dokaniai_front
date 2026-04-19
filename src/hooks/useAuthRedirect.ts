"use client";

import { consumeRedirectAfterLogin } from "@/lib/authFlow";
import { listBusinesses } from "@/lib/businessApi";
import { buildShopPath } from "@/lib/shopRouting";
import { getCurrentSubscription } from "@/lib/subscriptionApi";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useSyncExternalStore } from "react";

const AUTH_STORAGE_KEY = "dokaniai-auth-storage";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["ACTIVE", "TRIAL", "GRACE"]);

/**
 * Read accessToken directly from localStorage (bypasses Zustand hydration timing).
 */
function getAccessTokenRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.accessToken || null;
  } catch {
    return null;
  }
}

function getStoredUserRoleRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const role = parsed?.state?.userRole;
    return typeof role === "string" ? role : null;
  } catch {
    return null;
  }
}

/**
 * Resolve the correct post-login target path.
 *
 * Order matters: check subscription FIRST (excluded from backend interceptor),
 * then check businesses (requires active subscription).
 */
async function resolvePostLoginTarget(role: string): Promise<string | null> {
  // Admin roles always go to /admin
  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    return "/admin";
  }

  // Step 1: Check pending upgrade plan or explicit redirect
  const pendingRedirect = consumeRedirectAfterLogin();
  if (pendingRedirect) {
    return pendingRedirect;
  }

  // Step 2: Check subscription FIRST — /subscriptions/current is excluded from backend interceptor
  try {
    const subscription = await getCurrentSubscription();
    if (!subscription || !ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
      return "/subscription/upgrade";
    }
  } catch {
    return "/subscription/upgrade";
  }

  // Step 3: Subscription is active — now safe to call business API
  try {
    const response = await listBusinesses();
    const businesses = response.businesses ?? [];

    if (businesses.length === 0) {
      return "/onboarding";
    }

    if (businesses.length === 1) {
      return buildShopPath(businesses[0].id);
    }

    return "/businesses";
  } catch {
    try {
      const { clearTokens } = useAuthStore.getState();
      clearTokens();
    } catch { /* ignore */ }
    return null;
  }
}

/**
 * Redirect authenticated users away from public pages (home, login, register).
 * Reads directly from localStorage for maximum reliability.
 */
export function useRedirectIfAuthenticated(redirectTo?: string) {
  const hydrated = useSyncExternalStore(
    () => () => { },
    () => true,
    () => false,
  );

  const isAuthenticated = useSyncExternalStore(
    () => () => { },
    () => getAccessTokenRaw() != null,
    () => false,
  );

  useEffect(() => {
    if (!hydrated || !isAuthenticated) {
      return;
    }

    let cancelled = false;

    async function resolveAndRedirect() {
      const role = getStoredUserRoleRaw();

      // If an explicit redirectTo prop is provided, use it directly
      if (redirectTo) {
        window.location.replace(redirectTo);
        return;
      }

      const target = await resolvePostLoginTarget(role ?? "");
      if (!cancelled && target) {
        window.location.replace(target);
      }
    }

    void resolveAndRedirect();

    return () => { cancelled = true; };
  }, [hydrated, isAuthenticated, redirectTo]);

  return { hydrated, isAuthenticated };
}

