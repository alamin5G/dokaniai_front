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

function InfoTable({ rows }: { rows: { cols: string[] }[] }) {
    return (
        <div className="overflow-x-auto rounded-xl bg-surface-container-low">
            <table className="w-full text-sm">
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} className={i > 0 ? "border-t border-outline-variant/10" : ""}>
                            {row.cols.map((col, j) => (
                                <td key={j} className={`px-4 py-3 ${j === 0 ? "font-bold text-on-surface" : "text-on-surface-variant"}`}>
                                    {col}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function PrivacyPage() {
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
                        <Link href="/legal/terms" className="text-on-surface-variant hover:text-primary font-semibold text-sm">
                            {t("tabs.terms")}
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
                        <h1 className="text-4xl font-black text-primary font-headline">{t("tabs.privacy")}</h1>
                    </div>
                    <p className="text-on-surface-variant ml-8">{t("lastUpdated")}</p>
                </div>

                {/* Content */}
                <div className="bg-surface-container-lowest rounded-2xl p-8 md:p-12 space-y-8">
                    {/* 1. Introduction */}
                    <SectionTitle>{t("privacy.intro.title")}</SectionTitle>
                    <SubTitle>{t("privacy.intro.purpose.title")}</SubTitle>
                    <Para>{t("privacy.intro.purpose.desc")}</Para>
                    <SubTitle>{t("privacy.intro.scope.title")}</SubTitle>
                    <BulletList items={[
                        t("privacy.intro.scope.p1"),
                        t("privacy.intro.scope.p2"),
                        t("privacy.intro.scope.p3"),
                        t("privacy.intro.scope.p4"),
                    ]} />

                    {/* 2. Collection */}
                    <SectionTitle>{t("privacy.collection.title")}</SectionTitle>
                    <SubTitle>{t("privacy.collection.auto.title")}</SubTitle>
                    <InfoTable rows={[
                        { cols: [t("privacy.collection.auto.type"), t("privacy.collection.auto.example"), t("privacy.collection.auto.method")] },
                        { cols: [t("privacy.collection.auto.account"), t("privacy.collection.auto.accountEx"), t("privacy.collection.auto.registration")] },
                        { cols: [t("privacy.collection.auto.device"), t("privacy.collection.auto.deviceEx"), t("privacy.collection.auto.automatic")] },
                        { cols: [t("privacy.collection.auto.usage"), t("privacy.collection.auto.usageEx"), t("privacy.collection.auto.automatic")] },
                        { cols: [t("privacy.collection.auto.location"), t("privacy.collection.auto.locationEx"), t("privacy.collection.auto.fromIp")] },
                    ]} />
                    <SubTitle>{t("privacy.collection.user.title")}</SubTitle>
                    <BulletList items={[
                        t("privacy.collection.user.business"),
                        t("privacy.collection.user.sales"),
                        t("privacy.collection.user.stock"),
                        t("privacy.collection.user.due"),
                        t("privacy.collection.user.expense"),
                    ]} />
                    <SubTitle>{t("privacy.collection.voice.title")}</SubTitle>
                    <InfoTable rows={[
                        { cols: [t("privacy.collection.voice.type"), t("privacy.collection.voice.collect"), t("privacy.collection.voice.use")] },
                        { cols: [t("privacy.collection.voice.recording"), t("privacy.collection.voice.voiceInput"), t("privacy.collection.voice.toText")] },
                        { cols: [t("privacy.collection.voice.metadata"), t("privacy.collection.voice.auto"), t("privacy.collection.voice.service")] },
                    ]} />
                    <Para>{t("privacy.collection.voice.note")}</Para>

                    {/* 3. Usage */}
                    <SectionTitle>{t("privacy.usage.title")}</SectionTitle>
                    <SubTitle>{t("privacy.usage.service.title")}</SubTitle>
                    <BulletList items={[
                        t("privacy.usage.service.p1"),
                        t("privacy.usage.service.p2"),
                        t("privacy.usage.service.p3"),
                        t("privacy.usage.service.p4"),
                    ]} />
                    <SubTitle>{t("privacy.usage.improve.title")}</SubTitle>
                    <BulletList items={[
                        t("privacy.usage.improve.p1"),
                        t("privacy.usage.improve.p2"),
                        t("privacy.usage.improve.p3"),
                    ]} />
                    <SubTitle>{t("privacy.usage.communicate.title")}</SubTitle>
                    <BulletList items={[
                        t("privacy.usage.communicate.p1"),
                        t("privacy.usage.communicate.p2"),
                        t("privacy.usage.communicate.p3"),
                    ]} />
                    <SubTitle>{t("privacy.usage.security.title")}</SubTitle>
                    <BulletList items={[
                        t("privacy.usage.security.p1"),
                        t("privacy.usage.security.p2"),
                        t("privacy.usage.security.p3"),
                    ]} />

                    {/* 4. Sharing */}
                    <SectionTitle>{t("privacy.sharing.title")}</SectionTitle>
                    <InfoTable rows={[
                        { cols: [t("privacy.sharing.provider"), t("privacy.sharing.purpose"), t("privacy.sharing.dataType"), t("privacy.sharing.location")] },
                        { cols: ["BanglaSpeech2Text", t("privacy.sharing.voiceToText"), t("privacy.sharing.audioRec"), "বাংলাদেশ"] },
                        { cols: ["GLM-4 (Zhipu AI)", t("privacy.sharing.aiChat"), t("privacy.sharing.textQuery"), "চীন"] },
                        { cols: ["Google Gemini", t("privacy.sharing.altAi"), t("privacy.sharing.textQuery"), "USA/সিঙ্গাপুর"] },
                    ]} />
                    <Para>{t("privacy.sharing.paymentNote")}</Para>
                    <Para>{t("privacy.sharing.legalNote")}</Para>
                    <BulletList items={[
                        t("privacy.sharing.noSell"),
                        t("privacy.sharing.noShare"),
                    ]} />

                    {/* 5. Storage */}
                    <SectionTitle>{t("privacy.storage.title")}</SectionTitle>
                    <InfoTable rows={[
                        { cols: [t("privacy.storage.dataType"), t("privacy.storage.retention")] },
                        { cols: [t("privacy.storage.account"), t("privacy.storage.accountRet")] },
                        { cols: [t("privacy.storage.salesData"), t("privacy.storage.salesRet")] },
                        { cols: [t("privacy.storage.voiceRec"), t("privacy.storage.voiceRet")] },
                        { cols: [t("privacy.storage.aiConv"), t("privacy.storage.aiConvRet")] },
                        { cols: [t("privacy.storage.activityLog"), t("privacy.storage.activityRet")] },
                        { cols: [t("privacy.storage.auditLog"), t("privacy.storage.auditRet")] },
                    ]} />
                    <Para>{t("privacy.storage.location")}</Para>
                    <Para>{t("privacy.storage.deletion")}</Para>

                    {/* 6. Security */}
                    <SectionTitle>{t("privacy.security.title")}</SectionTitle>
                    <BulletList items={[
                        t("privacy.security.encryption"),
                        t("privacy.security.dbEncryption"),
                        t("privacy.security.password"),
                        t("privacy.security.access"),
                    ]} />
                    <Para>{t("privacy.security.breach")}</Para>

                    {/* 7. Rights */}
                    <SectionTitle>{t("privacy.rights.title")}</SectionTitle>
                    <BulletList items={[
                        t("privacy.rights.access"),
                        t("privacy.rights.correction"),
                        t("privacy.rights.deletion"),
                        t("privacy.rights.portability"),
                        t("privacy.rights.stopProcessing"),
                    ]} />
                    <Para>{t("privacy.rights.howTo")}</Para>

                    {/* 8. AI Training */}
                    <SectionTitle>{t("privacy.aiTraining.title")}</SectionTitle>
                    <SubTitle>{t("privacy.aiTraining.usedTitle")}</SubTitle>
                    <Para>{t("privacy.aiTraining.usedAnswer")}</Para>
                    <SubTitle>{t("privacy.aiTraining.anonTitle")}</SubTitle>
                    <Para>{t("privacy.aiTraining.anonDesc")}</Para>
                    <BulletList items={[
                        t("privacy.aiTraining.anonP1"),
                        t("privacy.aiTraining.anonP2"),
                        t("privacy.aiTraining.anonP3"),
                    ]} />
                    <SubTitle>{t("privacy.aiTraining.optTitle")}</SubTitle>
                    <Para>{t("privacy.aiTraining.optDesc")}</Para>
                    <Para>{t("privacy.aiTraining.optEmail")}</Para>
                    <Para>{t("privacy.aiTraining.optSubject")}</Para>

                    {/* 10. Children */}
                    <SectionTitle>{t("privacy.children.title")}</SectionTitle>
                    <BulletList items={[
                        t("privacy.children.p1"),
                        t("privacy.children.p2"),
                        t("privacy.children.p3"),
                    ]} />

                    {/* 11. International */}
                    <SectionTitle>{t("privacy.international.title")}</SectionTitle>
                    <BulletList items={[
                        t("privacy.international.p1"),
                        t("privacy.international.p2"),
                        t("privacy.international.p3"),
                    ]} />

                    {/* 12. Changes */}
                    <SectionTitle>{t("privacy.changes.title")}</SectionTitle>
                    <BulletList items={[
                        t("privacy.changes.p1"),
                        t("privacy.changes.p2"),
                        t("privacy.changes.p3"),
                        t("privacy.changes.p4"),
                    ]} />

                    {/* 13. Contact */}
                    <SectionTitle>{t("privacy.contact.title")}</SectionTitle>
                    <Para>{t("privacy.contact.email")}</Para>
                    <Para>{t("privacy.contact.phone")}</Para>
                    <Para>{t("privacy.contact.address")}</Para>
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
