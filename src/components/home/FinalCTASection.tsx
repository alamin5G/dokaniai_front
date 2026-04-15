"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function FinalCTASection() {
    const t = useTranslations("home.finalCta");

    return (
        /* Glassmorphism gradient CTA — DESIGN.md §2: primary → primary_container gradient */
        <section className="py-20 px-6"
            style={{
                background: "linear-gradient(135deg, #003727 0%, #00503a 100%)"
            }}>
            <div className="max-w-4xl mx-auto text-center space-y-8">
                <h2 className="text-4xl font-black text-on-primary font-headline">{t("title")}</h2>
                <p className="text-on-primary/80 text-lg max-w-2xl mx-auto">{t("description")}</p>
                {/* CTA Button — 48px touch target, inverted colors */}
                <Link href="/register">
                    <button className="px-10 py-5 bg-on-primary text-primary rounded-xl font-bold text-xl hover:brightness-110 transition-all flex items-center gap-3 mx-auto min-h-[48px]">
                        {t("button")}
                    </button>
                </Link>
            </div>
        </section>
    );
}
