"use client";

import { consumeRedirectAfterLogin } from "@/lib/authFlow";
import { listBusinesses } from "@/lib/businessApi";
import { buildShopPath } from "@/lib/shopRouting";
import { useEffect, useSyncExternalStore } from "react";

const AUTH_STORAGE_KEY = "dokaniai-auth-storage";

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
 *   2. businesses.length === 0 → /onboarding
 *   3. businesses.length === 1 → /shop/[businessId] (skip overview)
 *   4. businesses.length > 1 → /businesses (show overview)
 */
async function resolvePostLoginTarget(role: string): Promise<string> {
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
      return "/onboarding";
    }

    if (businesses.length === 1) {
      return buildShopPath(businesses[0].id);
    }

    // Multiple businesses → show overview
    return "/businesses";
  } catch {
    // API call failed — fall back to localStorage-based path
    const storedId = typeof window !== "undefined"
      ? localStorage.getItem("dokaniai-business-storage")
      : null;
    if (storedId) {
      try {
        const parsed = JSON.parse(storedId);
        const activeId = parsed?.state?.activeBusinessId;
        if (activeId) return buildShopPath(activeId);
      } catch { /* ignore */ }
    }
    return "/businesses";
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
      if (!cancelled) {
        window.location.replace(target);
      }
    }

    void resolveAndRedirect();

    return () => { cancelled = true; };
  }, [hydrated, isAuthenticated, redirectTo]);

  return { hydrated, isAuthenticated };
}

