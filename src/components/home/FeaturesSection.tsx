"use client";

import { PROJECT_FEATURE_HIGHLIGHTS } from "@/lib/planFeatureDisplay";
import { useLocale, useTranslations } from "next-intl";

export function FeaturesSection() {
  const t = useTranslations("home.features");
  const locale = useLocale();
  const isBn = locale.startsWith("bn");

  return (
    <section
      id="features"
      className="home-section"
      style={{ background: "linear-gradient(180deg, rgba(0,80,58,0.04) 0%, rgba(241,245,240,0.9) 55%)" }}
    >
      <div className="home-container">
        <div className="mb-12 md:mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-fixed text-on-primary-fixed rounded-full text-sm font-semibold">
            <span className="material-symbols-outlined home-icon-fill text-base">auto_awesome</span>
            {t("sectionTitle")}
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-primary font-headline max-w-3xl leading-tight">
            {t("sectionSubtitle")}
          </h2>
        </div>

        <div className="grid md:grid-cols-4 gap-4 sm:gap-6">
          {PROJECT_FEATURE_HIGHLIGHTS.map((feature, index) => {
            const featured = index === 0;
            const title = isBn ? feature.titleBn : feature.titleEn;
            const description = isBn ? feature.descriptionBn : feature.descriptionEn;

            return (
              <div
                key={feature.key}
                className={`${featured ? "md:col-span-2 bg-surface-container p-10" : "p-8"} rounded-3xl flex flex-col justify-between transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_32px_80px_-50px_rgba(0,80,58,0.4)] group cursor-default`}
                style={!featured ? { background: "linear-gradient(160deg, rgba(255,255,255,0.96) 0%, rgba(235,244,241,0.9) 100%)" } : undefined}
              >
                <div>
                  <div className={`${featured ? "w-16 h-16 rounded-2xl mb-6" : "w-12 h-12 rounded-xl mb-4"} bg-primary-container text-on-primary-container flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <span className={`material-symbols-outlined home-icon-fill ${featured ? "text-3xl" : "text-2xl"}`}>
                      {feature.icon}
                    </span>
                  </div>
                  <h3 className={`${featured ? "text-3xl" : "text-xl"} font-bold mb-3 font-headline text-on-surface`}>
                    {title}
                  </h3>
                  <p className={`${featured ? "text-lg max-w-md" : "text-sm"} text-on-surface-variant leading-relaxed`}>
                    {description}
                  </p>
                </div>
                <div className="mt-8 flex flex-wrap gap-2">
                  {feature.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1.5 bg-primary-fixed text-on-primary-fixed rounded-lg text-xs font-bold">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
