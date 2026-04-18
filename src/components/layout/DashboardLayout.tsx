"use client";

import BottomNavBar from "@/components/layout/BottomNavBar";
import SideNavBar from "@/components/layout/SideNavBar";
import TopAppBar from "@/components/layout/TopAppBar";
import * as businessApi from "@/lib/businessApi";
import { getCurrentSubscription } from "@/lib/subscriptionApi";
import { useBusinessStore } from "@/store/businessStore";
import { useWebPush } from "@/hooks/useWebPush";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Auth helper — reads directly from localStorage (bypasses Zustand hydration)
// ---------------------------------------------------------------------------

const AUTH_STORAGE_KEY = "dokaniai-auth-storage";

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

// ---------------------------------------------------------------------------
// Spinner component (inline, no external deps)
// ---------------------------------------------------------------------------

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <div className="w-10 h-10 rounded-full border-4 border-surface-container-high border-t-primary animate-spin" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state component with retry button
// ---------------------------------------------------------------------------

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-surface gap-4">
      <p className="text-on-surface-variant text-center px-6">{message}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity"
      >
        Retry
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  businessId?: string;
}

// ---------------------------------------------------------------------------
// Loading timeout (ms) — safety net for hung API calls
// ---------------------------------------------------------------------------

const LOADING_TIMEOUT = 10_000;

// ---------------------------------------------------------------------------
// DashboardLayout component
// ---------------------------------------------------------------------------

