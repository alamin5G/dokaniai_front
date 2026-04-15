"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function FAQSection() {
    const t = useTranslations("home.faq");
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqs = [
        { q: t("q1"), a: t("a1") },
        { q: t("q2"), a: t("a2") },
        { q: t("q3"), a: t("a3") },
        { q: t("q4"), a: t("a4") },
    ];

    return (
        <section className="py-24 px-6">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-black text-primary font-headline text-center mb-12 mt-8">{t("title")}</h2>

                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <div
                            key={i}
                            /* No-Line Rule: no border. Tonal layering: surface-container-lowest on surface bg */
                            className="bg-surface-container-lowest rounded-xl overflow-hidden"
                        >
                            <button
                                className="w-full px-6 py-5 flex items-center justify-between text-left min-h-[48px]"
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                            >
                                <span className="font-bold text-on-surface flex items-center gap-3 font-headline">
                                    <span className="text-primary">❓</span> {faq.q}
                                </span>
                                <span className="material-symbols-outlined text-on-surface-variant transition-transform">
                                    {openIndex === i ? "expand_less" : "expand_more"}
                                </span>
                            </button>
                            {openIndex === i && (
                                <div className="px-6 pb-5">
                                    <p className="text-on-surface-variant leading-relaxed">{faq.a}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
