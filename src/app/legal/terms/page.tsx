"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

/* ─── Shared sub-components ─── */

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

function StepCard({ number, title, desc }: { number: string; title: string; desc: string }) {
    return (
        <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                {number}
            </div>
            <div>
                <p className="font-bold text-on-surface">{title}</p>
                <p className="text-on-surface-variant text-sm leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}

function PartBadge({ icon, label, color }: { icon: string; label: string; color: string }) {
    const colorClasses: Record<string, string> = {
        green: "bg-green-100 text-green-700",
        blue: "bg-blue-100 text-blue-700",
        amber: "bg-amber-100 text-amber-700",
        red: "bg-red-100 text-red-700",
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

export default function TermsPage() {
    const t = useTranslations("shop.legal");

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
                        gavel
                    </span>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-headline leading-tight">
                        {t("tabs.terms")}
                    </h1>
                    <p className="mt-4 text-white/60 text-sm">{t("lastUpdated")}</p>

                    {/* Quick nav */}
                    <div className="flex flex-wrap justify-center gap-3 mt-8">
                        {[
                            { href: "#general", label: t("terms.part1Badge"), icon: "handshake" },
                            { href: "#subscription", label: t("terms.part2Badge"), icon: "card_membership" },
                            { href: "#rights", label: t("terms.part3Badge"), icon: "shield" },
                            { href: "#legal", label: t("terms.part4Badge"), icon: "balance" },
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
                        <Link href="/legal/privacy" className="text-on-surface-variant hover:text-primary font-semibold text-sm hidden sm:inline">
                            {t("tabs.privacy")}
                        </Link>
                        <Link href="/legal/payment" className="text-on-surface-variant hover:text-primary font-semibold text-sm hidden sm:inline">
                            {t("payment.title")}
                        </Link>
                        <Link href="/legal/cookies" className="text-on-surface-variant hover:text-primary font-semibold text-sm hidden sm:inline">
                            {t("home.footer.cookies")}
                        </Link>
                        <Link href="/register" className="text-on-surface-variant hover:text-primary font-semibold text-sm">
                            {t("backToRegister")}
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
                <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 md:p-12 space-y-8">

                    {/* ═══════ PART 1: GENERAL ═══════ */}
                    <PartBadge icon="handshake" label={t("terms.part1Badge")} color="green" />

                    {/* 1. Introduction */}
                    <section id="general">
                        <SectionTitle>{t("terms.intro.title")}</SectionTitle>
                        <InfoBox variant="info">
                            <p className="text-sm">{t("terms.intro.service.desc")}</p>
                        </InfoBox>
                        <div className="mt-4" />
                        <SubTitle>{t("terms.intro.acceptance.title")}</SubTitle>
                        <Para>{t("terms.intro.acceptance.desc")}</Para>
                    </section>

                    {/* 2. Account */}
                    <SectionTitle>{t("terms.account.title")}</SectionTitle>
                    <SubTitle>{t("terms.account.create.title")}</SubTitle>

                    {/* Account Creation Steps */}
                    <div className="space-y-4 bg-primary/[0.03] rounded-xl p-6">
                        <StepCard number="1" title={t("terms.account.create.p1")} desc="" />
                        <StepCard number="2" title={t("terms.account.create.p2")} desc="" />
                        <StepCard number="3" title={t("terms.account.create.p3")} desc="" />
                    </div>

                    <SubTitle>{t("terms.account.deactivate.title")}</SubTitle>
                    <BulletList items={[
                        t("terms.account.deactivate.p1"),
                        t("terms.account.deactivate.p2"),
                        t("terms.account.deactivate.p3"),
                        t("terms.account.deactivate.p4"),
                    ]} />

                    <SubTitle>{t("terms.account.delete.title")}</SubTitle>
                    <InfoBox variant="warning">
                        <p className="text-sm">{t("terms.account.delete.desc")}</p>
                    </InfoBox>

                    {/* ═══════ PART 2: SUBSCRIPTION & AI ═══════ */}
                    <PartBadge icon="card_membership" label={t("terms.part2Badge")} color="blue" />

                    {/* 3. Subscription */}
                    <section id="subscription">
                        <SectionTitle>{t("terms.subscription.title")}</SectionTitle>
                        <SubTitle>{t("terms.subscription.plans.title")}</SubTitle>
                        <CheckList items={[
                            t("terms.subscription.plans.p1"),
                            t("terms.subscription.plans.p2"),
                            t("terms.subscription.plans.p3"),
                        ]} />

                        <SubTitle>{t("terms.subscription.payment.title")}</SubTitle>
                        <BulletList items={[
                            t("terms.subscription.payment.p1"),
                            t("terms.subscription.payment.p2"),
                            t("terms.subscription.payment.p3"),
                        ]} />

                        <SubTitle>{t("terms.subscription.refund.title")}</SubTitle>
                        <BulletList items={[
                            t("terms.subscription.refund.p1"),
                            t("terms.subscription.refund.p2"),
                            t("terms.subscription.refund.p3"),
                        ]} />

                        <SubTitle>{t("terms.subscription.cancel.title")}</SubTitle>
                        <BulletList items={[
                            t("terms.subscription.cancel.p1"),
                            t("terms.subscription.cancel.p2"),
                            t("terms.subscription.cancel.p3"),
                        ]} />
                    </section>

                    {/* 4. AI */}
                    <SectionTitle>{t("terms.ai.title")}</SectionTitle>
                    <SubTitle>{t("terms.ai.accuracy.title")}</SubTitle>
                    <InfoBox variant="warning">
                        <p className="font-bold text-sm">{t("terms.ai.accuracy.p1")}</p>
                        <div className="mt-2" />
                        <BulletList items={[
                            t("terms.ai.accuracy.p2"),
                            t("terms.ai.accuracy.p3"),
                            t("terms.ai.accuracy.p4"),
                        ]} />
                    </InfoBox>

                    <SubTitle>{t("terms.ai.voice.title")}</SubTitle>
                    <BulletList items={[
                        t("terms.ai.voice.p1"),
                        t("terms.ai.voice.p2"),
                        t("terms.ai.voice.p3"),
                    ]} />

                    <SubTitle>{t("terms.ai.limits.title")}</SubTitle>
                    <BulletList items={[
                        t("terms.ai.limits.p1"),
                        t("terms.ai.limits.p2"),
                        t("terms.ai.limits.p3"),
                    ]} />

                    <SubTitle>{t("terms.ai.providers.title")}</SubTitle>
                    <BulletList items={[
                        t("terms.ai.providers.p1"),
                        t("terms.ai.providers.p2"),
                        t("terms.ai.providers.p3"),
                    ]} />
                    <Para>{t("terms.ai.providers.note")}</Para>

                    <SubTitle>{t("terms.ai.changes.title")}</SubTitle>
                    <BulletList items={[
                        t("terms.ai.changes.p1"),
                        t("terms.ai.changes.p2"),
                        t("terms.ai.changes.p3"),
                    ]} />

                    <SubTitle>{t("terms.ai.training.title")}</SubTitle>
                    <BulletList items={[
                        t("terms.ai.training.p1"),
                        t("terms.ai.training.p2"),
                        t("terms.ai.training.p3"),
                    ]} />

                    {/* ═══════ PART 3: RIGHTS & RESPONSIBILITIES ═══════ */}
                    <PartBadge icon="shield" label={t("terms.part3Badge")} color="amber" />

                    {/* 5. Responsibilities */}
                    <section id="rights">
                        <SectionTitle>{t("terms.responsibilities.title")}</SectionTitle>
                        <SubTitle>{t("terms.responsibilities.usage.title")}</SubTitle>
                        <CheckList items={[
                            t("terms.responsibilities.usage.p1"),
                            t("terms.responsibilities.usage.p2"),
                            t("terms.responsibilities.usage.p3"),
                            t("terms.responsibilities.usage.p4"),
                            t("terms.responsibilities.usage.p5"),
                        ]} />

                        <SubTitle>{t("terms.responsibilities.ownership.title")}</SubTitle>
                        <BulletList items={[
                            t("terms.responsibilities.ownership.p1"),
                            t("terms.responsibilities.ownership.p2"),
                            t("terms.responsibilities.ownership.p3"),
                        ]} />
                    </section>

                    {/* 6. IP */}
                    <SectionTitle>{t("terms.ip.title")}</SectionTitle>
                    <SubTitle>{t("terms.ip.dokaniai.title")}</SubTitle>
                    <BulletList items={[
                        t("terms.ip.dokaniai.p1"),
                        t("terms.ip.dokaniai.p2"),
                    ]} />

                    <SubTitle>{t("terms.ip.user.title")}</SubTitle>
                    <BulletList items={[
                        t("terms.ip.user.p1"),
                        t("terms.ip.user.p2"),
                    ]} />

                    {/* 7. Service Changes */}
                    <SectionTitle>{t("terms.serviceChanges.title")}</SectionTitle>
                    <SubTitle>{t("terms.serviceChanges.changeTitle")}</SubTitle>
                    <BulletList items={[
                        t("terms.serviceChanges.changeP1"),
                        t("terms.serviceChanges.changeP2"),
                    ]} />

                    <SubTitle>{t("terms.serviceChanges.suspendTitle")}</SubTitle>
                    <InfoBox variant="warning">
                        <BulletList items={[
                            t("terms.serviceChanges.suspendP1"),
                            t("terms.serviceChanges.suspendP2"),
                            t("terms.serviceChanges.suspendP3"),
                        ]} />
                    </InfoBox>

                    {/* ═══════ PART 4: LEGAL ═══════ */}
                    <PartBadge icon="balance" label={t("terms.part4Badge")} color="red" />

                    {/* 8. Liability */}
                    <section id="legal">
                        <SectionTitle>{t("terms.liability.title")}</SectionTitle>
                        <SubTitle>{t("terms.liability.asis.title")}</SubTitle>
                        <InfoBox variant="info">
                            <BulletList items={[
                                t("terms.liability.asis.p1"),
                                t("terms.liability.asis.p2"),
                            ]} />
                        </InfoBox>

                        <SubTitle>{t("terms.liability.limit.title")}</SubTitle>
                        <BulletList items={[
                            t("terms.liability.limit.p1"),
                            t("terms.liability.limit.p2"),
                            t("terms.liability.limit.p3"),
                            t("terms.liability.limit.p4"),
                            t("terms.liability.limit.p5"),
                        ]} />

                        <SubTitle>{t("terms.liability.max.title")}</SubTitle>
                        <BulletList items={[
                            t("terms.liability.max.p1"),
                            t("terms.liability.max.p2"),
                        ]} />
                    </section>

                    {/* 9. Indemnification */}
                    <SectionTitle>{t("terms.indemnification.title")}</SectionTitle>
                    <Para>{t("terms.indemnification.desc")}</Para>
                    <BulletList items={[
                        t("terms.indemnification.p1"),
                        t("terms.indemnification.p2"),
                        t("terms.indemnification.p3"),
                    ]} />

                    {/* 10. Dispute */}
                    <SectionTitle>{t("terms.dispute.title")}</SectionTitle>
                    <div className="space-y-4 bg-primary/[0.03] rounded-xl p-6">
                        <StepCard number="1" title={t("terms.dispute.p1")} desc="" />
                        <StepCard number="2" title={t("terms.dispute.p2")} desc="" />
                        <StepCard number="3" title={t("terms.dispute.p3")} desc="" />
                    </div>

                    {/* 11. General */}
                    <SectionTitle>{t("terms.general.title")}</SectionTitle>
                    <BulletList items={[
                        t("terms.general.p1"),
                        t("terms.general.p2"),
                        t("terms.general.p3"),
                        t("terms.general.p4"),
                    ]} />

                    {/* 12. Contact */}
                    <SectionTitle>{t("terms.contact.title")}</SectionTitle>
                    <div className="overflow-x-auto rounded-xl border border-black/10">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-primary/5">
                                    <th className="text-left p-3 font-bold text-on-surface">{t("payment.contact.subject")}</th>
                                    <th className="text-left p-3 font-bold text-on-surface">{t("payment.contact.detail")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                <tr className="bg-white">
                                    <td className="p-3 text-on-surface">{t("terms.contact.email")}</td>
                                    <td className="p-3 text-on-surface-variant">support@dokaniai.com</td>
                                </tr>
                                <tr className="bg-primary/[0.02]">
                                    <td className="p-3 text-on-surface">{t("terms.contact.phone")}</td>
                                    <td className="p-3 text-on-surface-variant">+880 1822-679672</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="p-3 text-on-surface">{t("terms.contact.address")}</td>
                                    <td className="p-3 text-on-surface-variant">Dhaka, Bangladesh</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Footer note */}
                    <div className="pt-8 border-t border-black/5 text-center space-y-2">
                        <p className="text-sm text-on-surface-variant">{t("lastUpdated")}</p>
                        <p className="font-bold text-primary font-headline">DokaniAI — AI-চালিত ডিজিটাল হিসাব ব্যবস্থা</p>
                        <p className="text-sm text-on-surface-variant">© 2026 DokaniAI. {t("footer.copyright")}</p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-surface-container-low w-full mt-20">
                <div className="px-6 py-8 max-w-7xl mx-auto text-center">
                    <p className="text-sm text-on-surface-variant">
                        © 2026 DokaniAI. {t("footer.copyright")}
                    </p>
                </div>
            </footer>
        </div>
    );
}