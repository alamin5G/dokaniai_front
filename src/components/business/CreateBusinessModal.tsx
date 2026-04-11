"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { FormInput, GradientButton } from "@/components/ui/FormPrimitives";
import { useBusinessStore } from "@/store/businessStore";
import { getApiErrorMessage } from "@/lib/apiError";
import type { BusinessCreateRequest } from "@/types/business";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BUSINESS_TYPES = [
    "grocery",
    "electronics",
    "clothing",
    "fashion",
    "pharmacy",
    "restaurant",
    "stationery",
    "hardware",
    "other",
] as const;

const CURRENCIES = [
    { value: "BDT", label: "৳ BDT — বাংলাদেশি টাকা" },
    { value: "USD", label: "$ USD — US Dollar" },
    { value: "INR", label: "₹ INR — Indian Rupee" },
    { value: "EUR", label: "€ EUR — Euro" },
    { value: "GBP", label: "£ GBP — British Pound" },
] as const;

// Map backend type values to i18n keys
const TYPE_I18N_KEY: Record<string, string> = {
    grocery: "grocery",
    electronics: "electronics",
    clothing: "clothing",
    fashion: "clothing",
    pharmacy: "pharmacy",
    restaurant: "restaurant",
    stationery: "stationery",
    hardware: "hardware",
    other: "other",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CreateBusinessModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreateBusinessModal({
    open,
    onClose,
    onSuccess,
}: CreateBusinessModalProps) {
    const t = useTranslations("business");
    const { createBusiness, setActiveBusiness, isCreating } =
        useBusinessStore();

    // Form state
    const [name, setName] = useState("");
    const [type, setType] = useState("");
    const [description, setDescription] = useState("");
    const [currency, setCurrency] = useState("BDT");

    // Validation & error
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [apiError, setApiError] = useState<string | null>(null);

    // ---- Validation ----
    function validate(): boolean {
        const next: Record<string, string> = {};
        if (!name.trim()) {
            next.name = t("form.errorNameRequired");
        }
        if (!type) {
            next.type = t("form.errorTypeRequired");
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    // ---- Submit ----
    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setApiError(null);

        if (!validate()) return;

        const data: BusinessCreateRequest = {
            name: name.trim(),
            type,
            ...(description.trim() ? { description: description.trim() } : {}),
            currency,
        };

        try {
            const business = await createBusiness(data);
            setActiveBusiness(business);
            onSuccess();
        } catch (err: unknown) {
            setApiError(getApiErrorMessage(err, t("list.errorCreate")));
        }
    }

    // ---- Reset & close ----
    function handleClose() {
        setName("");
        setType("");
        setDescription("");
        setCurrency("BDT");
        setErrors({});
        setApiError(null);
        onClose();
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal content */}
            <div className="relative bg-surface-container-lowest rounded-2xl p-8 max-w-lg w-full mx-4">
                {/* Close button */}
                <button
                    type="button"
                    onClick={handleClose}
                    className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors"
                    aria-label="Close"
                >
                    <span className="material-symbols-outlined text-xl">close</span>
                </button>

                {/* Title */}
                <h2 className="text-2xl font-bold text-on-surface mb-6">
                    {t("form.createButton")}
                </h2>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Business Name */}
                    <FormInput
                        label={t("form.nameLabel")}
                        placeholder={t("form.namePlaceholder")}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        error={errors.name}
                    />

                    {/* Business Type */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-primary ml-1">
                            {t("form.typeLabel")}
                        </label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full pl-6 pr-6 py-4 bg-surface-container-highest rounded-[1rem] text-lg text-on-surface transition-all appearance-none cursor-pointer"
                        >
                            <option value="" disabled>
                                {t("form.typePlaceholder")}
                            </option>
                            {BUSINESS_TYPES.map((bt) => (
                                <option key={bt} value={bt}>
                                    {t(`types.${TYPE_I18N_KEY[bt] ?? "other"}`)}
                                </option>
                            ))}
                        </select>
                        {errors.type && (
                            <p className="text-sm text-error ml-1 font-semibold">
                                {errors.type}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-primary ml-1">
                            {t("form.descriptionLabel")}
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t("form.descriptionPlaceholder")}
                            rows={3}
                            className="w-full pl-6 pr-6 py-4 bg-surface-container-highest rounded-[1rem] text-lg text-on-surface transition-all placeholder:text-outline-variant resize-none"
                        />
                    </div>

                    {/* Currency */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-primary ml-1">
                            {t("form.currencyLabel")}
                        </label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full pl-6 pr-6 py-4 bg-surface-container-highest rounded-[1rem] text-lg text-on-surface transition-all appearance-none cursor-pointer"
                        >
                            {CURRENCIES.map((c) => (
                                <option key={c.value} value={c.value}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* API Error */}
                    {apiError && (
                        <p className="text-sm text-error font-semibold text-center">
                            {apiError}
                        </p>
                    )}

                    {/* Submit */}
                    <GradientButton type="submit" loading={isCreating}>
                        {t("form.createButton")}
                    </GradientButton>
                </form>
            </div>
        </div>
    );
}
