"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function LegalHubPage() {
    const t = useTranslations("shop.legal");

    return (
        <div className="min-h-screen bg-background text-on-background font-body selection:bg-primary-fixed">
            {/* Header */}
            <nav className="bg-[#f7faf6]/80 backdrop-blur-md border-b border-black/5 sticky top-0 z-50 w-full">
                <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
                    <Link href="/" className="text-2xl font-black text-primary tracking-tight hover:opacity-80 transition-opacity font-headline">
                        DokaniAI
                    </Link>
                    <Link href="/register" className="text-on-surface-variant hover:text-primary font-semibold text-sm">
                        {t("backToRegister")}
                    </Link>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-16">
                {/* Page Title */}
                <div className="mb-16 text-center">
                    <h1 className="text-4xl font-black text-primary font-headline mb-3">{t("title")}</h1>
                    <p className="text-on-surface-variant">{t("lastUpdated")}</p>
                </div>

                {/* Document Cards */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Terms of Service Card */}
                    <Link
                        href="/legal/terms"
                        className="group bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/10 hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300"
                    >
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                            <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-on-surface font-headline mb-3 group-hover:text-primary transition-colors">
                            {t("hub.termsTitle")}
                        </h2>
                        <p className="text-on-surface-variant leading-relaxed mb-6">
                            {t("hub.termsDesc")}
                        </p>
                        <span className="inline-flex items-center gap-2 text-primary font-bold text-sm group-hover:gap-3 transition-all">
                            {t("hub.readMore")}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </span>
                    </Link>

                    {/* Privacy Policy Card */}
                    <Link
                        href="/legal/privacy"
                        className="group bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/10 hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300"
                    >
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                            <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-on-surface font-headline mb-3 group-hover:text-primary transition-colors">
                            {t("hub.privacyTitle")}
                        </h2>
                        <p className="text-on-surface-variant leading-relaxed mb-6">
                            {t("hub.privacyDesc")}
                        </p>
                        <span className="inline-flex items-center gap-2 text-primary font-bold text-sm group-hover:gap-3 transition-all">
                            {t("hub.readMore")}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </span>
                    </Link>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-surface-container-low w-full mt-20">
                <div className="px-6 py-8 max-w-7xl mx-auto text-center">
                    <p className="text-sm text-on-surface-variant">
                        © 2025 DokaniAI. {t("footer.copyright")}
                    </p>
                </div>
            </footer>
        </div>
    );
}
