"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("home.footer");

  return (
    /* Matches reference: bg-surface-container-low */
    <footer className="bg-surface-container-low w-full mt-20">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-6 py-12 max-w-7xl mx-auto">
        <div className="col-span-2 md:col-span-1 space-y-4">
          <Link href="/" className="text-xl font-bold text-primary font-headline hover:opacity-80 transition-opacity inline-block">
            DokaniAI
          </Link>
          <p className="text-sm text-on-surface-variant font-medium">{t("tagline")}</p>
          <p className="text-xs text-on-surface-variant/60">{t("copyright")}</p>
        </div>

        <div className="space-y-3">
          <h5 className="font-bold text-primary font-headline">{t("plans")}</h5>
          <ul className="text-sm text-on-surface-variant font-medium space-y-2">
            <li><Link className="hover:text-primary hover:translate-x-1 transition-transform inline-block" href="/pricing">{t("trialPlan")}</Link></li>
            <li><Link className="hover:text-primary hover:translate-x-1 transition-transform inline-block" href="/pricing">{t("basicPlan")}</Link></li>
            <li><Link className="hover:text-primary hover:translate-x-1 transition-transform inline-block" href="/pricing">{t("proPlan")}</Link></li>
            <li><Link className="hover:text-primary hover:translate-x-1 transition-transform inline-block" href="/pricing">{t("plusPlan")}</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h5 className="font-bold text-primary font-headline">{t("company")}</h5>
          <ul className="text-sm text-on-surface-variant font-medium space-y-2">
            <li><Link className="hover:text-primary hover:translate-x-1 transition-transform inline-block" href="/about">{t("aboutUs")}</Link></li>
            <li><Link className="hover:text-primary hover:translate-x-1 transition-transform inline-block" href="/#features">{t("features")}</Link></li>
            <li><Link className="hover:text-primary hover:translate-x-1 transition-transform inline-block" href="/pricing">{t("pricing")}</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h5 className="font-bold text-primary font-headline">{t("connect")}</h5>
          <ul className="text-sm text-on-surface-variant font-medium space-y-2">
            <li><Link className="hover:text-primary hover:translate-x-1 transition-transform inline-block" href="mailto:support@dokaniai.com">{t("email")}</Link></li>
            <li><Link className="hover:text-primary hover:translate-x-1 transition-transform inline-block" href="tel:+8801XXXXXXXXX">{t("phone")}</Link></li>
          </ul>
          <div className="flex gap-4 pt-2">
            <Link href="#" className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors" aria-label="Facebook">
              social_leaderboard
            </Link>
            <Link href="#" className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors" aria-label="WhatsApp">
              forum
            </Link>
            <Link href="mailto:support@dokaniai.com" className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors" aria-label="Email">
              mail
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
