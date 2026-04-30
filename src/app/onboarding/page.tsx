"use client";

import { FormInput, GradientButton } from "@/components/ui/FormPrimitives";
import { TrialExpiryBanner } from "@/components/subscription/TrialExpiryBanner";
import * as businessApi from "@/lib/businessApi";
import { getCategoriesByBusinessType } from "@/lib/categoryApi";
import { createProduct } from "@/lib/productApi";
import { formatLocalizedNumber, sanitizeNumericInput } from "@/lib/localeNumber";
import { getSampleProductsByBusinessType } from "@/lib/onboardingSampleProducts";
import { getFallbackCategoryPreview } from "@/lib/onboardingFallbackCategories";
import { getCurrentSubscription, invalidateCurrentSubscriptionCache } from "@/lib/subscriptionApi";
import { useAuthStore } from "@/store/authStore";
import { useBusinessStore } from "@/store/businessStore";
import type { CategoryResponse } from "@/types/category";
import type { BusinessCreateRequest, BusinessTypeOptionResponse, PaymentMethod } from "@/types/business";
import type { Subscription } from "@/types/subscription";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 7;
const ONBOARDING_DRAFT_KEY = "dokaniai-onboarding-draft";
const DEFAULT_BUSINESS_DATA: Partial<BusinessCreateRequest> = { currency: "BDT" };
const PROFILE_VERIFY_MAX_ATTEMPTS = 3;
const PROFILE_VERIFY_BASE_DELAY_MS = 250;

function isHttpNotFound(error: unknown): boolean {
    if (!error || typeof error !== "object") return false;
    const candidate = error as { response?: { status?: number } };
    return candidate.response?.status === 404;
}

type OnboardingBusinessTypeOption = {
    value: string;
    labelKey?: string;
    displayNameEn?: string;
    displayNameBn?: string;
};

const BUSINESS_TYPES: OnboardingBusinessTypeOption[] = [
    { value: "GROCERY", labelKey: "grocery" },
    { value: "FASHION", labelKey: "clothing" },
    { value: "ELECTRONICS", labelKey: "electronics" },
    { value: "RESTAURANT", labelKey: "restaurant" },
    { value: "PHARMACY", labelKey: "pharmacy" },
    { value: "STATIONERY", labelKey: "stationery" },
    { value: "HARDWARE", labelKey: "hardware" },
    { value: "BAKERY", labelKey: "bakery" },
    { value: "MOBILE_SHOP", labelKey: "mobileShop" },
    { value: "TAILORING", labelKey: "tailoring" },
    { value: "SWEETS_SHOP", labelKey: "sweetsShop" },
    { value: "COSMETICS", labelKey: "cosmetics" },
    { value: "BOOKSHOP", labelKey: "bookshop" },
    { value: "JEWELLERY", labelKey: "jewellery" },
    { value: "PRINTING", labelKey: "printing" },
    { value: "OTHER", labelKey: "other" },
] as const;

const BUSINESS_TYPE_LABEL_KEYS: Record<string, string> = Object.fromEntries(
    BUSINESS_TYPES.map((item) => [item.value, item.labelKey ?? "other"]),
);

const CURRENCIES = [
    { value: "BDT", label: "৳ BDT" },
    { value: "USD", label: "$ USD" },
    { value: "INR", label: "₹ INR" },
    { value: "EUR", label: "€ EUR" },
    { value: "GBP", label: "£ GBP" },
];

const PAYMENT_CHANNELS: PaymentMethod[] = [
    "CASH",
    "CREDIT",
    "BKASH",
    "NAGAD",
    "ROCKET",
    "CARD",
    "BANK",
    "MANUAL",
];

// ---------------------------------------------------------------------------
// Bangla → Latin transliteration map (vowel-stripped, consonant-first chars)
// Used to derive a meaningful invoice prefix from a Bengali shop name.
// ---------------------------------------------------------------------------

const BANGLA_TO_LATIN: Record<string, string> = {
    // Vowels (independent)
    "অ": "A", "আ": "A", "ই": "I", "ঈ": "I", "উ": "U", "ঊ": "U",
    "ঋ": "R", "এ": "E", "ঐ": "OI", "ও": "O", "ঔ": "OU",
    // Consonants
    "ক": "K", "খ": "KH", "গ": "G", "ঘ": "GH", "ঙ": "NG",
    "চ": "C", "ছ": "CH", "জ": "J", "ঝ": "JH", "ঞ": "NY",
    "ট": "T", "ঠ": "TH", "ড": "D", "ঢ": "DH", "ণ": "N",
    "ত": "T", "থ": "TH", "দ": "D", "ধ": "DH", "ন": "N",
    "প": "P", "ফ": "PH", "ব": "B", "ভ": "BH", "ম": "M",
    "য": "Y", "র": "R", "ল": "L", "শ": "SH", "ষ": "SH",
    "স": "S", "হ": "H", "ড়": "R", "ঢ়": "RH", "য়": "Y",
    // Hasanta & nukta (strip)
    "্": "", "়": "",
    // Matras (vowel diacritics — strip)
    "া": "", "ি": "", "ী": "", "ু": "", "ূ": "",
    "ৃ": "", "ে": "", "ৈ": "", "ো": "", "ৌ": "",
    "ৎ": "T", "ৄ": "",
    // Anusvara / Visarga
    "ং": "N", "ঃ": "H",
    // Digits (keep as-is handled below)
};

/**
 * Derives a short uppercase invoice prefix from a shop name.
 * Handles both Bangla and Latin words.
 * Strategy: take first word's first 2 chars + last word's first 2 chars (if different), uppercase.
 * For Bangla chars, map each character through BANGLA_TO_LATIN then take first 2 Latin letters.
 */
function buildInvoicePrefixFromName(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "INV";

    const transliterateWord = (word: string): string => {
        // Check if it has any Bangla characters
        const hasBangla = /[\u0980-\u09FF]/.test(word);
        if (!hasBangla) {
            // Latin word — strip non-alphanumeric, take first 2 uppercase letters
            return word.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase();
        }
        // Bangla word — map chars through BANGLA_TO_LATIN, collect result
        let result = "";
        for (const ch of word) {
            const mapped = BANGLA_TO_LATIN[ch];
            if (mapped !== undefined) {
                result += mapped;
            } else if (/[A-Za-z0-9]/.test(ch)) {
                result += ch.toUpperCase();
            }
            // else: unknown char, skip
        }
        // Take first 2 Latin letters from result
        return result.replace(/[^A-Z0-9]/g, "").slice(0, 2);
    };

    const firstPart = transliterateWord(words[0]);
    const lastPart = words.length > 1 ? transliterateWord(words[words.length - 1]) : "";

    const combined = (firstPart + lastPart).slice(0, 6) || "INV";
    return combined.length >= 2 ? combined : "INV";
}

