"use client";

import { useTranslations } from "next-intl";
import { CtaButton } from "@/components/home/CtaButton";

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

        <div className="relative grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Connector line — visible on lg screens */}
          <div className="hidden lg:block absolute top-1/2 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-[2px] -translate-y-1/2 z-0"
            style={{ background: "linear-gradient(90deg, var(--color-primary-container) 0%, var(--color-primary) 50%, var(--color-primary-container) 100%)" }} />

          {steps.map((step, idx) => (
            <article key={step.num} className="bg-surface-container rounded-3xl p-3 shadow-[0_28px_72px_-52px_rgba(0,80,58,0.45)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_36px_80px_-48px_rgba(0,80,58,0.5)] relative z-10 group">
              <div className="bg-surface-container-high rounded-[1.25rem] p-7 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined home-icon-fill">
                      {step.icon}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-black font-headline text-on-primary"
                    style={{ background: "linear-gradient(135deg, #003727 0%, #00503a 100%)" }}>
                    {step.num}
                  </div>
                </div>
                <h3 className="font-bold text-on-surface text-xl mb-3 font-headline">{step.title}</h3>
                <p className="text-on-surface-variant leading-relaxed">{step.desc}</p>
              </div>
              {/* Arrow indicator between steps on lg */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:flex absolute -right-4 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-primary-container text-on-primary-container rounded-full items-center justify-center shadow-md">
                  <span className="material-symbols-outlined home-icon-fill text-sm">arrow_forward</span>
                </div>
              )}
            </article>
          ))}
        </div>

        <div className="flex justify-center pt-2">
          <CtaButton />
        </div>
      </div>
    </section>
  );
}