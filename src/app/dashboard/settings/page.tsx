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
// Types
// ---------------------------------------------------------------------------

type TabType = "general" | "profile" | "location" | "danger";

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
    "other",
] as const;

const CURRENCIES = [
    { value: "BDT", label: "৳ BDT" },
    { value: "INR", label: "₹ INR" },
    { value: "USD", label: "$ USD" },
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
                <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant pointer-events-none">
                    expand_more
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
            {/* ---- Page heading ---- */}
            <h1 className="text-headline-sm font-bold text-on-surface">
                {t("settings.heading")}
            </h1>

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

            {/* ---- Tab bar ---- */}
            <div className="bg-surface-container-low rounded-xl p-1.5 flex gap-1 overflow-x-auto">
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

            {/* ---- Tab content ---- */}
            <div className="bg-surface-container-lowest rounded-2xl p-6">
                {/* ================================================================ */}
                {/* GENERAL TAB */}
                {/* ================================================================ */}
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

                {/* ================================================================ */}
                {/* PROFILE TAB */}
                {/* ================================================================ */}
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

                {/* ================================================================ */}
                {/* LOCATION TAB */}
                {/* ================================================================ */}
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

                {/* ================================================================ */}
                {/* DANGER ZONE TAB */}
                {/* ================================================================ */}
                {activeTab === "danger" && (
                    <div className="space-y-6">
                        {/* Archive section */}
                        <div className="bg-error/5 rounded-2xl p-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-error text-2xl mt-0.5">
                                    archive
                                </span>
                                <div className="flex-1">
                                    <h3 className="text-title-md font-bold text-error">
                                        {t("danger.archiveButton")}
                                    </h3>
                                    <p className="text-body-sm text-on-surface-variant mt-1">
                                        {t("danger.archiveButton")} —{" "}
                                        {activeBusiness.name}
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
                                <span className="material-symbols-outlined text-error text-2xl mt-0.5">
                                    delete_forever
                                </span>
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

            {/* ================================================================== */}
            {/* CONFIRMATION DIALOG (overlay modal) */}
            {/* ================================================================== */}
            {confirmDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-sm p-4">
                    <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md space-y-5">
                        <div className="flex items-center gap-3">
                            <span
                                className={`material-symbols-outlined text-3xl ${confirmDialog === "delete" ? "text-error" : "text-tertiary"
                                    }`}
                            >
                                {confirmDialog === "delete" ? "warning" : "archive"}
                            </span>
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
                                Type "{activeBusiness.name}" to confirm
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
                                onClick={
                                    confirmDialog === "archive" ? handleArchive : handleDelete
                                }
                                disabled={
                                    confirmText !== activeBusiness.name || dangerLoading
                                }
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
