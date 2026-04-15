"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

/* ─── Shared sub-components ─── */

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h2 className="text-2xl font-black text-primary font-headline pt-6 first:pt-0">{children}</h2>;
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

export default function TermsPage() {
    const t = useTranslations("shop.legal");

    return (
        <div className="min-h-screen bg-background text-on-background font-body selection:bg-primary-fixed">
            {/* Header */}
            <nav className="bg-[#f7faf6]/80 backdrop-blur-md border-b border-black/5 sticky top-0 z-50 w-full">
                <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
                    <Link href="/" className="text-2xl font-black text-primary tracking-tight hover:opacity-80 transition-opacity font-headline">
                        DokaniAI
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/legal/privacy" className="text-on-surface-variant hover:text-primary font-semibold text-sm">
                            {t("tabs.privacy")}
                        </Link>
                        <Link href="/register" className="text-on-surface-variant hover:text-primary font-semibold text-sm">
                            {t("backToRegister")}
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-12">
                {/* Page Title */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-2">
                        <Link href="/legal" className="text-on-surface-variant hover:text-primary transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <h1 className="text-4xl font-black text-primary font-headline">{t("tabs.terms")}</h1>
                    </div>
                    <p className="text-on-surface-variant ml-8">{t("lastUpdated")}</p>
                </div>

                {/* Content */}
                <div className="bg-surface-container-lowest rounded-2xl p-8 md:p-12 space-y-8">
                    {/* 1. Introduction */}
                    <SectionTitle>{t("terms.intro.title")}</SectionTitle>
                    <SubTitle>{t("terms.intro.service.title")}</SubTitle>
                    <Para>{t("terms.intro.service.desc")}</Para>
                    <SubTitle>{t("terms.intro.acceptance.title")}</SubTitle>
                    <Para>{t("terms.intro.acceptance.desc")}</Para>

                    {/* 2. Account */}
                    <SectionTitle>{t("terms.account.title")}</SectionTitle>
                    <SubTitle>{t("terms.account.create.title")}</SubTitle>
                    <BulletList items={[
                        t("terms.account.create.p1"),
                        t("terms.account.create.p2"),
                        t("terms.account.create.p3"),
                    ]} />
                    <SubTitle>{t("terms.account.deactivate.title")}</SubTitle>
                    <Para>{t("terms.account.deactivate.desc")}</Para>
                    <BulletList items={[
                        t("terms.account.deactivate.p1"),
                        t("terms.account.deactivate.p2"),
                        t("terms.account.deactivate.p3"),
                        t("terms.account.deactivate.p4"),
                    ]} />
                    <SubTitle>{t("terms.account.delete.title")}</SubTitle>
                    <Para>{t("terms.account.delete.desc")}</Para>

                    {/* 3. Subscription */}
                    <SectionTitle>{t("terms.subscription.title")}</SectionTitle>
                    <SubTitle>{t("terms.subscription.plans.title")}</SubTitle>
                    <BulletList items={[
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

                    {/* 4. AI */}
                    <SectionTitle>{t("terms.ai.title")}</SectionTitle>
                    <SubTitle>{t("terms.ai.accuracy.title")}</SubTitle>
                    <BulletList items={[
                        t("terms.ai.accuracy.p1"),
                        t("terms.ai.accuracy.p2"),
                        t("terms.ai.accuracy.p3"),
                        t("terms.ai.accuracy.p4"),
                    ]} />
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

                    {/* 5. Responsibilities */}
                    <SectionTitle>{t("terms.responsibilities.title")}</SectionTitle>
                    <SubTitle>{t("terms.responsibilities.usage.title")}</SubTitle>
                    <BulletList items={[
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
                    <BulletList items={[
                        t("terms.serviceChanges.suspendP1"),
                        t("terms.serviceChanges.suspendP2"),
                        t("terms.serviceChanges.suspendP3"),
                    ]} />

                    {/* 8. Liability */}
                    <SectionTitle>{t("terms.liability.title")}</SectionTitle>
                    <SubTitle>{t("terms.liability.asis.title")}</SubTitle>
                    <BulletList items={[
                        t("terms.liability.asis.p1"),
                        t("terms.liability.asis.p2"),
                    ]} />
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
                    <BulletList items={[
                        t("terms.dispute.p1"),
                        t("terms.dispute.p2"),
                        t("terms.dispute.p3"),
                    ]} />

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
                    <Para>{t("terms.contact.email")}</Para>
                    <Para>{t("terms.contact.phone")}</Para>
                    <Para>{t("terms.contact.address")}</Para>
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