// ---------------------------------------------------------------------------
// Inline SVG Icons (HeroIcons style, 24×24, stroke-based)
// ---------------------------------------------------------------------------

function IconStore() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
        </svg>
    );
}

function IconShirt() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
    );
}

function IconDevicePhone() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
        </svg>
    );
}

function IconUtensils() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m15-3.379a48.474 48.474 0 0 0-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 0 1 3 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 0 1 6 13.12M12.265 3.11a.375.375 0 1 1-.53 0L12 2.845l.265.265Zm-3 0a.375.375 0 1 1-.53 0L9 2.845l.265.265Zm6 0a.375.375 0 1 1-.53 0L15 2.845l.265.265Z" />
        </svg>
    );
}

function IconMedicalCross() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.59L4.5 14.25v6a2.25 2.25 0 0 0 2.25 2.25h10.5A2.25 2.25 0 0 0 19.5 20.25v-6l-4.591-3.842a2.25 2.25 0 0 1-.659-1.59V3.104a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75Z" />
        </svg>
    );
}

function IconPencil() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />
        </svg>
    );
}

function IconWrench() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-2.497a2.25 2.25 0 0 1 3.182 0l2.496 2.497M11.42 15.17l-4.655 4.655a2.548 2.548 0 1 1-3.606-3.606l4.655-4.655m0 0L2.77 8.25a2.25 2.25 0 0 1 0-3.182l3.182-3.182a2.25 2.25 0 0 1 3.182 0l4.655 4.655" />
        </svg>
    );
}

function IconBox() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
        </svg>
    );
}

function IconCake() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-3m0 0a1.5 1.5 0 0 1 3 0m-3 0a1.5 1.5 0 0 0-3 0m0 3h6m6 6.75H3m18 0v3a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-3m18 0a4.5 4.5 0 0 0-4.5-4.5h-9A4.5 4.5 0 0 0 3 15" />
        </svg>
    );
}

function IconCandy() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75 9.75 14.25m8.25-3a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm-12 0a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM6 6l-1.5-1.5M6 18l-1.5 1.5m12-15 1.5-1.5m-1.5 15 1.5 1.5" />
        </svg>
    );
}

function IconSparkles() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
        </svg>
    );
}

function IconBook() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292" />
        </svg>
    );
}

function IconGem() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="m6 3 6 18 6-18M3 8.25h18M4.5 3h15l-3 5.25h-9L4.5 3Z" />
        </svg>
    );
}

function IconPrinter() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5V4.875c0-.621.504-1.125 1.125-1.125h8.25c.621 0 1.125.504 1.125 1.125V7.5m-10.5 9V19.125c0 .621.504 1.125 1.125 1.125h8.25c.621 0 1.125-.504 1.125-1.125V16.5m-12 0h12m-12 0a2.25 2.25 0 0 1-2.25-2.25V10.5A2.25 2.25 0 0 1 6.75 8.25h10.5a2.25 2.25 0 0 1 2.25 2.25v3.75a2.25 2.25 0 0 1-2.25 2.25" />
        </svg>
    );
}

function IconMicrophone() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
        </svg>
    );
}

function IconBookOpen() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
        </svg>
    );
}

function IconCube() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
    );
}

function IconCheckCircle() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-20 h-20">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
    );
}

function IconArrowLeft() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
    );
}

function IconPlus() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    );
}

