"use client";

import { getCurrentSubscription } from "@/lib/subscriptionApi";
import { useAuthStore } from "@/store/authStore";
import type { SubscriptionStatus } from "@/types/subscription";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const ACTIVE_STATUSES: SubscriptionStatus[] = ["ACTIVE", "TRIAL", "GRACE"];

interface SubscriptionGateProps {
  children: React.ReactNode;
}

export function SubscriptionGate({ children }: SubscriptionGateProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "allowed" | "blocked">("loading");
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
      return;
    }

    if (checkedRef.current) return;
    checkedRef.current = true;

    let cancelled = false;

    async function check() {
      try {
        const sub = await getCurrentSubscription();
        if (cancelled) return;
        if (sub && ACTIVE_STATUSES.includes(sub.status)) {
          setStatus("allowed");
        } else {
          setStatus("blocked");
          router.replace("/subscription/upgrade");
        }
      } catch {
        if (cancelled) return;
        setStatus("blocked");
        router.replace("/subscription/upgrade");
      }
    }

    void check();
    return () => { cancelled = true; };
  }, [accessToken, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="w-10 h-10 rounded-full border-4 border-surface-container-high border-t-primary animate-spin" />
      </div>
    );
  }

  if (status === "blocked") return null;

  return <>{children}</>;
}
