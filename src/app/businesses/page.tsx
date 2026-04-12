"use client";

import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { formatCurrencyBDT } from "@/lib/localeNumber";
import { buildShopPath } from "@/lib/shopRouting";
import { useBusinessStore } from "@/store/businessStore";
import type { BusinessResponse } from "@/types/business";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Inline SVG Icons (HeroIcons style)
// ---------------------------------------------------------------------------

function IconPlus({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    );
}

function IconArchive({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
    );
}

function IconSparkles({ className = "w-6 h-6" }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
    );
}

function IconStore({ className = "w-6 h-6" }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z" />
        </svg>
    );
}

const BUSINESS_TYPE_LABEL_KEYS: Record<string, string> = {
    GROCERY: "grocery",
    FASHION: "clothing",
    ELECTRONICS: "electronics",
    RESTAURANT: "restaurant",
    PHARMACY: "pharmacy",
    STATIONERY: "stationery",
    HARDWARE: "hardware",
    BAKERY: "bakery",
    MOBILE_SHOP: "mobileShop",
    TAILORING: "tailoring",
    SWEETS_SHOP: "sweetsShop",
    COSMETICS: "cosmetics",
    BOOKSHOP: "bookshop",
    JEWELLERY: "jewellery",
    PRINTING: "printing",
    OTHER: "other",
};

const AUTH_STORAGE_KEY = "dokaniai-auth-storage";

function getAccessTokenRaw(): string | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.state?.accessToken || null;
    } catch {
        return null;
    }
}

// ---------------------------------------------------------------------------
// Confirmation Dialog
// ---------------------------------------------------------------------------

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    confirmColor?: "primary" | "error";
    onConfirm: () => void;
    onCancel: () => void;
}

function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel,
    confirmColor = "primary",
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-surface-container-lowest rounded-2xl p-8 max-w-sm w-full mx-4">
                <h3 className="text-xl font-bold text-on-surface mb-2">{title}</h3>
                <p className="text-on-surface-variant mb-6">{description}</p>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-xl font-bold bg-surface-container-high text-on-surface transition-colors hover:bg-surface-container-highest"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors ${confirmColor === "error"
                            ? "bg-error hover:bg-error/90"
                            : "bg-primary hover:bg-primary/90"
                            }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Skeleton Row (loading state)
// ---------------------------------------------------------------------------

function SkeletonRow() {
    return (
        <div className="grid grid-cols-12 items-center bg-surface-container-lowest p-6 rounded-[1rem] animate-pulse">
            <div className="col-span-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-surface-container-highest" />
                <div className="space-y-2">
                    <div className="h-5 w-40 rounded-lg bg-surface-container-highest" />
                    <div className="h-3 w-28 rounded-lg bg-surface-container-highest" />
                </div>
            </div>
            <div className="col-span-2 text-right space-y-2">
                <div className="h-6 w-20 rounded-lg bg-surface-container-highest ml-auto" />
                <div className="h-3 w-12 rounded-lg bg-surface-container-highest ml-auto" />
            </div>
            <div className="col-span-2 text-right space-y-2">
                <div className="h-6 w-20 rounded-lg bg-surface-container-highest ml-auto" />
                <div className="h-3 w-16 rounded-lg bg-surface-container-highest ml-auto" />
            </div>
            <div className="col-span-3 flex justify-end gap-2">
                <div className="h-9 w-20 rounded-lg bg-surface-container-highest" />
                <div className="h-9 w-24 rounded-lg bg-surface-container-highest" />
            </div>
        </div>
    );
}


// ---------------------------------------------------------------------------
// Business List Page — Digital Ledger View
// ---------------------------------------------------------------------------

