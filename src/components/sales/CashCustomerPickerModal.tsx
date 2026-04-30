"use client";

import { useTranslations } from "next-intl";
import CustomerPickerDialog from "@/components/sales/CustomerPickerDialog";
import type { CustomerResponse } from "@/types/due";

interface CashCustomerPickerModalProps {
    businessId: string;
    open: boolean;
    onClose: () => void;
    onSelect: (customer: CustomerResponse) => void;
    onSkip: () => void;
}

/**
 * CashCustomerPickerModal — Customer picker for CASH sales.
 * Wraps CustomerPickerDialog with an additional "Skip — Sale Without Customer" option.
 * This modal is ONLY used in the cash sale flow. The credit sale flow uses
 * CustomerPickerDialog directly (mandatory, no skip).
 */
export default function CashCustomerPickerModal({
    businessId,
    open,
    onClose,
    onSelect,
    onSkip,
}: CashCustomerPickerModalProps) {
    const t = useTranslations("shop.sales");

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-md">
                {/* Inner picker — reuse existing CustomerPickerDialog logic */}
                <div className="relative">
                    <CustomerPickerDialog
                        businessId={businessId}
                        open={open}
                        onClose={onClose}
                        onSelect={(customer) => {
                            onSelect(customer);
                        }}
                    />
                </div>

                {/* Skip button — only shown for CASH sales */}
                <div className="mt-3">
                    <button
                        type="button"
                        onClick={onSkip}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 bg-white py-3 text-sm font-semibold text-gray-600 transition-colors hover:border-gray-400 hover:bg-gray-50 hover:text-gray-800 active:scale-[0.98]"
                    >
                        <span className="material-symbols-outlined text-lg">person_off</span>
                        {t("customer.skipForCash")}
                    </button>
                </div>
            </div>
        </div>
    );
}