"use client";
// ---------------------------------------------------------------------------
// TrxIdInput — Shared TrxID input with per-provider validation
// Used by: SubscriptionWorkspace, Due Payment Page
// ---------------------------------------------------------------------------
import type { MfsType } from "@/types/subscription";
import { getTrxHint, getTrxMaxLength, validateTrxId } from "@/lib/mfsPaymentUtils";

interface TrxIdInputProps {
    value: string;
    onChange: (value: string) => void;
    mfsMethod: MfsType | null;
    error?: string | null;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
    isBn?: boolean;
}

export default function TrxIdInput({
    value,
    onChange,
    mfsMethod,
    error,
    disabled,
    placeholder,
    className = "",
    isBn = false,
}: TrxIdInputProps) {
    const maxLen = getTrxMaxLength(mfsMethod);
    const validationError = validateTrxId(value, mfsMethod);
    const hint = getTrxHint(mfsMethod, isBn);
    const displayError = error || validationError;

    return (
        <div className={`space-y-1.5 ${className}`}>
            <input
                type="text"
                value={value}
                disabled={disabled}
                onChange={(event) => {
                    const raw = event.target.value.toUpperCase();
                    onChange(raw.length > maxLen ? raw.slice(0, maxLen) : raw);
                }}
                maxLength={maxLen}
                minLength={value.length > 0 ? maxLen : undefined}
                placeholder={placeholder || (isBn ? "ট্রানজেকশন আইডি" : "Transaction ID")}
                className={`w-full rounded-xl border px-4 py-3 text-sm font-mono tracking-wider transition-colors
          ${displayError
                        ? "border-red-400 bg-red-50 text-red-700 focus:border-red-500"
                        : "border-outline-variant/40 bg-surface-container-lowest text-on-surface focus:border-primary"
                    }
          focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50`}
            />
            {hint && !displayError && (
                <p className="flex items-center gap-1 text-[11px] text-on-surface-variant">
                    <span className="material-symbols-outlined text-[13px]">info</span>
                    {hint}
                </p>
            )}
            {displayError && (
                <p className="text-[11px] text-red-600">{displayError}</p>
            )}
        </div>
    );
}
