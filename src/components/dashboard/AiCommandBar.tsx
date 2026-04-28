"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useBusinessStore } from "@/store/businessStore";
import { buildShopPath } from "@/lib/shopRouting";

// ---------------------------------------------------------------------------
// Inline SVG Icons
// ---------------------------------------------------------------------------

function IconSearch({ className = "w-5 h-5" }: { className?: string }) {
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
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
        </svg>
    );
}

function IconMic({ className = "w-6 h-6" }: { className?: string }) {
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
                d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
            />
        </svg>
    );
}

function IconSparkle({ className = "w-5 h-5" }: { className?: string }) {
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
                d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
            />
        </svg>
    );
}

// ---------------------------------------------------------------------------
// AiCommandBar Component
// ---------------------------------------------------------------------------

export default function AiCommandBar() {
    const t = useTranslations("dashboard.ai");
    const router = useRouter();
    const { activeBusinessId } = useBusinessStore();

    const handleOpenAI = () => {
        if (!activeBusinessId) return;
        router.push(buildShopPath(activeBusinessId, "/ai"));
    };

    return (
        <section className="relative group">
            {/* Gradient glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-15 group-hover:opacity-25 transition duration-1000 group-hover:duration-200" />

            {/* Command bar */}
            <div
                className="relative flex items-center bg-surface-container-lowest rounded-2xl p-2 cursor-pointer hover:bg-surface-container-high transition-colors"
                onClick={handleOpenAI}
            >
                {/* Search / Sparkle icon */}
                <div className="flex-1 flex items-center px-4">
                    <span className="text-primary-container mr-3">
                        <IconSparkle className="w-5 h-5" />
                    </span>
                    <input
                        type="text"
                        className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-base py-3 text-on-surface placeholder:text-on-surface-variant/60"
                        placeholder={t("placeholder")}
                    />
                </div>

                {/* Mic button */}
                <button
                    className="bg-gradient-to-br from-primary to-primary-container text-on-primary p-4 rounded-xl flex items-center justify-center hover:brightness-110 active:scale-95 transition-all min-w-[48px] min-h-[48px]"
                    title={t("micTooltip")}
                    onClick={(e) => { e.stopPropagation(); handleOpenAI(); }}
                >
                    <IconMic className="w-6 h-6" />
                </button>
            </div>
        </section>
    );
}
