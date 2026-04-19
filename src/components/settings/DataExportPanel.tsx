"use client";

/**
 * Data Export Panel
 * SRS Reference: Section 5.2.3 — FR-DATA-01
 * Allows users to download all business data (ZIP/CSV) with OTP authentication.
 *
 * Plan gating:
 * - FR-DATA-01 is a DATA RIGHTS provision — available to ALL subscription plans.
 * - The Feature Matrix "Data Export CSV/JSON" (Plus+) refers to advanced export formats.
 * - Basic ZIP export is available to all; JSON/CSV format is Plus+ only.
 */

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import {
    requestDataExport,
    verifyExportOtp,
    downloadExport,
    getExportUsage,
    type ExportRequestResponse,
} from "@/lib/dataExportApi";
import { useBusinessStore } from "@/store/businessStore";
import { getAvailablePlans, getCurrentSubscription } from "@/lib/subscriptionApi";

type Step = "select" | "otp" | "download" | "complete";

const DATA_SECTIONS = [
    { key: "products", icon: "inventory_2" },
    { key: "sales", icon: "receipt_long" },
    { key: "expenses", icon: "payments" },
    { key: "customers", icon: "person" },
    { key: "dueTransactions", icon: "menu_book" },
] as const;

export default function DataExportPanel() {
    const t = useTranslations("shop.dataExport");
    const activeBusiness = useBusinessStore((s) => s.activeBusiness);

    const [step, setStep] = useState<Step>("select");
    const [format, setFormat] = useState<"CSV" | "JSON" | "ZIP">("ZIP");
    const [selectedSections, setSelectedSections] = useState<string[]>([
        "products",
        "sales",
        "expenses",
        "customers",
        "dueTransactions",
    ]);
    const [exportResponse, setExportResponse] =
        useState<ExportRequestResponse | null>(null);
    const [otp, setOtp] = useState("");
    const [downloadUrl, setDownloadUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Plan gating: ZIP is for all plans; CSV/JSON is Plus+ only
    const [isPlusOrAbove, setIsPlusOrAbove] = useState(false);

    // Monthly export usage: [used, limit] — limit = -1 means unlimited
    const [exportUsage, setExportUsage] = useState<[number, number]>([0, 4]);

    useEffect(() => {
        let cancelled = false;
        const checkPlanAndUsage = async () => {
            try {
                const [subscription, plans, usage] = await Promise.all([
                    getCurrentSubscription(),
                    getAvailablePlans(),
                    getExportUsage(),
                ]);
                if (cancelled) return;
                if (!subscription) { setIsPlusOrAbove(false); return; }
                const plan = plans.find((item) => item.id === subscription.planId);
                const planName = plan?.name?.toUpperCase() ?? "";
                setIsPlusOrAbove(["PLUS", "ENTERPRISE"].includes(planName));
                setExportUsage(usage);
            } catch {
                if (!cancelled) {
                    setIsPlusOrAbove(false);
                    setExportUsage([0, 4]);
                }
            }
        };
        void checkPlanAndUsage();
        return () => { cancelled = true; };
    }, []);

    const toggleSection = (key: string) => {
        setSelectedSections((prev) =>
            prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
        );
    };

    const handleRequestExport = useCallback(async () => {
        if (!activeBusiness?.id) return;
        if (selectedSections.length === 0) {
            setError(t("errors.noSections"));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await requestDataExport({
                businessId: activeBusiness.id,
                format,
                include: selectedSections,
            });

            // Handle rate limit from backend
            if (result.status === "LIMIT_EXCEEDED") {
                setError(result.message || t("errors.limitExceeded"));
                // Refresh usage count
                try { setExportUsage(await getExportUsage()); } catch { /* ignore */ }
                return;
            }

            setExportResponse(result);
            setStep("otp");
        } catch {
            setError(t("errors.requestFailed"));
        } finally {
            setIsLoading(false);
        }
    }, [activeBusiness?.id, format, selectedSections, t]);

    const handleVerifyOtp = useCallback(async () => {
        if (!otp.trim()) {
            setError(t("errors.otpRequired"));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await verifyExportOtp(exportResponse!.exportId, otp);
            if (result.verified) {
                setDownloadUrl(result.downloadUrl);
                setStep("download");
            } else {
                setError(t("errors.otpInvalid"));
            }
        } catch {
            setError(t("errors.otpInvalid"));
        } finally {
            setIsLoading(false);
        }
    }, [otp, exportResponse, t]);

    const handleDownload = useCallback(async () => {
        if (!exportResponse) return;

        setIsLoading(true);
        setError(null);

        try {
            const blob = await downloadExport(exportResponse.exportId);
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `${activeBusiness?.name || "export"}_${format.toLowerCase()}_export.${format === "CSV" ? "csv" : format === "JSON" ? "json" : "zip"}`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);
            setStep("complete");
            // Refresh usage count after successful download
            try { setExportUsage(await getExportUsage()); } catch { /* ignore */ }
        } catch {
            setError(t("errors.downloadFailed"));
        } finally {
            setIsLoading(false);
        }
    }, [exportResponse, activeBusiness?.name, format, t]);

    const handleReset = () => {
        setStep("select");
        setOtp("");
        setExportResponse(null);
        setDownloadUrl("");
        setError(null);
    };

    // Auto-reset when business changes
    useEffect(() => {
        handleReset();
    }, [activeBusiness?.id]);

    return (
        <section className="rounded-[1.75rem] border border-outline-variant/30 bg-surface p-5 shadow-sm">
            <div className="mb-5">
                <h2 className="text-lg font-semibold text-on-surface">
                    {t("title")}
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                    {t("description")}
                </p>
            </div>

            {/* Monthly usage indicator */}
            {exportUsage[1] !== -1 && (
                <div className="mb-4 flex items-center justify-between rounded-xl bg-surface-container-high px-4 py-3">
                    <span className="text-sm font-medium text-on-surface-variant">
                        {t("monthlyUsage")}
                    </span>
                    <span className={`text-sm font-bold ${exportUsage[0] >= exportUsage[1]
                            ? "text-error"
                            : exportUsage[0] >= exportUsage[1] - 1
                                ? "text-tertiary"
                                : "text-primary"
                        }`}>
                        {exportUsage[0]} / {exportUsage[1]}
                    </span>
                </div>
            )}

            {/* Plan notice for non-Plus users */}
            {!isPlusOrAbove && (
                <div className="mb-4 rounded-xl bg-primary/10 p-4 text-sm text-primary">
                    <span className="mr-2 material-symbols-outlined text-sm align-middle">info</span>
                    {t("planNotice")}
                </div>
            )}

            {/* Step indicator */}
            <div className="mb-6 flex items-center gap-3">
                {(["select", "otp", "download"] as Step[]).map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                        <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step === s
                                ? "bg-primary text-white"
                                : i <
                                    ["select", "otp", "download"].indexOf(step)
                                    ? "bg-primary/20 text-primary"
                                    : "bg-surface-container-high text-on-surface-variant"
                                }`}
                        >
                            {i + 1}
                        </div>
                        <span className="text-xs font-medium text-on-surface-variant">
                            {t(`steps.${s}`)}
                        </span>
                        {i < 2 && (
                            <div className="h-px w-8 bg-outline-variant/30" />
                        )}
                    </div>
                ))}
            </div>

            {error && (
                <div className="mb-4 rounded-xl bg-error-container p-4 text-sm text-on-error-container">
                    {error}
                </div>
            )}

            {/* Step: Select data */}
            {step === "select" && (
                <div className="space-y-5">
                    {/* Format selection */}
                    <div>
                        <label className="mb-2 block text-sm font-bold text-primary">
                            {t("formatLabel")}
                        </label>
                        <div className="flex gap-3">
                            {(["ZIP", "CSV", "JSON"] as const).map((f) => {
                                const isRestricted = !isPlusOrAbove && f !== "ZIP";
                                return (
                                    <button
                                        key={f}
                                        type="button"
                                        onClick={() => !isRestricted && setFormat(f)}
                                        disabled={isRestricted}
                                        className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${format === f
                                            ? "bg-primary text-white"
                                            : isRestricted
                                                ? "bg-surface-container text-on-surface-variant/50 cursor-not-allowed line-through"
                                                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                                            }`}
                                    >
                                        {f}
                                        {isRestricted && (
                                            <span className="ml-1 material-symbols-outlined text-xs align-middle">lock</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section selection */}
                    <div>
                        <label className="mb-2 block text-sm font-bold text-primary">
                            {t("sectionsLabel")}
                        </label>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {DATA_SECTIONS.map((section) => (
                                <button
                                    key={section.key}
                                    type="button"
                                    onClick={() => toggleSection(section.key)}
                                    className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition ${selectedSections.includes(section.key)
                                        ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                                        : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-base">
                                        {section.icon}
                                    </span>
                                    {t(`sections.${section.key}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleRequestExport}
                        disabled={isLoading || selectedSections.length === 0 || (!isPlusOrAbove && exportUsage[0] >= exportUsage[1])}
                        className="w-full rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white transition hover:bg-primary/90 disabled:opacity-50"
                    >
                        {isLoading ? t("requesting") : (!isPlusOrAbove && exportUsage[0] >= exportUsage[1]) ? t("limitReached") : t("requestExport")}
                    </button>
                </div>
            )}

            {/* Step: OTP verification */}
            {step === "otp" && (
                <div className="space-y-5">
                    <p className="text-sm text-on-surface-variant">
                        {t("otpSent")}
                    </p>
                    <div>
                        <label className="mb-2 block text-sm font-bold text-primary">
                            {t("otpLabel")}
                        </label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="123456"
                            maxLength={6}
                            className="w-full rounded-xl bg-surface-container-highest px-5 py-4 text-center text-2xl font-bold tracking-[0.5em] text-on-surface outline-none ring-0 transition focus:ring-2 focus:ring-primary-fixed-dim"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={isLoading || otp.length < 4}
                        className="w-full rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white transition hover:bg-primary/90 disabled:opacity-50"
                    >
                        {isLoading ? t("verifying") : t("verifyOtp")}
                    </button>
                </div>
            )}

            {/* Step: Download */}
            {step === "download" && (
                <div className="space-y-5">
                    <div className="rounded-xl bg-primary/10 p-6 text-center">
                        <span className="material-symbols-outlined mb-2 text-4xl text-primary">
                            cloud_done
                        </span>
                        <p className="text-sm font-semibold text-primary">
                            {t("readyToDownload")}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleDownload}
                        disabled={isLoading}
                        className="w-full rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white transition hover:bg-primary/90 disabled:opacity-50"
                    >
                        {isLoading ? t("downloading") : t("download")}
                    </button>
                </div>
            )}

            {/* Step: Complete */}
            {step === "complete" && (
                <div className="space-y-5">
                    <div className="rounded-xl bg-primary/10 p-6 text-center">
                        <span className="material-symbols-outlined mb-2 text-4xl text-primary">
                            check_circle
                        </span>
                        <p className="text-sm font-semibold text-primary">
                            {t("downloadComplete")}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="w-full rounded-xl bg-surface-container-high px-6 py-3.5 text-sm font-bold text-on-surface-variant transition hover:bg-surface-container-highest"
                    >
                        {t("exportAgain")}
                    </button>
                </div>
            )}
        </section>
    );
}
