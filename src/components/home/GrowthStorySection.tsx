"use client";

import { useTranslations } from "next-intl";

const STAGES = ["stage1", "stage2", "stage3", "stage4"] as const;

const STAGE_COLORS = [
    "bg-primary-fixed text-primary",
    "bg-secondary-fixed text-secondary",
    "bg-inverse-primary text-primary",
    "bg-tertiary-fixed text-tertiary",
] as const;

export function GrowthStorySection() {
    const t = useTranslations("home.growthStory");

    return (
        <section className="py-24 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="editorial-grid">
                    {/* Left Column - Sticky Title */}
                    <div className="col-span-12 md:col-span-4 sticky top-12 h-fit">
                        <h2 className="text-4xl font-bold text-primary font-headline mb-8 leading-tight">
                            {t("title")}
                        </h2>
                        <p className="text-on-surface-variant leading-relaxed">
                            {t("subtitle")}
                        </p>
                        <div className="mt-12 h-64 w-full bg-surface-container rounded-lg overflow-hidden relative">
                            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-8xl opacity-30">trending_up</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Stages */}
                    <div className="col-span-12 md:col-span-7 md:col-start-6 space-y-24">
                        {STAGES.map((stage, index) => {
                            const isEven = index % 2 === 1;

                            return (
                                <div
                                    key={stage}
                                    className={`flex flex-col gap-6 ${isEven ? "items-end text-right" : "items-start"}`}
                                >
                                    <div
                                        className={`w-16 h-16 flex items-center justify-center rounded-full font-bold text-2xl ${STAGE_COLORS[index]}`}
                                    >
                                        {t(`${stage}.number`)}
                                    </div>
                                    <h4 className="text-2xl font-bold font-headline text-primary">
                                        {t(`${stage}.title`)}
                                    </h4>
                                    <p className="text-lg text-on-surface-variant">
                                        {t(`${stage}.description`)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
