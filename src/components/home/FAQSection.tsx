"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function FAQSection() {
  const t = useTranslations("home.faq");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    { q: t("q1"), a: t("a1") },
    { q: t("q2"), a: t("a2") },
    { q: t("q3"), a: t("a3") },
    { q: t("q4"), a: t("a4") },
  ];

  return (
    <section
      className="home-section"
      style={{ background: "linear-gradient(180deg, rgba(0,97,164,0.04) 0%, rgba(241,245,240,0.95) 55%)" }}
    >
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_1.4fr] gap-5 sm:gap-8 items-start">
        <div className="space-y-4 lg:sticky lg:top-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container-lowest rounded-full text-sm font-semibold text-primary">
            <span className="material-symbols-outlined home-icon text-base">support_agent</span>
            {t("title")}
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-primary font-headline leading-tight">{t("title")}</h2>
          <div className="mt-6 rounded-2xl overflow-hidden shadow-lg">
            <Image
              src="/icons/image/why-we.jpg"
              alt="Why DokaniAI"
              width={600}
              height={400}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {faqs.map((faq, i) => (
            <article
              key={faq.q}
              className="rounded-2xl overflow-hidden shadow-[0_24px_60px_-48px_rgba(0,80,58,0.45)]"
              style={{
                background:
                  i % 2 === 0
                    ? "linear-gradient(150deg, rgba(255,255,255,0.96) 0%, rgba(236,244,248,0.88) 100%)"
                    : "linear-gradient(150deg, rgba(255,255,255,0.96) 0%, rgba(237,244,241,0.9) 100%)",
              }}
            >
              <button
                className="w-full px-6 py-5 flex items-center justify-between text-left min-h-[48px]"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="font-bold text-on-surface flex items-center gap-3 font-headline">
                  <span className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
                    <span className="material-symbols-outlined home-icon text-base">help</span>
                  </span>
                  {faq.q}
                </span>
                <span className="material-symbols-outlined home-icon text-on-surface-variant transition-transform">
                  {openIndex === i ? "remove" : "add"}
                </span>
              </button>
              {openIndex === i && (
                <div className="px-6 pb-6">
                  <p className="text-on-surface-variant leading-relaxed">{faq.a}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
