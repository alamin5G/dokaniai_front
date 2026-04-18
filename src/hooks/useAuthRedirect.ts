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
 * SRS §8.2 — Post-Login Redirect:
 *   1. pending_upgrade_plan → /subscription/upgrade?plan=[planId]
 *   2. businesses.length === 0 → /onboarding (if active subscription) or /subscription/upgrade
 *   3. businesses.length === 1 → /shop/[businessId] (skip overview)
 *   4. businesses.length > 1 → /businesses (show overview)
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

  // Steps 2–4: Fetch business list to determine redirect
  try {
    const response = await listBusinesses();
    const businesses = response.businesses ?? [];

    if (businesses.length === 0) {
      // Before sending to onboarding, verify the user has an active subscription.
      try {
        const subscription = await getCurrentSubscription();
        if (!ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
          return "/subscription/upgrade";
        }
      } catch {
        return "/subscription/upgrade";
      }
      return "/onboarding";
    }

    if (businesses.length === 1) {
      return buildShopPath(businesses[0].id);
    }

    // Multiple businesses → show overview
    return "/businesses";
  } catch {
    // API call failed (likely 401 from stale token) — clear tokens and stay put
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

