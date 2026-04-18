"use client";

import { useTranslations } from "next-intl";
import { CtaButton } from "@/components/home/CtaButton";

export function FinalCTASection() {
  const t = useTranslations("home.finalCta");

  return (
    <section className="home-section py-16 md:py-20 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #003727 0%, #00503a 100%)",
      }}
    >
      <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-white/15 blur-3xl" />
      <div className="absolute -bottom-28 -left-16 w-80 h-80 rounded-full bg-primary-container/35 blur-3xl" />
      <div className="absolute top-1/3 left-1/3 w-64 h-64 rounded-full bg-secondary/15 blur-3xl" />

      <div className="relative max-w-5xl mx-auto rounded-[2rem] p-7 sm:p-8 md:p-12 text-center space-y-6 md:space-y-7 border border-white/15"
        style={{
          background: "linear-gradient(145deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.07) 100%)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-on-primary font-headline leading-tight">{t("title")}</h2>
        <p className="text-base sm:text-lg text-on-primary/85 max-w-2xl mx-auto leading-relaxed">{t("description")}</p>
        <div className="flex justify-center">
          <CtaButton variant="white" size="lg" />
        </div>
      </div>
    </section>
  );
}
