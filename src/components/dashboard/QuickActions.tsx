"use client";

import { buildShopPath } from "@/lib/shopRouting";
import { useBusinessStore } from "@/store/businessStore";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Inline SVG Icons
// ---------------------------------------------------------------------------

function IconCart({ className = "w-6 h-6" }: { className?: string }) {
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

function IconProduct({ className = "w-6 h-6" }: { className?: string }) {
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
                d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
            />
        </svg>
    );
}

function IconDue({ className = "w-6 h-6" }: { className?: string }) {
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
                d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
        </svg>
    );
}

function IconExpense({ className = "w-6 h-6" }: { className?: string }) {
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
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
            />
        </svg>
    );
}

function IconReturn({ className = "w-6 h-6" }: { className?: string }) {
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
// QuickActions Component
// ---------------------------------------------------------------------------

export default function QuickActions() {
    const t = useTranslations("dashboard.quickActions");
    const router = useRouter();
    const { activeBusinessId } = useBusinessStore();

    const primaryActions = [
        {
            label: t("newSale"),
            icon: <IconCart className="w-7 h-7" />,
            style:
                "bg-primary text-on-primary hover:brightness-105 active:scale-95",
            section: "/sales",
        },
        {
            label: t("addProduct"),
            icon: <IconProduct className="w-7 h-7" />,
            style:
                "bg-secondary text-on-secondary hover:brightness-105 active:scale-95",
            section: "/products",
        },
        {
            label: t("addDue"),
            icon: <IconDue className="w-7 h-7" />,
            style:
                "bg-tertiary text-on-tertiary hover:brightness-105 active:scale-95",
            section: "/due-ledger",
        },
    ];

    const secondaryActions = [
        {
            label: t("recordExpense"),
            icon: <IconExpense className="w-5 h-5" />,
            section: "/expenses",
        },
        {
            label: t("recordReturn"),
            icon: <IconReturn className="w-5 h-5" />,
            section: "/reports",
        },
    ];

    function handleNavigate(section: string) {
        if (!activeBusinessId) return;
        router.push(buildShopPath(activeBusinessId, section));
    }

    return (
        <section>
            <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-primary">
                    <IconBolt />
                </span>
                {t("title")}
            </h4>

            <div className="space-y-4">
                {/* Primary Actions — 3-column grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {primaryActions.map((action) => (
                        <button
                            key={action.label}
                            onClick={() => handleNavigate(action.section)}
                            className={`flex flex-col items-center justify-center p-6 rounded-2xl transition-all gap-3 min-h-[100px] ${action.style}`}
                        >
                            {action.icon}
                            <span className="font-bold text-base">{action.label}</span>
                        </button>
                    ))}
                </div>

                {/* Secondary Actions — 2-column grid */}
                <div className="grid grid-cols-2 gap-4">
                    {secondaryActions.map((action) => (
                        <button
                            key={action.label}
                            onClick={() => handleNavigate(action.section)}
                            className="flex items-center justify-center gap-3 py-4 bg-surface-container-high text-on-surface-variant rounded-xl hover:bg-surface-container-highest transition-colors min-h-[48px]"
                        >
                            {action.icon}
                            <span className="font-bold text-sm">{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}
