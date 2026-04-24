"use client";

import type { ParsedAction, ParsedProduct } from "@/types/ai";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

interface ParsedProductModalProps {
    parsedAction: ParsedAction;
    onConfirm: (edited: ParsedProduct) => void;
    onCancel: () => void;
    isExecuting?: boolean;
}

function confidenceColor(pct: number): string {
    if (pct >= 80) return "bg-emerald-500";
    if (pct >= 50) return "bg-amber-500";
    return "bg-rose-500";
}

const UNIT_LABELS: Record<string, string> = {
    kg: "কেজি",
    pcs: "টি",
    liter: "লিটার",
    packet: "প্যাকেট",
    bottle: "বোতল",
    bag: "ব্যাগ",
    dozen: "ডজন",
    gram: "গ্রাম",
    ml: "মিলি",
    meter: "মিটার",
    piece: "পিস",
};

function unitLabel(unit: string | null): string {
    if (!unit) return "";
    return UNIT_LABELS[unit] ?? unit;
}

export default function ParsedProductModal({
    parsedAction,
    onConfirm,
    onCancel,
    isExecuting = false,
}: ParsedProductModalProps) {
    const t = useTranslations("shop.products.voice.modal");

    const initialProduct: ParsedProduct = useMemo(() => {
        try {
            if (parsedAction.structuredOutput) {
                return JSON.parse(parsedAction.structuredOutput) as ParsedProduct;
            }
        } catch {
            // ignore
        }
        return {
            name: null,
            unit: null,
            costPrice: null,
            sellPrice: null,
            stockQty: null,
            reorderPoint: null,
            categoryName: null,
            subCategoryName: null,
            existingProductId: null,
            isNew: true,
            confidenceScore: parsedAction.confidenceScore ?? 0,
        };
    }, [parsedAction]);

    const [form, setForm] = useState<ParsedProduct>(initialProduct);

    useEffect(() => {
        setForm(initialProduct);
    }, [initialProduct]);

    const setField = useCallback(
        <K extends keyof ParsedProduct>(key: K, value: ParsedProduct[K]) => {
            setForm((prev) => ({ ...prev, [key]: value }));
        },
        [],
    );

    const confidencePct = Math.round(
        (form.confidenceScore ?? parsedAction.confidenceScore ?? 0) * 100,
    );

    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") onCancel();
        }
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onCancel]);

    const handleSubmit = useCallback(() => {
        onConfirm(form);
    }, [form, onConfirm]);

    const uLabel = unitLabel(form.unit);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div
                className="relative w-full max-w-md rounded-2xl bg-surface-container-lowest shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
                    <h2 className="text-lg font-bold text-on-surface">
                        {form.isNew ? t("titleAdd") : t("titleUpdate")} – নিশ্চিত করুন
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

                {/* ── Existing product warning ── */}
                {!form.isNew && form.existingProductId && (
                    <div className="mx-5 mt-3 flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-200 px-3 py-2.5 text-xs text-blue-700">
                        <span className="text-base leading-none">⚠️</span>
                        <span className="font-medium">{t("existingWarning")}</span>
                    </div>
                )}

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

                    {/* Quantity + Unit row */}
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
                        <FieldRow label={t("unit")}>
                            <input
                                type="text"
                                value={form.unit ?? ""}
                                onChange={(e) => setField("unit", e.target.value || null)}
                                placeholder={t("unitPlaceholder")}
                                className="w-full rounded-lg bg-surface-container-high px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-on-surface-variant/50"
                            />
                        </FieldRow>
                    </div>

                    {/* Cost price + Sell price — with per-unit suffix */}
                    <div className="grid grid-cols-2 gap-3">
                        <FieldRow label={t("costPrice")}>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant">৳</span>
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
                                    className="w-full rounded-lg bg-surface-container-high pl-7 pr-2 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-on-surface-variant/50"
                                />
                                {uLabel && form.costPrice != null && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-on-surface-variant">/{uLabel}</span>
                                )}
                            </div>
                        </FieldRow>
                        <FieldRow label={t("sellPrice")}>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant">৳</span>
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
                                    className="w-full rounded-lg bg-surface-container-high pl-7 pr-2 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-on-surface-variant/50"
                                />
                                {uLabel && form.sellPrice != null && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-on-surface-variant">/{uLabel}</span>
                                )}
                            </div>
                        </FieldRow>
                    </div>

                    {/* Category + Sub-category row */}
                    <div className="grid grid-cols-2 gap-3">
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
                        <FieldRow label={t("subCategory")}>
                            <input
                                type="text"
                                value={form.subCategoryName ?? ""}
                                onChange={(e) =>
                                    setField("subCategoryName", e.target.value || null)
                                }
                                placeholder={t("subCategoryPlaceholder")}
                                className="w-full rounded-lg bg-surface-container-high px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-on-surface-variant/50"
                            />
                        </FieldRow>
                    </div>

                    {/* Reorder point */}
                    <div className="grid grid-cols-2 gap-3">
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
                        {t("confirmCancel")}
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
