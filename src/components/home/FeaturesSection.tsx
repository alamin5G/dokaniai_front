"use client";

import { useTranslations } from "next-intl";

export function FeaturesSection() {
  const t = useTranslations("home.features");

  return (
    /* Bento Features Section — matches reference HTML layout */
    <section id="features" className="py-24 px-6 bg-surface-container-low">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-black text-primary font-headline">{t("sectionTitle")}</h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto text-lg">{t("sectionSubtitle")}</p>
        </div>

        {/* Bento Grid — matches reference: col-span-2 main + secondary + 3 small */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Feature Card — col-span-2, large */}
          <div className="md:col-span-2 bg-surface-container-lowest p-10 rounded-3xl flex flex-col justify-between hover:translate-y-[-4px] transition-transform duration-300">
            <div>
              <div className="w-16 h-16 bg-primary-fixed text-on-primary-fixed rounded-2xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>record_voice_over</span>
              </div>
              <h3 className="text-3xl font-bold mb-4 font-headline">{t("voiceTitle")}</h3>
              <p className="text-lg text-on-surface-variant max-w-md">{t("voiceDescription")}</p>
            </div>
            <div className="mt-8 flex gap-2">
              <span className="px-4 py-2 bg-secondary-fixed text-on-secondary-fixed rounded-lg text-sm font-bold">Bangla NLP 2.0</span>
              <span className="px-4 py-2 bg-primary-fixed text-on-primary-fixed rounded-lg text-sm font-bold">Voice-First</span>
            </div>
          </div>

          {/* Secondary Feature Card — full primary bg */}
          <div className="bg-primary p-10 rounded-3xl text-on-primary flex flex-col justify-end relative overflow-hidden group">
            <span className="material-symbols-outlined absolute top-[-20px] right-[-20px] text-[150px] opacity-10 rotate-12">receipt_long</span>
            <h3 className="text-2xl font-bold mb-3 font-headline">{t("dueTitle")}</h3>
            <p className="text-primary-fixed leading-relaxed">{t("dueDescription")}</p>
          </div>

          {/* Small Feature Cards — row 2 */}
          <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10">
            <div className="w-12 h-12 bg-secondary-container text-on-secondary-container rounded-xl flex items-center justify-center mb-4">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
            </div>
            <h4 className="text-xl font-bold mb-2 font-headline">{t("stockTitle")}</h4>
            <p className="text-on-surface-variant text-sm">{t("stockDescription")}</p>
          </div>

          <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10">
            <div className="w-12 h-12 bg-tertiary-fixed text-on-tertiary-fixed rounded-xl flex items-center justify-center mb-4">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
            </div>
            <h4 className="text-xl font-bold mb-2 font-headline">{t("securityTitle")}</h4>
            <p className="text-on-surface-variant text-sm">{t("securityDescription")}</p>
          </div>

          <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10">
            <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-xl flex items-center justify-center mb-4">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>monitoring</span>
            </div>
            <h4 className="text-xl font-bold mb-2 font-headline">{t("reportsTitle")}</h4>
            <p className="text-on-surface-variant text-sm">{t("reportsDescription")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
