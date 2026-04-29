"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h2 className="text-2xl font-black text-primary font-headline pt-8 first:pt-0">{children}</h2>;
}

function SubTitle({ children }: { children: React.ReactNode }) {
    return <h3 className="text-lg font-bold text-on-surface font-headline">{children}</h3>;
}

function Para({ children }: { children: React.ReactNode }) {
    return <p className="text-on-surface-variant leading-relaxed">{children}</p>;
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

function CheckList({ items }: { items: React.ReactNode[] }) {
    return (
        <ul className="space-y-2 pl-4">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-on-surface-variant">
                    <span className="text-green-600 mt-1 flex-shrink-0">✓</span>
                    <span className="leading-relaxed">{item}</span>
                </li>
            ))}
        </ul>
    );
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

function PartBadge({ icon, label, color }: { icon: string; label: string; color: string }) {
    const colorClasses: Record<string, string> = {
        green: "bg-green-100 text-green-700",
        blue: "bg-blue-100 text-blue-700",
        amber: "bg-amber-100 text-amber-700",
        red: "bg-red-100 text-red-700",
        purple: "bg-purple-100 text-purple-700",
    };
    return (
        <div className="pb-6 border-b border-black/5 pt-4">
            <div className={`inline-flex items-center gap-2 ${colorClasses[color]} px-4 py-1.5 rounded-full text-sm font-bold`}>
                <span className="material-symbols-outlined text-base">{icon}</span>
                {label}
            </div>
        </div>
    );
}

