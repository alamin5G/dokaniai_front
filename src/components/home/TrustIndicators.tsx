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
        /* No-Line Rule: background shift instead of border-y */
        <section className="py-10 px-6 bg-surface-container-low">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-wrap justify-center gap-10 md:gap-20">
                    {stats.map((stat, i) => (
                        <div key={i} className="flex items-center gap-3">
                            {/* Tonal icon container — surface-container-lowest on surface-container-low */}
                            <div className="w-12 h-12 bg-surface-container-lowest rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
                            </div>
                            <span className="font-bold text-on-surface text-lg font-headline">{stat.value}</span>
                        </div>
                    ))}
                </div>
                <p className="text-center text-on-surface-variant text-sm mt-6 font-medium font-label">{t("cities")}</p>
            </div>
        </section>
    );
}
