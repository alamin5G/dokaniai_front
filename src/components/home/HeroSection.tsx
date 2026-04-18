"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { CtaButton } from "@/components/home/CtaButton";

export function HeroSection() {
  const t = useTranslations("home.hero");

  return (
    <header className="home-section relative overflow-hidden pt-14 md:pt-16">
      <div className="home-container grid lg:grid-cols-2 gap-10 md:gap-16 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-fixed text-on-primary-fixed rounded-full font-medium text-sm">
            <span className="material-symbols-outlined home-icon-fill text-sm" data-icon="auto_awesome">auto_awesome</span>
            {t("badge")}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-primary leading-[1.15] tracking-tight font-headline">
            {t("title")}
          </h1>

          <p className="text-lg sm:text-xl text-on-surface-variant max-w-lg leading-relaxed">
            {t("description")}
          </p>

          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 pt-3 md:pt-4">
            <CtaButton size="lg" />
            <Link href="/#demo">
              <button className="w-full sm:w-auto px-8 py-4 bg-surface-container-high text-on-surface rounded-xl font-bold text-base sm:text-lg flex items-center justify-center gap-3 hover:bg-surface-dim transition-all min-h-[48px]">
                <span className="material-symbols-outlined home-icon" data-icon="play_circle">play_circle</span>
                {t("howItWorks")}
              </button>
            </Link>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-4 bg-primary-container/20 rounded-[2.5rem] blur-3xl group-hover:bg-primary-container/30 transition-colors"></div>

          <div className="relative aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl bg-surface-container-low">
            <img
              alt="Smiling Bangladeshi shopkeeper in a modern organized grocery store"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCp-BK_GEuHvnhBqO1cTU_N9Y9UUjd04LcI5mptEF0CVL4e7SSL1qolKM7_W8st8NZM75XWs6M2POYLfr3kaLVo_eN-P4Rt37p5TqdrJurXVijBW3YgtXgeVSCLI0Mi5R1wmlbMctU9nJzuxzOcbohVCETrfghiqMaaL8BoMzQH6BX8m3Jgu4H_9H8DJGAm2ffyl4VZTMkJutUd_dZ_IlMz1kEF3vjP7LUGxmnYG5VSL371rHNpxDdn2vFPW-aeaascIGshLEXs1FQ"
            />

            {/* Glass AI Overlay — matches reference: glass-ai + border + shadow */}
            <div className="absolute bottom-6 left-6 right-6 p-6 rounded-2xl border border-white/20 shadow-2xl"
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
