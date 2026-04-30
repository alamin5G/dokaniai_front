"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import DataExportPanel from "@/components/settings/DataExportPanel";
import { FormInput, GradientButton } from "@/components/ui/FormPrimitives";
import {
    getBusiness,
    getBusinessLocation,
    getBusinessProfile,
    getBusinessSettings,
    updateBusinessLocation,
    updateBusinessOperatingHours,
    updateBusinessProfile,
    updateBusinessSettings,
} from "@/lib/businessApi";
import { formatLocalizedNumber, sanitizeNumericInput } from "@/lib/localeNumber";
import { useBusinessStore } from "@/store/businessStore";
import type { PaymentMethod } from "@/types/business";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { getMyMfsNumbers, registerMfsNumber } from "@/lib/paymentAdminApi";
import type { MfsNumberResponse } from "@/types/paymentAdmin";

type TabKey = "general" | "profile" | "location" | "mfsNumbers" | "data" | "danger";
type Feedback = { type: "success" | "error" | "warning"; message: string } | null;

const BUSINESS_TYPES = [
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

const CURRENCIES = [
    { value: "BDT", label: "৳ BDT" },
    { value: "USD", label: "$ USD" },
    { value: "EUR", label: "EUR" },
    { value: "GBP", label: "GBP" },
    { value: "INR", label: "INR" },
] as const;

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

const PAYMENT_CHANNEL_LABELS: Record<PaymentMethod, { bn: string; en: string }> = {
    CASH: { bn: "ক্যাশ", en: "Cash" },
    CREDIT: { bn: "বাকি", en: "Credit" },
    BKASH: { bn: "বিকাশ", en: "bKash" },
    NAGAD: { bn: "নগদ (MFS)", en: "Nagad" },
    ROCKET: { bn: "রকেট", en: "Rocket" },
    CARD: { bn: "কার্ড", en: "Card" },
    BANK: { bn: "ব্যাংক", en: "Bank" },
    MANUAL: { bn: "ম্যানুয়াল", en: "Manual" },
};

const COUNTRY_OPTIONS = [
    { value: "BD", label: "Bangladesh" },
    { value: "IN", label: "India" },
    { value: "US", label: "United States" },
    { value: "GB", label: "United Kingdom" },
] as const;

const TIMEZONE_OPTIONS = [
    "Asia/Dhaka",
    "Asia/Kolkata",
    "Asia/Dubai",
    "Asia/Singapore",
    "UTC",
] as const;

const DAY_LABELS = {
    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    bn: ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহস্পতি", "শুক্র", "শনি"],
} as const;

const TAB_ITEMS: { key: TabKey; titleKey: string; descriptionKey: string }[] = [
    { key: "general", titleKey: "settings.tabGeneral", descriptionKey: "settings.tabGeneralDesc" },
    { key: "profile", titleKey: "settings.tabProfile", descriptionKey: "settings.tabProfileDesc" },
    { key: "location", titleKey: "settings.tabLocation", descriptionKey: "settings.tabLocationDesc" },
    { key: "mfsNumbers", titleKey: "settings.tabMfsNumbers", descriptionKey: "settings.tabMfsNumbersDesc" },
    { key: "data", titleKey: "settings.tabData", descriptionKey: "settings.tabDataDesc" },
    { key: "danger", titleKey: "danger.heading", descriptionKey: "danger.description" },
];

function normalizeBusinessTypeValue(value: string | null | undefined): string {
    if (!value) {
        return "OTHER";
    }

    const normalized = value.trim()
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .replace(/[^A-Za-z0-9]+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "")
        .toUpperCase();

    return normalized || "OTHER";
}

function humanizeBusinessType(value: string | null | undefined): string {
    if (!value) {
        return "";
    }

    return value
        .trim()
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

const BANGLA_TO_LATIN: Record<string, string> = {
    "অ": "A", "আ": "A", "ই": "I", "ঈ": "I", "উ": "U", "ঊ": "U",
    "ঋ": "R", "এ": "E", "ঐ": "OI", "ও": "O", "ঔ": "OU",
    "ক": "K", "খ": "KH", "গ": "G", "ঘ": "GH", "ঙ": "NG",
    "চ": "C", "ছ": "CH", "জ": "J", "ঝ": "JH", "ঞ": "NY",
    "ট": "T", "ঠ": "TH", "ড": "D", "ঢ": "DH", "ণ": "N",
    "ত": "T", "থ": "TH", "দ": "D", "ধ": "DH", "ন": "N",
    "প": "P", "ফ": "PH", "ব": "B", "ভ": "BH", "ম": "M",
    "য": "Y", "র": "R", "ল": "L", "শ": "SH", "ষ": "SH",
    "স": "S", "হ": "H", "ড়": "R", "ঢ়": "RH", "য়": "Y",
    "্": "", "়": "",
    "া": "", "ি": "", "ী": "", "ু": "", "ূ": "",
    "ৃ": "", "ে": "", "ৈ": "", "ো": "", "ৌ": "",
    "ৎ": "T", "ৄ": "",
    "ং": "N", "ঃ": "H",
};

function buildInvoicePrefixSuggestion(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "INV";

    const transliterateWord = (word: string): string => {
        const hasBangla = /[\u0980-\u09FF]/.test(word);
        if (!hasBangla) {
            return word.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase();
        }
        let result = "";
        for (const ch of word) {
            const mapped = BANGLA_TO_LATIN[ch];
            if (mapped !== undefined) {
                result += mapped;
            } else if (/[A-Za-z0-9]/.test(ch)) {
                result += ch.toUpperCase();
            }
        }
        return result.replace(/[^A-Z0-9]/g, "").slice(0, 2);
    };

    const firstPart = transliterateWord(words[0]);
    const lastPart = words.length > 1 ? transliterateWord(words[words.length - 1]) : "";
    const combined = (firstPart + lastPart).slice(0, 6) || "INV";
    return combined.length >= 2 ? combined : "INV";
}

function resolveBusinessTypeState(value: string | null | undefined) {
    const normalized = normalizeBusinessTypeValue(value);
    const known = BUSINESS_TYPES.find((item) => item.value === normalized);

    if (known) {
        return { selectedType: known.value, customType: "" };
    }

    return {
        selectedType: "OTHER",
        customType: humanizeBusinessType(value),
    };
}

function SectionCard({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-[1.75rem] border border-outline-variant/30 bg-surface p-5 shadow-sm">
            <div className="mb-5">
                <h2 className="text-lg font-semibold text-on-surface">{title}</h2>
                {description ? (
                    <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
                ) : null}
            </div>
            <div className="space-y-5">{children}</div>
        </section>
    );
}

function SelectField({
    label,
    value,
    onChange,
    children,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    children: ReactNode;
}) {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-bold text-primary ml-1">{label}</label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="w-full appearance-none rounded-[1rem] bg-surface-container-highest px-5 py-4 text-base text-on-surface outline-none ring-0 transition focus:ring-2 focus:ring-primary-fixed-dim"
                >
                    {children}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    ▾
                </span>
            </div>
        </div>
    );
}

function TextAreaField({
    label,
    value,
    onChange,
    placeholder,
    rows = 4,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
}) {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-bold text-primary ml-1">{label}</label>
            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="w-full rounded-[1rem] bg-surface-container-highest px-5 py-4 text-base text-on-surface outline-none transition placeholder:text-outline-variant focus:ring-2 focus:ring-primary-fixed-dim"
            />
        </div>
    );
}

