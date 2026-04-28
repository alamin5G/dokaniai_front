"use client";

import { useTranslations } from "next-intl";

export function FeaturesSection() {
  const t = useTranslations("home.features");

  return (
    <section
      id="features"
      className="home-section"
      style={{ background: "linear-gradient(180deg, rgba(0,80,58,0.04) 0%, rgba(241,245,240,0.9) 55%)" }}
    >
      <div className="home-container">
        <div className="mb-12 md:mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-fixed text-on-primary-fixed rounded-full text-sm font-semibold">
            <span className="material-symbols-outlined home-icon-fill text-base">
              auto_awesome
            </span>
            {t("sectionTitle")}
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-primary font-headline max-w-3xl leading-tight">{t("sectionSubtitle")}</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
          {/* Voice - Featured card */}
          <div className="md:col-span-2 bg-surface-container p-10 rounded-3xl flex flex-col justify-between transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_40px_90px_-50px_rgba(0,80,58,0.45)] shadow-[0_32px_80px_-50px_rgba(0,80,58,0.4)] group cursor-default">
            <div>
              <div className="w-16 h-16 bg-primary-fixed text-on-primary-fixed rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined home-icon-fill text-3xl">record_voice_over</span>
              </div>
              <h3 className="text-3xl font-bold mb-4 font-headline">{t("voiceTitle")}</h3>
              <p className="text-lg text-on-surface-variant max-w-md">{t("voiceDescription")}</p>
            </div>
            <div className="mt-8 flex gap-2">
              <span className="px-4 py-2 bg-secondary-fixed text-on-secondary-fixed rounded-lg text-sm font-bold">NLP</span>
              <span className="px-4 py-2 bg-primary-fixed text-on-primary-fixed rounded-lg text-sm font-bold">Voice</span>
            </div>
          </div>

          {/* Due management */}
          <div className="p-10 rounded-3xl text-on-primary flex flex-col justify-end relative overflow-hidden group transition-all duration-500 hover:-translate-y-1.5 cursor-default"
            style={{ background: "linear-gradient(160deg, #004735 0%, #006a4e 100%)" }}>
            <span className="material-symbols-outlined home-icon-fill absolute top-[-20px] right-[-20px] text-[150px] opacity-10 rotate-12 group-hover:rotate-6 transition-transform duration-700">receipt_long</span>
            <h3 className="text-2xl font-bold mb-3 font-headline">{t("dueTitle")}</h3>
            <p className="text-primary-fixed leading-relaxed">{t("dueDescription")}</p>
          </div>

          {/* Stock */}
          <div className="p-8 rounded-3xl transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-30px_rgba(0,97,164,0.2)] group cursor-default" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.96) 0%, rgba(236,244,248,0.88) 100%)" }}>
            <div className="w-12 h-12 bg-secondary-container text-on-secondary-container rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined home-icon-fill">inventory_2</span>
            </div>
            <h4 className="text-xl font-bold mb-2 font-headline">{t("stockTitle")}</h4>
            <p className="text-on-surface-variant text-sm">{t("stockDescription")}</p>
          </div>

          {/* Security */}
          <div className="p-8 rounded-3xl transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-30px_rgba(83,30,26,0.15)] group cursor-default" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.96) 0%, rgba(245,239,236,0.9) 100%)" }}>
            <div className="w-12 h-12 bg-tertiary-fixed text-on-tertiary-fixed rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined home-icon-fill">shield_with_heart</span>
            </div>
            <h4 className="text-xl font-bold mb-2 font-headline">{t("securityTitle")}</h4>
            <p className="text-on-surface-variant text-sm">{t("securityDescription")}</p>
          </div>

          {/* Reports */}
          <div className="p-8 rounded-3xl transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-30px_rgba(0,80,58,0.15)] group cursor-default" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.96) 0%, rgba(235,244,241,0.9) 100%)" }}>
            <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined home-icon-fill">monitoring</span>
            </div>
            <h4 className="text-xl font-bold mb-2 font-headline">{t("reportsTitle")}</h4>
            <p className="text-on-surface-variant text-sm">{t("reportsDescription")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}