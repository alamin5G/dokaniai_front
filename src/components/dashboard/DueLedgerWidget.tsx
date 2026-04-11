"use client";

import { useTranslations } from "next-intl";

// ---------------------------------------------------------------------------
// Inline SVG Icons
// ---------------------------------------------------------------------------

function IconBook({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={className}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
            />
        </svg>
    );
}

function IconChat({ className = "w-4 h-4" }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={className}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
            />
        </svg>
    );
}

// ---------------------------------------------------------------------------
// Placeholder due data
// ---------------------------------------------------------------------------

interface DueCustomer {
    id: string;
    name: string;
    initial: string;
    dueAmount: string;
    lastDueDays: number;
}

const placeholderCustomers: DueCustomer[] = [
    {
        id: "1",
        name: "হালিম ভাই",
        initial: "হ",
        dueAmount: "৳ ২,৪০০",
        lastDueDays: 5,
    },
    {
        id: "2",
        name: "আফসানা বেগম",
        initial: "আ",
        dueAmount: "৳ ১,২০০",
        lastDueDays: 2,
    },
    {
        id: "3",
        name: "কামাল হোসেন",
        initial: "ক",
        dueAmount: "৳ ৮৫০",
        lastDueDays: 10,
    },
];

// ---------------------------------------------------------------------------
// DueLedgerWidget Component
// ---------------------------------------------------------------------------

export default function DueLedgerWidget() {
    const t = useTranslations("dashboard.dueLedger");

    return (
        <section className="bg-surface-container-lowest rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6 text-secondary">
                <IconBook className="w-6 h-6" />
                <h4 className="text-xl font-bold">{t("title")}</h4>
            </div>

            {/* Customer List */}
            <div className="space-y-4">
                {placeholderCustomers.map((customer) => (
                    <div
                        key={customer.id}
                        className="flex items-center justify-between"
                    >
                        {/* Left: Avatar + Info */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant font-bold text-sm">
                                {customer.initial}
                            </div>
                            <div>
                                <p className="font-bold text-sm">{customer.name}</p>
                                <p className="text-[10px] text-on-surface-variant">
                                    {t("lastDue", { days: customer.lastDueDays })}
                                </p>
                            </div>
                        </div>

                        {/* Right: Amount + Chat */}
                        <div className="flex items-center gap-3">
                            <p className="font-bold text-tertiary text-sm">
                                {customer.dueAmount}
                            </p>
                            <button className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center min-w-[32px] min-h-[32px]">
                                <IconChat className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* View All Button */}
            <button className="w-full mt-6 bg-secondary text-on-secondary py-3 rounded-xl font-bold text-sm">
                {t("viewAll")}
            </button>
        </section>
    );
}
