"use client";

import { useTranslations } from "next-intl";

// ─── Types ───────────────────────────────────────────────

export interface StockConflictDetail {
    productId: string;
    productName: string;
    requested: number;
    available: number;
}

interface StockConflictModalProps {
    open: boolean;
    onClose: () => void;
    conflict: StockConflictDetail | null;
    onConfirm: () => void;
    onDiscard: () => void;
}

// ─── Component ───────────────────────────────────────────

export default function StockConflictModal({
    open,
    onClose,
    conflict,
    onConfirm,
    onDiscard,
}: StockConflictModalProps) {
    const t = useTranslations("shop.sales");

    if (!open || !conflict) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-2xl space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-error">
                        <span className="material-symbols-outlined">warning</span>
                        {t("stockConflict.title")}
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 hover:bg-surface-container transition-colors"
                    >
                        <span className="material-symbols-outlined text-on-surface-variant">close</span>
                    </button>
                </div>

                {/* Conflict Details */}
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-3">
                    <p className="text-sm font-medium text-amber-900">
                        {t("stockConflict.message", {
                            product: conflict.productName,
                            requested: conflict.requested,
                            available: conflict.available,
                        })}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-white p-3 text-center shadow-sm">
                            <p className="text-xs font-bold text-on-surface-variant uppercase">
                                Requested
                            </p>
                            <p className="mt-1 text-2xl font-black text-error">
                                {conflict.requested}
                            </p>
                        </div>
                        <div className="rounded-lg bg-white p-3 text-center shadow-sm">
                            <p className="text-xs font-bold text-on-surface-variant uppercase">
                                Available
                            </p>
                            <p className="mt-1 text-2xl font-black text-primary">
                                {conflict.available}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Warning */}
                <div className="rounded-xl bg-surface-container p-4 flex items-start gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant mt-0.5">info</span>
                    <p className="text-xs text-on-surface-variant">
                        Confirming will allow negative stock for this product. This may indicate
                        offline sales that need to be reconciled.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onDiscard}
                        className="flex-1 rounded-xl bg-surface-container px-4 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                    >
                        {t("stockConflict.discard")}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="flex-1 rounded-xl bg-error px-4 py-3 text-sm font-bold text-white hover:bg-error/90 transition-colors"
                    >
                        {t("stockConflict.confirm")}
                    </button>
                </div>
            </div>
        </div>
    );
}
