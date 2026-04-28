"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

/* ─── Shared sub-components ─── */

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h2 className="text-2xl font-black text-primary font-headline pt-8 first:pt-0">{children}</h2>;
}

function Para({ children }: { children: React.ReactNode }) {
    return <p className="text-on-surface-variant leading-relaxed">{children}</p>;
}

function InfoBox({ children, variant = "info" }: { children: React.ReactNode; variant?: "info" | "warning" | "success" }) {
    const styles = {
        info: "bg-blue-50 border-blue-200 text-blue-800",
        warning: "bg-amber-50 border-amber-200 text-amber-800",
        success: "bg-green-50 border-green-200 text-green-800",
    };
    return (
        <div className={`rounded-xl border-l-4 p-4 ${styles[variant]}`}>
            {children}
        </div>
    );
}

function BulletList({ items }: { items: React.ReactNode[] }) {
    return (
        <ul className="space-y-2 pl-4">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-on-surface-variant">
                    <span className="text-primary mt-1.5 flex-shrink-0">•</span>
                    <span className="leading-relaxed">{item}</span>
                </li>
            ))}
        </ul>
    );
}

const cookieTypeConfig: { key: string; icon: string; color: string; borderColor: string }[] = [
    { key: "essential", icon: "lock", color: "bg-red-50 text-red-700 border-red-200", borderColor: "border-l-red-400" },
    { key: "analytics", icon: "analytics", color: "bg-blue-50 text-blue-700 border-blue-200", borderColor: "border-l-blue-400" },
    { key: "functional", icon: "tune", color: "bg-green-50 text-green-700 border-green-200", borderColor: "border-l-green-400" },
];

