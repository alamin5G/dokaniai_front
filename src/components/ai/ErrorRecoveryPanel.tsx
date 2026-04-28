"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { AIActionType } from "@/types/ai";

interface ErrorRecoveryPanelProps {
    actionType: AIActionType;
    businessId: string;
    onDismiss: () => void;
}

const ACTION_ROUTES: Record<string, string> = {
    SALE: "sales",
    EXPENSE: "expenses",
    DUE_BAKI: "due-ledger",
    DUE_JOMA: "due-ledger",
    DISCOUNT: "sales",
    RETURN: "sales",
    ADD_PRODUCT: "products",
    QUERY: "",
    UNKNOWN: "",
};

export default function ErrorRecoveryPanel({
    actionType,
    businessId,
    onDismiss,
}: ErrorRecoveryPanelProps) {
    const t = useTranslations("shop.ai.recovery");
    const router = useRouter();

    const route = ACTION_ROUTES[actionType] ?? "";

    const handleManualEntry = () => {
        if (route) {
            router.push(`/shop/${businessId}/${route}`);
        }
    };

    return (
        <div className="rounded-[24px] bg-surface-container-lowest p-6 shadow-sm space-y-4">
            {/* Acknowledgment */}
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface-container">
                    <span className="material-symbols-outlined text-on-surface-variant">info</span>
                </div>
                <p className="text-sm font-bold text-on-surface">{t("acknowledgment")}</p>
            </div>

            {/* Manual entry link */}
            {route && (
                <div className="rounded-xl bg-primary-container/20 p-4">
                    <p className="text-sm text-on-surface mb-2">{t("manualEntry")}</p>
                    <button
                        onClick={handleManualEntry}
                        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-container transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                        {t("manualEntryLink")}
                    </button>
                </div>
            )}

            {/* Dismiss button */}
            <button
                onClick={onDismiss}
                className="flex items-center gap-2 rounded-xl bg-surface-container px-4 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
                <span className="material-symbols-outlined text-sm">close</span>
                {t("dismiss")}
            </button>
        </div>
    );
}