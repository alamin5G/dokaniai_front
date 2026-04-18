"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/authStore";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";

interface CtaButtonProps {
  variant?: "primary" | "outline" | "white";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CtaButton({ variant = "primary", size = "md", className = "" }: CtaButtonProps) {
  const t = useTranslations("home.cta");
  const accessToken = useAuthStore((s) => s.accessToken);
  const userRole = useAuthStore((s) => s.userRole);
  const isAuthenticated = accessToken != null;
  const { hasSubscription } = useSubscriptionGuard();

  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
  const href = isAdmin
    ? "/admin"
    : isAuthenticated && hasSubscription
      ? "/businesses"
      : isAuthenticated
        ? "/subscription/upgrade"
        : "/register";

  const label = isAdmin
    ? t("admin")
    : isAuthenticated
      ? hasSubscription
        ? t("dashboard")
        : t("selectPlan")
      : t("getStarted");

  const baseSize = size === "lg" ? "px-8 py-4 text-base sm:text-lg" : size === "sm" ? "px-6 py-2.5 text-sm" : "px-8 py-4 text-base";

  const variantClass =
    variant === "primary"
      ? "bg-primary text-on-primary hover:shadow-xl"
      : variant === "white"
        ? "bg-on-primary text-primary hover:shadow-xl"
        : "bg-transparent border-2 border-primary text-primary hover:bg-primary/5";

  return (
    <Link href={href} className="inline-block">
      <button className={`${baseSize} ${variantClass} rounded-xl font-bold flex items-center justify-center gap-3 transition-all min-h-[48px] ${className}`}>
        <span className="material-symbols-outlined">rocket_launch</span>
        {label}
      </button>
    </Link>
  );
}
