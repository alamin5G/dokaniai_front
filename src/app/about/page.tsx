"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Footer } from "@/components/home/Footer";
import { CtaButton } from "@/components/home/CtaButton";
import { NavBar } from "@/components/home/NavBar";

export default function AboutPage() {
    const t = useTranslations("about");

    return (
        <div className="min-h-screen bg-background text-on-background font-body selection:bg-primary-fixed overflow-x-hidden">
            <NavBar />

            <main>
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-20 pb-24 px-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>
                    <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-fixed text-on-primary-fixed rounded-full font-medium text-sm">
                            <span className="material-symbols-outlined text-sm">favorite</span>
                            {t("hero.badge")}
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-primary leading-tight tracking-tight font-headline">
                            {t("hero.title")}
                        </h1>
                        <p className="text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed font-medium">
                            {t("hero.subtitle")}
                        </p>
                    </div>
                </section>

                {/* Mission Section with Image */}
                <section className="py-20 px-6 bg-surface-container-low">
                    <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-black text-primary font-headline">{t("mission.title")}</h2>
                            <p className="text-on-surface-variant text-lg leading-relaxed">{t("mission.description")}</p>
                            <div className="grid grid-cols-2 gap-6 pt-4">
                                <div className="text-center p-6 bg-surface-container-lowest rounded-2xl">
                                    <div className="text-3xl font-black text-primary">5M+</div>
                                    <div className="text-sm text-on-surface-variant font-medium mt-1">{t("mission.shops")}</div>
                                </div>
                                <div className="text-center p-6 bg-surface-container-lowest rounded-2xl">
                                    <div className="text-3xl font-black text-primary">৳0</div>
                                    <div className="text-sm text-on-surface-variant font-medium mt-1">{t("mission.startCost")}</div>
                                </div>
                                <div className="text-center p-6 bg-surface-container-lowest rounded-2xl">
                                    <div className="text-3xl font-black text-primary">65</div>
                                    <div className="text-sm text-on-surface-variant font-medium mt-1">{t("mission.freeDays")}</div>
                                </div>
                                <div className="text-center p-6 bg-surface-container-lowest rounded-2xl">
                                    <div className="text-3xl font-black text-primary">24/7</div>
                                    <div className="text-sm text-on-surface-variant font-medium mt-1">{t("mission.aiSupport")}</div>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute -inset-4 bg-primary-container/20 rounded-[2rem] blur-2xl"></div>
                            <div className="relative rounded-[2rem] overflow-hidden aspect-[4/3]">
                                <Image
                                    src="/icons/image/self-help.jpg"
                                    alt="Smart shop management"
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Problem We Solve */}
                <section className="py-20 px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16 space-y-4">
                            <h2 className="text-3xl font-black text-primary font-headline">{t("problem.title")}</h2>
                            <p className="text-on-surface-variant max-w-2xl mx-auto text-lg">{t("problem.subtitle")}</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { icon: "menu_book", title: t("problem.p1Title"), desc: t("problem.p1Desc") },
                                { icon: "calculate", title: t("problem.p2Title"), desc: t("problem.p2Desc") },
                                { icon: "trending_flat", title: t("problem.p3Title"), desc: t("problem.p3Desc") },
                            ].map((item, i) => (
                                <div key={i} className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 hover:translate-y-[-4px] transition-transform duration-300">
                                    <div className="w-14 h-14 bg-error-container text-on-error-container rounded-2xl flex items-center justify-center mb-6">
                                        <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-on-surface mb-3">{item.title}</h3>
                                    <p className="text-on-surface-variant text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How We Help */}
                <section className="py-20 px-6 bg-surface-container-low">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16 space-y-4">
                            <h2 className="text-3xl font-black text-primary font-headline">{t("solution.title")}</h2>
                            <p className="text-on-surface-variant max-w-2xl mx-auto text-lg">{t("solution.subtitle")}</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { icon: "mic", title: t("solution.s1Title"), desc: t("solution.s1Desc") },
                                { icon: "inventory_2", title: t("solution.s2Title"), desc: t("solution.s2Desc") },
                                { icon: "account_balance_wallet", title: t("solution.s3Title"), desc: t("solution.s3Desc") },
                                { icon: "smart_toy", title: t("solution.s4Title"), desc: t("solution.s4Desc") },
                            ].map((item, i) => (
                                <div key={i} className="bg-surface-container-lowest p-6 rounded-2xl text-center hover:translate-y-[-4px] transition-transform duration-300 border border-outline-variant/10">
                                    <div className="w-16 h-16 bg-primary-container text-on-primary-container rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                                    </div>
                                    <h3 className="font-bold text-on-surface mb-2">{item.title}</h3>
                                    <p className="text-sm text-on-surface-variant leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ROI Section - What You Pay vs What You Get */}
                <section className="py-20 px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16 space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-tertiary-container text-on-tertiary-container rounded-full font-medium text-sm">
                                {t("roi.badge")}
                            </div>
                            <h2 className="text-3xl font-black text-primary font-headline">{t("roi.title")}</h2>
                            <p className="text-on-surface-variant max-w-2xl mx-auto text-lg">{t("roi.subtitle")}</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            {/* What you pay */}
                            <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 space-y-6">
                                <h3 className="text-xl font-bold text-on-surface flex items-center gap-3">
                                    <span className="w-10 h-10 bg-on-surface-variant/10 text-on-surface-variant rounded-xl flex items-center justify-center">
                                        <span className="material-symbols-outlined">payments</span>
                                    </span>
                                    {t("roi.payTitle")}
                                </h3>
                                {[
                                    { title: t("roi.pay1Title"), desc: t("roi.pay1Desc"), icon: "local_cafe" },
                                    { title: t("roi.pay2Title"), desc: t("roi.pay2Desc"), icon: "card_giftcard" },
                                    { title: t("roi.pay3Title"), desc: t("roi.pay3Desc"), icon: "phone_android" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 bg-surface-container-low rounded-xl">
                                        <span className="material-symbols-outlined text-on-surface-variant mt-0.5">{item.icon}</span>
                                        <div>
                                            <h4 className="font-bold text-on-surface">{item.title}</h4>
                                            <p className="text-sm text-on-surface-variant">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* What you get */}
                            <div className="relative bg-primary-container/30 p-8 rounded-2xl border-2 border-primary/20 space-y-5 overflow-hidden">
                                <div className="absolute top-3 right-3 px-3 py-1 bg-primary text-on-primary text-xs font-bold rounded-full">★ BEST VALUE</div>
                                <h3 className="text-xl font-bold text-primary flex items-center gap-3">
                                    <span className="w-10 h-10 bg-primary text-on-primary rounded-xl flex items-center justify-center">
                                        <span className="material-symbols-outlined">emoji_events</span>
                                    </span>
                                    {t("roi.getTitle")}
                                </h3>
                                {[
                                    { title: t("roi.get1Title"), desc: t("roi.get1Desc"), icon: "savings" },
                                    { title: t("roi.get2Title"), desc: t("roi.get2Desc"), icon: "psychology" },
                                    { title: t("roi.get3Title"), desc: t("roi.get3Desc"), icon: "inventory" },
                                    { title: t("roi.get4Title"), desc: t("roi.get4Desc"), icon: "chat" },
                                    { title: t("roi.get5Title"), desc: t("roi.get5Desc"), icon: "bar_chart" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-4 p-3 bg-primary-container/40 rounded-xl">
                                        <span className="material-symbols-outlined text-primary mt-0.5">{item.icon}</span>
                                        <div>
                                            <h4 className="font-bold text-on-surface">{item.title}</h4>
                                            <p className="text-sm text-on-surface-variant">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tagline */}
                        <div className="text-center mt-12">
                            <p className="text-2xl font-bold text-primary font-headline">{t("roi.tagline")}</p>
                            <div className="mt-6">
                                <CtaButton />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Why DokaniAI with Image */}
                <section className="py-20 px-6 bg-surface-container-low">
                    <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                        <div className="relative order-2 md:order-1">
                            <div className="absolute -inset-4 bg-secondary/10 rounded-[2rem] blur-2xl"></div>
                            <div className="relative rounded-[2rem] overflow-hidden aspect-[4/3]">
                                <Image
                                    src="/icons/image/why-we.jpg"
                                    alt="Why DokaniAI"
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                            </div>
                        </div>
                        <div className="space-y-8 order-1 md:order-2">
                            <h2 className="text-3xl font-black text-primary font-headline">{t("why.title")}</h2>
                            {[
                                { icon: "language", title: t("why.w1Title"), desc: t("why.w1Desc") },
                                { icon: "insights", title: t("why.w2Title"), desc: t("why.w2Desc") },
                                { icon: "lock", title: t("why.w3Title"), desc: t("why.w3Desc") },
                                { icon: "payments", title: t("why.w4Title"), desc: t("why.w4Desc") },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-10 h-10 bg-primary-fixed text-on-primary-fixed rounded-xl flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-lg">{item.icon}</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-on-surface">{item.title}</h4>
                                        <p className="text-sm text-on-surface-variant mt-1">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Banner */}
                <section className="py-20 px-6 bg-gradient-to-r from-primary to-primary/80">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <h2 className="text-4xl font-black text-on-primary font-headline">{t("cta.title")}</h2>
                        <p className="text-on-primary/80 text-lg max-w-2xl mx-auto">{t("cta.description")}</p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <CtaButton variant="white" />
                            <Link href="/pricing">
                                <button className="px-8 py-4 bg-white/20 text-on-primary rounded-xl font-bold text-lg hover:bg-white/30 transition-all flex items-center gap-3 border border-on-primary/30">
                                    <span className="material-symbols-outlined">visibility</span>
                                    {t("cta.viewPricing")}
                                </button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}