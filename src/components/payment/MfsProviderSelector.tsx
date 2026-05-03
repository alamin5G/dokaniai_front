"use client";
// ---------------------------------------------------------------------------
// MfsProviderSelector — Shared MFS provider selection cards
// Used by: SubscriptionControlCenter, Due Payment Page
// ---------------------------------------------------------------------------
import type { MfsType } from "@/types/subscription";
import { MFS_LABELS, MFS_THEMES } from "@/lib/mfsPaymentUtils";

export interface MfsProviderOption {
    type: MfsType;
    number?: string; // masked number to display
    disabled?: boolean;
}

interface MfsProviderSelectorProps {
    selected: MfsType | null;
    onSelect: (method: MfsType) => void;
    providers: MfsProviderOption[];
    className?: string;
}

export default function MfsProviderSelector({
    selected,
    onSelect,
    providers,
    className = "",
}: MfsProviderSelectorProps) {
    return (
        <div className={`flex gap-3 ${className}`}>
            {providers.map((provider) => {
                const theme = MFS_THEMES[provider.type];
                const label = MFS_LABELS[provider.type];
                const isActive = selected === provider.type;

                return (
                    <button
                        key={provider.type}
                        type="button"
                        onClick={() => !provider.disabled && onSelect(provider.type)}
                        disabled={provider.disabled}
                        className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${isActive
                                ? `${theme.activeBg} ${theme.activeText} shadow-md`
                                : `${theme.bg} ${theme.text} border ${theme.border} hover:shadow-sm`
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <span className="mr-1">{theme.icon}</span>
                        {label}
                        {provider.number && (
                            <span className="block text-[10px] font-normal mt-0.5 opacity-80">
                                {provider.number}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
