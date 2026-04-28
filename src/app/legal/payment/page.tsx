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

export default function PaymentPolicyPage() {
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
                        <h1 className="text-4xl font-black text-primary font-headline">{t("payment.title")}</h1>
                    </div>
                    <p className="text-on-surface-variant ml-8">{t("payment.lastUpdated")}</p>
                </div>

                {/* Content */}
                <div className="bg-surface-container-lowest rounded-2xl p-8 md:p-12 space-y-8">

                    {/* ═══════ PART 1: PAYMENT TERMS ═══════ */}
                    <div className="pb-6 border-b border-black/5">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold mb-4">
                            <span className="material-symbols-outlined text-base">payments</span>
                            {t("payment.part1Badge")}
                        </div>
                    </div>

                    {/* 1. General */}
                    <SectionTitle>{t("payment.general.title")}</SectionTitle>
                    <SubTitle>{t("payment.general.system.title")}</SubTitle>
                    <Para>{t("payment.general.system.desc")}</Para>

                    <SubTitle>{t("payment.general.plans.title")}</SubTitle>
                    {/* Plan Table */}
                    <div className="overflow-x-auto rounded-xl border border-black/10">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-primary/5">
                                    <th className="text-left p-3 font-bold text-on-surface">{t("payment.table.plan")}</th>
                                    <th className="text-left p-3 font-bold text-on-surface">{t("payment.table.price")}</th>
                                    <th className="text-left p-3 font-bold text-on-surface">{t("payment.table.period")}</th>
                                    <th className="text-left p-3 font-bold text-on-surface">{t("payment.table.businesses")}</th>
                                    <th className="text-left p-3 font-bold text-on-surface">{t("payment.table.products")}</th>
                                    <th className="text-left p-3 font-bold text-on-surface">{t("payment.table.aiPerDay")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {[
                                    { plan: "payment.plans.ft1", price: "৳0", period: "payment.plans.ft1Period", biz: "1", prod: "10", ai: "5" },
                                    { plan: "payment.plans.ft2", price: "৳0", period: "payment.plans.ft2Period", biz: "2", prod: "20", ai: "5" },
                                    { plan: "payment.plans.basic", price: "৳149", period: "payment.plans.monthly", biz: "1", prod: "100", ai: "25" },
                                    { plan: "payment.plans.pro", price: "৳399", period: "payment.plans.monthly", biz: "3", prod: "200", ai: "75" },
                                    { plan: "payment.plans.plus", price: "৳899", period: "payment.plans.monthly", biz: "7", prod: "payment.plans.unlimited", ai: "300" },
                                    { plan: "payment.plans.enterprise", price: "payment.plans.custom", period: "payment.plans.yearly", biz: "∞", prod: "∞", ai: "∞" },
                                ].map((row, i) => (
                                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-primary/[0.02]"}>
                                        <td className="p-3 font-semibold text-on-surface">{t(row.plan)}</td>
                                        <td className="p-3 text-on-surface-variant">{row.price}</td>
                                        <td className="p-3 text-on-surface-variant">{t(row.period)}</td>
                                        <td className="p-3 text-center text-on-surface-variant">{row.biz}</td>
                                        <td className="p-3 text-center text-on-surface-variant">{row.prod}</td>
                                        <td className="p-3 text-center text-on-surface-variant">{row.ai}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <BulletList items={[
                        t("payment.general.plans.note1"),
                        t("payment.general.plans.note2"),
                        t("payment.general.plans.note3"),
                        t("payment.general.plans.note4"),
                    ]} />

                    {/* 2. Payment Methods */}
                    <SectionTitle>{t("payment.methods.title")}</SectionTitle>
                    <SubTitle>{t("payment.methods.accepted.title")}</SubTitle>

                    {/* MFS Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {["bkash", "nagad", "rocket"].map((mfs) => (
                            <div key={mfs} className="flex items-center gap-3 bg-primary/5 rounded-xl p-4">
                                <span className="material-symbols-outlined text-primary text-2xl">account_balance_wallet</span>
                                <div>
                                    <p className="font-bold text-on-surface">{t(`payment.methods.${mfs}`)}</p>
                                    <p className="text-xs text-on-surface-variant">{t("payment.methods.mfsType")}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <InfoBox variant="warning">
                        <p className="font-bold">{t("payment.methods.important.title")}</p>
                        <p className="text-sm mt-1">{t("payment.methods.important.desc")}</p>
                    </InfoBox>

                    {/* Payment Process Steps */}
                    <SubTitle>{t("payment.methods.process.title")}</SubTitle>
                    <div className="space-y-4 bg-primary/[0.03] rounded-xl p-6">
                        <StepCard number="1" title={t("payment.methods.step1.title")} desc={t("payment.methods.step1.desc")} />
                        <StepCard number="2" title={t("payment.methods.step2.title")} desc={t("payment.methods.step2.desc")} />
                        <StepCard number="3" title={t("payment.methods.step3.title")} desc={t("payment.methods.step3.desc")} />
                        <StepCard number="4" title={t("payment.methods.step4.title")} desc={t("payment.methods.step4.desc")} />
                        <StepCard number="5" title={t("payment.methods.step5.title")} desc={t("payment.methods.step5.desc")} />
                    </div>

                    {/* Verification Rules */}
                    <SubTitle>{t("payment.methods.verification.title")}</SubTitle>
                    <div className="overflow-x-auto rounded-xl border border-black/10">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-primary/5">
                                    <th className="text-left p-3 font-bold text-on-surface">{t("payment.verification.condition")}</th>
                                    <th className="text-left p-3 font-bold text-on-surface">{t("payment.verification.requirement")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {["trxMatch", "amountTolerance", "timeWindow", "mfsMatch"].map((key, i) => (
                                    <tr key={key} className={i % 2 === 0 ? "bg-white" : "bg-primary/[0.02]"}>
                                        <td className="p-3 font-semibold text-on-surface">{t(`payment.verification.${key}`)}</td>
                                        <td className="p-3 text-on-surface-variant">{t(`payment.verification.${key}Val`)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Wrong TrxID */}
                    <SubTitle>{t("payment.methods.wrongTrx.title")}</SubTitle>
                    <BulletList items={[
                        t("payment.methods.wrongTrx.p1"),
                        t("payment.methods.wrongTrx.p2"),
                        t("payment.methods.wrongTrx.p3"),
                        t("payment.methods.wrongTrx.p4"),
                    ]} />

                    {/* 3. Subscription & Billing */}
                    <SectionTitle>{t("payment.billing.title")}</SectionTitle>
                    <SubTitle>{t("payment.billing.cycle.title")}</SubTitle>
                    <div className="overflow-x-auto rounded-xl border border-black/10">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-primary/5">
                                    <th className="text-left p-3 font-bold text-on-surface">{t("payment.table.plan")}</th>
                                    <th className="text-left p-3 font-bold text-on-surface">{t("payment.billing.cycle")}</th>
                                    <th className="text-left p-3 font-bold text-on-surface">{t("payment.billing.renewal")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {["basic", "pro", "plus", "enterprise"].map((plan, i) => (
                                    <tr key={plan} className={i % 2 === 0 ? "bg-white" : "bg-primary/[0.02]"}>
                                        <td className="p-3 font-semibold text-on-surface">{t(`payment.plans.${plan}`)}</td>
                                        <td className="p-3 text-on-surface-variant">{t(`payment.billing.${plan}Cycle`)}</td>
                                        <td className="p-3 text-on-surface-variant">{t(`payment.billing.${plan}Renewal`)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <InfoBox variant="info">
                        <p className="text-sm">{t("payment.billing.noAutoRenewal")}</p>
                    </InfoBox>

                    <SubTitle>{t("payment.billing.upgrade.title")}</SubTitle>
                    <BulletList items={[
                        t("payment.billing.upgrade.p1"),
                        t("payment.billing.upgrade.p2"),
                        t("payment.billing.upgrade.p3"),
                        t("payment.billing.upgrade.p4"),
                        t("payment.billing.upgrade.p5"),
                    ]} />

                    <SubTitle>{t("payment.billing.downgrade.title")}</SubTitle>
                    <BulletList items={[
                        t("payment.billing.downgrade.p1"),
                        t("payment.billing.downgrade.p2"),
                        t("payment.billing.downgrade.p3"),
                    ]} />

                    <SubTitle>{t("payment.billing.accurateInfo.title")}</SubTitle>
                    <BulletList items={[
                        t("payment.billing.accurateInfo.p1"),
                        t("payment.billing.accurateInfo.p2"),
                        t("payment.billing.accurateInfo.p3"),
                    ]} />

                    {/* 4. Payment Failure & Lifecycle */}
                    <SectionTitle>{t("payment.failure.title")}</SectionTitle>
                    <SubTitle>{t("payment.failure.causes.title")}</SubTitle>
                    <BulletList items={[
                        t("payment.failure.causes.p1"),
                        t("payment.failure.causes.p2"),
                        t("payment.failure.causes.p3"),
                        t("payment.failure.causes.p4"),
                        t("payment.failure.causes.p5"),
                    ]} />

                    <SubTitle>{t("payment.failure.lifecycle.title")}</SubTitle>
                    {/* Lifecycle Timeline */}
                    <div className="relative pl-8 space-y-0">
                        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-primary/20" />
                        {["grace", "limited", "archived", "deleted"].map((phase, i) => (
                            <div key={phase} className="relative flex items-start gap-4 py-3">
                                <div className="absolute -left-5 w-4 h-4 rounded-full bg-primary border-2 border-white z-10" />
                                <div className="flex-1 bg-primary/[0.03] rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-primary text-sm">{t(`payment.failure.${phase}.period`)}</span>
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t(`payment.failure.${phase}.time`)}</span>
                                    </div>
                                    <p className="text-on-surface-variant text-sm">{t(`payment.failure.${phase}.desc`)}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <SubTitle>{t("payment.failure.repay.title")}</SubTitle>
                    <BulletList items={[
                        t("payment.failure.repay.p1"),
                        t("payment.failure.repay.p2"),
                        t("payment.failure.repay.p3"),
                    ]} />

                    {/* 5. Invoice */}
                    <SectionTitle>{t("payment.invoice.title")}</SectionTitle>
                    <SubTitle>{t("payment.invoice.provision.title")}</SubTitle>
                    <BulletList items={[
                        t("payment.invoice.provision.p1"),
                        t("payment.invoice.provision.p2"),
                        t("payment.invoice.provision.p3"),
                    ]} />

                    <SubTitle>{t("payment.invoice.content.title")}</SubTitle>
                    <BulletList items={[
                        t("payment.invoice.content.p1"),
                        t("payment.invoice.content.p2"),
                        t("payment.invoice.content.p3"),
                        t("payment.invoice.content.p4"),
                        t("payment.invoice.content.p5"),
                        t("payment.invoice.content.p6"),
                    ]} />

                    <SubTitle>{t("payment.invoice.tax.title")}</SubTitle>
                    <BulletList items={[
                        t("payment.invoice.tax.p1"),
                        t("payment.invoice.tax.p2"),
                        t("payment.invoice.tax.p3"),
                    ]} />

                    {/* ═══════ PART 2: REFUND POLICY ═══════ */}
                    <div className="pb-6 border-b border-black/5 pt-4">
                        <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-bold">
                            <span className="material-symbols-outlined text-base">undo</span>
                            {t("payment.part2Badge")}
                        </div>
                    </div>

                    {/* Refund Eligibility */}
                    <SectionTitle>{t("payment.refund.eligibility.title")}</SectionTitle>
                    <SubTitle>{t("payment.refund.eligible.title")}</SubTitle>
                    <div className="overflow-x-auto rounded-xl border border-black/10">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-green-50">
                                    <th className="text-left p-3 font-bold text-green-800">{t("payment.refund.situation")}</th>
                                    <th className="text-left p-3 font-bold text-green-800">{t("payment.refund.refundAmount")}</th>
                                    <th className="text-left p-3 font-bold text-green-800">{t("payment.refund.condition")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {["serviceFail", "techIssue", "wrongAmount", "doublePay", "platformClose"].map((key, i) => (
                                    <tr key={key} className={i % 2 === 0 ? "bg-white" : "bg-green-50/30"}>
                                        <td className="p-3 text-on-surface">{t(`payment.refund.${key}`)}</td>
                                        <td className="p-3 font-bold text-green-700">{t(`payment.refund.${key}Amount`)}</td>
                                        <td className="p-3 text-on-surface-variant">{t(`payment.refund.${key}Condition`)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <SubTitle>{t("payment.refund.notEligible.title")}</SubTitle>
                    <div className="overflow-x-auto rounded-xl border border-black/10">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-red-50">
                                    <th className="text-left p-3 font-bold text-red-800">{t("payment.refund.case")}</th>
                                    <th className="text-left p-3 font-bold text-red-800">{t("payment.refund.reason")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {["freeTrial", "after7Days", "accountDeactivated", "promoCoupon", "enterpriseCustom"].map((key, i) => (
                                    <tr key={key} className={i % 2 === 0 ? "bg-white" : "bg-red-50/30"}>
                                        <td className="p-3 text-on-surface">{t(`payment.refund.ne.${key}`)}</td>
                                        <td className="p-3 text-on-surface-variant">{t(`payment.refund.ne.${key}Reason`)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Refund Process */}
                    <SectionTitle>{t("payment.refund.process.title")}</SectionTitle>
                    <SubTitle>{t("payment.refund.howTo.title")}</SubTitle>
                    <Para>{t("payment.refund.howTo.desc")}</Para>
                    <BulletList items={[
                        t("payment.refund.howTo.email"),
                        t("payment.refund.howTo.hotline"),
                        t("payment.refund.howTo.app"),
                    ]} />

                    <Para>{t("payment.refund.howTo.required")}</Para>
                    <BulletList items={[
                        t("payment.refund.howTo.r1"),
                        t("payment.refund.howTo.r2"),
                        t("payment.refund.howTo.r3"),
                        t("payment.refund.howTo.r4"),
                        t("payment.refund.howTo.r5"),
                    ]} />

                    <SubTitle>{t("payment.refund.processing.title")}</SubTitle>
                    <Para>{t("payment.refund.processing.desc")}</Para>
                    <div className="overflow-x-auto rounded-xl border border-black/10">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-primary/5">
                                    <th className="text-left p-3 font-bold text-on-surface">{t("payment.refund.step")}</th>
                                    <th className="text-left p-3 font-bold text-on-surface">{t("payment.refund.timeline")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {["receive", "verify", "transfer", "total"].map((key, i) => (
                                    <tr key={key} className={i % 2 === 0 ? "bg-white" : "bg-primary/[0.02]"}>
                                        <td className="p-3 text-on-surface">{t(`payment.refund.proc.${key}`)}</td>
                                        <td className="p-3 font-semibold text-primary">{t(`payment.refund.proc.${key}Time`)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <SubTitle>{t("payment.refund.status.title")}</SubTitle>
                    <BulletList items={[
                        t("payment.refund.status.p1"),
                        t("payment.refund.status.p2"),
                        t("payment.refund.status.p3"),
                    ]} />

                    {/* Pro-rata */}
                    <SectionTitle>{t("payment.prorata.title")}</SectionTitle>
                    <SubTitle>{t("payment.prorata.calc.title")}</SubTitle>
                    <div className="bg-primary/[0.03] rounded-xl p-6 font-mono text-sm text-on-surface-variant">
                        <p>{t("payment.prorata.formula")}</p>
                        <p className="mt-3 text-on-surface font-semibold">{t("payment.prorata.example")}</p>
                    </div>

                    <SubTitle>{t("payment.prorata.deductible.title")}</SubTitle>
                    <BulletList items={[
                        t("payment.prorata.deductible.p1"),
                        t("payment.prorata.deductible.p2"),
                    ]} />

                    {/* Fraud Prevention */}
                    <SectionTitle>{t("payment.fraud.title")}</SectionTitle>
                    <SubTitle>{t("payment.fraud.auto.title")}</SubTitle>
                    <div className="overflow-x-auto rounded-xl border border-black/10">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-red-50">
                                    <th className="text-left p-3 font-bold text-red-800">{t("payment.fraud.rule")}</th>
                                    <th className="text-left p-3 font-bold text-red-800">{t("payment.fraud.action")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {["wrongTrx", "adminReject", "detected"].map((key, i) => (
                                    <tr key={key} className={i % 2 === 0 ? "bg-white" : "bg-red-50/30"}>
                                        <td className="p-3 text-on-surface">{t(`payment.fraud.${key}`)}</td>
                                        <td className="p-3 text-on-surface-variant">{t(`payment.fraud.${key}Action`)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <SubTitle>{t("payment.fraud.idempotency.title")}</SubTitle>
                    <BulletList items={[
                        t("payment.fraud.idempotency.p1"),
                        t("payment.fraud.idempotency.p2"),
                        t("payment.fraud.idempotency.p3"),
                    ]} />

                    {/* Special Circumstances */}
                    <SectionTitle>{t("payment.special.title")}</SectionTitle>
                    <SubTitle>{t("payment.special.platformClose.title")}</SubTitle>
                    <BulletList items={[
                        t("payment.special.platformClose.p1"),
                        t("payment.special.platformClose.p2"),
                        t("payment.special.platformClose.p3"),
                    ]} />

                    <SubTitle>{t("payment.special.forceMajeure.title")}</SubTitle>
                    <BulletList items={[
                        t("payment.special.forceMajeure.p1"),
                        t("payment.special.forceMajeure.p2"),
                        t("payment.special.forceMajeure.p3"),
                    ]} />

                    <SubTitle>{t("payment.special.deactivation.title")}</SubTitle>
                    <BulletList items={[
                        t("payment.special.deactivation.p1"),
                        t("payment.special.deactivation.p2"),
                        t("payment.special.deactivation.p3"),
                    ]} />

                    {/* ═══════ PART 3: FREE TRIAL, COUPONS & REFERRAL ═══════ */}
                    <div className="pb-6 border-b border-black/5 pt-4">
                        <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full text-sm font-bold">
                            <span className="material-symbols-outlined text-base">card_giftcard</span>
                            {t("payment.part3Badge")}
                        </div>
                    </div>

                    <SectionTitle>{t("payment.freeTrial.title")}</SectionTitle>
                    <SubTitle>{t("payment.freeTrial.twoPhase.title")}</SubTitle>
                    <div className="overflow-x-auto rounded-xl border border-black/10">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-purple-50">
                                    <th className="text-left p-3 font-bold text-purple-800">{t("payment.freeTrial.phase")}</th>
                                    <th className="text-left p-3 font-bold text-purple-800">{t("payment.freeTrial.duration")}</th>
                                    <th className="text-left p-3 font-bold text-purple-800">{t("payment.table.businesses")}</th>
                                    <th className="text-left p-3 font-bold text-purple-800">{t("payment.table.products")}</th>
                                    <th className="text-left p-3 font-bold text-purple-800">{t("payment.table.aiPerDay")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                <tr className="bg-white">
                                    <td className="p-3 font-semibold text-on-surface">{t("payment.freeTrial.ft1")}</td>
                                    <td className="p-3 text-on-surface-variant">{t("payment.freeTrial.ft1Dur")}</td>
                                    <td className="p-3 text-center text-on-surface-variant">1</td>
                                    <td className="p-3 text-center text-on-surface-variant">10</td>
                                    <td className="p-3 text-center text-on-surface-variant">5</td>
                                </tr>
                                <tr className="bg-purple-50/30">
                                    <td className="p-3 font-semibold text-on-surface">{t("payment.freeTrial.ft2")}</td>
                                    <td className="p-3 text-on-surface-variant">{t("payment.freeTrial.ft2Dur")}</td>
                                    <td className="p-3 text-center text-on-surface-variant">2</td>
                                    <td className="p-3 text-center text-on-surface-variant">20</td>
                                    <td className="p-3 text-center text-on-surface-variant">5</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <SubTitle>{t("payment.freeTrial.rules.title")}</SubTitle>
                    <BulletList items={[
                        t("payment.freeTrial.rules.p1"),
                        t("payment.freeTrial.rules.p2"),
                        t("payment.freeTrial.rules.p3"),
                        t("payment.freeTrial.rules.p4"),
                        t("payment.freeTrial.rules.p5"),
                        t("payment.freeTrial.rules.p6"),
                        t("payment.freeTrial.rules.p7"),
                    ]} />

                    <SectionTitle>{t("payment.coupons.title")}</SectionTitle>
                    <SubTitle>{t("payment.coupons.conditions.title")}</SubTitle>
                    <BulletList items={[
                        t("payment.coupons.conditions.p1"),
                        t("payment.coupons.conditions.p2"),
                        t("payment.coupons.conditions.p3"),
                        t("payment.coupons.conditions.p4"),
                    ]} />

                    <SubTitle>{t("payment.coupons.cancellation.title")}</SubTitle>
                    <BulletList items={[
                        t("payment.coupons.cancellation.p1"),
                        t("payment.coupons.cancellation.p2"),
                        t("payment.coupons.cancellation.p3"),
                    ]} />

                    <SectionTitle>{t("payment.referral.title")}</SectionTitle>
                    <SubTitle>{t("payment.referral.credits.title")}</SubTitle>
                    <BulletList items={[
                        t("payment.referral.credits.p1"),
                        t("payment.referral.credits.p2"),
                        t("payment.referral.credits.p3"),
                    ]} />

                    <SubTitle>{t("payment.referral.abuse.title")}</SubTitle>
                    <BulletList items={[
                        t("payment.referral.abuse.p1"),
                        t("payment.referral.abuse.p2"),
                        t("payment.referral.abuse.p3"),
                    ]} />

                    {/* ═══════ PART 4: IMPORTANT INFO ═══════ */}
                    <div className="pb-6 border-b border-black/5 pt-4">
                        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-sm font-bold">
                            <span className="material-symbols-outlined text-base">info</span>
                            {t("payment.part4Badge")}
                        </div>
                    </div>

                    {/* Payment Warning */}
                    <InfoBox variant="warning">
                        <p className="font-bold text-base mb-2">{t("payment.warning.title")}</p>
                        <div className="space-y-2 text-sm">
                            <p className="font-semibold">🔒 {t("payment.warning.safe.title")}</p>
                            <BulletList items={[
                                t("payment.warning.safe.p1"),
                                t("payment.warning.safe.p2"),
                                t("payment.warning.safe.p3"),
                                t("payment.warning.safe.p4"),
                            ]} />
                            <p className="font-semibold mt-3">📱 {t("payment.warning.official.title")}</p>
                            <BulletList items={[
                                t("payment.warning.official.p1"),
                                t("payment.warning.official.p2"),
                                t("payment.warning.official.p3"),
                                t("payment.warning.official.p4"),
                            ]} />
                        </div>
                    </InfoBox>

                    {/* Contact */}
                    <SectionTitle>{t("payment.contact.title")}</SectionTitle>
                    <div className="overflow-x-auto rounded-xl border border-black/10">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-primary/5">
                                    <th className="text-left p-3 font-bold text-on-surface">{t("payment.contact.subject")}</th>
                                    <th className="text-left p-3 font-bold text-on-surface">{t("payment.contact.detail")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {["general", "refund", "fraud", "promo"].map((key, i) => (
                                    <tr key={key} className={i % 2 === 0 ? "bg-white" : "bg-primary/[0.02]"}>
                                        <td className="p-3 text-on-surface">{t(`payment.contact.${key}`)}</td>
                                        <td className="p-3 text-on-surface-variant">support@dokaniai.com</td>
                                    </tr>
                                ))}
                                <tr className="bg-primary/[0.02]">
                                    <td className="p-3 text-on-surface">{t("payment.contact.hotline")}</td>
                                    <td className="p-3 text-on-surface-variant">+880 1822-679672</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* User Responsibilities */}
                    <SectionTitle>{t("payment.responsibilities.title")}</SectionTitle>
                    <CheckList items={[
                        t("payment.responsibilities.p1"),
                        t("payment.responsibilities.p2"),
                        t("payment.responsibilities.p3"),
                        t("payment.responsibilities.p4"),
                        t("payment.responsibilities.p5"),
                        t("payment.responsibilities.p6"),
                    ]} />

                    {/* Dispute Process */}
                    <SectionTitle>{t("payment.dispute.title")}</SectionTitle>
                    <div className="space-y-4 bg-primary/[0.03] rounded-xl p-6">
                        <StepCard number="1" title={t("payment.dispute.step1.title")} desc={t("payment.dispute.step1.desc")} />
                        <StepCard number="2" title={t("payment.dispute.step2.title")} desc={t("payment.dispute.step2.desc")} />
                        <StepCard number="3" title={t("payment.dispute.step3.title")} desc={t("payment.dispute.step3.desc")} />
                        <StepCard number="4" title={t("payment.dispute.step4.title")} desc={t("payment.dispute.step4.desc")} />
                        <StepCard number="5" title={t("payment.dispute.step5.title")} desc={t("payment.dispute.step5.desc")} />
                    </div>

                    {/* Legal Notice */}
                    <SectionTitle>{t("payment.legal.title")}</SectionTitle>
                    <InfoBox variant="info">
                        <p className="font-bold mb-2">{t("payment.legal.governed")}</p>
                        <p className="font-semibold">{t("payment.legal.applicableLaws")}</p>
                        <BulletList items={[
                            "Digital Security Act, 2018",
                            "Bangladesh Bank Payment System Guidelines",
                            "Consumer Rights Protection Act, 2009",
                            "The Contract Act, 1872",
                            "Mobile Financial Services Regulations",
                        ]} />
                        <p className="font-semibold mt-3">{t("payment.legal.dispute")}</p>
                        <BulletList items={[
                            t("payment.legal.disputeDhaka"),
                            t("payment.legal.disputeArbitration"),
                        ]} />
                    </InfoBox>

                    {/* Footer note */}
                    <div className="pt-8 border-t border-black/5 text-center space-y-2">
                        <p className="text-sm text-on-surface-variant">{t("payment.lastUpdated")}</p>
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