export default function DashboardLayout({ children, title, businessId }: DashboardLayoutProps) {
  const router = useRouter();
  const { activeBusiness, activeBusinessId, loadBusinesses, loadBusiness, setActiveBusiness, businesses } = useBusinessStore();

  // Web Push — auto-registers service worker when dashboard loads
  useWebPush();

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to track lifecycle and avoid stale closures
  const mountedRef = useRef(true);
  const isReadyRef = useRef(false);

  // -------------------------------------------------------------------------
  // Core guard logic — reads latest store state via getState() to avoid
  // stale closure values caused by Zustand persist hydration timing.
  // -------------------------------------------------------------------------
  const runGuards = useCallback(async () => {
    setError(null);
    isReadyRef.current = false;

    // Safety timeout — break out of loading if guards take too long
    const timeoutId = setTimeout(() => {
      if (mountedRef.current && !isReadyRef.current) {
        setError("Loading is taking too long. Please try again.");
      }
    }, LOADING_TIMEOUT);

    try {
      // 1. Auth guard — read directly from localStorage
      const token = getAccessTokenRaw();
      if (!token) {
        clearTimeout(timeoutId);
        router.replace("/login");
        return;
      }

      // 1b. Subscription guard — no active sub = no access
      //    Only /subscription and /billing routes are exempt (user picks plan there)
      const currentPath = window.location.pathname;
      const isAuthOnlyRoute =
        currentPath.startsWith("/subscription") ||
        currentPath.startsWith("/billing");

      if (!isAuthOnlyRoute) {
        try {
          const sub = await getCurrentSubscription();
          if (!["ACTIVE", "TRIAL", "GRACE"].includes(sub.status)) {
            clearTimeout(timeoutId);
            router.replace("/subscription/upgrade");
            return;
          }
        } catch {
          clearTimeout(timeoutId);
          router.replace("/subscription/upgrade");
          return;
        }
      }

      // 2. Read latest state from store (bypasses stale React closure).
      const state = useBusinessStore.getState();

      // 3. Business guard — only fetch if no cached list.
      if (state.businesses.length === 0) {
        try {
          await loadBusinesses();
        } catch {
          if (mountedRef.current) {
            setError("Failed to load businesses. Please check your connection and try again.");
          }
          return;
        }
      }

      // 4. Re-read state after potential load
      const updatedState = useBusinessStore.getState();

      // 5. Onboarding guard — redirect to /onboarding if:
      //    a) No businesses at all (brand new user)
      //    b) User has active businesses but none completed onboarding
      //    Skip this guard if we're already on /onboarding, /businesses, or /subscription
      const skipOnboardingGuard =
        currentPath === "/onboarding" ||
        currentPath === "/businesses" ||
        currentPath.startsWith("/subscription");

      if (!skipOnboardingGuard && updatedState.businesses.length === 0) {
        // Brand new user — no businesses at all
        clearTimeout(timeoutId);
        router.replace("/onboarding");
        return;
      }

      if (!skipOnboardingGuard && updatedState.businesses.length > 0) {
        try {
          const onboardingStatus = await businessApi.getMyOnboardingStatus();
          if (
            onboardingStatus.hasActiveBusinesses &&
            !onboardingStatus.hasCompletedOnboarding
          ) {
            // User has active businesses but none with completed onboarding
            clearTimeout(timeoutId);
            router.replace("/onboarding");
            return;
          }
        } catch {
          // If onboarding stats API fails, let user through to dashboard
        }
      }

      // 6. Shop route guard — explicit /shop/[businessId] context takes precedence.
      if (businessId) {
        let targetBusiness = updatedState.businesses.find((b) => b.id === businessId);

        if (!targetBusiness) {
          try {
            targetBusiness = await loadBusiness(businessId);
          } catch {
            clearTimeout(timeoutId);
            router.replace("/businesses");
            return;
          }
        }

        if (!targetBusiness || targetBusiness.status !== "ACTIVE") {
          clearTimeout(timeoutId);
          router.replace("/businesses");
          return;
        }

        if (!updatedState.activeBusiness || updatedState.activeBusiness.id !== businessId) {
          setActiveBusiness(targetBusiness);
        }
      }

      // 7. Mark as ready
      if (mountedRef.current) {
        isReadyRef.current = true;
        setIsReady(true);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }, [router, loadBusinesses, loadBusiness, setActiveBusiness, businessId]);

  // -------------------------------------------------------------------------
  // Mount effect — wait for Zustand persist hydration, then run guards.
  // Without this, the useEffect fires before hydration completes, sees
  // activeBusiness as null, and makes an unnecessary (potentially failing)
  // API call that leaves the spinner stuck forever.
  // -------------------------------------------------------------------------
  useEffect(() => {
    mountedRef.current = true;

    const startGuards = () => {
      if (mountedRef.current) {
        runGuards().catch(() => {
          if (mountedRef.current) {
            setError("An unexpected error occurred. Please try again.");
          }
        });
      }
    };

    // Wait for Zustand persist to hydrate from localStorage before checking
    // activeBusiness. This prevents the stale-closure race condition.
    const store = useBusinessStore;
    if (store.persist && store.persist.hasHydrated()) {
      // Already hydrated — run immediately
      startGuards();
    } else if (store.persist) {
      // Not yet hydrated — subscribe to hydration finish event
      const unsubFinish = store.persist.onFinishHydration(() => {
        unsubFinish();
        startGuards();
      });
      // Double-check: hydration might have completed between our check and
      // the subscription. If so, unsubscribe and start immediately.
      if (store.persist.hasHydrated()) {
        unsubFinish();
        startGuards();
      }
    } else {
      // No persist middleware — run immediately
      startGuards();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [runGuards]);

  // -------------------------------------------------------------------------
  // After guards pass, auto-select first active business if none selected
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isReady) return;
    if (businessId) return;

    if (!activeBusiness && businesses.length > 0) {
      const firstActive = businesses.find((b) => b.status === "ACTIVE");
      if (firstActive) {
        setActiveBusiness(firstActive);
      } else {
        // All businesses archived — send to businesses page to restore/create
        router.replace("/businesses");
      }
    }
  }, [isReady, activeBusiness, businesses, router, setActiveBusiness, businessId]);

  // -------------------------------------------------------------------------
  // Background refresh: verify active business still exists on server (endpoint #2)
  // This ensures cached data from localStorage is up-to-date without blocking UI.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const targetBusinessId = businessId ?? activeBusinessId;
    if (isReady && targetBusinessId) {
      loadBusiness(targetBusinessId).catch(() => {
        // If business no longer exists, redirect to business list
        const state = useBusinessStore.getState();
        if (!state.activeBusiness) {
          router.replace("/businesses");
        }
      });
    }
  }, [isReady, activeBusinessId, loadBusiness, router, businessId]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  // Show error state with retry button
  if (error) {
    return <ErrorState message={error} onRetry={runGuards} />;
  }

  // Show spinner while checking auth/business
  if (!isReady || !activeBusiness || (businessId != null && activeBusiness.id !== businessId)) {
    return <Spinner />;
  }

  return (
    <>
      {/* Desktop sidebar */}
      <SideNavBar businessId={activeBusinessId ?? businessId} />

      {/* Main content area */}
      <main className="md:ml-64 min-h-screen pb-28 md:pb-8">
        <TopAppBar title={title} businessId={activeBusinessId ?? businessId} />

        <div className="px-6 py-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNavBar businessId={activeBusinessId ?? businessId} />
    </>
  );
}
