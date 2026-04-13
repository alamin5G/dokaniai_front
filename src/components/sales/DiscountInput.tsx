"use client";

import { useTranslations } from "next-intl";
import type { DiscountMethod } from "@/types/sale";

interface DiscountInputProps {
    method: DiscountMethod;
    onMethodChange: (method: DiscountMethod) => void;
    value: string;
    onValueChange: (value: string) => void;
}

export default function DiscountInput({
    method,
    onMethodChange,
    value,
    onValueChange,
}: DiscountInputProps) {
    const t = useTranslations("shop.sales");

    return (
        <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                {t("cart.discount.label")}
            </label>
            <div className="flex gap-2 rounded-xl bg-surface-container-high p-1">
                <button
                    type="button"
                    onClick={() => onMethodChange("FIXED")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 font-bold transition-all ${method === "FIXED"
                            ? "bg-surface-container-lowest text-primary shadow-sm"
                            : "text-on-surface-variant hover:bg-surface-container-lowest/50"
                        }`}
                >
                    <span className="material-symbols-outlined text-sm">payments</span>
                    {t("cart.discount.fixed")}
                </button>
                <button
                    type="button"
                    onClick={() => onMethodChange("PERCENTAGE")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 font-bold transition-all ${method === "PERCENTAGE"
                            ? "bg-surface-container-lowest text-primary shadow-sm"
                            : "text-on-surface-variant hover:bg-surface-container-lowest/50"
                        }`}
                >
                    <span className="material-symbols-outlined text-sm">percent</span>
                    {t("cart.discount.percentage")}
                </button>
            </div>
            <input
                type="number"
                min="0"
                step={method === "PERCENTAGE" ? "0.1" : "1"}
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                className="mt-2 w-full rounded-xl bg-surface-container-low py-2 px-4 text-center font-bold text-on-surface outline-none focus:ring-1 focus:ring-primary"
                placeholder={t("cart.discount.placeholder")}
            />
        </div>
    );
}
