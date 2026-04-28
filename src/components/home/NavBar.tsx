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
    <nav className="bg-[#f7faf6]/80 backdrop-blur-xl border-b border-black/5 sticky top-0 z-50 w-full transition-all duration-300">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
        <Link href="/" className="text-2xl font-black text-primary tracking-tight hover:opacity-80 transition-opacity font-headline flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-on-primary"
            style={{ background: "linear-gradient(135deg, #003727 0%, #00503a 100%)" }}>
            <span className="material-symbols-outlined home-icon-fill text-base">storefront</span>
          </span>
          DokaniAI
        </Link>
        <div className="hidden md:flex gap-1 items-center font-semibold text-base">
          <Link className="text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all duration-300 px-4 py-2 rounded-lg" href="/#features">{t("features")}</Link>
          <Link className="text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all duration-300 px-4 py-2 rounded-lg" href="/pricing">{t("pricing")}</Link>
          <Link className="text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all duration-300 px-4 py-2 rounded-lg" href="/about">{t("about")}</Link>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <Link href={dashboardHref}>
              <button className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-bold active:scale-95 transition-all duration-200 hover:shadow-lg hover:shadow-primary/20">
                {t("dashboard")}
              </button>
            </Link>
          ) : (
            <>
              <Link className="text-on-surface-variant hover:text-primary font-semibold text-sm hidden md:inline-block transition-colors" href="/login">
                {t("login")}
              </Link>
              <Link href="/register">
                <button className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-bold active:scale-95 transition-all duration-200 hover:shadow-lg hover:shadow-primary/20">
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