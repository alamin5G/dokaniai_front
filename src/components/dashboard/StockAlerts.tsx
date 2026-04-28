"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useBusinessStore } from "@/store/businessStore";
import { buildShopPath } from "@/lib/shopRouting";

// ---------------------------------------------------------------------------
// Inline SVG Icons
// ---------------------------------------------------------------------------

function IconWarning({ className = "w-5 h-5" }: { className?: string }) {
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
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
        </svg>
    );
}

function IconPlus({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={className}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    );
}

// ---------------------------------------------------------------------------
// Placeholder stock alert data
// ---------------------------------------------------------------------------

interface StockAlert {
    id: string;
    productName: string;
    remaining: string;
}

const placeholderAlerts: StockAlert[] = [
    {
        id: "1",
        productName: "পিঁয়াজ (দেশি)",
        remaining: "মাত্র ৩ কেজি বাকি",
    },
    {
        id: "2",
        productName: "সয়াবিন তেল (৫লি)",
        remaining: "মাত্র ২ বোতল বাকি",
    },
];

// ---------------------------------------------------------------------------
// StockAlerts Component
// ---------------------------------------------------------------------------

export default function StockAlerts() {
    const t = useTranslations("dashboard.lowStock");
    const router = useRouter();
    const { activeBusinessId } = useBusinessStore();

    const handleNavigate = (section: string) => {
        if (!activeBusinessId) return;
        router.push(buildShopPath(activeBusinessId, section));
    };

    return (
        <section className="bg-surface-container-lowest rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6 text-tertiary">
                <IconWarning className="w-6 h-6" />
                <h4 className="text-xl font-bold">{t("title")}</h4>
            </div>

            {/* Alert List */}
            <div className="space-y-4">
                {placeholderAlerts.map((alert) => (
                    <div
                        key={alert.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-tertiary-fixed/20"
                    >
                        <div>
                            <p className="font-bold text-sm">{alert.productName}</p>
                            <p className="text-xs text-tertiary font-medium">
                                {alert.remaining}
                            </p>
                        </div>
                        <button
                            className="p-2 bg-tertiary text-on-tertiary rounded-lg min-w-[40px] min-h-[40px] flex items-center justify-center"
                            onClick={() => handleNavigate("/products")}
                        >
                            <IconPlus className="w-5 h-5" />
                        </button>
                    </div>
                ))}
            </div>

            {/* View Inventory Link */}
            <button
                className="w-full mt-6 py-3 text-tertiary rounded-xl font-bold text-sm bg-surface-container-low text-center hover:bg-surface-container-high transition-colors"
                onClick={() => handleNavigate("/products")}
            >
                {t("viewInventory")}
            </button>
        </section>
    );
}
