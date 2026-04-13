"use client";

import { consumeRedirectAfterLogin } from "@/lib/authFlow";
import { getPreferredWorkspacePath } from "@/lib/shopRouting";
import { useEffect } from "react";

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
 * Redirect authenticated users away from public pages (home, login, register).
 * Reads directly from localStorage for maximum reliability.
 */
export function useRedirectIfAuthenticated(redirectTo?: string) {
  const isClient = typeof window !== "undefined";
  const token = isClient ? getAccessTokenRaw() : null;
  const isAuthenticated = token != null;

  useEffect(() => {
    if (token) {
      const role = getStoredUserRoleRaw();
      const pendingRedirect = role === "ADMIN" || role === "SUPER_ADMIN" ? null : consumeRedirectAfterLogin();
      const target = pendingRedirect ?? redirectTo ?? (role === "ADMIN" || role === "SUPER_ADMIN" ? "/admin" : getPreferredWorkspacePath());
      // Hard navigation for reliability
      window.location.replace(target);
    }
  }, [redirectTo, token]);

  return { hydrated: isClient, isAuthenticated };
}