export default function BusinessesPage() {
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations("business");
    const tc = useTranslations("common");
    const hasToken = getAccessTokenRaw() != null;
    const {
        businesses,
        businessStatsMap,
        isLoading,
        loadBusinesses,
        loadBusinessStatsMap,
        setActiveBusiness,
        archiveBusiness,
        deleteBusiness,
    } = useBusinessStore();

    const renderBusinessType = useCallback(
        (type?: string | null) => {
            if (!type) return "";
            const key = BUSINESS_TYPE_LABEL_KEYS[type];
            if (key) return t(`types.${key}` as Parameters<typeof t>[0]);
            return type.replaceAll("_", " ");
        },
        [t],
    );

    useEffect(() => {
        if (!hasToken) {
            router.replace("/login");
        }
    }, [hasToken, router]);

    // Load businesses on mount
    useEffect(() => {
        if (hasToken) {
            loadBusinesses();
        }
    }, [hasToken, loadBusinesses]);

    // Load per-business stats when businesses are loaded
    useEffect(() => {
        const activeIds = businesses
            .filter((b) => b.status === "ACTIVE")
            .map((b) => b.id);
        if (activeIds.length > 0) {
            loadBusinessStatsMap(activeIds);
        }
    }, [businesses, loadBusinessStatsMap]);

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        description: string;
        confirmLabel: string;
        confirmColor: "primary" | "error";
        onConfirm: () => void;
    }>({
        open: false,
        title: "",
        description: "",
        confirmLabel: "",
        confirmColor: "primary",
        onConfirm: () => { },
    });

    // Separate active and archived businesses
    const activeBusinesses = businesses.filter((b) => b.status === "ACTIVE");
    const archivedBusinesses = businesses.filter((b) => b.status === "ARCHIVED");

    // ---- Handlers ----

    const handleSelectBusiness = useCallback(
        (business: BusinessResponse) => {
            setActiveBusiness(business);
            router.push(buildShopPath(business.id));
        },
        [setActiveBusiness, router]
    );

    const handleManage = useCallback(
        (business: BusinessResponse) => {
            setActiveBusiness(business);
            router.push(buildShopPath(business.id, "/settings"));
        },
        [setActiveBusiness, router]
    );

    const handleArchive = useCallback(
        (business: BusinessResponse) => {
            setConfirmDialog({
                open: true,
                title: t("list.archiveConfirm"),
                description: t("list.archiveDescription"),
                confirmLabel: t("danger.archiveConfirm"),
                confirmColor: "primary",
                onConfirm: async () => {
                    setConfirmDialog((prev) => ({ ...prev, open: false }));
                    try {
                        await archiveBusiness(business.id);
                    } catch {
                        // Error handled silently
                    }
                },
            });
        },
        [t, archiveBusiness]
    );

    const handleDelete = useCallback(
        (business: BusinessResponse) => {
            setConfirmDialog({
                open: true,
                title: t("list.deleteConfirm"),
                description: t("list.deleteDescription"),
                confirmLabel: t("danger.deleteConfirm"),
                confirmColor: "error",
                onConfirm: async () => {
                    setConfirmDialog((prev) => ({ ...prev, open: false }));
                    try {
                        await deleteBusiness(business.id);
                    } catch {
                        // Error handled silently
                    }
                },
            });
        },
        [t, deleteBusiness]
    );

    const handleRestore = useCallback(
        async (business: BusinessResponse) => {
            // For now, restoring means updating status back to ACTIVE
            // This would need a restore API endpoint
            try {
                await archiveBusiness(business.id); // Toggle archive
            } catch {
                // Error handled silently
            }
        },
        [archiveBusiness]
    );

    // ---- Render ----

    if (!hasToken) {
        return null;
    }

    return (
        <div className="min-h-screen bg-surface">
            {/* ---- Minimal Header ---- */}
            <header className="sticky top-0 z-30 bg-surface-container-low">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold tracking-tight text-primary">{tc("appName")}</h1>
                    <LanguageSwitcher />
                </div>
            </header>

            {/* ---- Main Content ---- */}
            <main className="mx-auto max-w-7xl px-6 md:px-8 py-8 space-y-10">
                {/* ---- Header Section ---- */}
                <section className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div>
                        <h2 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">
                            {t("ledger.title")}
                        </h2>
                        <p className="text-on-surface-variant font-medium">
                            {t("ledger.subtitle")}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            className="px-6 py-3 bg-surface-container-high text-primary font-bold rounded-lg hover:bg-surface-variant transition-colors"
                        >
                            {t("ledger.exportAll")}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push("/onboarding?mode=new")}
                            className="px-6 py-3 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                            style={{ background: "linear-gradient(135deg, #003727 0%, #00503a 100%)" }}
                        >
                            <IconPlus className="w-5 h-5" />
                            {t("ledger.newBusiness")}
                        </button>
                    </div>
                </section>

                {/* ---- Active Businesses Table ---- */}
                <section className="space-y-4">
                    {/* Column Headers */}
                    <div className="hidden md:grid grid-cols-12 px-6 text-sm font-bold text-outline uppercase tracking-widest">
                        <div className="col-span-5">{t("ledger.colBusinessIdentity")}</div>
                        <div className="col-span-2 text-right">{t("ledger.colTodaySales")}</div>
                        <div className="col-span-2 text-right">{t("ledger.colTotalDue")}</div>
                        <div className="col-span-3 text-right">{t("ledger.colActions")}</div>
                    </div>

                    {/* Loading state */}
                    {isLoading && (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <SkeletonRow key={i} />
                            ))}
                        </div>
                    )}

                    {/* Empty state */}
                    {!isLoading && activeBusinesses.length === 0 && archivedBusinesses.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface-container-low mb-6">
                                <IconStore className="w-12 h-12 text-on-surface-variant" />
                            </div>
                            <h3 className="text-2xl font-bold text-on-surface mb-2">
                                {t("list.emptyTitle")}
                            </h3>
                            <p className="text-on-surface-variant mb-8 max-w-sm">
                                {t("list.emptyDescription")}
                            </p>
                            <button
                                type="button"
                                onClick={() => router.push("/onboarding?mode=new")}
                                className="inline-flex items-center gap-2 rounded-xl px-8 py-4 font-bold text-white transition-colors active:scale-[0.98]"
                                style={{ background: "linear-gradient(135deg, #003727 0%, #00503a 100%)" }}
                            >
                                <IconPlus className="w-5 h-5" />
                                {t("list.createButton")}
                            </button>
                        </div>
                    )}

                    {/* Business Rows */}
                    {!isLoading && activeBusinesses.length > 0 && (
                        <div className="space-y-3">
                            {activeBusinesses.map((business) => {
                                const bizStats = businessStatsMap[business.id];
                                const salesAmount = bizStats?.totalRevenue ?? 0;
                                const dueAmount = bizStats?.totalDue ?? 0;
                                const customerCount = bizStats?.activeCustomers ?? 0;
                                return (
                                    <div
                                        key={business.id}
                                        className="grid grid-cols-1 md:grid-cols-12 items-center bg-surface-container-lowest p-6 rounded-[1rem] hover:translate-x-1 transition-transform cursor-pointer group"
                                    >
                                        {/* Business Identity */}
                                        <div
                                            className="md:col-span-5 flex items-center gap-4 mb-4 md:mb-0"
                                            onClick={() => handleSelectBusiness(business)}
                                        >
                                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-primary-container/10 flex items-center justify-center shrink-0">
                                                <IconStore className="w-7 h-7 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-primary">{business.name}</h3>
                                                <p className="text-sm text-on-surface-variant font-medium">
                                                    {renderBusinessType(business.type)} • {business.slug}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Today's Sales */}
                                        <div
                                            className="md:col-span-2 text-right mb-3 md:mb-0"
                                            onClick={() => handleSelectBusiness(business)}
                                        >
                                            <p className="text-xl font-extrabold text-on-surface">
                                                {formatCurrencyBDT(salesAmount, locale)}
                                            </p>
                                            <span className="text-xs font-bold text-on-surface-variant flex items-center justify-end gap-1">
                                                {bizStats ? `${bizStats.totalSales} টি বিক্রয়` : "—"}
                                            </span>
                                        </div>

                                        {/* Total Due */}
                                        <div
                                            className="md:col-span-2 text-right mb-3 md:mb-0"
                                            onClick={() => handleSelectBusiness(business)}
                                        >
                                            <p className={`text-xl font-extrabold ${dueAmount > 0 ? "text-tertiary" : "text-on-surface"}`}>
                                                {formatCurrencyBDT(dueAmount, locale)}
                                            </p>
                                            <span className="text-xs text-outline font-medium">
                                                {dueAmount === 0
                                                    ? t("ledger.paid")
                                                    : t("ledger.customers", { count: customerCount })
                                                }
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="md:col-span-3 flex justify-end gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleArchive(business); }}
                                                className="px-4 py-2 bg-surface-container-high text-on-surface font-bold rounded-lg hover:bg-surface-container-highest transition-colors"
                                            >
                                                {t("list.archived")}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleManage(business); }}
                                                className="px-4 py-2 bg-secondary/10 text-secondary font-bold rounded-lg hover:bg-secondary/20 transition-colors"
                                            >
                                                {t("ledger.manage")}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleSelectBusiness(business); }}
                                                className="px-4 py-2 text-white font-bold rounded-lg group-hover:scale-105 transition-transform"
                                                style={{ background: "linear-gradient(135deg, #003727 0%, #00503a 100%)" }}
                                            >
                                                {t("ledger.quickSwitch")}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ---- Archived Businesses Section ---- */}
                {!isLoading && archivedBusinesses.length > 0 && (
                    <section className="pt-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-px flex-1 bg-surface-container-high" />
                            <h3 className="text-sm font-bold text-outline-variant flex items-center gap-2">
                                <IconArchive className="w-4 h-4" />
                                {t("ledger.archivedSection")}
                            </h3>
                            <div className="h-px flex-1 bg-surface-container-high" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {archivedBusinesses.map((business) => (
                                <div
                                    key={business.id}
                                    className="bg-surface-container-low p-4 rounded-lg flex items-center justify-between opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded bg-outline-variant flex items-center justify-center text-white">
                                            <IconStore className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-on-surface">{business.name}</h4>
                                            <p className="text-xs text-on-surface-variant">
                                                {business.archivedAt
                                                    ? new Date(business.archivedAt).toLocaleDateString()
                                                    : business.type}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRestore(business)}
                                        className="text-primary font-bold text-sm"
                                    >
                                        {t("ledger.restore")}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(business)}
                                        className="text-error font-bold text-sm"
                                    >
                                        {t("danger.deleteButton")}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* ---- AI FAB ---- */}
            <button
                className="fixed bottom-8 right-8 w-16 h-16 rounded-xl flex items-center justify-center text-white z-50 hover:scale-110 active:scale-95 transition-all"
                style={{ background: "linear-gradient(135deg, #0061a4 0%, #77b7ff 100%)" }}
            >
                <IconSparkles className="w-7 h-7" />
                <div className="absolute -top-2 -left-2 bg-tertiary text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                    AI Active
                </div>
            </button>

            {/* Confirmation Dialog */}
            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                description={confirmDialog.description}
                confirmLabel={confirmDialog.confirmLabel}
                confirmColor={confirmDialog.confirmColor}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
            />
        </div>
    );
}
