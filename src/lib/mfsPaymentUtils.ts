// ---------------------------------------------------------------------------
// Shared MFS Payment Utilities
// Used by: SubscriptionWorkspace, Due Payment Page
// ---------------------------------------------------------------------------
import type { MfsType } from "@/types/subscription";

export const MFS_LABELS: Record<MfsType, string> = {
    BKASH: "bKash",
    NAGAD: "Nagad",
    ROCKET: "Rocket",
};

export interface MfsTheme {
    bg: string;
    text: string;
    border: string;
    activeBg: string;
    activeText: string;
    icon: string;
}

export const MFS_THEMES: Record<MfsType, MfsTheme> = {
    BKASH: {
        bg: "bg-pink-50",
        text: "text-pink-700",
        border: "border-pink-300",
        activeBg: "bg-[#E2136E]",
        activeText: "text-white",
        icon: "💳",
    },
    NAGAD: {
        bg: "bg-orange-50",
        text: "text-orange-700",
        border: "border-orange-300",
        activeBg: "bg-[#F6921E]",
        activeText: "text-white",
        icon: "📱",
    },
    ROCKET: {
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-300",
        activeBg: "bg-[#8B2F8E]",
        activeText: "text-white",
        icon: "🚀",
    },
};

export function getTrxMaxLength(mfsMethod: MfsType | null): number {
    switch (mfsMethod) {
        case "BKASH": return 10;
        case "NAGAD": return 8;
        case "ROCKET": return 10;
        default: return 10;
    }
}

export function validateTrxId(trxId: string, mfsMethod: MfsType | null): string | null {
    const trimmed = trxId.trim();
    if (!trimmed) return null; // empty is handled by required check
    switch (mfsMethod) {
        case "BKASH":
            return /^[A-Z0-9]{10}$/.test(trimmed) ? null : "bKash TrxID must be exactly 10 alphanumeric characters";
        case "NAGAD":
            return /^[A-Z0-9]{8}$/.test(trimmed) ? null : "Nagad TrxID must be exactly 8 alphanumeric characters";
        case "ROCKET":
            return /^\d{10}$/.test(trimmed) ? null : "Rocket TrxID must be exactly 10 digits";
        default:
            return null;
    }
}

export function getTrxHint(mfsMethod: MfsType | null, isBn: boolean): string {
    switch (mfsMethod) {
        case "BKASH": return isBn ? "১০ অক্ষরের আলফানিউমেরিক (যেমন DDJ8BQBVCM)" : "10 alphanumeric chars (e.g. DDJ8BQBVCM)";
        case "NAGAD": return isBn ? "৮ অক্ষরের আলফানিউমেরিক (যেমন 754PTHMR)" : "8 alphanumeric chars (e.g. 754PTHMR)";
        case "ROCKET": return isBn ? "১০ সংখ্যার ডিজিট (যেমন 4661971574)" : "10 digit number (e.g. 4661971574)";
        default: return "";
    }
}
