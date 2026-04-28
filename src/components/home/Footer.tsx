"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations();
  const locale = useLocale();
  const isBn = locale.startsWith("bn");

  const navLinkClass =
    "inline-flex min-h-10 items-center text-sm text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-md";
  const iconChipClass =
    "inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/70 transition-all hover:-translate-y-0.5 hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30";

  return (
    <footer className="relative w-full overflow-hidden" style={{ background: "linear-gradient(180deg, #003727 0%, #001a12 100%)" }} aria-label="Footer">
      {/* Decorative top gradient that blends with any page background */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-32" style={{ background: "linear-gradient(to bottom, rgba(248,250,246,0.08) 0%, transparent 100%)" }} />
      <div aria-hidden className="pointer-events-none absolute -right-20 top-10 h-56 w-56 rounded-full bg-secondary/8 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -left-20 bottom-10 h-48 w-48 rounded-full bg-primary-container/8 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 md:pt-16 pb-8">
        {/* Main footer grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,minmax(0,1fr))_1.2fr] lg:gap-10 mb-12">
          {/* Brand */}
          <div className="space-y-4 lg:pr-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-2xl font-bold text-white font-headline transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-md"
            >
              <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                <span className="material-symbols-outlined text-lg text-white" style={{ fontVariationSettings: "'FILL' 1" }}>store</span>
              </span>
              DokaniAI
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-white/60">{t("home.footer.tagline")}</p>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <h5 className="font-headline text-xs font-bold uppercase tracking-widest text-white/40">{t("home.footer.company")}</h5>
            <ul className="space-y-2">
              <li><Link className={navLinkClass} href="/about">{t("home.footer.aboutUs")}</Link></li>
              <li><Link className={navLinkClass} href="/#features">{t("home.footer.features")}</Link></li>
              <li><Link className={navLinkClass} href="/pricing">{t("home.footer.pricing")}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h5 className="font-headline text-xs font-bold uppercase tracking-widest text-white/40">{t("home.footer.legal")}</h5>
            <ul className="space-y-2">
              <li><Link className={navLinkClass} href="/legal/terms">{t("home.footer.terms")}</Link></li>
              <li><Link className={navLinkClass} href="/legal/privacy">{t("home.footer.privacy")}</Link></li>
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-3">
            <h5 className="font-headline text-xs font-bold uppercase tracking-widest text-white/40">{t("home.footer.connect")}</h5>
            <ul className="space-y-2">
              <li><Link className={navLinkClass} href="mailto:support@dokaniai.com">{t("home.footer.email")}</Link></li>
              <li><Link className={navLinkClass} href="tel:+8801822679672">{t("home.footer.phone")}</Link></li>
            </ul>
            <div className="flex gap-2 pt-1">
              <Link href="#" className={iconChipClass} aria-label="Facebook">
                <span className="material-symbols-outlined home-icon text-lg">public</span>
              </Link>
              <Link href="#" className={iconChipClass} aria-label="WhatsApp">
                <span className="material-symbols-outlined home-icon text-lg">forum</span>
              </Link>
              <Link href="mailto:support@dokaniai.com" className={iconChipClass} aria-label="Email">
                <span className="material-symbols-outlined home-icon text-lg">mail</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-white/40 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
                {isBn ? "আমরা যে পেমেন্ট মাধ্যমসমূহ সাপোর্ট করি" : "Secure Payment Partners"}
              </span>
            </div>
            <Image
              src="/icons/payment/nagad_rocket_bkash.png"
              alt="bKash, Nagad, Rocket"
              width={160}
              height={32}
              className="object-contain opacity-50 hover:opacity-80 transition-opacity"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-6">
            <p className="text-xs text-white/30">{t("home.footer.copyright")}</p>
            <p className="text-xs text-white/30">{isBn ? "বাংলাদেশে ❤️ দিয়ে তৈরি" : "Made with ❤️ in Bangladesh"}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}