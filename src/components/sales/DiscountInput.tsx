"use client";

import { useTranslations } from "next-intl";
import { Banknote, Percent } from "lucide-react";
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
        <div className="flex items-center gap-1.5 flex-nowrap">
            {/* Compact toggle pills — ৳ / % */}
            <div className="flex shrink-0 rounded-lg bg-surface-container-high p-0.5">
                <button
                    type="button"
                    onClick={() => onMethodChange("FIXED")}
                    title={t("cart.discount.fixed")}
                    className={`flex items-center justify-center rounded-md px-2 py-1 text-xs font-bold transition-all ${method === "FIXED"
                        ? "bg-surface-container-lowest text-primary shadow-sm"
                        : "text-on-surface-variant hover:bg-surface-container-lowest/50"
                        }`}
                >
                    <span className="flex items-center gap-1 text-sm">
                        <Banknote className="h-3.5 w-3.5" />
                        <span>৳</span>
                    </span>
                </button>
                <button
                    type="button"
                    onClick={() => onMethodChange("PERCENTAGE")}
                    title={t("cart.discount.percentage")}
                    className={`flex items-center justify-center rounded-md px-2 py-1 text-xs font-bold transition-all ${method === "PERCENTAGE"
                        ? "bg-surface-container-lowest text-primary shadow-sm"
                        : "text-on-surface-variant hover:bg-surface-container-lowest/50"
                        }`}
                >
                    <span className="flex items-center gap-1 text-sm">
                        <Percent className="h-3.5 w-3.5" />
                        <span>%</span>
                    </span>
                </button>
            </div>

            {/* Value input — fills remaining space */}
            <input
                type="number"
                min="0"
                step={method === "PERCENTAGE" ? "0.1" : "1"}
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                className="w-full min-w-0 rounded-lg bg-surface-container-low py-1 px-2.5 text-right text-sm font-bold text-on-surface outline-none focus:ring-1 focus:ring-primary"
                placeholder={t("cart.discount.placeholder")}
            />
        </div>
    );
}