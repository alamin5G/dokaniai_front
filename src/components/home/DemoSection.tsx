"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";

const EXAMPLES = [
    {
        voiceKey: "ex1Voice",
        productKey: "ex1Product",
        quantityKey: "ex1Quantity",
        totalKey: "ex1Total",
    },
    {
        voiceKey: "ex2Voice",
        productKey: "ex2Product",
        quantityKey: "ex2Quantity",
        totalKey: "ex2Total",
    },
    {
        voiceKey: "ex3Voice",
        productKey: "ex3Product",
        quantityKey: "ex3Quantity",
        totalKey: "ex3Total",
    },
];

export function DemoSection() {
  const t = useTranslations("home.demo");
  const [exampleIndex, setExampleIndex] = useState(0);

  const handleNext = useCallback(() => {
    setExampleIndex((prev) => (prev + 1) % EXAMPLES.length);
  }, []);

  const ex = EXAMPLES[exampleIndex];

  return (
    <section
      id="demo"
      className="home-section"
      style={{ background: "linear-gradient(180deg, rgba(241,245,240,0.2) 0%, rgba(0,97,164,0.04) 100%)" }}
    >
      <div className="home-container grid lg:grid-cols-[1.1fr_1.4fr] gap-8 md:gap-10 items-start">
        <div className="space-y-6 lg:sticky lg:top-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-fixed text-on-primary-fixed rounded-full text-sm font-semibold">
            <span className="material-symbols-outlined home-icon-fill text-base">
              smart_toy
            </span>
            {t("title")}
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-primary leading-tight font-headline">{t("resultTitle")}</h2>
          <p className="text-lg text-on-surface-variant leading-relaxed">{t(ex.voiceKey)}</p>
          <button
            onClick={handleNext}
            className="w-full sm:w-auto px-6 py-4 bg-surface-container-high text-on-surface rounded-xl font-bold hover:bg-surface-dim transition-all flex items-center justify-center gap-2 min-h-[48px]"
          >
            <span className="material-symbols-outlined home-icon">refresh</span>
            {t("anotherExample")}
          </button>
        </div>

        <div className="relative rounded-[2rem] bg-surface-container p-3 shadow-[0_40px_100px_-55px_rgba(0,80,58,0.45)]">
          <div className="relative rounded-[1.6rem] bg-surface-container-high overflow-hidden">
            <div className="p-7 md:p-8"
              style={{
                background: "linear-gradient(135deg, rgba(0, 80, 58, 0.08) 0%, rgba(0, 106, 78, 0.06) 100%)",
              }}
            >
              <div
                className="inline-flex items-center gap-3 px-5 py-4 rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, rgba(0, 80, 58, 0.92) 0%, rgba(0, 106, 78, 0.82) 100%)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                }}
              >
                <span className="material-symbols-outlined home-icon-fill text-white text-2xl">
                  mic
                </span>
                <p className="text-white font-bold font-headline">{t(ex.voiceKey)}</p>
              </div>
            </div>

            <div className="p-7 md:p-8 bg-surface-container-low space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined home-icon-fill text-on-primary-container">
                    auto_awesome
                  </span>
                </div>
                <p className="font-bold text-primary text-xl font-headline">{t("resultTitle")}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-surface-container p-4 rounded-xl flex items-center gap-3">
                  <span className="material-symbols-outlined home-icon-fill text-secondary">
                    inventory_2
                  </span>
                  <div>
                    <p className="text-xs text-on-surface-variant font-label">{t("labelProduct")}</p>
                    <p className="font-bold text-on-surface">{t(ex.productKey)}</p>
                  </div>
                </div>
                <div className="bg-surface-container p-4 rounded-xl flex items-center gap-3">
                  <span className="material-symbols-outlined home-icon-fill text-secondary">
                    scale
                  </span>
                  <div>
                    <p className="text-xs text-on-surface-variant font-label">{t("labelQuantity")}</p>
                    <p className="font-bold text-on-surface">{t(ex.quantityKey)}</p>
                  </div>
                </div>
                <div className="bg-surface-container p-4 rounded-xl flex items-center gap-3">
                  <span className="material-symbols-outlined home-icon-fill text-secondary">
                    payments
                  </span>
                  <div>
                    <p className="text-xs text-on-surface-variant font-label">{t("labelTotal")}</p>
                    <p className="font-bold text-primary text-lg font-headline">{t(ex.totalKey)}</p>
                  </div>
                </div>
                <div className="bg-surface-container p-4 rounded-xl flex items-center gap-3">
                  <span className="material-symbols-outlined home-icon-fill text-secondary">
                    trending_down
                  </span>
                  <div>
                    <p className="text-xs text-on-surface-variant font-label">{t("labelStock")}</p>
                    <p className="font-bold text-on-surface">{t("resultStock")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
