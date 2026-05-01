"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

interface AuthLayoutProps {
  children: React.ReactNode;
  heading: string;
  subheading: string;
}

export function AuthLayout({ children, heading, subheading }: AuthLayoutProps) {
  const t = useTranslations("authLayout");

  return (
    <main className="w-full max-w-[1200px] mx-auto grid md:grid-cols-12 items-center gap-8 md:gap-16 pt-8 md:pt-0 min-h-screen relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-20 -left-32 w-72 h-72 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 right-10 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Left Side: Editorial Branding */}
      <section className="md:col-span-5 hidden md:flex flex-col space-y-8 pl-8 animate-auth-fade-in-up">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 bg-primary-container rounded-[1rem] flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary-container text-3xl" data-icon="book_2">book_2</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-primary font-headline">DokaniAI</h1>
          </Link>
        </div>

        <div className="space-y-4">
          <h2 className="text-5xl font-bold leading-tight text-primary">{t("brandTitle", { highlight: t("brandHighlight") })}</h2>
          <p className="text-lg text-on-surface-variant font-medium leading-relaxed opacity-80">{t("brandDescription")}</p>
        </div>

        <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden bg-surface-container shadow-lg group">
          <Image
            alt="Merchant Shop"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            src="/icons/image/local-store-owner.jpg"
            width={600}
            height={600}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/50 via-primary/10 to-transparent" />

          {/* Glass AI Overlay — matching home page hero style */}
          <div className="absolute bottom-5 left-5 right-5 p-5 rounded-2xl border border-white/20 shadow-2xl transition-all duration-300 group-hover:translate-y-[-4px]"
            style={{
              background: "linear-gradient(135deg, rgba(0, 80, 58, 0.9) 0%, rgba(0, 106, 78, 0.8) 100%)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)"
            }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <div>
                <p className="text-white/80 text-xs font-medium">{t("smartInsight")}</p>
                <p className="text-white font-bold text-sm leading-snug">&ldquo;{t("insightSample")}&rdquo;</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="flex items-center gap-6 text-on-surface-variant text-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <span className="font-medium">{t("trustFree")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
            <span className="font-medium">{t("trustSecure")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
            <span className="font-medium">{t("trustSupport")}</span>
          </div>
        </div>
      </section>

      {/* Right Side: Interaction Container */}
      <section className="md:col-span-7 w-full max-w-md mx-auto space-y-6 px-4 z-10 pb-20 md:pb-0 animate-auth-fade-in-up" style={{ animationDelay: "0.15s" }}>
        {/* Mobile Header Only */}
        <div className="md:hidden flex flex-col items-center mb-8 text-center pt-8">
          <Link href="/" className="flex flex-col items-center hover:opacity-80 transition-opacity">
            <span className="material-symbols-outlined text-primary text-5xl mb-2" data-icon="auto_stories">auto_stories</span>
            <h1 className="text-2xl font-black text-primary">DokaniAI</h1>
          </Link>
        </div>

        {/* Language Switcher */}
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        {/* Auth Card */}
        <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-lg relative overflow-hidden border border-outline-variant/10">
          {/* Decorative gradient top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-[2rem]" style={{ background: "linear-gradient(90deg, #003727 0%, #00503a 40%, #0061a4 100%)" }} />

          <div className="mb-8">
            <h3 className="text-2xl font-bold text-on-surface mb-2">{heading}</h3>
            <p className="text-on-surface-variant text-sm">{subheading}</p>
          </div>

          {children}
        </div>
      </section>

      {/* AI Voice Assistant FAB (Global to layout) */}
      <button
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95 group z-40"
        style={{ background: "linear-gradient(135deg, #0061a4 0%, #77b7ff 100%)" }}
      >
        <span className="material-symbols-outlined text-white text-3xl group-hover:rotate-12 transition-transform" data-icon="mic" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
        <div className="absolute -top-12 right-0 bg-on-surface text-surface text-xs py-2 px-4 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {t("brandHighlight")}
        </div>
      </button>
    </main>
  );
}