function ToggleField({
    label,
    description,
    checked,
    onChange,
}: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className="flex w-full items-start justify-between gap-4 rounded-[1rem] border border-outline-variant/30 bg-surface-container-high px-4 py-4 text-left"
        >
            <div>
                <p className="font-semibold text-on-surface">{label}</p>
                {description ? (
                    <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
                ) : null}
            </div>
            <span
                className={`mt-1 inline-flex h-7 w-12 rounded-full p-1 transition ${checked ? "bg-primary" : "bg-outline-variant"
                    }`}
            >
                <span
                    className={`h-5 w-5 rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-0"
                        }`}
                />
            </span>
        </button>
    );
}

export default function BusinessSettingsPage() {
    const locale = useLocale();
    const isBn = locale.startsWith("bn");
    const t = useTranslations("business");
    const router = useRouter();
    const pathname = usePathname();

    const {
        activeBusinessId,
        activeBusiness,
        setActiveBusiness,
        updateBusiness,
        archiveBusiness,
    } = useBusinessStore();

    const routeBusinessId = pathname.startsWith("/shop/") ? pathname.split("/")[2] ?? null : null;
    const businessId = routeBusinessId ?? activeBusinessId;
    const weekdayLabels = locale.startsWith("bn") ? DAY_LABELS.bn : DAY_LABELS.en;

    const [pageLoading, setPageLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabKey>("general");
    const [feedback, setFeedback] = useState<Feedback>(null);

    const [generalForm, setGeneralForm] = useState({
        name: "",
        selectedType: "OTHER",
        customType: "",
        description: "",
    });
    const [settingsForm, setSettingsForm] = useState({
        currency: "BDT",
        taxEnabled: false,
        taxRate: "",
        taxNumber: "",
        paymentChannel: "CASH" as PaymentMethod,
        paymentReceiverNumber: "",
        aiAssistantEnabled: true,
        invoicePrefix: "INV",
        invoiceNotes: "",
        receiptFooter: "",
        lowStockThreshold: "10",
        lowStockAlertEnabled: true,
    });
    const [hoursForm, setHoursForm] = useState({
        is24Hours: true,
        operatingHoursStart: "",
        operatingHoursEnd: "",
        operatingDays: [0, 1, 2, 3, 4, 5, 6] as number[],
    });
    const [profileForm, setProfileForm] = useState({
        logoUrl: "",
        coverImageUrl: "",
        contactPerson: "",
        phone: "",
        whatsappNumber: "",
        email: "",
        website: "",
        facebookPage: "",
    });
    const [locationForm, setLocationForm] = useState({
        address: "",
        city: "",
        district: "",
        postalCode: "",
        country: "BD",
        latitude: "",
        longitude: "",
        timezone: "Asia/Dhaka",
    });

    const [generalSaving, setGeneralSaving] = useState(false);
    const [profileSaving, setProfileSaving] = useState(false);
    const [locationSaving, setLocationSaving] = useState(false);
    const [dangerSaving, setDangerSaving] = useState(false);
    const [archiveName, setArchiveName] = useState("");

    const [mfsNumbers, setMfsNumbers] = useState<MfsNumberResponse[]>([]);
    const [mfsNumbersLoading, setMfsNumbersLoading] = useState(false);
    const [mfsRegistering, setMfsRegistering] = useState(false);
    const [mfsForm, setMfsForm] = useState({ mfsType: "BKASH" as "BKASH" | "NAGAD" | "ROCKET", mfsNumber: "", simSlot: 0, accountType: "MERCHANT" as string });
    const [mfsMessage, setMfsMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const showFeedback = (type: "success" | "error" | "warning", message: string) => {
        setFeedback({ type, message });
        window.setTimeout(() => {
            setFeedback((current) => (current?.message === message ? null : current));
        }, 4000);
    };

    useEffect(() => {
        if (pathname === "/dashboard/settings" && activeBusinessId) {
            router.replace(`/shop/${activeBusinessId}/settings`);
        }
    }, [activeBusinessId, pathname, router]);

    useEffect(() => {
        if (!businessId) {
            setPageLoading(false);
            return;
        }

        let cancelled = false;

        const loadPage = async () => {
            setPageLoading(true);

            try {
                const [business, settings, location] = await Promise.all([
                    getBusiness(businessId),
                    getBusinessSettings(businessId),
                    getBusinessLocation(businessId),
                ]);

                let profile = null;
                let profileLoadFailed = false;
                try {
                    profile = await getBusinessProfile(businessId);
                } catch {
                    profileLoadFailed = true;
                }

                if (cancelled) {
                    return;
                }

                setActiveBusiness(business);

                const typeState = resolveBusinessTypeState(business.type);
                setGeneralForm({
                    name: business.name ?? "",
                    selectedType: typeState.selectedType,
                    customType: typeState.customType,
                    description: profile?.description ?? "",
                });

                setSettingsForm({
                    currency: settings.currency ?? "BDT",
                    taxEnabled: Boolean(settings.taxEnabled),
                    taxRate: settings.taxRate != null ? String(settings.taxRate) : "",
                    taxNumber: settings.taxNumber ?? "",
                    paymentChannel: settings.paymentChannel ?? "CASH",
                    paymentReceiverNumber: settings.paymentReceiverNumber ?? "",
                    aiAssistantEnabled: settings.aiAssistantEnabled !== false,
                    invoicePrefix: settings.invoicePrefix ?? "INV",
                    invoiceNotes: settings.invoiceNotes ?? "",
                    receiptFooter: settings.receiptFooter ?? "",
                    lowStockThreshold:
                        settings.lowStockThreshold != null
                            ? String(settings.lowStockThreshold)
                            : "10",
                    lowStockAlertEnabled: settings.lowStockAlertEnabled !== false,
                });

                setHoursForm({
                    is24Hours: settings.is24Hours !== false,
                    operatingHoursStart: settings.operatingHoursStart ?? "",
                    operatingHoursEnd: settings.operatingHoursEnd ?? "",
                    operatingDays: settings.operatingDays?.length
                        ? [...settings.operatingDays].sort((a, b) => a - b)
                        : [0, 1, 2, 3, 4, 5, 6],
                });

                setProfileForm({
                    logoUrl: profile?.logoUrl ?? "",
                    coverImageUrl: profile?.coverImageUrl ?? "",
                    contactPerson: profile?.contactPerson ?? "",
                    phone: profile?.phone ?? "",
                    whatsappNumber: profile?.whatsappNumber ?? "",
                    email: profile?.email ?? "",
                    website: profile?.website ?? "",
                    facebookPage: profile?.facebookPage ?? "",
                });

                setLocationForm({
                    address: location.address ?? "",
                    city: location.city ?? "",
                    district: location.district ?? "",
                    postalCode: location.postalCode ?? "",
                    country: location.country ?? "BD",
                    latitude: location.latitude != null ? String(location.latitude) : "",
                    longitude: location.longitude != null ? String(location.longitude) : "",
                    timezone: location.timezone ?? "Asia/Dhaka",
                });

                setArchiveName("");

                if (profileLoadFailed) {
                    showFeedback("warning", t("settings.profileLoadWarning"));
                }
            } catch {
                if (!cancelled) {
                    showFeedback("error", t("settings.loadError"));
                }
            } finally {
                if (!cancelled) {
                    setPageLoading(false);
                }
            }
        };

        void loadPage();

        return () => {
            cancelled = true;
        };
    }, [businessId, setActiveBusiness, t]);

    const businessTypeLabel =
        generalForm.selectedType === "OTHER" && generalForm.customType.trim()
            ? generalForm.customType.trim()
            : t(`types.${BUSINESS_TYPES.find((item) => item.value === generalForm.selectedType)?.labelKey ?? "other"}`);

    const statusLabel =
        activeBusiness?.status === "ARCHIVED" ? t("list.archivedLabel") : t("list.active");
    const invoicePrefixSuggestion = buildInvoicePrefixSuggestion(activeBusiness?.name ?? "");

    const handleDayToggle = (day: number) => {
        setHoursForm((current) => {
            const nextDays = current.operatingDays.includes(day)
                ? current.operatingDays.filter((item) => item !== day)
                : [...current.operatingDays, day].sort((a, b) => a - b);

            return {
                ...current,
                operatingDays: nextDays,
            };
        });
    };

    const handleSaveGeneral = async () => {
        if (!businessId) {
            return;
        }

        const trimmedName = generalForm.name.trim();
        const typeValue =
            generalForm.selectedType === "OTHER"
                ? generalForm.customType.trim()
                : generalForm.selectedType;

        if (!trimmedName) {
            showFeedback("error", t("form.errorNameRequired"));
            return;
        }

        if (!typeValue) {
            showFeedback("error", t("form.errorTypeRequired"));
            return;
        }

        if (!hoursForm.is24Hours) {
            if (!hoursForm.operatingHoursStart || !hoursForm.operatingHoursEnd) {
                showFeedback("error", t("settings.invalidHours"));
                return;
            }

            if (hoursForm.operatingDays.length === 0) {
                showFeedback("error", t("settings.invalidOperatingDays"));
                return;
            }
        }

        const parsedTaxRate = settingsForm.taxRate.trim()
            ? Number(settingsForm.taxRate)
            : undefined;
        const parsedLowStockThreshold = settingsForm.lowStockThreshold.trim()
            ? Number(settingsForm.lowStockThreshold)
            : undefined;

        if (
            settingsForm.taxRate.trim() &&
            (parsedTaxRate == null || Number.isNaN(parsedTaxRate))
        ) {
            showFeedback("error", t("settings.invalidTaxRate"));
            return;
        }

        if (
            settingsForm.lowStockThreshold.trim() &&
            (parsedLowStockThreshold == null || Number.isNaN(parsedLowStockThreshold))
        ) {
            showFeedback("error", t("settings.invalidLowStockThreshold"));
            return;
        }

        setGeneralSaving(true);

        try {
            await updateBusiness(businessId, {
                name: trimmedName,
                type: typeValue,
                description: generalForm.description.trim() || undefined,
            });

            await Promise.all([
                updateBusinessSettings(businessId, {
                    currency: settingsForm.currency,
                    taxEnabled: settingsForm.taxEnabled,
                    taxRate: settingsForm.taxEnabled ? parsedTaxRate : undefined,
                    taxNumber: settingsForm.taxEnabled
                        ? settingsForm.taxNumber.trim() || undefined
                        : undefined,
                    paymentChannel: settingsForm.paymentChannel,
                    paymentReceiverNumber:
                        settingsForm.paymentReceiverNumber.trim() || undefined,
                    aiAssistantEnabled: settingsForm.aiAssistantEnabled,
                    invoicePrefix: settingsForm.invoicePrefix.trim() || undefined,
                    invoiceNotes: settingsForm.invoiceNotes.trim() || undefined,
                    receiptFooter: settingsForm.receiptFooter.trim() || undefined,
                    lowStockThreshold: parsedLowStockThreshold,
                    lowStockAlertEnabled: settingsForm.lowStockAlertEnabled,
                }),
                updateBusinessOperatingHours(businessId, {
                    is24Hours: hoursForm.is24Hours,
                    operatingHoursStart: hoursForm.is24Hours
                        ? undefined
                        : hoursForm.operatingHoursStart,
                    operatingHoursEnd: hoursForm.is24Hours
                        ? undefined
                        : hoursForm.operatingHoursEnd,
                    operatingDays: hoursForm.is24Hours
                        ? [0, 1, 2, 3, 4, 5, 6]
                        : hoursForm.operatingDays,
                }),
                updateBusinessProfile(businessId, {
                    description: generalForm.description.trim() || undefined,
                }),
            ]);

            const refreshedBusiness = await getBusiness(businessId);
            setActiveBusiness(refreshedBusiness);

            const typeState = resolveBusinessTypeState(refreshedBusiness.type);
            setGeneralForm((current) => ({
                ...current,
                name: refreshedBusiness.name ?? current.name,
                selectedType: typeState.selectedType,
                customType: typeState.customType,
            }));

            showFeedback("success", t("settings.successSave"));
        } catch {
            showFeedback("error", t("settings.errorSave"));
        } finally {
            setGeneralSaving(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!businessId) {
            return;
        }

        setProfileSaving(true);

        try {
            await updateBusinessProfile(businessId, {
                logoUrl: profileForm.logoUrl.trim() || undefined,
                coverImageUrl: profileForm.coverImageUrl.trim() || undefined,
                contactPerson: profileForm.contactPerson.trim() || undefined,
                phone: profileForm.phone.trim() || undefined,
                whatsappNumber: profileForm.whatsappNumber.trim() || undefined,
                email: profileForm.email.trim() || undefined,
                website: profileForm.website.trim() || undefined,
                facebookPage: profileForm.facebookPage.trim() || undefined,
            });
            showFeedback("success", t("profile.successSave"));
        } catch {
            showFeedback("error", t("profile.errorSave"));
        } finally {
            setProfileSaving(false);
        }
    };

    const handleSaveLocation = async () => {
        if (!businessId) {
            return;
        }

        const parsedLatitude = locationForm.latitude.trim()
            ? Number(locationForm.latitude)
            : undefined;
        const parsedLongitude = locationForm.longitude.trim()
            ? Number(locationForm.longitude)
            : undefined;

        if (
            locationForm.latitude.trim() &&
            (parsedLatitude == null || Number.isNaN(parsedLatitude))
        ) {
            showFeedback("error", t("location.invalidLatitude"));
            return;
        }

        if (
            locationForm.longitude.trim() &&
            (parsedLongitude == null || Number.isNaN(parsedLongitude))
        ) {
            showFeedback("error", t("location.invalidLongitude"));
            return;
        }

        setLocationSaving(true);

        try {
            await updateBusinessLocation(businessId, {
                address: locationForm.address.trim() || undefined,
                city: locationForm.city.trim() || undefined,
                district: locationForm.district.trim() || undefined,
                postalCode: locationForm.postalCode.trim() || undefined,
                country: locationForm.country,
                latitude: parsedLatitude,
                longitude: parsedLongitude,
                timezone: locationForm.timezone,
            });
            showFeedback("success", t("location.successSave"));
        } catch {
            showFeedback("error", t("location.errorSave"));
        } finally {
            setLocationSaving(false);
        }
    };

    const handleArchive = async () => {
        if (!businessId || !activeBusiness) {
            return;
        }

        if (archiveName.trim() !== activeBusiness.name) {
            showFeedback("error", t("danger.nameMismatch"));
            return;
        }

        setDangerSaving(true);

        try {
            await archiveBusiness(businessId);
            router.push("/businesses");
        } catch {
            showFeedback("error", t("list.errorArchive"));
            setDangerSaving(false);
        }
    };

    const loadMfsNumbers = useCallback(async () => {
        setMfsNumbersLoading(true);
        try {
            const numbers = await getMyMfsNumbers();
            setMfsNumbers(numbers);
        } catch {
            setMfsMessage({ type: "error", text: t("settings.mfsNumbers.loadError") });
        } finally {
            setMfsNumbersLoading(false);
        }
    }, [t]);

    useEffect(() => {
        if (activeTab === "mfsNumbers") {
            loadMfsNumbers();
        }
    }, [activeTab, loadMfsNumbers]);

    const handleMfsRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mfsForm.mfsNumber.trim()) return;

        setMfsRegistering(true);
        setMfsMessage(null);

        try {
            await registerMfsNumber({
                mfsType: mfsForm.mfsType,
                mfsNumber: mfsForm.mfsNumber.trim(),
                simSlot: mfsForm.simSlot,
            });
            setMfsMessage({ type: "success", text: t("settings.mfsNumbers.registerSuccess") });
            setMfsForm({ mfsType: "BKASH", mfsNumber: "", simSlot: 0, accountType: "MERCHANT" });
            await loadMfsNumbers();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : t("settings.mfsNumbers.registerError");
            setMfsMessage({ type: "error", text: msg });
        } finally {
            setMfsRegistering(false);
        }
    };

    useEffect(() => {
        if (mfsMessage) {
            const timer = setTimeout(() => setMfsMessage(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [mfsMessage]);

    if (pageLoading) {
        return (
            <div className="flex min-h-[55vh] items-center justify-center">
                <p className="text-lg text-on-surface-variant">{t("settings.heading")}...</p>
            </div>
        );
    }

    if (!businessId || !activeBusiness) {
        return (
            <div className="flex min-h-[55vh] items-center justify-center">
                <div className="max-w-md rounded-[1.75rem] border border-outline-variant/30 bg-surface p-8 text-center">
                    <h1 className="text-2xl font-semibold text-on-surface">{t("settings.heading")}</h1>
                    <p className="mt-3 text-on-surface-variant">{t("settings.noBusinessSelected")}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#003727_0%,#00503a_55%,#17734d_100%)] p-6 text-white shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
                    {t("settings.heading")}
                </p>
                <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight">{activeBusiness.name}</h1>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/14 px-4 py-2 text-sm">
                            {businessTypeLabel}
                        </span>
                        <span className="rounded-full bg-white/14 px-4 py-2 text-sm">
                            {statusLabel}
                        </span>
                        <span className="rounded-full bg-white/14 px-4 py-2 text-sm">
                            /{activeBusiness.slug}
                        </span>
                    </div>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div className="rounded-[1.25rem] bg-white/10 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                            {t("settings.summaryBusinessType")}
                        </p>
                        <p className="mt-2 text-xl font-semibold">{businessTypeLabel}</p>
                    </div>
                    <div className="rounded-[1.25rem] bg-white/10 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                            {t("settings.summaryCurrency")}
                        </p>
                        <p className="mt-2 text-xl font-semibold">{settingsForm.currency}</p>
                    </div>
                    <div className="rounded-[1.25rem] bg-white/10 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                            {t("settings.summarySchedule")}
                        </p>
                        <p className="mt-2 text-xl font-semibold">
                            {hoursForm.is24Hours
                                ? t("settings.alwaysOpen")
                                : `${hoursForm.operatingHoursStart || "--:--"} - ${hoursForm.operatingHoursEnd || "--:--"}`}
                        </p>
                    </div>
                </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
                <aside className="rounded-[1.75rem] border border-outline-variant/30 bg-surface p-3 shadow-sm">
                    <div className="space-y-2">
                        {TAB_ITEMS.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`w-full rounded-[1.25rem] px-4 py-4 text-left transition ${activeTab === tab.key
                                    ? "bg-primary text-white shadow-md"
                                    : "bg-transparent text-on-surface hover:bg-surface-container-high"
                                    }`}
                            >
                                <p className="font-semibold">{t(tab.titleKey)}</p>
                                <p
                                    className={`mt-1 text-sm ${activeTab === tab.key
                                        ? "text-white/80"
                                        : "text-on-surface-variant"
                                        }`}
                                >
                                    {t(tab.descriptionKey)}
                                </p>
                            </button>
                        ))}
                    </div>
                </aside>

                <div className="space-y-6">
                    {feedback ? (
                        <div
                            className={`rounded-[1.25rem] border px-4 py-3 text-sm font-medium ${feedback.type === "success"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : feedback.type === "warning"
                                    ? "border-amber-200 bg-amber-50 text-amber-800"
                                    : "border-rose-200 bg-rose-50 text-rose-800"
                                }`}
                        >
                            {feedback.message}
                        </div>
                    ) : null}

                    {activeTab === "general" ? (
                        <>
                            <SectionCard
                                title={t("settings.identityTitle")}
                            >
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <FormInput
                                        label={t("form.nameLabel")}
                                        value={generalForm.name}
                                        onChange={(event) =>
                                            setGeneralForm((current) => ({
                                                ...current,
                                                name: event.target.value,
                                            }))
                                        }
                                        placeholder={t("form.namePlaceholder")}
                                    />
                                    <SelectField
                                        label={t("form.typeLabel")}
                                        value={generalForm.selectedType}
                                        onChange={(value) =>
                                            setGeneralForm((current) => ({
                                                ...current,
                                                selectedType: value,
                                                customType: value === "OTHER" ? current.customType : "",
                                            }))
                                        }
                                    >
                                        {BUSINESS_TYPES.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {t(`types.${type.labelKey}`)}
                                            </option>
                                        ))}
                                    </SelectField>
                                </div>
                                {generalForm.selectedType === "OTHER" ? (
                                    <FormInput
                                        label={t("settings.customTypeLabel")}
                                        value={generalForm.customType}
                                        onChange={(event) =>
                                            setGeneralForm((current) => ({
                                                ...current,
                                                customType: event.target.value,
                                            }))
                                        }
                                        placeholder={t("settings.customTypePlaceholder")}
                                    />
                                ) : null}
                                <TextAreaField
                                    label={t("form.descriptionLabel")}
                                    value={generalForm.description}
                                    onChange={(value) =>
                                        setGeneralForm((current) => ({
                                            ...current,
                                            description: value,
                                        }))
                                    }
                                    placeholder={t("form.descriptionPlaceholder")}
                                    rows={5}
                                />
                            </SectionCard>

                            <SectionCard
                                title={t("settings.hoursTitle")}
                            >
                                <ToggleField
                                    label={t("settings.is24HoursLabel")}
                                    description={t("settings.is24HoursDescription")}
                                    checked={hoursForm.is24Hours}
                                    onChange={(value) =>
                                        setHoursForm((current) => ({
                                            ...current,
                                            is24Hours: value,
                                        }))
                                    }
                                />
                                {!hoursForm.is24Hours ? (
                                    <>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <FormInput
                                                label={t("settings.operatingHoursStartLabel")}
                                                type="time"
                                                value={hoursForm.operatingHoursStart}
                                                onChange={(event) =>
                                                    setHoursForm((current) => ({
                                                        ...current,
                                                        operatingHoursStart: event.target.value,
                                                    }))
                                                }
                                            />
                                            <FormInput
                                                label={t("settings.operatingHoursEndLabel")}
                                                type="time"
                                                value={hoursForm.operatingHoursEnd}
                                                onChange={(event) =>
                                                    setHoursForm((current) => ({
                                                        ...current,
                                                        operatingHoursEnd: event.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-primary ml-1">
                                                {t("settings.operatingDaysLabel")}
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {weekdayLabels.map((label, index) => {
                                                    const selected = hoursForm.operatingDays.includes(index);

                                                    return (
                                                        <button
                                                            key={label}
                                                            type="button"
                                                            onClick={() => handleDayToggle(index)}
                                                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${selected
                                                                ? "bg-primary text-white"
                                                                : "bg-surface-container-high text-on-surface"
                                                                }`}
                                                        >
                                                            {label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </>
                                ) : null}
                            </SectionCard>

                            <SectionCard
                                title={t("settings.commerceTitle")}
                            >
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <SelectField
                                        label={t("settings.currencyLabel")}
                                        value={settingsForm.currency}
                                        onChange={(value) =>
                                            setSettingsForm((current) => ({
                                                ...current,
                                                currency: value,
                                            }))
                                        }
                                    >
                                        {CURRENCIES.map((currency) => (
                                            <option key={currency.value} value={currency.value}>
                                                {currency.label}
                                            </option>
                                        ))}
                                    </SelectField>
                                    <SelectField
                                        label={t("settings.paymentChannelLabel")}
                                        value={settingsForm.paymentChannel}
                                        onChange={(value) =>
                                            setSettingsForm((current) => ({
                                                ...current,
                                                paymentChannel: value as PaymentMethod,
                                            }))
                                        }
                                    >
                                        {PAYMENT_CHANNELS.map((channel) => (
                                            <option key={channel} value={channel}>
                                                {isBn ? PAYMENT_CHANNEL_LABELS[channel].bn : PAYMENT_CHANNEL_LABELS[channel].en}
                                            </option>
                                        ))}
                                    </SelectField>
                                    <FormInput
                                        label={t("settings.paymentReceiverLabel")}
                                        value={settingsForm.paymentReceiverNumber}
                                        onChange={(event) =>
                                            setSettingsForm((current) => ({
                                                ...current,
                                                paymentReceiverNumber: event.target.value,
                                            }))
                                        }
                                        placeholder="01XXXXXXXXX"
                                    />
                                    <FormInput
                                        label={t("settings.invoicePrefixLabel")}
                                        value={settingsForm.invoicePrefix}
                                        onChange={(event) =>
                                            setSettingsForm((current) => ({
                                                ...current,
                                                invoicePrefix: event.target.value.toUpperCase(),
                                            }))
                                        }
                                        maxLength={10}
                                        placeholder={invoicePrefixSuggestion}
                                    />
                                </div>
                                <p className="text-sm text-on-surface-variant">
                                    {t("settings.invoicePrefixHint", {
                                        suggestion: invoicePrefixSuggestion,
                                    })}
                                </p>
                                <ToggleField
                                    label={t("settings.taxEnabledLabel")}
                                    checked={settingsForm.taxEnabled}
                                    onChange={(value) =>
                                        setSettingsForm((current) => ({
                                            ...current,
                                            taxEnabled: value,
                                        }))
                                    }
                                />
                                {settingsForm.taxEnabled ? (
                                    <div className="grid gap-4 lg:grid-cols-2">
                                        <FormInput
                                            label={t("settings.taxRateLabel")}
                                            value={settingsForm.taxRate}
                                            onChange={(event) =>
                                                setSettingsForm((current) => ({
                                                    ...current,
                                                    taxRate: sanitizeNumericInput(event.target.value, {
                                                        allowDecimal: true,
                                                        maxIntegerDigits: 3,
                                                        maxFractionDigits: 2,
                                                    }),
                                                }))
                                            }
                                            placeholder="5"
                                        />
                                        <FormInput
                                            label={t("settings.taxNumberLabel")}
                                            value={settingsForm.taxNumber}
                                            onChange={(event) =>
                                                setSettingsForm((current) => ({
                                                    ...current,
                                                    taxNumber: event.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                ) : null}
                                <ToggleField
                                    label={t("settings.aiAssistantEnabledLabel")}
                                    checked={settingsForm.aiAssistantEnabled}
                                    onChange={(value) =>
                                        setSettingsForm((current) => ({
                                            ...current,
                                            aiAssistantEnabled: value,
                                        }))
                                    }
                                />
                            </SectionCard>

                            <SectionCard
                                title={t("settings.inventoryTitle")}
                            >
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <FormInput
                                        label={t("settings.lowStockThresholdLabel")}
                                        value={settingsForm.lowStockThreshold}
                                        onChange={(event) =>
                                            setSettingsForm((current) => ({
                                                ...current,
                                                lowStockThreshold: sanitizeNumericInput(event.target.value, {
                                                    maxIntegerDigits: 4,
                                                }),
                                            }))
                                        }
                                    />
                                    <div className="rounded-[1rem] border border-dashed border-outline-variant/40 bg-surface-container-high px-4 py-4">
                                        <p className="text-sm font-semibold text-on-surface">
                                            {t("settings.previewLabel")}
                                        </p>
                                        <p className="mt-2 text-sm text-on-surface-variant">
                                            {t("settings.previewText", {
                                                threshold: formatLocalizedNumber(
                                                    settingsForm.lowStockThreshold || 0,
                                                    locale,
                                                ),
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <ToggleField
                                    label={t("settings.lowStockAlertLabel")}
                                    checked={settingsForm.lowStockAlertEnabled}
                                    onChange={(value) =>
                                        setSettingsForm((current) => ({
                                            ...current,
                                            lowStockAlertEnabled: value,
                                        }))
                                    }
                                />
                                <TextAreaField
                                    label={t("settings.invoiceNotesLabel")}
                                    value={settingsForm.invoiceNotes}
                                    onChange={(value) =>
                                        setSettingsForm((current) => ({
                                            ...current,
                                            invoiceNotes: value,
                                        }))
                                    }
                                    rows={3}
                                />
                                <TextAreaField
                                    label={t("settings.receiptFooterLabel")}
                                    value={settingsForm.receiptFooter}
                                    onChange={(value) =>
                                        setSettingsForm((current) => ({
                                            ...current,
                                            receiptFooter: value,
                                        }))
                                    }
                                    rows={3}
                                />
                            </SectionCard>

                            <GradientButton loading={generalSaving} onClick={handleSaveGeneral}>
                                {t("settings.saveButton")}
                            </GradientButton>
                        </>
                    ) : null}

                    {activeTab === "profile" ? (
                        <>
                            <SectionCard
                                title={t("profile.brandTitle")}
                            >
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <FormInput
                                        label={t("profile.logoUrlLabel")}
                                        value={profileForm.logoUrl}
                                        onChange={(event) =>
                                            setProfileForm((current) => ({
                                                ...current,
                                                logoUrl: event.target.value,
                                            }))
                                        }
                                        placeholder="https://"
                                    />
                                    <FormInput
                                        label={t("profile.coverImageUrlLabel")}
                                        value={profileForm.coverImageUrl}
                                        onChange={(event) =>
                                            setProfileForm((current) => ({
                                                ...current,
                                                coverImageUrl: event.target.value,
                                            }))
                                        }
                                        placeholder="https://"
                                    />
                                </div>
                            </SectionCard>

                            <SectionCard
                                title={t("profile.contactTitle")}
                            >
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <FormInput
                                        label={t("profile.contactPersonLabel")}
                                        value={profileForm.contactPerson}
                                        onChange={(event) =>
                                            setProfileForm((current) => ({
                                                ...current,
                                                contactPerson: event.target.value,
                                            }))
                                        }
                                    />
                                    <FormInput
                                        label={t("profile.phoneLabel")}
                                        value={profileForm.phone}
                                        onChange={(event) =>
                                            setProfileForm((current) => ({
                                                ...current,
                                                phone: event.target.value,
                                            }))
                                        }
                                    />
                                    <FormInput
                                        label={t("profile.whatsappLabel")}
                                        value={profileForm.whatsappNumber}
                                        onChange={(event) =>
                                            setProfileForm((current) => ({
                                                ...current,
                                                whatsappNumber: event.target.value,
                                            }))
                                        }
                                    />
                                    <FormInput
                                        label={t("profile.emailLabel")}
                                        value={profileForm.email}
                                        onChange={(event) =>
                                            setProfileForm((current) => ({
                                                ...current,
                                                email: event.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            </SectionCard>

                            <SectionCard
                                title={t("profile.onlineTitle")}
                            >
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <FormInput
                                        label={t("profile.websiteLabel")}
                                        value={profileForm.website}
                                        onChange={(event) =>
                                            setProfileForm((current) => ({
                                                ...current,
                                                website: event.target.value,
                                            }))
                                        }
                                        placeholder="https://"
                                    />
                                    <FormInput
                                        label={t("profile.facebookLabel")}
                                        value={profileForm.facebookPage}
                                        onChange={(event) =>
                                            setProfileForm((current) => ({
                                                ...current,
                                                facebookPage: event.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            </SectionCard>

                            <GradientButton loading={profileSaving} onClick={handleSaveProfile}>
                                {t("profile.saveButton")}
                            </GradientButton>
                        </>
                    ) : null}

                    {activeTab === "location" ? (
                        <>
                            <SectionCard
                                title={t("location.addressTitle")}
                            >
                                <TextAreaField
                                    label={t("location.addressLabel")}
                                    value={locationForm.address}
                                    onChange={(value) =>
                                        setLocationForm((current) => ({
                                            ...current,
                                            address: value,
                                        }))
                                    }
                                    placeholder={t("location.addressPlaceholder")}
                                    rows={4}
                                />
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <FormInput
                                        label={t("location.cityLabel")}
                                        value={locationForm.city}
                                        onChange={(event) =>
                                            setLocationForm((current) => ({
                                                ...current,
                                                city: event.target.value,
                                            }))
                                        }
                                        placeholder={t("location.cityPlaceholder")}
                                    />
                                    <FormInput
                                        label={t("location.districtLabel")}
                                        value={locationForm.district}
                                        onChange={(event) =>
                                            setLocationForm((current) => ({
                                                ...current,
                                                district: event.target.value,
                                            }))
                                        }
                                        placeholder={t("location.districtPlaceholder")}
                                    />
                                    <FormInput
                                        label={t("location.postalCodeLabel")}
                                        value={locationForm.postalCode}
                                        onChange={(event) =>
                                            setLocationForm((current) => ({
                                                ...current,
                                                postalCode: event.target.value,
                                            }))
                                        }
                                    />
                                    <SelectField
                                        label={t("location.countryLabel")}
                                        value={locationForm.country}
                                        onChange={(value) =>
                                            setLocationForm((current) => ({
                                                ...current,
                                                country: value,
                                            }))
                                        }
                                    >
                                        {COUNTRY_OPTIONS.map((country) => (
                                            <option key={country.value} value={country.value}>
                                                {country.label}
                                            </option>
                                        ))}
                                    </SelectField>
                                </div>
                            </SectionCard>

                            <SectionCard
                                title={t("location.mapTitle")}
                            >
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <FormInput
                                        label={t("location.latitudeLabel")}
                                        value={locationForm.latitude}
                                        onChange={(event) =>
                                            setLocationForm((current) => ({
                                                ...current,
                                                latitude: sanitizeNumericInput(event.target.value, {
                                                    allowDecimal: true,
                                                    allowNegative: true,
                                                    maxIntegerDigits: 3,
                                                    maxFractionDigits: 8,
                                                }),
                                            }))
                                        }
                                        placeholder="23.810331"
                                    />
                                    <FormInput
                                        label={t("location.longitudeLabel")}
                                        value={locationForm.longitude}
                                        onChange={(event) =>
                                            setLocationForm((current) => ({
                                                ...current,
                                                longitude: sanitizeNumericInput(event.target.value, {
                                                    allowDecimal: true,
                                                    allowNegative: true,
                                                    maxIntegerDigits: 3,
                                                    maxFractionDigits: 8,
                                                }),
                                            }))
                                        }
                                        placeholder="90.412521"
                                    />
                                </div>
                                <SelectField
                                    label={t("location.timezoneLabel")}
                                    value={locationForm.timezone}
                                    onChange={(value) =>
                                        setLocationForm((current) => ({
                                            ...current,
                                            timezone: value,
                                        }))
                                    }
                                >
                                    {TIMEZONE_OPTIONS.map((timezone) => (
                                        <option key={timezone} value={timezone}>
                                            {timezone}
                                        </option>
                                    ))}
                                </SelectField>
                            </SectionCard>

                            <GradientButton loading={locationSaving} onClick={handleSaveLocation}>
                                {t("location.saveButton")}
                            </GradientButton>
                        </>
                    ) : null}

                    {activeTab === "data" ? (
                        <DataExportPanel />
                    ) : null}

                    {activeTab === "mfsNumbers" ? (
                        <>
                            <SectionCard title={t("settings.mfsNumbers.title")}>
                                <p className="text-sm text-on-surface-variant mb-5">{t("settings.mfsNumbers.subtitle")}</p>

                                {/* AI Verification hint */}
                                <div className="flex justify-end mb-4 pointer-events-none">
                                    <div className="inline-flex items-center gap-2 bg-surface-container-lowest/70 backdrop-blur-xl px-4 py-2 rounded-full shadow-[0_20px_40px_rgba(24,28,26,0.06)]">
                                        <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                                        <span className="text-xs font-semibold text-primary">AI Verification Active</span>
                                    </div>
                                </div>

                                {mfsMessage ? (
                                    <div className={`mb-4 rounded-[1.25rem] border px-4 py-3 text-sm font-medium ${mfsMessage.type === "success"
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                        : "border-rose-200 bg-rose-50 text-rose-800"
                                        }`}>
                                        {mfsMessage.text}
                                    </div>
                                ) : null}

                                <form onSubmit={handleMfsRegister} className="space-y-6">
                                    {/* Provider Selection — chip-style radio per mfs_registration_settings/code.html */}
                                    <div className="flex flex-col gap-3">
                                        <label className="text-sm font-semibold text-on-surface-variant">{t("settings.mfsNumbers.mfsTypeLabel")}</label>
                                        <div className="flex flex-wrap gap-3">
                                            {(["BKASH", "NAGAD", "ROCKET"] as const).map((provider) => {
                                                const colors: Record<string, string> = { BKASH: "#E2136E", NAGAD: "#F37021", ROCKET: "#7C3AED" };
                                                const labels: Record<string, string> = { BKASH: "bKash", NAGAD: "Nagad", ROCKET: "Rocket" };
                                                return (
                                                    <label key={provider} className="cursor-pointer relative">
                                                        <input type="radio" name="mfsProvider" checked={mfsForm.mfsType === provider} onChange={() => setMfsForm((f) => ({ ...f, mfsType: provider }))} className="peer sr-only" />
                                                        <div className={`px-6 py-3 rounded-full font-medium transition-colors flex items-center gap-2 ${mfsForm.mfsType === provider ? "bg-primary text-white" : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"}`}>
                                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${mfsForm.mfsType === provider ? "bg-white/20 text-white" : "bg-surface-container text-on-surface-variant"}`} style={{ border: mfsForm.mfsType === provider ? "none" : `2px solid ${colors[provider]}22` }}>{labels[provider].charAt(0)}</span>
                                                            <span>{labels[provider]}</span>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Phone + Account Type + SIM Slot */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="text-sm font-semibold text-on-surface-variant block mb-2">{t("settings.mfsNumbers.mfsNumberLabel")}</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-medium text-sm">+88</span>
                                                <input type="tel" value={mfsForm.mfsNumber} onChange={(e) => setMfsForm((f) => ({ ...f, mfsNumber: e.target.value }))} placeholder="01X XXXX XXXX" required className="w-full pl-12 pr-4 py-4 rounded-xl text-lg font-medium text-on-surface placeholder:text-on-surface-variant/50 bg-surface-container-low focus:ring-1 focus:ring-primary outline-none border-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-on-surface-variant block mb-2">{t("settings.mfsNumbers.accountTypeLabel")}</label>
                                            <select value={mfsForm.accountType} onChange={(e) => setMfsForm((f) => ({ ...f, accountType: e.target.value }))} className="w-full px-4 py-4 rounded-xl text-base font-medium text-on-surface bg-surface-container-low focus:ring-1 focus:ring-primary outline-none border-none appearance-none cursor-pointer">
                                                <option value="MERCHANT">Merchant (Payment)</option>
                                                <option value="PERSONAL">Personal (Send Money)</option>
                                                <option value="AGENT">Agent</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-on-surface-variant block mb-2">{t("settings.mfsNumbers.simSlotLabel")}</label>
                                            <select value={String(mfsForm.simSlot)} onChange={(e) => setMfsForm((f) => ({ ...f, simSlot: Number(e.target.value) }))} className="w-full px-4 py-4 rounded-xl text-base font-medium text-on-surface bg-surface-container-low focus:ring-1 focus:ring-primary outline-none border-none appearance-none cursor-pointer">
                                                <option value="0">{t("settings.mfsNumbers.simSlot0")}</option>
                                                <option value="1">{t("settings.mfsNumbers.simSlot1")}</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-4">
                                        <button type="button" onClick={() => setMfsForm({ mfsType: "BKASH", mfsNumber: "", simSlot: 0, accountType: "MERCHANT" })} className="px-6 py-3 text-on-surface font-bold hover:bg-surface-container-high rounded-xl transition-colors">{t("settings.mfsNumbers.cancel")}</button>
                                        <button type="submit" disabled={mfsRegistering} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-container px-8 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm">
                                            {t("settings.mfsNumbers.registerButton")}
                                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                        </button>
                                    </div>
                                </form>
                            </SectionCard>

                            <SectionCard title={t("settings.mfsNumbers.myNumbersTitle")}>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xl font-bold font-headline text-on-surface tracking-tight flex items-center gap-3">
                                        {t("settings.mfsNumbers.myNumbersTitle")}
                                        <span className="text-sm font-medium bg-surface-container-high px-3 py-1 rounded-full">{mfsNumbers.filter(n => n.status === "APPROVED").length} {t("settings.mfsNumbers.activeCount")}</span>
                                    </h3>
                                </div>
                                {mfsNumbersLoading ? (
                                    <div className="flex items-center justify-center py-10">
                                        <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                                    </div>
                                ) : mfsNumbers.length === 0 ? (
                                    <p className="text-sm text-on-surface-variant py-4 text-center">{t("settings.mfsNumbers.noNumbers")}</p>
                                ) : (
                                    <div className="space-y-4">
                                        {mfsNumbers.map((item) => {
                                            const colors: Record<string, { bg: string; text: string; initial: string }> = {
                                                BKASH: { bg: "bg-[#E2136E]/10", text: "text-[#E2136E]", initial: "b" },
                                                NAGAD: { bg: "bg-[#F37021]/10", text: "text-[#F37021]", initial: "N" },
                                                ROCKET: { bg: "bg-purple-100", text: "text-purple-700", initial: "R" },
                                            };
                                            const c = colors[item.mfsType] || { bg: "bg-gray-100", text: "text-gray-800", initial: "?" };
                                            const isApproved = item.status === "APPROVED";
                                            return (
                                                <div key={item.id} className={`bg-surface-container-lowest p-6 rounded-2xl flex flex-col gap-4 ${!isApproved ? "opacity-80" : ""}`}>
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-12 h-12 rounded-full ${c.bg} flex items-center justify-center ${c.text} font-bold text-xl shrink-0`}>{c.initial}</div>
                                                            <div>
                                                                <h4 className="font-bold text-lg text-on-surface tracking-tight">{item.mfsType === "BKASH" ? "bKash" : item.mfsType === "NAGAD" ? "Nagad" : "Rocket"} {item.accountType || ""}</h4>
                                                                <p className="text-sm text-on-surface-variant font-medium">+88 {item.mfsNumber}</p>
                                                            </div>
                                                        </div>
                                                        <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${isApproved ? "bg-primary-fixed-dim/20 text-primary-container" : "bg-surface-variant text-on-surface-variant"}`}>
                                                            <span className="material-symbols-outlined text-[14px]">{isApproved ? "verified" : "pending"}</span>
                                                            {isApproved ? t("settings.mfsNumbers.statusApproved") : t("settings.mfsNumbers.statusPending")}
                                                        </div>
                                                    </div>
                                                    <div className="bg-surface-container-low rounded-xl p-4 mt-2 flex items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{isApproved ? t("settings.mfsNumbers.autoSync") : t("settings.mfsNumbers.pendingApproval")}</span>
                                                            <span className="text-sm font-bold text-primary">{isApproved ? `Active on SIM ${item.simSlot !== null ? item.simSlot + 1 : "?"}` : t("settings.mfsNumbers.waitingApproval")}</span>
                                                        </div>
                                                        {isApproved ? (
                                                            <button className="text-secondary font-medium text-sm hover:underline">{t("settings.mfsNumbers.configure")}</button>
                                                        ) : (
                                                            <button className="text-secondary font-medium text-sm hover:underline">{t("settings.mfsNumbers.resend")}</button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </SectionCard>

                            {/* Why register MFS numbers? — per mfs_registration_settings/code.html */}
                            <div className="bg-secondary-fixed/30 p-6 rounded-2xl border-l-4 border-secondary">
                                <h4 className="font-bold text-on-secondary-container mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined">info</span>
                                    {t("settings.mfsNumbers.whyRegisterTitle")}
                                </h4>
                                <p className="text-sm text-on-surface-variant leading-relaxed">
                                    {t("settings.mfsNumbers.whyRegisterDesc")}
                                </p>
                            </div>
                        </>
                    ) : null}

                    {activeTab === "data" ? (
                        <DataExportPanel />
                    ) : null}

                    {activeTab === "danger" ? (
                        <SectionCard
                            title={t("danger.heading")}
                        >
                            <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-4">
                                <p className="text-base font-semibold text-rose-900">
                                    {t("danger.archiveButton")}
                                </p>
                                <p className="mt-2 text-sm text-rose-800">
                                    {t("list.archiveDescription")}
                                </p>
                                <div className="mt-4">
                                    <FormInput
                                        label={t("danger.confirmNameLabel")}
                                        value={archiveName}
                                        onChange={(event) => setArchiveName(event.target.value)}
                                        placeholder={activeBusiness.name}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleArchive}
                                    disabled={dangerSaving || archiveName.trim() !== activeBusiness.name}
                                    className="mt-4 inline-flex rounded-full bg-rose-700 px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {dangerSaving ? t("danger.archiveConfirm") : t("danger.archiveButton")}
                                </button>
                            </div>
                        </SectionCard>
                    ) : null}
                </div>
            </div>
        </div>
    );
}


