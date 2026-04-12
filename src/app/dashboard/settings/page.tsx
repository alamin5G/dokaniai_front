"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useBusinessStore } from "@/store/businessStore";
import {
    getBusinessSettings,
    updateBusinessSettings,
    getBusinessProfile,
    updateBusinessProfile,
    getBusinessLocation,
    updateBusinessLocation,
} from "@/lib/businessApi";
import { FormInput, GradientButton } from "@/components/ui/FormPrimitives";

// ---------------------------------------------------------------------------
// Inline SVG Icons (HeroIcons style)
// ---------------------------------------------------------------------------

function IconCheck({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
    );
}

function IconSparkles({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
    );
}

function IconShield({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
    );
}

function IconMoreVert({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
        </svg>
    );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabType = "general" | "profile" | "location" | "danger";

// ---------------------------------------------------------------------------
// Onboarding step definition
// ---------------------------------------------------------------------------

interface OnboardingStep {
    step: number;
    titleKey: string;
    descKey: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
    { step: 1, titleKey: "settings.stepBusinessIdentity", descKey: "settings.stepBusinessIdentityDesc" },
    { step: 2, titleKey: "settings.stepTaxConfig", descKey: "settings.stepTaxConfigDesc" },
    { step: 3, titleKey: "settings.stepSetupProducts", descKey: "settings.stepSetupProductsDesc" },
    { step: 4, titleKey: "settings.stepAddCustomer", descKey: "settings.stepAddCustomerDesc" },
    { step: 5, titleKey: "settings.stepBankIntegration", descKey: "settings.stepBankIntegrationDesc" },
    { step: 6, titleKey: "settings.stepInventoryAlert", descKey: "settings.stepInventoryAlertDesc" },
    { step: 7, titleKey: "settings.stepAiSync", descKey: "settings.stepAiSyncDesc" },
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BUSINESS_TYPES = [
    "grocery",
    "electronics",
    "clothing",
    "pharmacy",
    "restaurant",
    "stationery",
    "hardware",
    "bakery",
    "mobileShop",
    "tailoring",
    "sweetsShop",
    "cosmetics",
    "bookshop",
    "jewellery",
    "printing",
    "other",
] as const;

const CURRENCIES = [
    { value: "BDT", label: "৳ BDT" },
    { value: "INR", label: "₹ INR" },
    { value: "USD", label: "$ USD" },
    { value: "EUR", label: "€ EUR" },
    { value: "GBP", label: "£ GBP" },
] as const;

const TABS: { key: TabType; labelKey: string }[] = [
    { key: "general", labelKey: "settings.tabGeneral" },
    { key: "profile", labelKey: "settings.tabProfile" },
    { key: "location", labelKey: "settings.tabLocation" },
    { key: "danger", labelKey: "danger.heading" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BusinessSettingsPage() {
    const t = useTranslations("business");
    const router = useRouter();
    const {
        activeBusinessId,
        activeBusiness,
        updateBusiness,
        archiveBusiness,
        deleteBusiness,
        loadOnboarding,
        onboardingData,
        stats,
        loadStats,
    } = useBusinessStore();

    // ---- Tab state ----
    const [activeTab, setActiveTab] = useState<TabType>("general");

    // ---- Feedback state ----
    const [feedback, setFeedback] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);

    // ---- General tab state ----
    const [generalForm, setGeneralForm] = useState({
        name: "",
        type: "",
        description: "",
    });
    const [currency, setCurrency] = useState("BDT");
    const [generalLoading, setGeneralLoading] = useState(false);
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    // ---- Profile tab state ----
    const [profileForm, setProfileForm] = useState({
        description: "",
        logoUrl: "",
        coverImageUrl: "",
        contactPerson: "",
        phone: "",
        whatsappNumber: "",
        email: "",
        website: "",
        facebookPage: "",
    });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileLoaded, setProfileLoaded] = useState(false);

    // ---- Location tab state ----
    const [locationForm, setLocationForm] = useState({
        address: "",
        city: "",
        district: "",
        postalCode: "",
        country: "Bangladesh",
    });
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationLoaded, setLocationLoaded] = useState(false);

    // ---- Danger zone state ----
    const [confirmDialog, setConfirmDialog] = useState<
        "archive" | "delete" | null
    >(null);
    const [confirmText, setConfirmText] = useState("");
    const [dangerLoading, setDangerLoading] = useState(false);

    // ---------------------------------------------------------------------------
    // Effects — Initialize forms & load data on tab change
    // ---------------------------------------------------------------------------

    // Populate general form from activeBusiness
    useEffect(() => {
        if (activeBusiness) {
            setGeneralForm({
                name: activeBusiness.name || "",
                type: activeBusiness.type || "",
                description: "",
            });
        }
    }, [activeBusiness]);

    // Load onboarding data
    useEffect(() => {
        if (activeBusinessId) {
            loadOnboarding(activeBusinessId);
            loadStats(activeBusinessId);
        }
    }, [activeBusinessId, loadOnboarding, loadStats]);

    // Load settings (for currency) when General tab is active
    useEffect(() => {
        if (activeBusinessId && activeTab === "general" && !settingsLoaded) {
            getBusinessSettings(activeBusinessId)
                .then((settings) => {
                    setCurrency(settings.currency || "BDT");
                    setSettingsLoaded(true);
                })
                .catch(() => {
                    /* silently fail — currency defaults to BDT */
                });
        }
    }, [activeBusinessId, activeTab, settingsLoaded]);

    // Load profile data when Profile tab is first visited
    useEffect(() => {
        if (activeBusinessId && activeTab === "profile" && !profileLoaded) {
            getBusinessProfile(activeBusinessId)
                .then((profile) => {
                    setProfileForm({
                        description: profile.description || "",
                        logoUrl: profile.logoUrl || "",
                        coverImageUrl: profile.coverImageUrl || "",
                        contactPerson: profile.contactPerson || "",
                        phone: profile.phone || "",
                        whatsappNumber: profile.whatsappNumber || "",
                        email: profile.email || "",
                        website: profile.website || "",
                        facebookPage: profile.facebookPage || "",
                    });
                    setProfileLoaded(true);
                })
                .catch(() => {
                    /* silently fail */
                });
        }
    }, [activeBusinessId, activeTab, profileLoaded]);

    // Load location data when Location tab is first visited
    useEffect(() => {
        if (activeBusinessId && activeTab === "location" && !locationLoaded) {
            getBusinessLocation(activeBusinessId)
                .then((location) => {
                    setLocationForm({
                        address: location.address || "",
                        city: location.city || "",
                        district: location.district || "",
                        postalCode: location.postalCode || "",
                        country: location.country || "Bangladesh",
                    });
                    setLocationLoaded(true);
                })
                .catch(() => {
                    /* silently fail */
                });
        }
    }, [activeBusinessId, activeTab, locationLoaded]);

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    const showFeedback = useCallback(
        (type: "success" | "error", message: string) => {
            setFeedback({ type, message });
            setTimeout(() => setFeedback(null), 4000);
        },
        [],
    );

    // Calculate onboarding percentage from step data
    const currentStep = onboardingData?.setupStep ?? 0;
    const totalSteps = ONBOARDING_STEPS.length;
    const onboardingPercent = onboardingData?.onboardingCompleted
        ? 100
        : Math.round((currentStep / totalSteps) * 100);

    // ---------------------------------------------------------------------------
    // Save handlers
    // ---------------------------------------------------------------------------

    /** General tab: update business name/type/description + currency via settings */
    const handleSaveGeneral = async () => {
        if (!activeBusinessId) return;
        setGeneralLoading(true);
        try {
            await updateBusiness(activeBusinessId, {
                name: generalForm.name,
                type: generalForm.type,
                description: generalForm.description || undefined,
            });
            await updateBusinessSettings(activeBusinessId, { currency });
            showFeedback("success", t("settings.successSave"));
        } catch {
            showFeedback("error", t("settings.errorSave"));
        } finally {
            setGeneralLoading(false);
        }
    };

    /** Profile tab */
    const handleSaveProfile = async () => {
        if (!activeBusinessId) return;
        setProfileLoading(true);
        try {
            await updateBusinessProfile(activeBusinessId, {
                description: profileForm.description || undefined,
                logoUrl: profileForm.logoUrl || undefined,
                coverImageUrl: profileForm.coverImageUrl || undefined,
                contactPerson: profileForm.contactPerson || undefined,
                phone: profileForm.phone || undefined,
                whatsappNumber: profileForm.whatsappNumber || undefined,
                email: profileForm.email || undefined,
                website: profileForm.website || undefined,
                facebookPage: profileForm.facebookPage || undefined,
            });
            showFeedback("success", t("profile.successSave"));
        } catch {
            showFeedback("error", t("profile.errorSave"));
        } finally {
            setProfileLoading(false);
        }
    };

    /** Location tab */
    const handleSaveLocation = async () => {
        if (!activeBusinessId) return;
        setLocationLoading(true);
        try {
            await updateBusinessLocation(activeBusinessId, {
                address: locationForm.address || undefined,
                city: locationForm.city || undefined,
                district: locationForm.district || undefined,
                postalCode: locationForm.postalCode || undefined,
                country: locationForm.country || undefined,
            });
            showFeedback("success", t("location.successSave"));
        } catch {
            showFeedback("error", t("location.errorSave"));
        } finally {
            setLocationLoading(false);
        }
    };

    /** Archive business */
    const handleArchive = async () => {
        if (!activeBusinessId) return;
        setDangerLoading(true);
        try {
            await archiveBusiness(activeBusinessId);
            router.push("/businesses");
        } catch {
            showFeedback("error", t("settings.errorSave"));
            setDangerLoading(false);
        }
    };

    /** Delete business */
    const handleDelete = async () => {
        if (!activeBusinessId) return;
        setDangerLoading(true);
        try {
            await deleteBusiness(activeBusinessId);
            router.push("/businesses");
        } catch {
            showFeedback("error", t("settings.errorSave"));
            setDangerLoading(false);
        }
    };

    // ---------------------------------------------------------------------------
    // Guard — no active business
    // ---------------------------------------------------------------------------

    if (!activeBusinessId || !activeBusiness) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-on-surface-variant text-lg">
                    {t("settings.heading")}
                </p>
            </div>
        );
    }

    // ---------------------------------------------------------------------------
    // Render helpers
    // ---------------------------------------------------------------------------

    /** Styled select wrapper — no native appearance */
    const StyledSelect = ({
        value,
        onChange,
        label,
        children,
    }: {
        value: string;
        onChange: (v: string) => void;
        label: string;
        children: React.ReactNode;
    }) => (
        <div className="space-y-2">
            <label className="block text-sm font-bold text-primary ml-1">
                {label}
            </label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full appearance-none pl-6 pr-12 py-4 bg-surface-container-highest rounded-[1rem] text-lg text-on-surface transition-all focus:ring-2 focus:ring-primary-fixed-dim cursor-pointer"
                >
                    {children}
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </span>
            </div>
        </div>
    );

    /** Styled textarea */
    const StyledTextarea = ({
        value,
        onChange,
        label,
        placeholder,
        rows = 4,
    }: {
        value: string;
        onChange: (v: string) => void;
        label: string;
        placeholder?: string;
        rows?: number;
    }) => (
        <div className="space-y-2">
            <label className="block text-sm font-bold text-primary ml-1">
                {label}
            </label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="w-full pl-6 pr-6 py-4 bg-surface-container-highest rounded-[1rem] text-lg text-on-surface transition-all placeholder:text-outline-variant focus:ring-2 focus:ring-primary-fixed-dim resize-y"
            />
        </div>
    );

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------

    return (
        <div className="space-y-6">
            {/* ---- Editorial Header ---- */}
            <section className="mb-8">
                <span className="text-secondary font-semibold tracking-widest uppercase text-xs mb-2 block">
                    {t("settings.heading")}
                </span>
                <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-2 leading-tight">
                    {activeBusiness.name}
                </h1>
                <p className="text-lg text-on-surface-variant max-w-2xl">
                    Manage your business identity, tax profiles, and follow the growth ledger to unlock AI insights.
                </p>
            </section>

            {/* ---- Feedback banner ---- */}
            {feedback && (
                <div
                    className={`rounded-xl px-5 py-3 text-sm font-semibold transition-all ${feedback.type === "success"
                        ? "bg-primary-fixed text-on-primary-fixed"
                        : "bg-error/10 text-error"
                        }`}
                >
                    {feedback.message}
                </div>
            )}

            {/* ---- Asymmetric Grid ---- */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
                {/* ============================================================ */}
                {/* LEFT: Settings Tabs + Onboarding */}
                {/* ============================================================ */}
                <div className="space-y-8">
                    {/* ---- Onboarding Progress ---- */}
                    <div className="bg-surface-container-low p-8 md:p-10 rounded-lg">
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-primary mb-1">
                                    {t("settings.onboardingProgress")}
                                </h2>
                                <p className="text-on-surface-variant">
                                    {t("settings.onboardingSubtitle")}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-4xl font-black text-secondary">
                                    {onboardingPercent}%
                                </span>
                                <p className="text-xs font-bold uppercase tracking-tighter text-outline">
                                    {t("settings.completeLabel")}
                                </p>
                            </div>
                        </div>

                        {/* Step Checklist */}
                        <div className="space-y-4">
                            {ONBOARDING_STEPS.map((stepDef) => {
                                const isComplete = stepDef.step < currentStep || onboardingData?.onboardingCompleted;
                                const isCurrent = stepDef.step === currentStep && !onboardingData?.onboardingCompleted;
                                const isPending = stepDef.step > currentStep && !onboardingData?.onboardingCompleted;

                                return (
                                    <div key={stepDef.step} className="flex items-start gap-4 group">
                                        {/* Step indicator */}
                                        {isComplete ? (
                                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shrink-0 mt-1">
                                                <IconCheck className="w-5 h-5" />
                                            </div>
                                        ) : isCurrent ? (
                                            <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-secondary/20">
                                                <span className="text-sm font-bold">{String(stepDef.step).padStart(2, "0")}</span>
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-surface-container-highest text-outline flex items-center justify-center shrink-0 mt-1">
                                                <span className="text-sm font-bold">{String(stepDef.step).padStart(2, "0")}</span>
                                            </div>
                                        )}

                                        {/* Step content */}
                                        <div className={`pb-4 w-full ${stepDef.step < ONBOARDING_STEPS.length ? "border-b border-outline-variant/15" : ""} ${isPending ? "opacity-60" : ""}`}>
                                            <div className="flex justify-between items-center mb-1">
                                                <h3 className={`text-lg font-bold leading-none mb-1 ${isComplete ? "text-primary" : "text-on-surface"}`}>
                                                    {t(stepDef.titleKey as Parameters<typeof t>[0])}
                                                </h3>
                                                {isCurrent && (
                                                    <button className="text-sm font-bold text-secondary bg-secondary-fixed px-4 py-1 rounded-full">
                                                        {t("settings.continueStep")}
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-on-surface-variant text-sm">
                                                {t(stepDef.descKey as Parameters<typeof t>[0])}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ---- Settings Tabs ---- */}
                    <div>
                        {/* Tab bar */}
                        <div className="bg-surface-container-low rounded-xl p-1.5 flex gap-1 overflow-x-auto mb-6">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.key
                                        ? "bg-surface-container-lowest text-primary shadow-sm"
                                        : "text-on-surface-variant hover:text-on-surface"
                                        }`}
                                >
                                    {t(tab.labelKey as Parameters<typeof t>[0])}
                                </button>
                            ))}
                        </div>

                        {/* Tab content */}
                        <div className="bg-surface-container-lowest rounded-2xl p-6">
                            {/* GENERAL TAB */}
                            {activeTab === "general" && (
                                <div className="space-y-5">
                                    <FormInput
                                        label={t("form.nameLabel")}
                                        value={generalForm.name}
                                        onChange={(e) =>
                                            setGeneralForm((prev) => ({ ...prev, name: e.target.value }))
                                        }
                                        placeholder={t("form.namePlaceholder")}
                                    />
                                    <StyledSelect
                                        label={t("form.typeLabel")}
                                        value={generalForm.type}
                                        onChange={(v) =>
                                            setGeneralForm((prev) => ({ ...prev, type: v }))
                                        }
                                    >
                                        <option value="">{t("form.typePlaceholder")}</option>
                                        {BUSINESS_TYPES.map((bt) => (
                                            <option key={bt} value={bt}>
                                                {t(`types.${bt}` as Parameters<typeof t>[0])}
                                            </option>
                                        ))}
                                    </StyledSelect>
                                    <StyledTextarea
                                        label={t("form.descriptionLabel")}
                                        value={generalForm.description}
                                        onChange={(v) =>
                                            setGeneralForm((prev) => ({ ...prev, description: v }))
                                        }
                                        placeholder={t("form.descriptionPlaceholder")}
                                    />
                                    <StyledSelect
                                        label={t("settings.currencyLabel")}
                                        value={currency}
                                        onChange={setCurrency}
                                    >
                                        {CURRENCIES.map((c) => (
                                            <option key={c.value} value={c.value}>
                                                {c.label}
                                            </option>
                                        ))}
                                    </StyledSelect>
                                    <div className="pt-2">
                                        <GradientButton
                                            loading={generalLoading}
                                            onClick={handleSaveGeneral}
                                            className="!w-auto !px-8"
                                        >
                                            {t("settings.saveButton")}
                                        </GradientButton>
                                    </div>
                                </div>
                            )}

                            {/* PROFILE TAB */}
                            {activeTab === "profile" && (
                                <div className="space-y-5">
                                    <StyledTextarea
                                        label={t("profile.descriptionLabel")}
                                        value={profileForm.description}
                                        onChange={(v) =>
                                            setProfileForm((prev) => ({ ...prev, description: v }))
                                        }
                                        rows={3}
                                    />
                                    <FormInput
                                        label={t("profile.logoUrlLabel")}
                                        value={profileForm.logoUrl}
                                        onChange={(e) =>
                                            setProfileForm((prev) => ({
                                                ...prev,
                                                logoUrl: e.target.value,
                                            }))
                                        }
                                        icon="image"
                                    />
                                    <FormInput
                                        label={t("profile.coverImageUrlLabel")}
                                        value={profileForm.coverImageUrl}
                                        onChange={(e) =>
                                            setProfileForm((prev) => ({
                                                ...prev,
                                                coverImageUrl: e.target.value,
                                            }))
                                        }
                                        icon="panorama"
                                    />
                                    <FormInput
                                        label={t("profile.contactPersonLabel")}
                                        value={profileForm.contactPerson}
                                        onChange={(e) =>
                                            setProfileForm((prev) => ({
                                                ...prev,
                                                contactPerson: e.target.value,
                                            }))
                                        }
                                        icon="person"
                                    />
                                    <FormInput
                                        label={t("profile.phoneLabel")}
                                        value={profileForm.phone}
                                        onChange={(e) =>
                                            setProfileForm((prev) => ({
                                                ...prev,
                                                phone: e.target.value,
                                            }))
                                        }
                                        icon="phone"
                                        type="tel"
                                    />
                                    <FormInput
                                        label={t("profile.whatsappLabel")}
                                        value={profileForm.whatsappNumber}
                                        onChange={(e) =>
                                            setProfileForm((prev) => ({
                                                ...prev,
                                                whatsappNumber: e.target.value,
                                            }))
                                        }
                                        icon="chat"
                                        type="tel"
                                    />
                                    <FormInput
                                        label={t("profile.emailLabel")}
                                        value={profileForm.email}
                                        onChange={(e) =>
                                            setProfileForm((prev) => ({
                                                ...prev,
                                                email: e.target.value,
                                            }))
                                        }
                                        icon="mail"
                                        type="email"
                                    />
                                    <FormInput
                                        label={t("profile.websiteLabel")}
                                        value={profileForm.website}
                                        onChange={(e) =>
                                            setProfileForm((prev) => ({
                                                ...prev,
                                                website: e.target.value,
                                            }))
                                        }
                                        icon="language"
                                    />
                                    <FormInput
                                        label={t("profile.facebookLabel")}
                                        value={profileForm.facebookPage}
                                        onChange={(e) =>
                                            setProfileForm((prev) => ({
                                                ...prev,
                                                facebookPage: e.target.value,
                                            }))
                                        }
                                        icon="group"
                                    />
                                    <div className="pt-2">
                                        <GradientButton
                                            loading={profileLoading}
                                            onClick={handleSaveProfile}
                                            className="!w-auto !px-8"
                                        >
                                            {t("profile.saveButton")}
                                        </GradientButton>
                                    </div>
                                </div>
                            )}

                            {/* LOCATION TAB */}
                            {activeTab === "location" && (
                                <div className="space-y-5">
                                    <StyledTextarea
                                        label={t("location.addressLabel")}
                                        value={locationForm.address}
                                        onChange={(v) =>
                                            setLocationForm((prev) => ({ ...prev, address: v }))
                                        }
                                        placeholder={t("location.addressPlaceholder")}
                                        rows={3}
                                    />
                                    <FormInput
                                        label={t("location.cityLabel")}
                                        value={locationForm.city}
                                        onChange={(e) =>
                                            setLocationForm((prev) => ({ ...prev, city: e.target.value }))
                                        }
                                        placeholder={t("location.cityPlaceholder")}
                                        icon="location_city"
                                    />
                                    <FormInput
                                        label={t("location.districtLabel")}
                                        value={locationForm.district}
                                        onChange={(e) =>
                                            setLocationForm((prev) => ({
                                                ...prev,
                                                district: e.target.value,
                                            }))
                                        }
                                        placeholder={t("location.districtPlaceholder")}
                                        icon="map"
                                    />
                                    <FormInput
                                        label={t("location.postalCodeLabel")}
                                        value={locationForm.postalCode}
                                        onChange={(e) =>
                                            setLocationForm((prev) => ({
                                                ...prev,
                                                postalCode: e.target.value,
                                            }))
                                        }
                                        icon="markunread_mailbox"
                                    />
                                    <StyledSelect
                                        label={t("location.countryLabel")}
                                        value={locationForm.country}
                                        onChange={(v) =>
                                            setLocationForm((prev) => ({ ...prev, country: v }))
                                        }
                                    >
                                        <option value="Bangladesh">Bangladesh</option>
                                        <option value="India">India</option>
                                        <option value="Pakistan">Pakistan</option>
                                        <option value="Nepal">Nepal</option>
                                        <option value="Sri Lanka">Sri Lanka</option>
                                    </StyledSelect>
                                    <div className="pt-2">
                                        <GradientButton
                                            loading={locationLoading}
                                            onClick={handleSaveLocation}
                                            className="!w-auto !px-8"
                                        >
                                            {t("location.saveButton")}
                                        </GradientButton>
                                    </div>
                                </div>
                            )}

                            {/* DANGER ZONE TAB */}
                            {activeTab === "danger" && (
                                <div className="space-y-6">
                                    {/* Archive section */}
                                    <div className="bg-error/5 rounded-2xl p-6 space-y-4">
                                        <div className="flex items-start gap-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-error mt-0.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                            </svg>
                                            <div className="flex-1">
                                                <h3 className="text-title-md font-bold text-error">
                                                    {t("danger.archiveButton")}
                                                </h3>
                                                <p className="text-body-sm text-on-surface-variant mt-1">
                                                    {t("danger.archiveButton")} — {activeBusiness.name}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setConfirmDialog("archive");
                                                    setConfirmText("");
                                                }}
                                                className="px-5 py-2.5 rounded-xl bg-surface-container text-tertiary font-bold text-sm hover:bg-surface-container-high transition-colors"
                                            >
                                                {t("danger.archiveButton")}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Delete section */}
                                    <div className="bg-error/5 rounded-2xl p-6 space-y-4">
                                        <div className="flex items-start gap-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-error mt-0.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                            <div className="flex-1">
                                                <h3 className="text-title-md font-bold text-error">
                                                    {t("danger.deleteButton")}
                                                </h3>
                                                <p className="text-body-sm text-on-surface-variant mt-1">
                                                    {activeBusiness.name}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setConfirmDialog("delete");
                                                    setConfirmText("");
                                                }}
                                                className="px-5 py-2.5 rounded-xl bg-error text-on-error font-bold text-sm hover:bg-error/90 transition-colors"
                                            >
                                                {t("danger.deleteButton")}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* RIGHT: Stats & AI Insights */}
                {/* ============================================================ */}
                <aside className="space-y-8">
                    {/* Business Stats Card */}
                    <div className="bg-surface-container-lowest p-8 rounded-lg">
                        <div className="flex justify-between items-start mb-10">
                            <h3 className="text-xl font-bold text-primary">{t("settings.businessStats")}</h3>
                            <IconMoreVert className="w-5 h-5 text-outline" />
                        </div>
                        <div className="space-y-8">
                            <div>
                                <p className="text-xs uppercase font-bold tracking-widest text-outline mb-1">
                                    {t("settings.totalProductsLabel")}
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black text-primary">
                                        {stats?.totalProducts?.toLocaleString() ?? "0"}
                                    </span>
                                    <span className="text-sm text-on-surface-variant">{t("settings.itemsListed")}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs uppercase font-bold tracking-widest text-outline mb-1">
                                    {t("settings.totalSalesMTD")}
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black text-primary">
                                        ৳{stats?.totalRevenue?.toLocaleString() ?? "0.00"}
                                    </span>
                                    <span className="text-sm text-on-surface-variant">{t("settings.biggerLedger")}</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-10 pt-6 border-t border-outline-variant/15">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-error" />
                                <p className="text-sm font-medium">{t("settings.inactive")}</p>
                            </div>
                        </div>
                    </div>

                    {/* AI Insights Glass Card */}
                    <div
                        className="p-8 rounded-lg"
                        style={{ background: "rgba(225, 227, 223, 0.6)", backdropFilter: "blur(20px)" }}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <IconSparkles className="w-5 h-5 text-secondary" />
                            <h3 className="text-lg font-bold text-on-surface-variant">{t("settings.aiTip")}</h3>
                        </div>
                        <p className="text-on-surface font-medium leading-relaxed italic">
                            &ldquo;{t("settings.aiTipText")}&rdquo;
                        </p>
                        <button
                            className="mt-6 w-full py-3 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                            style={{ background: "linear-gradient(135deg, #003727 0%, #00503a 100%)" }}
                        >
                            {t("settings.getAiAdvice")}
                        </button>
                    </div>

                    {/* Security Tonal Card */}
                    <div className="bg-surface-container p-6 rounded-lg">
                        <div className="flex items-center gap-4">
                            <IconShield className="w-6 h-6 text-primary-container" />
                            <div>
                                <h4 className="font-bold text-primary">{t("settings.security")}</h4>
                                <p className="text-xs text-on-surface-variant">{t("settings.encryptionActive")}</p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* ================================================================== */}
            {/* CONFIRMATION DIALOG (overlay modal) */}
            {/* ================================================================== */}
            {confirmDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-sm p-4">
                    <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md space-y-5">
                        <div className="flex items-center gap-3">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className={`w-8 h-8 ${confirmDialog === "delete" ? "text-error" : "text-tertiary"}`}
                            >
                                {confirmDialog === "delete" ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                )}
                            </svg>
                            <h2 className="text-title-lg font-bold text-on-surface">
                                {confirmDialog === "archive"
                                    ? t("danger.archiveButton")
                                    : t("danger.deleteButton")}
                            </h2>
                        </div>

                        <p className="text-body-md text-on-surface-variant">
                            {confirmDialog === "archive"
                                ? `Archive "${activeBusiness.name}"? You can restore it later.`
                                : `Permanently delete "${activeBusiness.name}"? This cannot be undone.`}
                        </p>

                        {/* Type business name to confirm */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-primary ml-1">
                                Type &ldquo;{activeBusiness.name}&rdquo; to confirm
                            </label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                className="w-full pl-6 pr-6 py-4 bg-surface-container-highest rounded-[1rem] text-lg text-on-surface transition-all focus:ring-2 focus:ring-primary-fixed-dim"
                                placeholder={activeBusiness.name}
                            />
                        </div>

                        {/* Dialog actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setConfirmDialog(null)}
                                className="flex-1 py-3 rounded-xl bg-surface-container text-on-surface font-bold text-sm hover:bg-surface-container-high transition-colors"
                            >
                                {t("danger.cancel")}
                            </button>
                            <button
                                onClick={confirmDialog === "archive" ? handleArchive : handleDelete}
                                disabled={confirmText !== activeBusiness.name || dangerLoading}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-40 ${confirmDialog === "delete"
                                    ? "bg-error text-on-error hover:bg-error/90"
                                    : "bg-tertiary text-on-tertiary hover:bg-tertiary/90"
                                    }`}
                            >
                                {dangerLoading
                                    ? "..."
                                    : confirmDialog === "archive"
                                        ? t("danger.archiveConfirm")
                                        : t("danger.deleteConfirm")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
