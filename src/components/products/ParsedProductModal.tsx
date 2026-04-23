"use client";

import type { ParsedAction, ParsedProduct } from "@/types/ai";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface ParsedProductModalProps {
    /** The parsed action returned from the AI parse endpoint */
    parsedAction: ParsedAction;
    /** Called when user confirms the edited product data */
    onConfirm: (edited: ParsedProduct) => void;
    /** Called when user cancels / closes the modal */
    onCancel: () => void;
    /** Whether the confirm action is currently executing */
    isExecuting?: boolean;
}

// ---------------------------------------------------------------------------
// Confidence bar colour helper
// ---------------------------------------------------------------------------
function confidenceColor(pct: number): string {
    if (pct >= 80) return "bg-emerald-500";
    if (pct >= 50) return "bg-amber-500";
    return "bg-rose-500";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ParsedProductModal({
    parsedAction,
    onConfirm,
    onCancel,
    isExecuting = false,
}: ParsedProductModalProps) {
    const t = useTranslations("shop.products.voice.modal");

    // ── Parse structuredOutput JSON into ParsedProduct ──
    const initialProduct: ParsedProduct = useMemo(() => {
        try {
            if (parsedAction.structuredOutput) {
                return JSON.parse(parsedAction.structuredOutput) as ParsedProduct;
            }
        } catch {
            // ignore parse errors
        }
        return {
            name: null,
            unit: null,
            costPrice: null,
            sellPrice: null,
            stockQty: null,
            reorderPoint: null,
            categoryName: null,
            existingProductId: null,
            isNew: true,
            confidenceScore: parsedAction.confidenceScore ?? 0,
        };
    }, [parsedAction]);

    // ── Editable form state ──
    const [form, setForm] = useState<ParsedProduct>(initialProduct);

    // Sync if parsedAction changes while modal is open
    useEffect(() => {
        setForm(initialProduct);
    }, [initialProduct]);

    const setField = useCallback(
        <K extends keyof ParsedProduct>(key: K, value: ParsedProduct[K]) => {
            setForm((prev) => ({ ...prev, [key]: value }));
        },
        [],
    );

    // ── Confidence percentage ──
    const confidencePct = Math.round(
        (form.confidenceScore ?? parsedAction.confidenceScore ?? 0) * 100,
    );

    // ── Close on Escape key ──
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") onCancel();
        }
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onCancel]);

    // ── Submit handler ──
    const handleSubmit = useCallback(() => {
        onConfirm(form);
    }, [form, onConfirm]);

    // ── Render ──
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div
                className="relative w-full max-w-md rounded-2xl bg-surface-container-lowest shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
                    <h2 className="text-lg font-bold text-on-surface">
                        {form.isNew ? t("titleAdd") : t("titleUpdate")}
                    </h2>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-low transition-colors"
                        aria-label={t("close")}
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
                                d="M6 18 18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* ── Confidence bar ── */}
                <div className="px-5 pt-4">
                    <div className="flex items-center justify-between text-xs font-medium text-on-surface-variant mb-1.5">
                        <span>{t("confidence")}</span>
                        <span>{confidencePct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-surface-container-highest overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${confidenceColor(confidencePct)}`}
                            style={{ width: `${confidencePct}%` }}
                        />
                    </div>
                </div>

                {/* ── Form fields ── */}
                <div className="space-y-3 px-5 py-4">
                    {/* Product name */}
                    <FieldRow label={t("name")}>
                        <input
                            type="text"
                            value={form.name ?? ""}
                            onChange={(e) => setField("name", e.target.value || null)}
                            placeholder={t("namePlaceholder")}
                            className="w-full rounded-lg bg-surface-container-high px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-on-surface-variant/50"
                        />
                    </FieldRow>

                    {/* Unit + Category row */}
                    <div className="grid grid-cols-2 gap-3">
                        <FieldRow label={t("unit")}>
                            <input
                                type="text"
                                value={form.unit ?? ""}
                                onChange={(e) => setField("unit", e.target.value || null)}
                                placeholder={t("unitPlaceholder")}
                                className="w-full rounded-lg bg-surface-container-high px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-on-surface-variant/50"
                            />
                        </FieldRow>
                        <FieldRow label={t("category")}>
                            <input
                                type="text"
                                value={form.categoryName ?? ""}
                                onChange={(e) =>
                                    setField("categoryName", e.target.value || null)
                                }
                                placeholder={t("categoryPlaceholder")}
                                className="w-full rounded-lg bg-surface-container-high px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-on-surface-variant/50"
                            />
                        </FieldRow>
                    </div>

                    {/* Cost price + Sell price row */}
                    <div className="grid grid-cols-2 gap-3">
                        <FieldRow label={t("costPrice")}>
                            <input
                                type="number"
                                step="any"
                                value={form.costPrice ?? ""}
                                onChange={(e) =>
                                    setField(
                                        "costPrice",
                                        e.target.value ? Number(e.target.value) : null,
                                    )
                                }
                                placeholder="০.০০"
                                className="w-full rounded-lg bg-surface-container-high px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-on-surface-variant/50"
                            />
                        </FieldRow>
                        <FieldRow label={t("sellPrice")}>
                            <input
                                type="number"
                                step="any"
                                value={form.sellPrice ?? ""}
                                onChange={(e) =>
                                    setField(
                                        "sellPrice",
                                        e.target.value ? Number(e.target.value) : null,
                                    )
                                }
                                placeholder="০.০০"
                                className="w-full rounded-lg bg-surface-container-high px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-on-surface-variant/50"
                            />
                        </FieldRow>
                    </div>

                    {/* Stock qty + Reorder point row */}
                    <div className="grid grid-cols-2 gap-3">
                        <FieldRow label={t("stockQty")}>
                            <input
                                type="number"
                                step="any"
                                value={form.stockQty ?? ""}
                                onChange={(e) =>
                                    setField(
                                        "stockQty",
                                        e.target.value ? Number(e.target.value) : null,
                                    )
                                }
                                placeholder="০"
                                className="w-full rounded-lg bg-surface-container-high px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-on-surface-variant/50"
                            />
                        </FieldRow>
                        <FieldRow label={t("reorderPoint")}>
                            <input
                                type="number"
                                step="any"
                                value={form.reorderPoint ?? ""}
                                onChange={(e) =>
                                    setField(
                                        "reorderPoint",
                                        e.target.value ? Number(e.target.value) : null,
                                    )
                                }
                                placeholder="০"
                                className="w-full rounded-lg bg-surface-container-high px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-on-surface-variant/50"
                            />
                        </FieldRow>
                    </div>

                    {/* Uncertainty warning */}
                    {parsedAction.uncertaintyReason && (
                        <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                            <span className="text-base leading-none">⚠️</span>
                            <span>{parsedAction.uncertaintyReason}</span>
                        </div>
                    )}
                </div>

                {/* ── Footer actions ── */}
                <div className="flex gap-3 border-t border-outline-variant px-5 py-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 rounded-xl bg-surface-container-high py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                    >
                        {t("cancel")}
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isExecuting}
                        className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-on-primary hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isExecuting
                            ? t("executing")
                            : form.isNew
                                ? t("confirmAdd")
                                : t("confirmUpdate")}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Reusable field row
// ---------------------------------------------------------------------------
function FieldRow({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-medium text-on-surface-variant">
                {label}
            </span>
            {children}
        </label>
    );
}
