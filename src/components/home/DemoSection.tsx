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
        <section id="demo" className="py-24 px-6">
            <div className="max-w-3xl mx-auto text-center space-y-10">
                <h2 className="text-3xl md:text-4xl font-black text-primary font-headline">{t("title")}</h2>

                {/* No-Line Rule: tonal layering, no borders */}
                <div className="relative bg-surface-container-lowest rounded-2xl overflow-hidden"
                    style={{ boxShadow: "0 48px 80px -12px rgba(24, 29, 26, 0.06)" }}>

                    {/* Voice Input — Glassmorphism for AI (DESIGN.md §2) */}
                    <div className="p-8"
                        style={{
                            background: "linear-gradient(135deg, rgba(0, 80, 58, 0.06) 0%, rgba(0, 97, 164, 0.06) 100%)"
                        }}>
                        <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl"
                            style={{
                                background: "linear-gradient(135deg, rgba(0, 80, 58, 0.12) 0%, rgba(0, 106, 78, 0.10) 100%)",
                                backdropFilter: "blur(12px)",
                                WebkitBackdropFilter: "blur(12px)"
                            }}>
                            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
                            <p className="text-lg font-bold text-on-surface font-headline">{t(ex.voiceKey)}</p>
                        </div>
                    </div>

                    {/* Transition zone — No-Line Rule: use spacing, no dividers */}
                    <div className="flex items-center px-8 py-3 bg-surface-container-low">
                        <div className="flex-1"></div>
                        <div className="mx-4 w-8 h-8 bg-primary-container rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-on-primary-container text-lg animate-bounce">arrow_downward</span>
                        </div>
                        <div className="flex-1"></div>
                    </div>

                    {/* AI Result */}
                    <div className="p-8 space-y-4">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            </div>
                            <p className="font-bold text-primary text-xl font-headline">{t("resultTitle")}</p>
                        </div>

                        {/* Result cards — tonal layering on surface-container-lowest */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-surface-container-low p-4 rounded-xl flex items-center gap-3">
                                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
                                <div>
                                    <p className="text-xs text-on-surface-variant font-label">{t("labelProduct")}</p>
                                    <p className="font-bold text-on-surface">{t(ex.productKey)}</p>
                                </div>
                            </div>
                            <div className="bg-surface-container-low p-4 rounded-xl flex items-center gap-3">
                                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>scale</span>
                                <div>
                                    <p className="text-xs text-on-surface-variant font-label">{t("labelQuantity")}</p>
                                    <p className="font-bold text-on-surface">{t(ex.quantityKey)}</p>
                                </div>
                            </div>
                            <div className="bg-surface-container-low p-4 rounded-xl flex items-center gap-3">
                                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                                <div>
                                    <p className="text-xs text-on-surface-variant font-label">{t("labelTotal")}</p>
                                    <p className="font-bold text-primary text-lg font-headline">{t(ex.totalKey)}</p>
                                </div>
                            </div>
                            <div className="bg-surface-container-low p-4 rounded-xl flex items-center gap-3">
                                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>trending_down</span>
                                <div>
                                    <p className="text-xs text-on-surface-variant font-label">{t("labelStock")}</p>
                                    <p className="font-bold text-on-surface">{t("resultStock")}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cycle button — 48px touch target */}
                <button
                    onClick={handleNext}
                    className="px-6 py-3 bg-primary/10 text-primary rounded-xl font-bold hover:bg-primary/20 transition-all flex items-center gap-2 mx-auto min-h-[48px]"
                >
                    <span className="material-symbols-outlined">refresh</span>
                    {t("anotherExample")}
                </button>
            </div>
        </section>
    );
}
