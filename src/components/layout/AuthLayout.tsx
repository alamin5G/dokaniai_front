"use client";

import React from "react";
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
    <main className="w-full max-w-[1200px] mx-auto grid md:grid-cols-12 items-center gap-8 md:gap-16 pt-8 md:pt-0 min-h-screen relative">
      {/* Left Side: Editorial Branding */}
      <section className="md:col-span-5 hidden md:flex flex-col space-y-8 pl-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-container rounded-[1rem] flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary-container text-3xl" data-icon="book_2">book_2</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary font-headline">DokaniAI</h1>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-5xl font-bold leading-tight text-primary">{t("brandTitle", { highlight: t("brandHighlight") })}</h2>
          <p className="text-lg text-on-surface-variant font-medium leading-relaxed opacity-80">{t("brandDescription")}</p>
        </div>
        
        <div className="relative w-full aspect-square rounded-[1rem] overflow-hidden bg-surface-container shadow-sm">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAH2YO8_dvIf5XWcqcT3y-TBAi--2KYmxa7vbeL9v72Wb3R51UITvLqqxGKPIryU1fF0LruKalQk7uxXlUUA8AKQoMejS46GSYOkUzY9nfZyt3B4ghgMxR1j7oiKU_tbL8yYN0tw_71fW_D5VlqdAWzDe5-LJNgDv7Wh3vuLLb3DyMcc_tVZbYFXa8GLtINOLyRK_m3I-YdbpYH2gvLCbu3RzkYXAi0TcNnG0PLIyJZDQPN1Sbwq-BLWRn6xHyjWzMpFdSBf0BqzAWi"
            alt="Merchant Shop" 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6 p-6 bg-surface-variant/60 backdrop-blur-md rounded-[1rem]">
            <p className="text-primary font-semibold text-sm mb-1">{t("smartInsight")}</p>
            <p className="text-on-surface font-bold text-lg leading-snug">"{t("insightSample")}"</p>
          </div>
        </div>
      </section>
      
      {/* Right Side: Interaction Container */}
      <section className="md:col-span-7 w-full max-w-md mx-auto space-y-6 px-4 z-10 pb-20 md:pb-0">
        {/* Mobile Header Only */}
        <div className="md:hidden flex flex-col items-center mb-8 text-center pt-8">
          <span className="material-symbols-outlined text-primary text-5xl mb-2" data-icon="auto_stories">auto_stories</span>
          <h1 className="text-2xl font-black text-primary">DokaniAI</h1>
        </div>
        
        {/* Language Switcher */}
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        {/* Auth Card */}
        <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
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
