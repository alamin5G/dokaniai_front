"use client";

import { useTranslations } from "next-intl";

export function TrustIndicators() {
  const t = useTranslations("home.trust");

  const stats = [
    { icon: "store", value: t("shops") },
    { icon: "receipt_long", value: t("transactions") },
    { icon: "star", value: t("rating") },
  ];

  return (
    <section
      className="home-section py-14 md:py-16"
      style={{ background: "linear-gradient(180deg, rgba(0, 80, 58, 0.05) 0%, rgba(241, 245, 240, 1) 45%)" }}
    >
      <div className="home-container grid lg:grid-cols-[1.2fr_1.8fr] gap-5 sm:gap-6 lg:gap-8 items-stretch">
        <div className="rounded-3xl bg-surface-container p-8 md:p-10 flex flex-col justify-between shadow-[0_30px_70px_-40px_rgba(0,80,58,0.35)] transition-all duration-500 hover:shadow-[0_36px_80px_-36px_rgba(0,80,58,0.4)] group">
          <div className="space-y-4">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white"
              style={{
                background: "linear-gradient(135deg, rgba(0, 80, 58, 0.9) 0%, rgba(0, 106, 78, 0.8) 100%)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              {t("cities")}
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-primary leading-tight font-headline">{t("rating")}</h3>
            <p className="text-on-surface-variant leading-relaxed">{t("cities")}</p>
          </div>
          <div className="mt-7 md:mt-8 inline-flex items-center gap-2 text-on-surface-variant group-hover:gap-3 transition-all">
            <span className="material-symbols-outlined home-icon text-secondary">location_city</span>
            <span className="font-medium">{t("shops")}</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
          {stats.map((stat, index) => (
            <article
              key={stat.icon}
              className="rounded-3xl p-6 md:p-8 flex flex-col gap-5 shadow-[0_24px_60px_-40px_rgba(0,97,164,0.35)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_70px_-36px_rgba(0,97,164,0.4)] group cursor-default"
              style={{
                background:
                  index === 0
                    ? "linear-gradient(160deg, rgba(255,255,255,0.95) 0%, rgba(235,244,241,0.9) 100%)"
                    : index === 1
                      ? "linear-gradient(160deg, rgba(255,255,255,0.95) 0%, rgba(237,243,248,0.9) 100%)"
                      : "linear-gradient(160deg, rgba(255,255,255,0.95) 0%, rgba(243,237,232,0.9) 100%)",
              }}
            >
              <div className="w-12 h-12 rounded-xl bg-white/75 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined home-icon-fill text-primary text-2xl">
                  {stat.icon}
                </span>
              </div>
              <p className="font-black text-xl text-on-surface leading-snug font-headline">{stat.value}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}