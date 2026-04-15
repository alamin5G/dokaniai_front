"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function HowItWorksSection() {
  const t = useTranslations("home.howItWorks");

  const steps = [
    { num: "১", icon: "person_add", title: t("step1Title"), desc: t("step1Desc") },
    { num: "২", icon: "storefront", title: t("step2Title"), desc: t("step2Desc") },
    { num: "৩", icon: "play_circle", title: t("step3Title"), desc: t("step3Desc") },
  ];

  return (
    <section
      className="home-section"
      style={{ background: "linear-gradient(180deg, rgba(241,245,240,0.2) 0%, rgba(0,106,78,0.05) 100%)" }}
    >
      <div className="home-container space-y-10 md:space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-primary font-headline">{t("title")}</h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {steps.map((step) => (
            <article key={step.num} className="bg-surface-container rounded-3xl p-3 shadow-[0_28px_72px_-52px_rgba(0,80,58,0.45)]">
              <div className="bg-surface-container-high rounded-[1.25rem] p-7 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined home-icon-fill">
                      {step.icon}
                    </span>
                  </div>
                  <div className="w-10 h-10 bg-primary text-on-primary rounded-full flex items-center justify-center font-black font-headline">
                    {step.num}
                  </div>
                </div>
                <h3 className="font-bold text-on-surface text-xl mb-3 font-headline">{step.title}</h3>
                <p className="text-on-surface-variant leading-relaxed">{step.desc}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="flex justify-center pt-2">
          <Link href="/register">
            <button
              className="w-full sm:w-auto px-8 py-4 text-on-primary rounded-xl font-bold text-base sm:text-lg flex items-center justify-center gap-3 hover:shadow-xl transition-all mx-auto min-h-[48px]"
              style={{ background: "linear-gradient(135deg, #00503a 0%, #006a4e 100%)" }}
            >
              <span className="material-symbols-outlined home-icon">rocket_launch</span>
              {t("cta")}
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