export default function AIPolicyPage() {
    const t = useTranslations("shop.legal");

    return (
        <div className="min-h-screen bg-background text-on-background font-body selection:bg-primary-fixed overflow-x-hidden">
            {/* Hero Header */}
            <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #003727 0%, #001a12 100%)" }}>
                <div className="max-w-7xl mx-auto px-6 py-16 sm:py-20 text-center">
                    <span className="material-symbols-outlined text-5xl text-primary-container mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>
                        smart_toy
                    </span>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-headline leading-tight">
                        {t("aiPolicy.title")}
                    </h1>
                    <p className="mt-4 text-white/60 text-sm">{t("aiPolicy.lastUpdated")}</p>
                    <div className="flex flex-wrap justify-center gap-3 mt-8">
                        {[
                            { href: "#overview", label: t("aiPolicy.intro.title"), icon: "info" },
                            { href: "#data-handling", label: t("aiPolicy.dataHandling.title"), icon: "shield" },
                            { href: "#rights", label: t("aiPolicy.rights.title"), icon: "verified_user" },
                            { href: "#faq", label: t("aiPolicy.faq.title"), icon: "help" },
                        ].map((tab) => (
                            <Link key={tab.href} href={tab.href} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/80 text-sm font-semibold hover:bg-white/20 hover:text-white transition-all">
                                <span className="material-symbols-outlined text-base">{tab.icon}</span>
                                {tab.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Nav Bar */}
            <nav className="bg-[#f7faf6]/80 backdrop-blur-md border-b border-black/5 sticky top-0 z-50 w-full">
                <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
                    <Link href="/" className="text-2xl font-black text-primary tracking-tight hover:opacity-80 transition-opacity font-headline">DokaniAI</Link>
                    <div className="flex items-center gap-4 sm:gap-6">
                        <Link href="/legal/terms" className="text-on-surface-variant hover:text-primary font-semibold text-sm hidden sm:inline">{t("tabs.terms")}</Link>
                        <Link href="/legal/privacy" className="text-on-surface-variant hover:text-primary font-semibold text-sm hidden sm:inline">{t("tabs.privacy")}</Link>
                        <Link href="/legal/payment" className="text-on-surface-variant hover:text-primary font-semibold text-sm hidden sm:inline">{t("payment.title")}</Link>
                        <Link href="/legal/cookies" className="text-on-surface-variant hover:text-primary font-semibold text-sm hidden sm:inline">{t("home.footer.cookies")}</Link>
                        <Link href="/register" className="text-on-surface-variant hover:text-primary font-semibold text-sm">{t("backToRegister")}</Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
                <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 md:p-12 space-y-8">

                    {/* PART 1: OVERVIEW */}
                    <PartBadge icon="info" label={t("aiPolicy.part1Badge")} color="blue" />
                    <section id="overview">
                        <SectionTitle>{t("aiPolicy.intro.title")}</SectionTitle>
                        <Para>{t("aiPolicy.intro.p1")}</Para>
                        <Para>{t("aiPolicy.intro.p2")}</Para>
                        <SubTitle>{t("aiPolicy.features.title")}</SubTitle>
                        <BulletList items={[
                            t("aiPolicy.features.voice"),
                            t("aiPolicy.features.text"),
                            t("aiPolicy.features.chatbot"),
                            t("aiPolicy.features.insights"),
                            t("aiPolicy.features.suggestions"),
                        ]} />
                    </section>

                    {/* How AI Works */}
                    <SectionTitle>{t("aiPolicy.howItWorks.title")}</SectionTitle>
                    <Para>{t("aiPolicy.howItWorks.p1")}</Para>
                    <InfoBox variant="success">
                        <p className="font-bold text-sm">{t("aiPolicy.howItWorks.rag.title")}</p>
                        <p className="text-sm mt-1">{t("aiPolicy.howItWorks.rag.desc")}</p>
                    </InfoBox>
                    <div className="mt-4" />
                    <BulletList items={[
                        t("aiPolicy.howItWorks.rag.b1"),
                        t("aiPolicy.howItWorks.rag.b2"),
                        t("aiPolicy.howItWorks.rag.b3"),
                        t("aiPolicy.howItWorks.rag.b4"),
                    ]} />

                    {/* PART 2: DATA HANDLING */}
                    <PartBadge icon="shield" label={t("aiPolicy.part2Badge")} color="green" />
                    <section id="data-handling">
                        <SectionTitle>{t("aiPolicy.dataHandling.title")}</SectionTitle>
                        <SubTitle>{t("aiPolicy.dataHandling.sees.title")}</SubTitle>
                        <CheckList items={[
                            t("aiPolicy.dataHandling.sees.p1"),
                            t("aiPolicy.dataHandling.sees.p2"),
                            t("aiPolicy.dataHandling.sees.p3"),
                            t("aiPolicy.dataHandling.sees.p4"),
                        ]} />
                        <SubTitle>{t("aiPolicy.dataHandling.neverSees.title")}</SubTitle>
                        <InfoBox variant="warning">
                            <BulletList items={[
                                t("aiPolicy.dataHandling.neverSees.p1"),
                                t("aiPolicy.dataHandling.neverSees.p2"),
                                t("aiPolicy.dataHandling.neverSees.p3"),
                                t("aiPolicy.dataHandling.neverSees.p4"),
                                t("aiPolicy.dataHandling.neverSees.p5"),
                            ]} />
                        </InfoBox>
                    </section>

                    {/* Providers */}
                    <SectionTitle>{t("aiPolicy.providers.title")}</SectionTitle>
                    <Para>{t("aiPolicy.providers.desc")}</Para>
                    <div className="overflow-x-auto rounded-xl border border-black/10">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-primary/5">
                                    <th className="text-left p-3 font-bold text-on-surface">{t("aiPolicy.providers.colProvider")}</th>
                                    <th className="text-left p-3 font-bold text-on-surface">{t("aiPolicy.providers.colPurpose")}</th>
                                    <th className="text-left p-3 font-bold text-on-surface">{t("aiPolicy.providers.colRetention")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                <tr className="bg-white">
                                    <td className="p-3 font-semibold text-on-surface">Z.ai (GLM-4)</td>
                                    <td className="p-3 text-on-surface-variant">{t("aiPolicy.providers.zai.purpose")}</td>
                                    <td className="p-3 text-on-surface-variant">{t("aiPolicy.providers.zai.retention")}</td>
                                </tr>
                                <tr className="bg-primary/[0.02]">
                                    <td className="p-3 font-semibold text-on-surface">Google Gemini</td>
                                    <td className="p-3 text-on-surface-variant">{t("aiPolicy.providers.gemini.purpose")}</td>
                                    <td className="p-3 text-on-surface-variant">{t("aiPolicy.providers.gemini.retention")}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <Para>{t("aiPolicy.providers.noShare")}</Para>

                    {/* Retention */}
                    <SectionTitle>{t("aiPolicy.retention.title")}</SectionTitle>
                    <div className="overflow-x-auto rounded-xl border border-black/10">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-primary/5">
                                    <th className="text-left p-3 font-bold text-on-surface">{t("aiPolicy.retention.colType")}</th>
                                    <th className="text-left p-3 font-bold text-on-surface">{t("aiPolicy.retention.colPeriod")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                <tr className="bg-white"><td className="p-3 text-on-surface">{t("aiPolicy.retention.voice")}</td><td className="p-3 font-semibold text-green-700">{t("aiPolicy.retention.voicePeriod")}</td></tr>
                                <tr className="bg-primary/[0.02]"><td className="p-3 text-on-surface">{t("aiPolicy.retention.aiContext")}</td><td className="p-3 text-on-surface-variant">{t("aiPolicy.retention.aiContextPeriod")}</td></tr>
                                <tr className="bg-white"><td className="p-3 text-on-surface">{t("aiPolicy.retention.queryLog")}</td><td className="p-3 text-on-surface-variant">{t("aiPolicy.retention.queryLogPeriod")}</td></tr>
                                <tr className="bg-primary/[0.02]"><td className="p-3 text-on-surface">{t("aiPolicy.retention.businessData")}</td><td className="p-3 text-on-surface-variant">{t("aiPolicy.retention.businessDataPeriod")}</td></tr>
                            </tbody>
                        </table>
                    </div>

                    {/* PART 3: SAFETY & RIGHTS */}
                    <PartBadge icon="verified_user" label={t("aiPolicy.part3Badge")} color="amber" />
                    <section id="rights">
                        <SectionTitle>{t("aiPolicy.safety.title")}</SectionTitle>
                        <SubTitle>{t("aiPolicy.safety.training.title")}</SubTitle>
                        <InfoBox variant="success">
                            <p className="font-bold text-sm">{t("aiPolicy.safety.training.answer")}</p>
                            <p className="text-sm mt-1">{t("aiPolicy.safety.training.desc")}</p>
                        </InfoBox>
                        <SubTitle>{t("aiPolicy.safety.fairness.title")}</SubTitle>
                        <BulletList items={[
                            t("aiPolicy.safety.fairness.p1"),
                            t("aiPolicy.safety.fairness.p2"),
                            t("aiPolicy.safety.fairness.p3"),
                        ]} />
                        <SubTitle>{t("aiPolicy.safety.accuracy.title")}</SubTitle>
                        <InfoBox variant="warning">
                            <p className="text-sm font-bold">{t("aiPolicy.safety.accuracy.p1")}</p>
                            <BulletList items={[
                                t("aiPolicy.safety.accuracy.p2"),
                                t("aiPolicy.safety.accuracy.p3"),
                                t("aiPolicy.safety.accuracy.p4"),
                            ]} />
                        </InfoBox>
                        <SectionTitle>{t("aiPolicy.rights.title")}</SectionTitle>
                        <CheckList items={[
                            t("aiPolicy.rights.p1"),
                            t("aiPolicy.rights.p2"),
                            t("aiPolicy.rights.p3"),
                            t("aiPolicy.rights.p4"),
                            t("aiPolicy.rights.p5"),
                        ]} />
                    </section>

                    {/* PART 4: LEGAL & FAQ */}
                    <PartBadge icon="gavel" label={t("aiPolicy.part4Badge")} color="purple" />
                    <SectionTitle>{t("aiPolicy.generated.title")}</SectionTitle>
                    <BulletList items={[
                        t("aiPolicy.generated.p1"),
                        t("aiPolicy.generated.p2"),
                        t("aiPolicy.generated.p3"),
                    ]} />

                    <SectionTitle>{t("aiPolicy.children.title")}</SectionTitle>
                    <Para>{t("aiPolicy.children.desc")}</Para>

                    <SectionTitle>{t("aiPolicy.changes.title")}</SectionTitle>
                    <BulletList items={[
                        t("aiPolicy.changes.p1"),
                        t("aiPolicy.changes.p2"),
                        t("aiPolicy.changes.p3"),
                    ]} />

                    {/* Related Policies */}
                    <SectionTitle>{t("aiPolicy.related.title")}</SectionTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { href: "/legal/privacy", icon: "privacy_tip", label: t("tabs.privacy"), desc: t("aiPolicy.related.privacy") },
                            { href: "/legal/terms", icon: "gavel", label: t("tabs.terms"), desc: t("aiPolicy.related.terms") },
                            { href: "/legal/payment", icon: "payments", label: t("payment.title"), desc: t("aiPolicy.related.payment") },
                            { href: "/legal/cookies", icon: "cookie", label: t("home.footer.cookies"), desc: t("aiPolicy.related.cookies") },
                        ].map((link) => (
                            <Link key={link.href} href={link.href} className="flex items-start gap-3 bg-primary/5 rounded-xl p-4 hover:bg-primary/10 transition-colors">
                                <span className="material-symbols-outlined text-primary text-2xl">{link.icon}</span>
                                <div>
                                    <p className="font-bold text-on-surface">{link.label}</p>
                                    <p className="text-xs text-on-surface-variant">{link.desc}</p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* FAQ */}
                    <section id="faq">
                        <SectionTitle>{t("aiPolicy.faq.title")}</SectionTitle>
                        {["q1", "q2", "q3", "q4", "q5", "q6"].map((q) => (
                            <div key={q} className="mb-4">
                                <SubTitle>{t(`aiPolicy.faq.${q}.q`)}</SubTitle>
                                <Para>{t(`aiPolicy.faq.${q}.a`)}</Para>
                            </div>
                        ))}
                    </section>

                    {/* Contact */}
                    <SectionTitle>{t("aiPolicy.contact.title")}</SectionTitle>
                    <Para>{t("aiPolicy.contact.desc")}</Para>
                    <div className="overflow-x-auto rounded-xl border border-black/10">
                        <table className="w-full text-sm">
                            <thead><tr className="bg-primary/5"><th className="text-left p-3 font-bold text-on-surface">{t("payment.contact.subject")}</th><th className="text-left p-3 font-bold text-on-surface">{t("payment.contact.detail")}</th></tr></thead>
                            <tbody className="divide-y divide-black/5">
                                <tr className="bg-white"><td className="p-3 text-on-surface">{t("aiPolicy.contact.email")}</td><td className="p-3 text-on-surface-variant">support@dokaniai.com</td></tr>
                                <tr className="bg-primary/[0.02]"><td className="p-3 text-on-surface">{t("aiPolicy.contact.phone")}</td><td className="p-3 text-on-surface-variant">+880 1822-679672</td></tr>
                                <tr className="bg-white"><td className="p-3 text-on-surface">{t("aiPolicy.contact.address")}</td><td className="p-3 text-on-surface-variant">Dhaka, Bangladesh</td></tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="pt-8 border-t border-black/5 text-center space-y-2">
                        <p className="text-sm text-on-surface-variant">{t("aiPolicy.lastUpdated")}</p>
                        <p className="font-bold text-primary font-headline">DokaniAI — AI-চালিত ডিজিটাল হিসাব ব্যবস্থা</p>
                        <p className="text-sm text-on-surface-variant">© 2026 DokaniAI. {t("footer.copyright")}</p>
                    </div>
                </div>
            </main>

            <footer className="bg-surface-container-low w-full mt-20">
                <div className="px-6 py-8 max-w-7xl mx-auto text-center">
                    <p className="text-sm text-on-surface-variant">© 2026 DokaniAI. {t("footer.copyright")}</p>
                </div>
            </footer>
        </div>
    );
}