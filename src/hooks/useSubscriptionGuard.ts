"use client";

import { getCurrentSubscription } from "@/lib/subscriptionApi";
import { useAuthStore } from "@/store/authStore";
import type { SubscriptionStatus } from "@/types/subscription";
import { useEffect, useRef, useState } from "react";

const ACTIVE_STATUSES = new Set<SubscriptionStatus>(["ACTIVE", "TRIAL", "GRACE"]);

export const SUBSCRIPTION_REFRESH_EVENT = "dokaniai:subscription-refresh";

interface SubscriptionGuardResult {
  loading: boolean;
  hasSubscription: boolean;
  subscriptionStatus: SubscriptionStatus | null;
}

export function useSubscriptionGuard(): SubscriptionGuardResult {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const checkedRef = useRef(false);
  const refreshGenerationRef = useRef(0);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    const role = useAuthStore.getState().userRole;
    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      setHasSubscription(true);
      setSubscriptionStatus("ACTIVE");
      setLoading(false);
      return;
    }

    if (checkedRef.current) return;
    checkedRef.current = true;

    let cancelled = false;

    async function check() {
      try {
        const sub = await getCurrentSubscription();
        if (cancelled) return;
        if (!sub) {
          setHasSubscription(false);
          setSubscriptionStatus(null);
          return;
        }
        const active = ACTIVE_STATUSES.has(sub.status);
        setHasSubscription(active);
        setSubscriptionStatus(sub.status);
      } catch {
        if (cancelled) return;
        setHasSubscription(false);
        setSubscriptionStatus(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void check();

    const onRefresh = () => {
      checkedRef.current = false;
      refreshGenerationRef.current += 1;
      void check();
    };

    window.addEventListener(SUBSCRIPTION_REFRESH_EVENT, onRefresh);
    return () => {
      cancelled = true;
      window.removeEventListener(SUBSCRIPTION_REFRESH_EVENT, onRefresh);
    };
  }, [accessToken]);

  return { loading, hasSubscription, subscriptionStatus };
}
