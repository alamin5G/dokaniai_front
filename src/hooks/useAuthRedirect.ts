"use client";

import { useEffect, useState } from "react";

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

/**
 * Redirect authenticated users away from public pages (home, login, register).
 * Reads directly from localStorage for maximum reliability.
 */
export function useRedirectIfAuthenticated(redirectTo: string = "/dashboard") {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = getAccessTokenRaw();

    if (token) {
      // Hard navigation for reliability
      window.location.replace(redirectTo);
    } else {
      setChecked(true);
    }
  }, [redirectTo]);

  return { hydrated: checked, isAuthenticated: false };
}