export default function CookiePolicyPage() {
    const t = useTranslations("shop.legal.cookies");
    const tl = useTranslations("shop.legal");

    return (
        <div className="min-h-screen bg-background text-on-background font-body selection:bg-primary-fixed overflow-x-hidden">
            {/* ═══════ Hero Header ═══════ */}
            <div
                className="relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #003727 0%, #001a12 100%)" }}
            >
                <div className="max-w-7xl mx-auto px-6 py-16 sm:py-20 text-center">
                    <span
                        className="material-symbols-outlined text-5xl text-primary-container mb-4 block"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                        cookie
                    </span>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-headline leading-tight">
                        {t("title")}
                    </h1>
                    <p className="mt-4 text-white/60 text-sm">{t("lastUpdated")}</p>

                    {/* Quick nav */}
                    <div className="flex flex-wrap justify-center gap-3 mt-8">
                        {[
                            { href: "#what", label: t("whatCookies"), icon: "help" },
                            { href: "#how", label: t("howWeUse"), icon: "settings" },
                            { href: "#types", label: t("typesOfCookies"), icon: "category" },
                            { href: "#manage", label: t("manageCookies"), icon: "tune" },
                        ].map((tab) => (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/80 text-sm font-semibold hover:bg-white/20 hover:text-white transition-all"
                            >
                                <span className="material-symbols-outlined text-base">{tab.icon}</span>
                                {tab.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* ═══════ Top Nav Bar ═══════ */}
            <nav className="bg-[#f7faf6]/80 backdrop-blur-md border-b border-black/5 sticky top-0 z-50 w-full">
                <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
                    <Link
                        href="/"
                        className="text-2xl font-black text-primary tracking-tight hover:opacity-80 transition-opacity font-headline"
                    >
                        DokaniAI
                    </Link>
                    <div className="flex items-center gap-4 sm:gap-6">
                        <Link href="/legal/terms" className="text-on-surface-variant hover:text-primary font-semibold text-sm hidden sm:inline">
                            {tl("tabs.terms")}
                        </Link>
                        <Link href="/legal/privacy" className="text-on-surface-variant hover:text-primary font-semibold text-sm hidden sm:inline">
                            {tl("tabs.privacy")}
                        </Link>
                        <Link href="/legal/payment" className="text-on-surface-variant hover:text-primary font-semibold text-sm hidden sm:inline">
                            {tl("payment.title")}
                        </Link>
                        <Link href="/register" className="text-on-surface-variant hover:text-primary font-semibold text-sm">
                            {tl("backToRegister")}
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
                <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 md:p-12 space-y-8">

                    {/* What Are Cookies */}
                    <section id="what">
                        <SectionTitle>{t("whatCookies")}</SectionTitle>
                        <InfoBox variant="info">
                            <p className="text-sm">{t("whatCookiesDesc")}</p>
                        </InfoBox>
                    </section>

                    {/* How We Use */}
                    <section id="how">
                        <SectionTitle>{t("howWeUse")}</SectionTitle>
                        <Para>{t("howWeUseDesc")}</Para>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { icon: "login", label: "Authentication" },
                                { icon: "language", label: "Language" },
                                { icon: "monitoring", label: "Analytics" },
                            ].map((item) => (
                                <div key={item.icon} className="flex items-center gap-3 bg-primary/5 rounded-xl p-4">
                                    <span className="material-symbols-outlined text-primary text-2xl">{item.icon}</span>
                                    <p className="font-bold text-on-surface text-sm">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Types of Cookies */}
                    <section id="types">
                        <SectionTitle>{t("typesOfCookies")}</SectionTitle>
                        <div className="space-y-4">
                            {cookieTypeConfig.map(({ key, icon, color, borderColor }) => (
                                <div key={key} className={`rounded-xl border-l-4 ${borderColor} p-5 ${color.split(" ").slice(0, 1).join(" ")}`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${color} flex-shrink-0`}>
                                            <span className="material-symbols-outlined text-xl">{icon}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-on-surface font-headline">{t(`type_${key}`)}</h3>
                                            <p className="text-on-surface-variant leading-relaxed mt-1 text-sm">{t(`type_${key}Desc`)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Managing Cookies */}
                    <section id="manage">
                        <SectionTitle>{t("manageCookies")}</SectionTitle>
                        <Para>{t("manageCookiesDesc")}</Para>
                        <InfoBox variant="warning">
                            <BulletList items={[
                                "Chrome: Settings → Privacy and Security → Cookies",
                                "Firefox: Settings → Privacy & Security → Cookies",
                                "Safari: Preferences → Privacy → Manage Website Data",
                                "Edge: Settings → Cookies and site permissions",
                            ]} />
                        </InfoBox>
                    </section>

                    {/* Contact */}
                    <section>
                        <SectionTitle>{t("contact")}</SectionTitle>
                        <div className="overflow-x-auto rounded-xl border border-black/10">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-primary/5">
                                        <th className="text-left p-3 font-bold text-on-surface">Channel</th>
                                        <th className="text-left p-3 font-bold text-on-surface">Detail</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5">
                                    <tr className="bg-white">
                                        <td className="p-3 text-on-surface font-semibold">Email</td>
                                        <td className="p-3 text-on-surface-variant">
                                            <a href="mailto:support@dokaniai.com" className="text-primary hover:underline">support@dokaniai.com</a>
                                        </td>
                                    </tr>
                                    <tr className="bg-primary/[0.02]">
                                        <td className="p-3 text-on-surface font-semibold">Hotline</td>
                                        <td className="p-3 text-on-surface-variant">+880 1822-679672</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Footer note */}
                    <div className="pt-8 border-t border-black/5 text-center space-y-2">
                        <p className="text-sm text-on-surface-variant">{t("lastUpdated")}</p>
                        <p className="font-bold text-primary font-headline">DokaniAI — AI-চালিত ডিজিটাল হিসাব ব্যবস্থা</p>
                        <p className="text-sm text-on-surface-variant">© 2026 DokaniAI. {tl("footer.copyright")}</p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-surface-container-low w-full mt-20">
                <div className="px-6 py-8 max-w-7xl mx-auto text-center">
                    <p className="text-sm text-on-surface-variant">
                        © 2026 DokaniAI. {tl("footer.copyright")}
                    </p>
                </div>
            </footer>
        </div>
    );
}