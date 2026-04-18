"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import { useAuthStore } from "@/store/authStore";

export function NavBar() {
  const t = useTranslations("home.nav");
  const accessToken = useAuthStore((s) => s.accessToken);
  const userRole = useAuthStore((s) => s.userRole);
  const isAuthenticated = accessToken != null;
  const { hasSubscription } = useSubscriptionGuard();

  const dashboardHref =
    userRole === "ADMIN" || userRole === "SUPER_ADMIN"
      ? "/admin"
      : hasSubscription
        ? "/businesses"
        : "/subscription/upgrade";

  return (
    <nav className="bg-[#f7faf6]/80 backdrop-blur-md border-b border-black/5 sticky top-0 z-50 w-full">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
        <Link href="/" className="text-2xl font-black text-primary tracking-tight hover:opacity-80 transition-opacity font-headline">
          DokaniAI
        </Link>
        <div className="hidden md:flex gap-8 items-center font-semibold text-base">
          <Link className="text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all duration-300 px-3 py-1 rounded" href="/#features">{t("features")}</Link>
          <Link className="text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all duration-300 px-3 py-1 rounded" href="/pricing">{t("pricing")}</Link>
          <Link className="text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all duration-300 px-3 py-1 rounded" href="/about">{t("about")}</Link>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <Link href={dashboardHref}>
              <button className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-bold active:scale-95 transition-transform">
                {t("dashboard")}
              </button>
            </Link>
          ) : (
            <>
              <Link className="text-on-surface-variant hover:text-primary font-semibold text-sm hidden md:inline-block" href="/login">
                {t("login")}
              </Link>
              <Link href="/register">
                <button className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-bold active:scale-95 transition-transform">
                  {t("getStarted")}
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
