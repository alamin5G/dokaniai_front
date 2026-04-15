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
        /* Alternating section bg for visual separation — No-Line Rule */
        <section className="py-24 px-6">
            <div className="max-w-5xl mx-auto text-center space-y-16">
                <h2 className="text-3xl md:text-4xl font-black text-primary font-headline">{t("title")}</h2>

                <div className="grid md:grid-cols-3 gap-8 relative">
                    {/* Connector — No-Line Rule: use subtle tonal indicator instead of line */}
                    <div className="hidden md:block absolute top-16 left-[33%] right-[33%]">
                        <div className="flex items-center justify-center">
                            <div className="flex-1 h-0.5 bg-outline-variant/15"></div>
                            <span className="material-symbols-outlined text-primary mx-2 text-xl">arrow_forward</span>
                            <div className="flex-1 h-0.5 bg-outline-variant/15"></div>
                        </div>
                    </div>

                    {steps.map((step, i) => (
                        <div key={i}
                            /* No-Line Rule: no border. Tonal layering only */
                            className="bg-surface-container-lowest p-8 rounded-2xl transition-all">
                            {/* Step number — primary circle, tonal elevation */}
                            <div className="w-16 h-16 bg-primary text-on-primary rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-black font-headline">
                                {step.num}
                            </div>
                            {/* Icon */}
                            <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-xl flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{step.icon}</span>
                            </div>
                            <h3 className="font-bold text-on-surface text-lg mb-2 font-headline">{step.title}</h3>
                            <p className="text-sm text-on-surface-variant leading-relaxed">{step.desc}</p>
                        </div>
                    ))}
                </div>

                {/* CTA — 48px touch target */}
                <Link href="/register">
                    <button className="px-8 py-4 bg-primary text-on-primary rounded-xl font-bold text-lg flex items-center gap-3 hover:brightness-110 transition-all mx-auto min-h-[48px]">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
                        {t("cta")}
                    </button>
                </Link>
            </div>
        </section>
    );
}
