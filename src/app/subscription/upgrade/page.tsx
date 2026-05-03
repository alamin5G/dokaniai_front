"use client";

import { setRedirectAfterLogin } from "@/lib/authFlow";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function buildAccountSubscriptionUrl(searchParams: URLSearchParams) {
  const params = new URLSearchParams();
  const plan = searchParams.get("plan");
  const billing = searchParams.get("billing");
  if (plan) params.set("plan", plan);
  if (billing) params.set("billing", billing);
  const query = params.toString();
  return query ? `/account/subscription?${query}` : "/account/subscription";
}

function UpgradeRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const target = buildAccountSubscriptionUrl(searchParams);
    try {
      const rawAuth = localStorage.getItem("dokaniai-auth-storage");
      const parsed = rawAuth ? JSON.parse(rawAuth) : null;
      if (!parsed?.state?.accessToken) {
        setRedirectAfterLogin(target);
        router.replace("/login");
        return;
      }
      router.replace(target);
    } catch {
      setRedirectAfterLogin(target);
      router.replace("/login");
    }
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="rounded-lg border border-outline-variant/30 bg-surface px-5 py-4 text-sm font-semibold text-on-surface">
        সাবস্ক্রিপশন পেজে নেওয়া হচ্ছে...
      </div>
    </div>
  );
}

export default function SubscriptionUpgradePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <UpgradeRedirect />
    </Suspense>
  );
}
