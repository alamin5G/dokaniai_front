"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

export function NavBar() {
  const t = useTranslations("home.nav");

  return (
    <nav className="bg-surface/80 backdrop-blur-md border-b border-surface-container sticky top-0 z-50 w-full">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
        <Link href="/" className="text-2xl font-black text-primary tracking-tight hover:opacity-80 transition-opacity">
          DokaniAI
        </Link>
        <div className="hidden md:flex gap-8 items-center font-semibold text-base">
          <Link className="text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all duration-300 px-3 py-1 rounded" href="/#features">{t("features")}</Link>
          <Link className="text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all duration-300 px-3 py-1 rounded" href="/pricing">{t("pricing")}</Link>
          <Link className="text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all duration-300 px-3 py-1 rounded" href="/about">{t("about")}</Link>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link className="text-on-surface-variant hover:text-primary font-semibold text-sm hidden md:inline-block" href="/login">
            {t("login")}
          </Link>
          <Link href="/register">
            <button className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-bold active:scale-95 transition-transform shadow-md">
              {t("getStarted")}
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