/** Map business type value → icon component */
const TYPE_ICONS: Record<string, () => React.JSX.Element> = {
    GROCERY: IconStore,
    FASHION: IconShirt,
    ELECTRONICS: IconDevicePhone,
    RESTAURANT: IconUtensils,
    PHARMACY: IconMedicalCross,
    STATIONERY: IconPencil,
    HARDWARE: IconWrench,
    BAKERY: IconCake,
    MOBILE_SHOP: IconDevicePhone,
    TAILORING: IconShirt,
    SWEETS_SHOP: IconCandy,
    COSMETICS: IconSparkles,
    BOOKSHOP: IconBook,
    JEWELLERY: IconGem,
    PRINTING: IconPrinter,
    OTHER: IconBox,
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

function OnboardingPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const locale = useLocale();
    const t = useTranslations("onboarding");
    const tc = useTranslations("common");
    const tb = useTranslations("business");
    const forceNewBusiness = searchParams.get("mode") === "new";

    // Auth
    const accessToken = useAuthStore((s) => s.accessToken);

    // Business store
    const loadBusinesses = useBusinessStore((s) => s.loadBusinesses);
    const storeCreateBusiness = useBusinessStore((s) => s.createBusiness);

    // Wizard state
    const [currentStep, setCurrentStep] = useState(1);
    const [businessData, setBusinessData] = useState<Partial<BusinessCreateRequest>>(DEFAULT_BUSINESS_DATA);
    const [createdBusinessId, setCreatedBusinessId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    const [isResuming, setIsResuming] = useState(true);
    const [newFlowInitialized, setNewFlowInitialized] = useState(false);
    const [error, setError] = useState("");
    const hasDraftRef = useRef(false);

    type OnboardingDraft = {
        currentStep: number;
        businessData: Partial<BusinessCreateRequest>;
        createdBusinessId: string | null;
        quickProducts: Array<{ name: string; price: string }>;
        customType: string;
        dueEnabled: boolean;
        paymentTerms: string;
        customPaymentTerms: string;
        taxEnabled: boolean;
        taxRate: string;
        taxNumber: string;
        paymentChannel: "" | PaymentMethod;
        paymentReceiverNumber: string;
        aiAssistantEnabled: boolean;
        tutorialIndex: number;
    };

    // Step 4: Quick products
    const [productName, setProductName] = useState("");
    const [productPrice, setProductPrice] = useState("");
    const [quickProducts, setQuickProducts] = useState<
        Array<{ name: string; price: string }>
    >([]);

    // Step 2: Custom type (when "OTHER" is selected)
    const [customType, setCustomType] = useState("");
    const [businessTypeOptions, setBusinessTypeOptions] = useState<OnboardingBusinessTypeOption[]>(BUSINESS_TYPES);
    const [categoryPreview, setCategoryPreview] = useState<string[]>([]);
    const [isCategoryLoading, setIsCategoryLoading] = useState(false);

    // Step 5: Due setup
    const [dueEnabled, setDueEnabled] = useState(false);
    const [paymentTerms, setPaymentTerms] = useState("30");
    const [customPaymentTerms, setCustomPaymentTerms] = useState("");
    const [taxEnabled, setTaxEnabled] = useState(false);
    const [taxRate, setTaxRate] = useState("");
    const [taxNumber, setTaxNumber] = useState("");
    const [paymentChannel, setPaymentChannel] = useState<"" | PaymentMethod>("");
    const [paymentReceiverNumber, setPaymentReceiverNumber] = useState("");
    const [aiAssistantEnabled, setAiAssistantEnabled] = useState(true);

    // Step 6: Tutorial
    const [tutorialIndex, setTutorialIndex] = useState(0);

    // Subscription check
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [subscription, setSubscription] = useState<Subscription | null>(null);

    // ---------------------------------------------------------------------------
    // Subscription check on mount
    // ---------------------------------------------------------------------------

    useEffect(() => {
        if (!isHydrated || !accessToken) return;

        let cancelled = false;
        const checkSubscription = async () => {
            try {
                // Always bust cache — this page may be reached right after payment completion
                invalidateCurrentSubscriptionCache();
                const sub = await getCurrentSubscription();
                if (cancelled) return;
                setSubscription(sub);
                if (!sub || !["ACTIVE", "TRIAL", "GRACE"].includes(sub.status)) {
                    setShowSubscriptionModal(true);
                } else {
                    setShowSubscriptionModal(false);
                }
            } catch {
                setShowSubscriptionModal(true);
            }
        };
        void checkSubscription();

        // Also re-check when payment page signals subscription refresh
        const onRefresh = () => { void checkSubscription(); };
        window.addEventListener("dokaniai:subscription-refresh", onRefresh);
        return () => {
            cancelled = true;
            window.removeEventListener("dokaniai:subscription-refresh", onRefresh);
        };
    }, [isHydrated, accessToken]);

    // ---------------------------------------------------------------------------
    // Auth guard + hydration
    // ---------------------------------------------------------------------------

    useEffect(() => {
        const timer = setTimeout(() => setIsHydrated(true), 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isHydrated || typeof window === "undefined") return;
        try {
            const raw = localStorage.getItem(ONBOARDING_DRAFT_KEY);
            if (!raw) return;
            hasDraftRef.current = true;
            const draft = JSON.parse(raw) as OnboardingDraft;
            if (draft.currentStep >= 1 && draft.currentStep <= TOTAL_STEPS) {
                setCurrentStep(draft.currentStep);
            }
            setBusinessData(draft.businessData || DEFAULT_BUSINESS_DATA);
            setCreatedBusinessId(draft.createdBusinessId || null);
            setQuickProducts(Array.isArray(draft.quickProducts) ? draft.quickProducts : []);
            setCustomType(draft.customType || "");
            setDueEnabled(Boolean(draft.dueEnabled));
            setPaymentTerms(draft.paymentTerms || "30");
            setCustomPaymentTerms(draft.customPaymentTerms || "");
            setTaxEnabled(Boolean(draft.taxEnabled));
            setTaxRate(draft.taxRate || "");
            setTaxNumber(draft.taxNumber || "");
            setPaymentChannel(
                PAYMENT_CHANNELS.includes(draft.paymentChannel as PaymentMethod)
                    ? (draft.paymentChannel as PaymentMethod)
                    : "",
            );
            setPaymentReceiverNumber(draft.paymentReceiverNumber || "");
            setAiAssistantEnabled(draft.aiAssistantEnabled !== false);
            setTutorialIndex(typeof draft.tutorialIndex === "number" ? draft.tutorialIndex : 0);
        } catch {
            // ignore corrupted draft
        }
    }, [isHydrated]);

    useEffect(() => {
        if (!isHydrated || !forceNewBusiness || newFlowInitialized) return;
        if (typeof window !== "undefined") {
            localStorage.removeItem(ONBOARDING_DRAFT_KEY);
        }
        setCurrentStep(2);
        setBusinessData(DEFAULT_BUSINESS_DATA);
        setCreatedBusinessId(null);
        setQuickProducts([]);
        setCustomType("");
        setDueEnabled(false);
        setPaymentTerms("30");
        setCustomPaymentTerms("");
        setTaxEnabled(false);
        setTaxRate("");
        setTaxNumber("");
        setPaymentChannel("");
        setPaymentReceiverNumber("");
        setAiAssistantEnabled(true);
        setTutorialIndex(0);
        setError("");
        setNewFlowInitialized(true);
    }, [forceNewBusiness, isHydrated, newFlowInitialized]);

    useEffect(() => {
        if (!isHydrated || !accessToken) return;

        let cancelled = false;
        const loadTypeOptions = async () => {
            try {
                const options = await businessApi.listBusinessTypeOptions();
                if (cancelled || options.length === 0) return;

                const mapped: OnboardingBusinessTypeOption[] = options.map((option: BusinessTypeOptionResponse) => ({
                    value: option.value,
                    labelKey: BUSINESS_TYPE_LABEL_KEYS[option.value],
                    displayNameEn: option.displayNameEn,
                    displayNameBn: option.displayNameBn,
                }));
                setBusinessTypeOptions(mapped);
            } catch {
                // Keep fallback options silently.
            }
        };

        void loadTypeOptions();
        return () => {
            cancelled = true;
        };
    }, [isHydrated, accessToken]);

    const loadCategoryPreview = useCallback(
        async (typeValue: string | undefined) => {
            if (!typeValue) {
                setCategoryPreview([]);
                return;
            }

            if (typeValue === "OTHER") {
                setCategoryPreview(getFallbackCategoryPreview(typeValue));
                return;
            }

            setIsCategoryLoading(true);
            try {
                const categories: CategoryResponse[] = await getCategoriesByBusinessType(typeValue);
                const roots = categories
                    .filter((category) => !category.parentId)
                    .map((category) => (locale === "bn" ? category.nameBn : (category.nameEn ?? category.nameBn)))
                    .slice(0, 8);

                setCategoryPreview(roots.length > 0 ? roots : getFallbackCategoryPreview(typeValue));
            } catch {
                setCategoryPreview(getFallbackCategoryPreview(typeValue));
            } finally {
                setIsCategoryLoading(false);
            }
        },
        [locale],
    );

    useEffect(() => {
        void loadCategoryPreview(businessData.type);
    }, [businessData.type, loadCategoryPreview]);

    const getExistingBusinessId = useCallback(() => {
        if (forceNewBusiness) return null;
        const store = useBusinessStore.getState();
        return store.activeBusinessId &&
            store.businesses.some((b) => b.id === store.activeBusinessId && b.status === "ACTIVE")
            ? store.activeBusinessId
            : null;
    }, [forceNewBusiness]);

    const ensureProfileDescription = useCallback(async (businessId: string, expectedDescription?: string) => {
        const normalizedExpected = expectedDescription?.trim();
        if (!normalizedExpected) {
            return;
        }

        for (let attempt = 0; attempt < PROFILE_VERIFY_MAX_ATTEMPTS; attempt += 1) {
            try {
                const profile = await businessApi.getBusinessProfile(businessId);
                const currentDescription = profile.description?.trim() ?? "";
                if (currentDescription === normalizedExpected) {
                    return;
                }
            } catch {
                // Profile can be briefly unavailable right after business creation.
            }

            if (attempt < PROFILE_VERIFY_MAX_ATTEMPTS - 1) {
                await new Promise((resolve) => setTimeout(resolve, PROFILE_VERIFY_BASE_DELAY_MS * (attempt + 1)));
            }
        }

        try {
            await businessApi.updateBusinessProfile(businessId, { description: normalizedExpected });
        } catch {
            // Non-blocking fallback; onboarding continues even if profile sync fails.
        }
    }, []);

    // ---------------------------------------------------------------------------
    // Draft persistence
    // ---------------------------------------------------------------------------

    useEffect(() => {
        if (!isHydrated) return;

        const draft: OnboardingDraft = {
            currentStep,
            businessData,
            createdBusinessId,
            quickProducts,
            customType,
            dueEnabled,
            paymentTerms,
            customPaymentTerms,
            taxEnabled,
            taxRate,
            taxNumber,
            paymentChannel,
            paymentReceiverNumber,
            aiAssistantEnabled,
            tutorialIndex,
        };
        localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(draft));
    }, [
        isHydrated,
        currentStep,
        businessData,
        createdBusinessId,
        quickProducts,
        customType,
        dueEnabled,
        paymentTerms,
        customPaymentTerms,
        taxEnabled,
        taxRate,
        taxNumber,
        paymentChannel,
        paymentReceiverNumber,
        aiAssistantEnabled,
        tutorialIndex,
    ]);

    useEffect(() => {
        if (!isHydrated) return;

        if (!accessToken) {
            router.replace("/login");
            return;
        }

        let cancelled = false;

        const resume = async () => {
            try {
                if (forceNewBusiness && !createdBusinessId) {
                    return;
                }

                await loadBusinesses();
                if (cancelled) return;

                const store = useBusinessStore.getState();
                const validActiveBusiness = forceNewBusiness
                    ? null
                    : store.activeBusinessId &&
                        store.businesses.some((b) => b.id === store.activeBusinessId && b.status === "ACTIVE")
                        ? store.activeBusinessId
                        : null;

                if (!validActiveBusiness && store.activeBusinessId) {
                    useBusinessStore.getState().clearActiveBusiness();
                }

                const bid = createdBusinessId || validActiveBusiness;

                if (bid) {
                    try {
                        const onboarding = await businessApi.getOnboarding(bid);
                        if (cancelled) return;

                        if (onboarding.onboardingCompleted) {
                            router.replace(`/shop/${bid}`);
                            return;
                        }

                        const serverStep = Math.min(onboarding.setupStep, TOTAL_STEPS);
                        if (!hasDraftRef.current && serverStep > 1) {
                            setCurrentStep(serverStep);
                        }
                        setCreatedBusinessId(bid);
                    } catch (error) {
                        if (!isHttpNotFound(error)) {
                            // Keep expected 404 silent; surface unexpected failures for debugging.
                            console.error("Failed to resume onboarding state", error);
                        }
                    }
                }
            } finally {
                if (!cancelled) setIsResuming(false);
            }
        };

        resume();

        return () => {
            cancelled = true;
        };
    }, [forceNewBusiness, isHydrated, accessToken, createdBusinessId, loadBusinesses, router]);

    // ---------------------------------------------------------------------------
    // Step navigation
    // ---------------------------------------------------------------------------

    const advanceStep = useCallback(
        async (nextStep: number) => {
            const bid = createdBusinessId || getExistingBusinessId();
            if (bid && nextStep <= TOTAL_STEPS) {
                try {
                    await businessApi.updateOnboardingStep(bid, nextStep);
                } catch {
                    // Non-critical — continue anyway
                }
            }
            setCurrentStep(nextStep);
            setError("");
        },
        [createdBusinessId, getExistingBusinessId],
    );

    // Step 1: Welcome → Start
    const handleWelcomeStart = () => advanceStep(2);

    // Step 2: Business Type → Select & Next
    const handleTypeSelect = (type: string) => {
        setBusinessData((prev) => ({ ...prev, type }));
        if (type !== "OTHER") setCustomType("");
    };

    const handleTypeNext = () => {
        if (!businessData.type) return;
        // If "OTHER" selected, use custom type name as the business type
        if (businessData.type === "OTHER" && customType.trim()) {
            setBusinessData((prev) => ({ ...prev, type: customType.trim().toUpperCase() }));
        }
        advanceStep(3);
    };

    // Step 3: Business Name → Submit & Create
    const handleNameSubmit = async () => {
        if (!businessData.name?.trim()) {
            setError(tb("form.errorNameRequired"));
            return;
        }
        setError("");
        setIsLoading(true);
        try {
            const existingBusinessId = getExistingBusinessId();
            let targetBusinessId = createdBusinessId || existingBusinessId || null;

            if (!createdBusinessId && !existingBusinessId) {
                const business = await storeCreateBusiness({
                    name: businessData.name.trim(),
                    type: businessData.type || "OTHER",
                    description: businessData.description,
                    currency: businessData.currency || "BDT",
                });
                setCreatedBusinessId(business.id);
                useBusinessStore.getState().setActiveBusiness(business);
                targetBusinessId = business.id;
            }

            if (targetBusinessId) {
                await ensureProfileDescription(targetBusinessId, businessData.description);
            }

            advanceStep(4);
        } catch (err: unknown) {
            const resp = err && typeof err === "object" && "response" in err
                ? (err as { response?: { status?: number; data?: { message?: string } } }).response
                : undefined;
            if (resp?.status === 402) {
                setShowSubscriptionModal(true);
                return;
            }
            const isLimitError = resp?.status === 400
                || (resp?.data?.message?.toLowerCase().includes("limit"));
            setError(isLimitError ? tb("list.errorCreateLimitReached") : tb("list.errorCreate"));
        } finally {
            setIsLoading(false);
        }
    };

    // Step 4: Add Products
    const handleAddProduct = () => {
        if (!productName.trim()) return;
        setQuickProducts((prev) => [
            ...prev,
            { name: productName.trim(), price: productPrice.trim() },
        ]);
        setProductName("");
        setProductPrice("");
    };

    const handleLoadSampleData = async () => {
        const bid = createdBusinessId || getExistingBusinessId();
        const products = getSampleProductsByBusinessType(businessData.type);
        setQuickProducts(products);

        if (!bid) {
            return;
        }
        setIsLoading(true);
        setError("");
        try {
            await businessApi.markSampleDataLoaded(bid);
        } catch {
            setError(t("addProducts.sampleDataFailed"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleProductsDone = async () => {
        const bid = createdBusinessId || getExistingBusinessId();
        if (!bid || quickProducts.length === 0) {
            advanceStep(5);
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            // Persist each quick-product to the backend
            await Promise.all(
                quickProducts.map((p) =>
                    createProduct(bid, {
                        name: p.name,
                        unit: "piece",
                        costPrice: 0,
                        sellPrice: p.price ? Number(p.price) || 0 : 0,
                    })
                )
            );
        } catch {
            // Non-fatal: continue onboarding even if some products fail to save
            console.error("Failed to save some onboarding products");
        } finally {
            setIsLoading(false);
        }

        advanceStep(5);
    };

    // Step 5: Due Setup + essentials
    const handleDueNext = async () => {
        const bid = createdBusinessId || getExistingBusinessId();

        const parsedTaxRate = taxRate.trim() ? Number(taxRate) : undefined;
        if (taxEnabled && taxRate.trim() && (parsedTaxRate == null || Number.isNaN(parsedTaxRate))) {
            setError(t("dueSetup.taxRateInvalid"));
            return;
        }

        if (!bid) {
            await advanceStep(6);
            return;
        }

        setIsLoading(true);
        setError("");
        try {
            const autoInvoicePrefix = buildInvoicePrefixFromName(businessData.name ?? "");
            const effectiveDeadlineDays = paymentTerms === "custom"
                ? (parseInt(customPaymentTerms) || 30)
                : (parseInt(paymentTerms) || 30);

            await businessApi.updateBusinessSettings(bid, {
                taxEnabled,
                taxRate: taxEnabled ? parsedTaxRate : undefined,
                taxNumber: taxEnabled ? (taxNumber.trim() || undefined) : undefined,
                paymentChannel: paymentChannel || undefined,
                paymentReceiverNumber: paymentReceiverNumber.trim() || undefined,
                aiAssistantEnabled,
                invoicePrefix: autoInvoicePrefix !== "INV" ? autoInvoicePrefix : undefined,
                dueEnabled,
                paymentDeadlineDays: dueEnabled ? effectiveDeadlineDays : undefined,
            });

            if (paymentReceiverNumber.trim()) {
                await businessApi.updateBusinessProfile(bid, {
                    whatsappNumber: paymentReceiverNumber.trim(),
                });
            }

            await advanceStep(6);
        } catch {
            setError(t("dueSetup.saveFailed"));
        } finally {
            setIsLoading(false);
        }
    };

    // Step 6: Tutorial → Complete
    const handleTutorialGotIt = () => {
        if (tutorialIndex < 2) {
            setTutorialIndex((prev) => prev + 1);
        } else {
            handleComplete();
        }
    };

    // Step 7: Complete
    const handleComplete = useCallback(async () => {
        const bid = createdBusinessId || getExistingBusinessId();

        setIsLoading(true);
        setError("");
        if (bid) {
            try {
                await businessApi.completeOnboarding(bid);
            } catch {
                setError(t("complete.failed"));
                setIsLoading(false);
                return;
            }
        }
        if (typeof window !== "undefined") {
            localStorage.removeItem(ONBOARDING_DRAFT_KEY);
        }
        setIsLoading(false);
        router.replace(bid ? `/shop/${bid}` : "/businesses");
    }, [createdBusinessId, getExistingBusinessId, router, t]);

    // ---------------------------------------------------------------------------
    // Render: Progress Bar
    // ---------------------------------------------------------------------------

    const renderProgressBar = () => {
        if (currentStep <= 1 || currentStep > TOTAL_STEPS) return null;

        const pct = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;

        return (
            <div className="mb-8">
                <p className="text-sm text-on-surface-variant mb-2">
                    {t("progress", { current: currentStep, total: TOTAL_STEPS })}
                </p>
                <div className="bg-surface-container-low rounded-full h-2">
                    <div
                        className="bg-primary rounded-full h-2 transition-all duration-500 ease-out"
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>
        );
    };

    // ---------------------------------------------------------------------------
    // Render: Navigation Buttons
    // ---------------------------------------------------------------------------

    const renderNavButtons = ({
        showBack = false,
        onBack,
        onNext,
        nextDisabled = false,
        nextLabel,
        loading = false,
    }: {
        showBack?: boolean;
        onBack?: () => void;
        onNext?: () => void;
        nextDisabled?: boolean;
        nextLabel?: string;
        loading?: boolean;
    }) => (
        <div className="flex items-center justify-between mt-8 gap-3">
            {showBack ? (
                <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface transition-colors px-4 py-3 rounded-xl bg-surface-container"
                >
                    <IconArrowLeft />
                    <span>{t("back")}</span>
                </button>
            ) : (
                <div />
            )}

            <div className="flex items-center gap-3">
                {onNext && (
                    <div className="min-w-[140px]">
                        <GradientButton
                            onClick={onNext}
                            disabled={nextDisabled || loading}
                            loading={loading}
                        >
                            {nextLabel || t("next")}
                        </GradientButton>
                    </div>
                )}
            </div>
        </div>
    );

    // ---------------------------------------------------------------------------
    // Step 1: Welcome
    // ---------------------------------------------------------------------------

    const renderStep1 = () => (
        <div className="text-center py-8">
            {/* Decorative icon */}
            <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-12 h-12 text-primary"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                    />
                </svg>
            </div>

            <h2 className="text-2xl font-bold text-on-surface mb-3">
                {t("welcome.title")}
            </h2>
            <p className="text-on-surface-variant text-lg mb-10 max-w-md mx-auto leading-relaxed">
                {t("welcome.subtitle")}
            </p>

            <div className="max-w-xs mx-auto">
                <GradientButton onClick={handleWelcomeStart}>
                    {t("welcome.startButton")}
                </GradientButton>
            </div>
        </div>
    );

    // ---------------------------------------------------------------------------
    // Step 2: Business Type
    // ---------------------------------------------------------------------------

    const renderStep2 = () => (
        <div>
            <h2 className="text-2xl font-bold text-on-surface mb-2">
                {t("businessType.title")}
            </h2>
            <p className="text-on-surface-variant mb-6">
                {t("businessType.subtitle")}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {businessTypeOptions.map((bt) => {
                    const isSelected = businessData.type === bt.value;
                    const IconComp = TYPE_ICONS[bt.value] || IconBox;
                    const localizedLabel = bt.labelKey
                        ? tb(`types.${bt.labelKey}`)
                        : locale === "bn"
                            ? (bt.displayNameBn ?? bt.displayNameEn ?? bt.value)
                            : (bt.displayNameEn ?? bt.displayNameBn ?? bt.value);

                    return (
                        <button
                            key={bt.value}
                            type="button"
                            onClick={() => handleTypeSelect(bt.value)}
                            className={`
                flex flex-col items-center gap-2 p-4 rounded-2xl transition-all
                bg-surface-container-low
                ${isSelected
                                    ? "ring-2 ring-primary bg-primary/5"
                                    : "hover:bg-surface-container"
                                }
              `}
                        >
                            <div
                                className={`${isSelected ? "text-primary" : "text-on-surface-variant"
                                    }`}
                            >
                                <IconComp />
                            </div>
                            <span
                                className={`text-sm font-medium ${isSelected ? "text-primary" : "text-on-surface"
                                    }`}
                            >
                                {localizedLabel}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Custom type input when "OTHER" is selected */}
            {businessData.type === "OTHER" && (
                <div className="mt-4">
                    <FormInput
                        label={t("businessType.customTypeLabel")}
                        type="text"
                        placeholder={t("businessType.customTypePlaceholder")}
                        value={customType}
                        onChange={(e) => setCustomType(e.target.value)}
                    />
                </div>
            )}

            <div className="mt-5 rounded-2xl bg-surface-container-low p-4">
                <h4 className="text-sm font-bold text-on-surface mb-2">{t("businessType.categoryPreviewTitle")}</h4>
                {isCategoryLoading ? (
                    <p className="text-sm text-on-surface-variant">{t("businessType.categoryPreviewLoading")}</p>
                ) : categoryPreview.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {categoryPreview.map((name) => (
                            <span key={name} className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary font-medium">
                                {name}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-on-surface-variant">{t("businessType.categoryPreviewEmpty")}</p>
                )}
            </div>

            {renderNavButtons({
                showBack: true,
                onBack: () => setCurrentStep(1),
                onNext: handleTypeNext,
                nextDisabled: !businessData.type || (businessData.type === "OTHER" && !customType.trim()),
                nextLabel: t("next"),
            })}
        </div>
    );

    // ---------------------------------------------------------------------------
    // Step 3: Business Name
    // ---------------------------------------------------------------------------

    const renderStep3 = () => (
        <div>
            <h2 className="text-2xl font-bold text-on-surface mb-2">
                {t("businessName.title")}
            </h2>
            <p className="text-on-surface-variant mb-6">
                {t("businessName.subtitle")}
            </p>

            <div className="space-y-4">
                <FormInput
                    label={tb("form.nameLabel")}
                    placeholder={tb("form.namePlaceholder")}
                    value={businessData.name || ""}
                    onChange={(e) =>
                        setBusinessData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    error={error}
                />

                <FormInput
                    label={tb("form.descriptionLabel")}
                    placeholder={tb("form.descriptionPlaceholder")}
                    value={businessData.description || ""}
                    onChange={(e) =>
                        setBusinessData((prev) => ({
                            ...prev,
                            description: e.target.value,
                        }))
                    }
                />

                {/* Currency selector */}
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-primary ml-1">
                        {tb("form.currencyLabel")}
                    </label>
                    <div className="relative">
                        <select
                            value={businessData.currency || "BDT"}
                            onChange={(e) =>
                                setBusinessData((prev) => ({
                                    ...prev,
                                    currency: e.target.value,
                                }))
                            }
                            className="w-full pl-6 pr-10 py-4 bg-surface-container-highest rounded-[1rem] text-lg text-on-surface appearance-none focus:ring-2 focus:ring-primary-fixed-dim transition-all"
                        >
                            {CURRENCIES.map((c) => (
                                <option key={c.value} value={c.value}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-5 h-5"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                                />
                            </svg>
                        </span>
                    </div>
                </div>
            </div>

            {renderNavButtons({
                showBack: true,
                onBack: () => setCurrentStep(2),
                onNext: handleNameSubmit,
                nextDisabled: !businessData.name?.trim(),
                nextLabel: t("next"),
                loading: isLoading,
            })}
        </div>
    );

    // ---------------------------------------------------------------------------
    // Step 4: Add Products
    // ---------------------------------------------------------------------------

    const renderStep4 = () => (
        <div>
            <h2 className="text-2xl font-bold text-on-surface mb-2">
                {t("addProducts.title")}
            </h2>
            <p className="text-on-surface-variant mb-6">
                {t("addProducts.subtitle")}
            </p>

            {/* Quick add form */}
            <div className="bg-surface-container-low rounded-2xl p-4 mb-4">
                <div className="flex gap-2 items-end">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder={t("addProducts.productNamePlaceholder")}
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleAddProduct();
                            }}
                            className="w-full pl-4 pr-4 py-3 bg-surface-container-highest rounded-xl text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary-fixed-dim transition-all"
                        />
                    </div>
                    <div className="w-28">
                        <input
                            type="text"
                            placeholder={t("addProducts.productPricePlaceholder")}
                            value={productPrice}
                            onChange={(e) => setProductPrice(sanitizeNumericInput(e.target.value, { allowDecimal: true, maxIntegerDigits: 10, maxFractionDigits: 2 }))}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleAddProduct();
                            }}
                            className="w-full pl-4 pr-4 py-3 bg-surface-container-highest rounded-xl text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary-fixed-dim transition-all"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleAddProduct}
                        disabled={!productName.trim()}
                        className="p-3 rounded-xl bg-primary text-on-primary disabled:opacity-40 transition-all"
                    >
                        <IconPlus />
                    </button>
                </div>

                {/* Added products list */}
                {quickProducts.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {quickProducts.map((p, i) => (
                            <div
                                key={i}
                                className="flex justify-between items-center bg-surface-container-lowest rounded-xl px-4 py-2"
                            >
                                <span className="text-on-surface">{p.name}</span>
                                {p.price && (
                                    <span className="text-on-surface-variant text-sm">
                                        ৳{formatLocalizedNumber(p.price, locale, { maximumFractionDigits: 2 })}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
                {/* Load sample data */}
                <button
                    type="button"
                    onClick={handleLoadSampleData}
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-surface-container text-on-surface font-medium hover:bg-surface-container-high transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                        />
                    </svg>
                    {t("addProducts.loadSampleData")}
                </button>

                {error && (
                    <p className="text-sm text-error px-1">{error}</p>
                )}
            </div>

            {renderNavButtons({
                showBack: true,
                onBack: () => setCurrentStep(3),
                onNext: handleProductsDone,
                nextLabel: quickProducts.length > 0 ? t("addProducts.done") : t("next"),
                loading: isLoading,
            })}
        </div>
    );

    // ---------------------------------------------------------------------------
    // Step 5: Due Setup
    // ---------------------------------------------------------------------------

    const renderStep5 = () => (
        <div>
            <h2 className="text-2xl font-bold text-on-surface mb-2">
                {t("dueSetup.title")}
            </h2>
            <p className="text-on-surface-variant mb-6">
                {t("dueSetup.subtitle")}
            </p>

            {/* Toggle */}
            <div className="bg-surface-container-low rounded-2xl p-6 mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-on-surface font-medium">
                            {t("dueSetup.yesButton")}
                        </p>
                        <p className="text-on-surface-variant text-sm mt-1">
                            {t("dueSetup.subtitle")}
                        </p>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={dueEnabled}
                        onClick={() => setDueEnabled(!dueEnabled)}
                        className={`
              relative inline-flex h-7 w-12 items-center rounded-full transition-colors
              ${dueEnabled ? "bg-primary" : "bg-surface-container-highest"}
            `}
                    >
                        <span
                            className={`
                inline-block h-5 w-5 rounded-full bg-white transition-transform
                ${dueEnabled ? "translate-x-6" : "translate-x-1"}
              `}
                        />
                    </button>
                </div>

                {/* Payment terms (visible when due enabled) */}
                {dueEnabled && (
                    <div className="mt-4 pt-4 border-t-0">
                        <p className="text-sm font-medium text-on-surface-variant mb-3">
                            {t("dueSetup.paymentTerms")}
                        </p>
                        <div className="flex gap-2 flex-wrap">
                            {["7", "15", "30", "60"].map((days) => (
                                <button
                                    key={days}
                                    type="button"
                                    onClick={() => setPaymentTerms(days)}
                                    className={`
                    px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${paymentTerms === days
                                            ? "bg-primary text-on-primary"
                                            : "bg-surface-container-highest text-on-surface"
                                        }
                  `}
                                >
                                    {days} {t("dueSetup.days")}
                                </button>
                            ))}

                            <button
                                type="button"
                                onClick={() => setPaymentTerms("custom")}
                                className={`
                    px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${paymentTerms === "custom"
                                        ? "bg-primary text-on-primary"
                                        : "bg-surface-container-highest text-on-surface"
                                    }
                  `}
                            >
                                {t("dueSetup.customTerms")}
                            </button>
                        </div>

                        {paymentTerms === "custom" && (
                            <div className="mt-3">
                                <FormInput
                                    label={t("dueSetup.customTermsLabel")}
                                    type="text"
                                    placeholder={t("dueSetup.customTermsPlaceholder")}
                                    value={customPaymentTerms}
                                    onChange={(e) => setCustomPaymentTerms(sanitizeNumericInput(e.target.value, { maxIntegerDigits: 3 }))}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="bg-surface-container-low rounded-2xl p-6 mb-4 space-y-4">
                <div>
                    <p className="text-on-surface font-semibold">
                        {t("dueSetup.businessEssentialsTitle")}
                    </p>
                    <p className="text-on-surface-variant text-sm mt-1">
                        {t("dueSetup.businessEssentialsSubtitle")}
                    </p>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-on-surface font-medium">
                            {t("dueSetup.enableTax")}
                        </p>
                        <p className="text-on-surface-variant text-xs mt-1">
                            {t("dueSetup.enableTaxDesc")}
                        </p>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={taxEnabled}
                        onClick={() => setTaxEnabled(!taxEnabled)}
                        className={`
              relative inline-flex h-7 w-12 items-center rounded-full transition-colors
              ${taxEnabled ? "bg-primary" : "bg-surface-container-highest"}
            `}
                    >
                        <span
                            className={`
                inline-block h-5 w-5 rounded-full bg-white transition-transform
                ${taxEnabled ? "translate-x-6" : "translate-x-1"}
              `}
                        />
                    </button>
                </div>

                {taxEnabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormInput
                            label={t("dueSetup.taxNumber")}
                            type="text"
                            placeholder={t("dueSetup.taxNumberPlaceholder")}
                            value={taxNumber}
                            onChange={(e) => setTaxNumber(e.target.value)}
                        />
                        <FormInput
                            label={t("dueSetup.taxRate")}
                            type="text"
                            placeholder={t("dueSetup.taxRatePlaceholder")}
                            value={taxRate}
                            onChange={(e) =>
                                setTaxRate(
                                    sanitizeNumericInput(e.target.value, {
                                        allowDecimal: true,
                                        maxIntegerDigits: 3,
                                        maxFractionDigits: 2,
                                    }),
                                )
                            }
                        />
                    </div>
                )}

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface-variant">
                        {t("dueSetup.paymentChannelOptional")}
                    </label>
                    <select
                        value={paymentChannel}
                        onChange={(e) => setPaymentChannel(e.target.value as "" | PaymentMethod)}
                        className="w-full pl-4 pr-10 py-3 bg-surface-container-highest rounded-xl text-on-surface appearance-none focus:ring-2 focus:ring-primary-fixed-dim transition-all"
                    >
                        <option value="">{t("dueSetup.paymentChannelPlaceholder")}</option>
                        {PAYMENT_CHANNELS.map((channel) => (
                            <option key={channel} value={channel}>
                                {t(`dueSetup.channel.${channel}` as Parameters<typeof t>[0])}
                            </option>
                        ))}
                    </select>
                </div>

                <FormInput
                    label={t("dueSetup.paymentReceiverNumberOptional")}
                    type="text"
                    placeholder={t("dueSetup.paymentReceiverNumberPlaceholder")}
                    value={paymentReceiverNumber}
                    onChange={(e) => setPaymentReceiverNumber(e.target.value)}
                />

                {paymentChannel && ["BKASH", "NAGAD", "ROCKET"].includes(paymentChannel) && paymentReceiverNumber.trim() && (
                    <p className="text-xs text-primary-fixed-dim flex items-center gap-1.5 -mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                        {t("dueSetup.mfsVerificationHint")}
                    </p>
                )}

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-on-surface font-medium">
                            {t("dueSetup.aiAssistantSync")}
                        </p>
                        <p className="text-on-surface-variant text-xs mt-1">
                            {t("dueSetup.aiAssistantSyncDesc")}
                        </p>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={aiAssistantEnabled}
                        onClick={() => setAiAssistantEnabled(!aiAssistantEnabled)}
                        className={`
              relative inline-flex h-7 w-12 items-center rounded-full transition-colors
              ${aiAssistantEnabled ? "bg-primary" : "bg-surface-container-highest"}
            `}
                    >
                        <span
                            className={`
                inline-block h-5 w-5 rounded-full bg-white transition-transform
                ${aiAssistantEnabled ? "translate-x-6" : "translate-x-1"}
              `}
                        />
                    </button>
                </div>
            </div>

            {error && <p className="text-sm text-error px-1">{error}</p>}

            {renderNavButtons({
                showBack: true,
                onBack: () => setCurrentStep(4),
                onNext: handleDueNext,
                nextLabel: t("next"),
                loading: isLoading,
            })}
        </div>
    );

    // ---------------------------------------------------------------------------
    // Step 6: Tutorial
    // ---------------------------------------------------------------------------

    const TUTORIAL_CARDS = [
        {
            icon: <IconMicrophone />,
            title: t("tutorial.feature1Title"),
            desc: t("tutorial.feature1Desc"),
            color: "text-primary",
            bg: "bg-primary/10",
        },
        {
            icon: <IconBookOpen />,
            title: t("tutorial.feature2Title"),
            desc: t("tutorial.feature2Desc"),
            color: "text-secondary",
            bg: "bg-secondary/10",
        },
        {
            icon: <IconCube />,
            title: t("tutorial.feature3Title"),
            desc: t("tutorial.feature3Desc"),
            color: "text-tertiary",
            bg: "bg-tertiary-container/30",
        },
    ];

    const renderStep6 = () => {
        const card = TUTORIAL_CARDS[tutorialIndex];

        return (
            <div>
                <h2 className="text-2xl font-bold text-on-surface mb-2">
                    {t("tutorial.title")}
                </h2>
                <p className="text-on-surface-variant mb-6">
                    {t("tutorial.subtitle")}
                </p>

                {/* Tutorial card */}
                <div className="bg-surface-container-low rounded-2xl p-8 text-center">
                    <div
                        className={`mx-auto mb-4 w-20 h-20 rounded-full ${card.bg} flex items-center justify-center ${card.color}`}
                    >
                        {card.icon}
                    </div>
                    <h3 className="text-xl font-bold text-on-surface mb-2">
                        {card.title}
                    </h3>
                    <p className="text-on-surface-variant leading-relaxed">{card.desc}</p>
                </div>

                {/* Dots indicator */}
                <div className="flex justify-center gap-2 mt-4">
                    {TUTORIAL_CARDS.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setTutorialIndex(i)}
                            className={`
                h-2 rounded-full transition-all
                ${i === tutorialIndex
                                    ? "w-6 bg-primary"
                                    : "w-2 bg-surface-container-highest"
                                }
              `}
                        />
                    ))}
                </div>

                {renderNavButtons({
                    showBack: true,
                    onBack: () => {
                        if (tutorialIndex > 0) {
                            setTutorialIndex((prev) => prev - 1);
                        } else {
                            setCurrentStep(5);
                        }
                    },
                    onNext: handleTutorialGotIt,
                    nextLabel:
                        tutorialIndex < 2 ? t("tutorial.gotIt") : t("tutorial.goToDashboard"),
                })}
            </div>
        );
    };

    // ---------------------------------------------------------------------------
    // Step 7: Complete
    // ---------------------------------------------------------------------------

    const renderStep7 = () => (
        <div className="text-center py-8">
            <div className="mx-auto mb-6 text-primary">
                <IconCheckCircle />
            </div>

            <h2 className="text-2xl font-bold text-on-surface mb-3">
                {t("complete.title")}
            </h2>
            <p className="text-on-surface-variant text-lg mb-10 max-w-md mx-auto leading-relaxed">
                {t("complete.subtitle")}
            </p>

            <div className="max-w-xs mx-auto">
                <GradientButton onClick={handleComplete} loading={isLoading}>
                    {t("complete.goToDashboard")}
                </GradientButton>
            </div>
        </div>
    );

    // ---------------------------------------------------------------------------
    // Main render
    // ---------------------------------------------------------------------------

    // Loading / hydration guard
    if (!isHydrated || isResuming) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <p className="text-on-surface-variant text-lg">{tc("loading")}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface flex flex-col">
            {/* Minimal header */}
            <header className="py-6 px-6 text-center">
                <h1 className="text-2xl font-bold text-primary tracking-tight">
                    DokaniAI
                </h1>
            </header>

            {/* Trial Expiry Banner */}
            {subscription?.status === "TRIAL" && subscription.currentPeriodEnd && (
                (() => {
                    const daysLeft = Math.max(0, Math.ceil(Math.abs(
                        new Date(subscription.currentPeriodEnd).getTime() - Date.now()
                    ) / (1000 * 60 * 60 * 24)));
                    return daysLeft <= 7 ? <TrialExpiryBanner daysRemaining={daysLeft} /> : null;
                })()
            )}

            {/* Main wizard card */}
            <main className="flex-1 flex items-start justify-center px-4 pb-8">
                <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full p-6 md:p-8">
                    {/* Progress bar */}
                    {renderProgressBar()}

                    {/* Step content */}
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                    {currentStep === 4 && renderStep4()}
                    {currentStep === 5 && renderStep5()}
                    {currentStep === 6 && renderStep6()}
                    {currentStep === 7 && renderStep7()}
                </div>
            </main>

            {/* Subscription Required Modal */}
            {showSubscriptionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div className="relative bg-surface-container-lowest rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
                        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-tertiary-container/30 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-tertiary">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-on-surface mb-2">
                            {t("subscriptionRequired.title")}
                        </h3>
                        <p className="text-on-surface-variant mb-6">
                            {t("subscriptionRequired.description")}
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={() => router.push("/subscription/upgrade")}
                                className="w-full py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-colors"
                            >
                                {t("subscriptionRequired.viewPlans")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <OnboardingPageContent />
        </Suspense>
    );
}
