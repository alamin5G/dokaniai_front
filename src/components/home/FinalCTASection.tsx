"use client";

import { useTranslations } from "next-intl";
import { CtaButton } from "@/components/home/CtaButton";

export function FinalCTASection() {
  const t = useTranslations("home.finalCta");

  return (
    <section className="home-section py-16 md:py-20 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #003727 0%, #00503a 50%, #003727 100%)",
      }}
    >
      {/* Animated decorative blobs */}
      <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-white/15 blur-3xl animate-[float_12s_ease-in-out_infinite]" />
      <div className="absolute -bottom-28 -left-16 w-80 h-80 rounded-full bg-primary-container/35 blur-3xl animate-[float_15s_ease-in-out_infinite_2s]" />
      <div className="absolute top-1/3 left-1/3 w-64 h-64 rounded-full bg-secondary/15 blur-3xl animate-[float_10s_ease-in-out_infinite_1s]" />

      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }} />

      <div className="relative max-w-5xl mx-auto rounded-[2rem] p-7 sm:p-8 md:p-12 text-center space-y-6 md:space-y-7 border border-white/15 transition-all duration-500 hover:border-white/25"
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