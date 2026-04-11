"use client";

import { useTranslations } from "next-intl";

export function PricingSection() {
  const t = useTranslations("home.pricing");

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <span className="text-secondary font-bold tracking-widest uppercase text-xs">{t("label")}</span>
          <h2 className="text-4xl font-black text-primary font-headline">{t("title")}</h2>
          <p className="text-on-surface-variant text-lg font-medium">{t("subtitle")}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Trial 1 */}
          <div className="bg-surface-container-low p-6 rounded-[1.5rem] flex flex-col justify-between hover:scale-[1.02] transition-transform shadow-sm">
            <div>
              <h4 className="font-bold text-primary mb-1">{t("trial1.name")}</h4>
              <div className="text-2xl font-black mb-4">{t("trial1.price")} <span className="text-sm font-normal text-on-surface-variant">{t("trial1.period")}</span></div>
              <ul className="space-y-3 text-sm font-medium">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base" data-icon="check_circle">check_circle</span> {t("trial1.feature1")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base" data-icon="check_circle">check_circle</span> {t("trial1.feature2")}
                </li>
              </ul>
            </div>
            <button className="mt-8 w-full py-3 bg-surface-container-highest hover:bg-surface-dim transition-colors rounded-xl font-bold text-sm">{t("trial1.cta")}</button>
          </div>
          
          {/* Trial 2 */}
          <div className="bg-surface-container-low p-6 rounded-[1.5rem] flex flex-col justify-between hover:scale-[1.02] transition-transform shadow-sm">
            <div>
              <h4 className="font-bold text-primary mb-1">{t("trial2.name")}</h4>
              <div className="text-2xl font-black mb-4">{t("trial2.price")} <span className="text-sm font-normal text-on-surface-variant">{t("trial2.period")}</span></div>
              <ul className="space-y-3 text-sm font-medium">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base" data-icon="check_circle">check_circle</span> {t("trial2.feature1")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base" data-icon="check_circle">check_circle</span> {t("trial2.feature2")}
                </li>
              </ul>
            </div>
            <button className="mt-8 w-full py-3 bg-surface-container-highest hover:bg-surface-dim transition-colors rounded-xl font-bold text-sm">{t("trial2.cta")}</button>
          </div>
          
          {/* Basic */}
          <div className="bg-surface-container-lowest p-6 rounded-[1.5rem] flex flex-col justify-between border-2 border-primary/20 shadow-xl relative overflow-hidden group hover:-translate-y-2 transition-transform">
            <div className="absolute top-0 right-0 bg-primary text-on-primary px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-bl-xl shadow-sm">{t("basic.popular")}</div>
            <div>
              <h4 className="font-bold text-primary mb-1">{t("basic.name")}</h4>
              <div className="text-2xl font-black mb-4">{t("basic.price")} <span className="text-sm font-normal text-on-surface-variant">{t("basic.period")}</span></div>
              <ul className="space-y-3 text-sm font-medium">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base" data-icon="check_circle">check_circle</span> {t("basic.feature1")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base" data-icon="check_circle">check_circle</span> {t("basic.feature2")}
                </li>
              </ul>
            </div>
            <button className="mt-8 w-full py-3 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all">{t("basic.cta")}</button>
          </div>
          
          {/* Pro */}
          <div className="bg-primary-container p-6 rounded-[1.5rem] flex flex-col justify-between text-on-primary-container shadow-sm hover:scale-[1.02] transition-transform">
            <div>
              <h4 className="font-bold mb-1">{t("pro.name")}</h4>
              <div className="text-2xl font-black mb-4">{t("pro.price")} <span className="text-sm font-normal opacity-70">{t("pro.period")}</span></div>
              <ul className="space-y-3 text-sm font-medium">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base" data-icon="check_circle">check_circle</span> {t("pro.feature1")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base" data-icon="check_circle">check_circle</span> {t("pro.feature2")}
                </li>
              </ul>
            </div>
            <button className="mt-8 w-full py-3 bg-white text-primary rounded-xl font-bold text-sm shadow-sm hover:bg-surface active:scale-95 transition-all">{t("pro.cta")}</button>
          </div>
          
          {/* Plus */}
          <div className="bg-secondary p-6 rounded-[1.5rem] flex flex-col justify-between text-on-secondary shadow-xl hover:scale-[1.02] transition-transform">
            <div>
              <h4 className="font-bold mb-1 text-secondary-fixed opacity-90">{t("plus.name")}</h4>
              <div className="text-2xl font-black mb-4">{t("plus.price")} <span className="text-sm font-normal opacity-70">{t("plus.period")}</span></div>
              <ul className="space-y-3 text-sm font-medium">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base" data-icon="check_circle">check_circle</span> {t("plus.feature1")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base" data-icon="check_circle">check_circle</span> {t("plus.feature2")}
                </li>
              </ul>
            </div>
            <button className="mt-8 w-full py-3 bg-secondary-fixed text-on-secondary-fixed rounded-xl font-bold text-sm shadow-md hover:bg-secondary-fixed-dim transition-colors active:scale-95">{t("plus.cta")}</button>
          </div>
        </div>
      </div>
    </section>
  );
}
