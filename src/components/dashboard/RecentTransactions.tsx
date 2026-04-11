"use client";

import { useTranslations } from "next-intl";

// ---------------------------------------------------------------------------
// Inline SVG Icons
// ---------------------------------------------------------------------------

function IconShoppingCart({ className = "w-5 h-5" }: { className?: string }) {
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
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
            />
        </svg>
    );
}

function IconReturn({ className = "w-5 h-5" }: { className?: string }) {
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
                d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
            />
        </svg>
    );
}

function IconBolt({ className = "w-5 h-5" }: { className?: string }) {
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
                d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
            />
        </svg>
    );
}

// ---------------------------------------------------------------------------
// Placeholder transaction data
// ---------------------------------------------------------------------------

interface Transaction {
    id: string;
    type: "sale" | "return" | "expense";
    description: string;
    amount: string;
    amountColor: string;
    badge: string;
    badgeStyle: string;
    timeAgo: string;
    iconBg: string;
    iconColor: string;
    icon: React.ReactNode;
}

const placeholderTransactions: Transaction[] = [
    {
        id: "1",
        type: "sale",
        description: "নগদ বিক্রয় #৩৪৩২",
        amount: "+৳ ৮৫০",
        amountColor: "text-primary",
        badge: "success",
        badgeStyle: "bg-primary-fixed/40 text-primary",
        timeAgo: "২ মিনিট আগে • ৫টি পণ্য",
        iconBg: "bg-primary/10",
        iconColor: "text-primary",
        icon: <IconShoppingCart />,
    },
    {
        id: "2",
        type: "return",
        description: "পণ্য ফেরত - রহিম স্টোর",
        amount: "-৳ ১২০",
        amountColor: "text-tertiary",
        badge: "return",
        badgeStyle: "bg-tertiary-fixed/40 text-tertiary",
        timeAgo: "১৫ মিনিট আগে",
        iconBg: "bg-tertiary/10",
        iconColor: "text-tertiary",
        icon: <IconReturn />,
    },
    {
        id: "3",
        type: "expense",
        description: "বিদ্যুৎ বিল পরিশোধ",
        amount: "-৳ ২,৪০০",
        amountColor: "text-on-surface",
        badge: "expense",
        badgeStyle: "bg-surface-container-highest text-on-surface-variant",
        timeAgo: "১ ঘণ্টা আগে",
        iconBg: "bg-secondary-fixed/30",
        iconColor: "text-secondary",
        icon: <IconBolt />,
    },
];

// ---------------------------------------------------------------------------
// RecentTransactions Component
// ---------------------------------------------------------------------------

export default function RecentTransactions() {
    const t = useTranslations("dashboard.transactions");

    // Map badge keys to translations
    const badgeLabel = (badge: string) => {
        switch (badge) {
            case "success":
                return t("success");
            case "return":
                return t("return");
            case "expense":
                return t("expense");
            default:
                return badge;
        }
    };

    return (
        <section className="bg-surface-container-low rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-bold">{t("title")}</h4>
                <button className="text-primary font-bold text-sm">{t("viewAll")}</button>
            </div>

            {/* Transaction List */}
            <div className="space-y-3">
                {placeholderTransactions.map((txn) => (
                    <div
                        key={txn.id}
                        className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between"
                    >
                        {/* Left: Icon + Details */}
                        <div className="flex items-center gap-4">
                            <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center ${txn.iconBg} ${txn.iconColor}`}
                            >
                                {txn.icon}
                            </div>
                            <div>
                                <p className="font-bold text-sm">{txn.description}</p>
                                <p className="text-xs text-on-surface-variant">{txn.timeAgo}</p>
                            </div>
                        </div>

                        {/* Right: Amount + Badge */}
                        <div className="text-right">
                            <p className={`font-bold text-sm ${txn.amountColor}`}>
                                {txn.amount}
                            </p>
                            <p
                                className={`text-[10px] px-2 py-0.5 rounded-full inline-block mt-1 ${txn.badgeStyle}`}
                            >
                                {badgeLabel(txn.badge)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
