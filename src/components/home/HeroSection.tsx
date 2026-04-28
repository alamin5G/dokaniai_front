"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { CtaButton } from "@/components/home/CtaButton";

export function HeroSection() {
  const t = useTranslations("home.hero");

  return (
    <header className="home-section relative overflow-hidden pt-14 md:pt-16">
      {/* Decorative background blobs */}
      <div className="absolute top-20 -left-32 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl animate-[float_8s_ease-in-out_infinite]" />
      <div className="absolute -bottom-20 right-10 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-[float_10s_ease-in-out_infinite_1s]" />

      <div className="home-container grid lg:grid-cols-2 gap-10 md:gap-16 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-fixed text-on-primary-fixed rounded-full font-medium text-sm animate-[fadeInUp_0.6s_ease-out]">
            <span className="material-symbols-outlined home-icon-fill text-sm" data-icon="auto_awesome">auto_awesome</span>
            {t("badge")}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-primary leading-[1.15] tracking-tight font-headline animate-[fadeInUp_0.6s_ease-out_0.1s_both]">
            {t("title")}
          </h1>

          <p className="text-lg sm:text-xl text-on-surface-variant max-w-lg leading-relaxed animate-[fadeInUp_0.6s_ease-out_0.2s_both]">
            {t("description")}
          </p>

          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 pt-3 md:pt-4 animate-[fadeInUp_0.6s_ease-out_0.3s_both]">
            <CtaButton size="lg" />
            <Link href="/#demo">
              <button className="w-full sm:w-auto px-8 py-4 bg-surface-container-high text-on-surface rounded-xl font-bold text-base sm:text-lg flex items-center justify-center gap-3 hover:bg-surface-dim transition-all min-h-[48px] group">
                <span className="material-symbols-outlined home-icon group-hover:scale-110 transition-transform" data-icon="play_circle">play_circle</span>
                {t("howItWorks")}
              </button>
            </Link>
          </div>
        </div>

        <div className="relative group animate-[fadeInUp_0.8s_ease-out_0.2s_both]">
          <div className="absolute -inset-4 bg-primary-container/20 rounded-[2.5rem] blur-3xl group-hover:bg-primary-container/30 transition-all duration-700"></div>

          {/* Decorative floating elements */}
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-secondary/10 rounded-2xl rotate-12 animate-[float_6s_ease-in-out_infinite] z-10 hidden lg:block" />
          <div className="absolute -bottom-3 -left-3 w-14 h-14 bg-primary-fixed/30 rounded-xl -rotate-6 animate-[float_7s_ease-in-out_infinite_0.5s] z-10 hidden lg:block" />

          <div className="relative aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl bg-surface-container-low">
            <Image
              alt="Smiling Bangladeshi shopkeeper in a modern organized grocery store"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              src="/icons/image/local-store-owner.jpg"
              width={800}
              height={800}
              priority
            />

            {/* Gradient overlay at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

            {/* Glass AI Overlay — matches reference: glass-ai + border + shadow */}
            <div className="absolute bottom-6 left-6 right-6 p-6 rounded-2xl border border-white/20 shadow-2xl transition-all duration-300 group-hover:translate-y-[-4px]"
              style={{
                background: "linear-gradient(135deg, rgba(0, 80, 58, 0.9) 0%, rgba(0, 106, 78, 0.8) 100%)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)"
              }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                  <span className="material-symbols-outlined home-icon-fill text-white">mic</span>
                </div>
                <div>
                  <p className="text-white/80 text-sm font-medium">{t("listeningAi")}</p>
                  <p className="text-white font-bold">&ldquo;{t("voiceSample")}&rdquo;</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}