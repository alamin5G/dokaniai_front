"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/authStore";
import { useBusinessStore } from "@/store/businessStore";
import type { BusinessResponse } from "@/types/business";
import { BusinessCard } from "@/components/business/BusinessCard";
import { CreateBusinessModal } from "@/components/business/CreateBusinessModal";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

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
                        {/* Re-use danger.cancel key which exists in both locales */}
                        {confirmColor === "primary" ? "Cancel" : "Cancel"}
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
// Skeleton Card (loading state)
// ---------------------------------------------------------------------------

function SkeletonCard() {
    return (
        <div className="rounded-2xl p-6 bg-surface-container-low animate-pulse">
            <div className="flex items-start justify-between gap-3">
                <div className="h-7 w-3/5 rounded-lg bg-surface-container-highest" />
                <div className="h-10 w-10 rounded-xl bg-surface-container-highest" />
            </div>
            <div className="mt-3 flex gap-2">
                <div className="h-6 w-20 rounded-full bg-surface-container-highest" />
            </div>
            <div className="mt-4 h-4 w-2/5 rounded-lg bg-surface-container-highest" />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Business List Page
// ---------------------------------------------------------------------------

export default function BusinessesPage() {
    const router = useRouter();
    const t = useTranslations("business");
    const tc = useTranslations("common");
    const { accessToken } = useAuthStore();
    const {
        businesses,
        activeBusinessId,
        isLoading,
        loadBusinesses,
        setActiveBusiness,
        archiveBusiness,
        deleteBusiness,
    } = useBusinessStore();

    // Auth guard
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        if (!accessToken) {
            router.replace("/login");
        } else {
            setAuthChecked(true);
        }
    }, [accessToken, router]);

    // Load businesses on mount
    useEffect(() => {
        if (authChecked) {
            loadBusinesses();
        }
    }, [authChecked, loadBusinesses]);

    // Modal state
    const [createModalOpen, setCreateModalOpen] = useState(false);

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

    // ---- Handlers ----

    const handleSelectBusiness = useCallback(
        (business: BusinessResponse) => {
            setActiveBusiness(business);
            router.push("/dashboard");
        },
        [setActiveBusiness, router]
    );

    const handleCreateSuccess = useCallback(() => {
        setCreateModalOpen(false);
        router.push("/dashboard");
    }, [router]);

    const handleEdit = useCallback(
        (business: BusinessResponse) => {
            // Select the business and navigate to dashboard settings
            setActiveBusiness(business);
            router.push("/dashboard");
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
                        // Error handled silently; store doesn't expose error state
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

    // ---- Render ----

    // Don't render until auth is confirmed
    if (!authChecked) {
        return null;
    }

    return (
        <div className="min-h-screen bg-surface">
            {/* ---- Minimal Header ---- */}
            <header className="sticky top-0 z-30 bg-surface-container-low">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <h1 className="text-2xl font-bold text-primary">{tc("appName")}</h1>
                    <LanguageSwitcher />
                </div>
            </header>

            {/* ---- Main Content ---- */}
            <main className="mx-auto max-w-6xl px-6 py-8">
                {/* Page header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-on-surface">
                            {t("list.heading")}
                        </h2>
                        <p className="mt-1 text-on-surface-variant">
                            {t("list.subheading")}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-white transition-colors active:scale-[0.98]"
                        style={{
                            background: "linear-gradient(135deg, #003727 0%, #00503a 100%)",
                        }}
                    >
                        <span className="material-symbols-outlined text-xl">add</span>
                        {t("list.createButton")}
                    </button>
                </div>

                {/* Loading state */}
                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && businesses.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface-container-low mb-6">
                            <span className="material-symbols-outlined text-5xl text-on-surface-variant">
                                store
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-on-surface mb-2">
                            {t("list.emptyTitle")}
                        </h3>
                        <p className="text-on-surface-variant mb-8 max-w-sm">
                            {t("list.emptyDescription")}
                        </p>
                        <button
                            type="button"
                            onClick={() => setCreateModalOpen(true)}
                            className="inline-flex items-center gap-2 rounded-xl px-8 py-4 font-bold text-white transition-colors active:scale-[0.98]"
                            style={{
                                background:
                                    "linear-gradient(135deg, #003727 0%, #00503a 100%)",
                            }}
                        >
                            <span className="material-symbols-outlined text-xl">add</span>
                            {t("list.createButton")}
                        </button>
                    </div>
                )}

                {/* Business grid */}
                {!isLoading && businesses.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {businesses.map((business) => (
                            <BusinessCard
                                key={business.id}
                                business={business}
                                isActive={activeBusinessId === business.id}
                                onSelect={handleSelectBusiness}
                                onEdit={handleEdit}
                                onArchive={handleArchive}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Create Business Modal */}
            <CreateBusinessModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
            />

            {/* Confirmation Dialog */}
            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                description={confirmDialog.description}
                confirmLabel={confirmDialog.confirmLabel}
                confirmColor={confirmDialog.confirmColor}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() =>
                    setConfirmDialog((prev) => ({ ...prev, open: false }))
                }
            />
        </div>
    );
}
