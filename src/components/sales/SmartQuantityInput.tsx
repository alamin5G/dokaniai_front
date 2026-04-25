"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { getUnitStep, getUnitButtonStep, isFractionalUnit } from "@/lib/productUnits";

interface SmartQuantityInputProps {
    quantity: number;
    unit: string;
    onChange: (newQuantity: number) => void;
}

const QUICK_FRACTIONS = [0.25, 0.5, 0.75, 1];
const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

function toBnDigits(n: string): string {
    return n.replace(/\d/g, (d) => BN_DIGITS[parseInt(d)]);
}

export default function SmartQuantityInput({
    quantity,
    unit,
    onChange,
}: SmartQuantityInputProps) {
    const t = useTranslations("shop.sales");
    const precision = getUnitStep(unit);       // 0.01 for kg — minimum input precision
    const buttonStep = getUnitButtonStep(unit); // 0.25 for kg — ± button step
    const fractional = isFractionalUnit(unit);
    const [editing, setEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    /** Clamp to minimum precision, ensure > 0 */
    const sanitize = useCallback(
        (v: number) => {
            const rounded = Math.round(v / precision) * precision;
            return Math.max(precision, parseFloat(rounded.toFixed(4)));
        },
        [precision],
    );

    const handleDec = () => {
        const next = sanitize(quantity - buttonStep);
        if (next >= precision) onChange(next);
    };

    const handleInc = () => {
        onChange(sanitize(quantity + buttonStep));
    };

    const handleChip = (val: number) => {
        onChange(val);
    };

    const handleBlur = () => {
        setEditing(false);
        if (inputRef.current) {
            const parsed = parseFloat(inputRef.current.value);
            if (!isNaN(parsed) && parsed > 0) {
                onChange(sanitize(parsed));
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
        }
    };

    const displayValue = fractional
        ? quantity % 1 !== 0
            ? quantity.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")
            : String(quantity)
        : String(Math.round(quantity));

    return (
        <div className="flex flex-col gap-1.5">
            {/* Main stepper row */}
            <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    onClick={handleDec}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-white text-primary shadow-sm transition-colors hover:bg-primary hover:text-white active:scale-95"
                >
                    <span className="material-symbols-outlined text-sm">remove</span>
                </button>

                {editing ? (
                    <input
                        ref={inputRef}
                        type="number"
                        step={precision}
                        min={precision}
                        defaultValue={quantity}
                        autoFocus
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        className="w-16 rounded border border-primary/30 bg-white px-1.5 py-0.5 text-center text-sm font-bold text-on-surface focus:border-primary focus:outline-none"
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="min-w-[2.5rem] rounded px-1.5 py-0.5 text-center text-sm font-bold text-on-surface transition-colors hover:bg-white/50"
                        title={t("cart.quantity.tapToEdit")}
                    >
                        {displayValue}
                    </button>
                )}

                <button
                    type="button"
                    onClick={handleInc}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-white text-primary shadow-sm transition-colors hover:bg-primary hover:text-white active:scale-95"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                </button>
            </div>

            {/* Quick fraction chips — only for fractional units at low quantities */}
            {fractional && quantity < 2 && (
                <div className="flex items-center gap-1">
                    {QUICK_FRACTIONS.map((val) => (
                        <button
                            key={val}
                            type="button"
                            onClick={() => handleChip(val)}
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${Math.abs(quantity - val) < 0.01
                                ? "bg-primary text-white"
                                : "bg-white text-on-surface-variant hover:bg-primary/10"
                                }`}
                        >
                            {toBnDigits(String(val))}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}