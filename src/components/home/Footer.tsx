"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations();

  const navLinkClass =
    "inline-flex min-h-10 items-center text-sm text-on-surface-variant transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 rounded-md";
  const iconChipClass =
    "inline-flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container-lowest text-on-surface-variant transition-all hover:-translate-y-0.5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35";

  return (
    <footer className="relative mt-16 w-full overflow-hidden bg-surface-container-low md:mt-20" aria-label="Footer">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/8 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute -right-20 top-10 h-56 w-56 rounded-full bg-secondary/10 blur-3xl" />

      <div className="home-container relative px-4 sm:px-6 py-12 md:py-16">
        <div className="rounded-3xl bg-surface px-5 py-8 shadow-[0_14px_44px_rgba(25,28,26,0.06)] sm:px-7 md:px-8 md:py-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))] lg:gap-10">
            <div className="space-y-4 lg:pr-4">
              <Link
                href="/"
                className="inline-flex text-2xl font-bold text-primary font-headline transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 rounded-md"
              >
                DokaniAI
              </Link>
              <p className="max-w-xs text-sm leading-relaxed text-on-surface-variant">{t("home.footer.tagline")}</p>
              <p className="text-xs text-on-surface-variant/70">{t("home.footer.copyright")}</p>
            </div>

            <div className="space-y-3">
              <h5 className="font-headline text-sm font-bold uppercase tracking-wide text-primary">{t("home.footer.plans")}</h5>
              <ul className="space-y-1.5">
                <li><Link className={navLinkClass} href="/pricing">{t("home.footer.trialPlan")}</Link></li>
                <li><Link className={navLinkClass} href="/pricing">{t("home.footer.basicPlan")}</Link></li>
                <li><Link className={navLinkClass} href="/pricing">{t("home.footer.proPlan")}</Link></li>
                <li><Link className={navLinkClass} href="/pricing">{t("home.footer.plusPlan")}</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h5 className="font-headline text-sm font-bold uppercase tracking-wide text-primary">{t("home.footer.company")}</h5>
              <ul className="space-y-1.5">
                <li><Link className={navLinkClass} href="/about">{t("home.footer.aboutUs")}</Link></li>
                <li><Link className={navLinkClass} href="/#features">{t("home.footer.features")}</Link></li>
                <li><Link className={navLinkClass} href="/pricing">{t("home.footer.pricing")}</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h5 className="font-headline text-sm font-bold uppercase tracking-wide text-primary">{t("home.footer.legal")}</h5>
              <ul className="space-y-1.5">
                <li><Link className={navLinkClass} href="/legal/terms">{t("home.footer.terms")}</Link></li>
                <li><Link className={navLinkClass} href="/legal/privacy">{t("home.footer.privacy")}</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h5 className="font-headline text-sm font-bold uppercase tracking-wide text-primary">{t("home.footer.connect")}</h5>
              <ul className="space-y-1.5">
                <li><Link className={navLinkClass} href="mailto:support@dokaniai.com">{t("home.footer.email")}</Link></li>
                <li><Link className={navLinkClass} href="tel:+8801822679672">{t("home.footer.phone")}</Link></li>
              </ul>

              <div className="flex gap-3 pt-1">
                <Link href="#" className={iconChipClass} aria-label="Facebook">
                  <span className="material-symbols-outlined home-icon">social_leaderboard</span>
                </Link>
                <Link href="#" className={iconChipClass} aria-label="WhatsApp">
                  <span className="material-symbols-outlined home-icon">forum</span>
                </Link>
                <Link href="mailto:support@dokaniai.com" className={iconChipClass} aria-label="Email">
                  <span className="material-symbols-outlined home-icon">mail</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
