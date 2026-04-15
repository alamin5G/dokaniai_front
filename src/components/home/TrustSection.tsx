"use client";

import { useTranslations } from "next-intl";

const TRUST_FEATURES = [
    { icon: "encrypted", titleKey: "security.title", descKey: "security.description" },
    { icon: "cloud_sync", titleKey: "backup.title", descKey: "backup.description" },
    { icon: "support_agent", titleKey: "support.title", descKey: "support.description" },
] as const;

export function TrustSection() {
    const t = useTranslations("home.trust");

    return (
        <section className="py-24 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="bg-surface-container-low rounded-xl p-12 md:p-20 text-center">
                    <h2 className="text-3xl font-bold font-headline text-primary mb-8">
                        {t("title")}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {TRUST_FEATURES.map((feature) => (
                            <div key={feature.icon} className="flex flex-col items-center">
                                <span className="material-symbols-outlined text-secondary text-5xl mb-4">
                                    {feature.icon}
                                </span>
                                <h5 className="text-xl font-bold mb-2">{t(feature.titleKey)}</h5>
                                <p className="text-sm opacity-70">{t(feature.descKey)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

