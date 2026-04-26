"use client";

import { useLocale, useTranslations } from "next-intl";
import type { FormEvent } from "react";
import type { CategoryResponse } from "@/types/category";
import type { Product } from "@/types/product";
import { getProductUnitOptions } from "@/lib/productUnits";

export type EditorMode = "create" | "edit";

export interface ProductFormState {
    name: string;
    sku: string;
    barcode: string;
    description: string;
    unit: string;
    costPrice: string;
    sellPrice: string;
    stockQty: string;
    reorderPoint: string;
    purchaseDate: string;
    expiryDate: string;
    categoryId: string;
    subCategoryId: string;
    restockQty: string;
}

export const initialFormState: ProductFormState = {
    name: "",
    sku: "",
    barcode: "",
    description: "",
    unit: "pcs",
    costPrice: "",
    sellPrice: "",
    stockQty: "",
    reorderPoint: "",
    purchaseDate: "",
    expiryDate: "",
    categoryId: "",
    subCategoryId: "",
    restockQty: "",
};

export function toFormState(product: Product): ProductFormState {
    return {
        name: product.name,
        sku: product.sku,
        barcode: product.barcode ?? "",
        description: product.description ?? "",
        unit: product.unit,
        costPrice: product.costPrice.toString(),
        sellPrice: product.sellPrice.toString(),
        stockQty: product.stockQty.toString(),
        reorderPoint: product.reorderPoint?.toString() ?? "",
        purchaseDate: product.purchaseDate ?? "",
        expiryDate: product.expiryDate ?? "",
        categoryId: product.categoryId ?? "",
        subCategoryId: product.subCategoryId ?? "",
        restockQty: "",
    };
}

interface ProductFormProps {
    businessId: string;
    form: ProductFormState;
    editorMode: EditorMode;
    editingProduct: Product | null;
    categories: CategoryResponse[];
    isSubmitting: boolean;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onUpdateForm: <K extends keyof ProductFormState>(
        key: K,
        value: ProductFormState[K],
    ) => void;
    onReset: () => void;
}

export default function ProductForm({
    businessId,
    form,
    editorMode,
    editingProduct,
    categories,
    isSubmitting,
    onSubmit,
    onUpdateForm,
    onReset,
}: ProductFormProps) {
    const t = useTranslations("shop.products");
    const locale = useLocale();
    const isBn = locale.toLowerCase().startsWith("bn");

    function getCategoryName(category: CategoryResponse): string {
        if (isBn) return category.nameBn;
        return category.nameEn ?? category.nameBn;
    }

    // Top-level categories for the category dropdown
    const topLevelCategories = categories.filter((c) => c.parentId === null);

    // Sub-categories for the selected parent category
    const selectedParent = form.categoryId;
    const subCategories = selectedParent
        ? categories.filter((c) => c.parentId === selectedParent)
        : [];
    const unitOptions = getProductUnitOptions(form.unit);

    return (
        <section className="rounded-[28px] bg-surface-container p-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-secondary">
                        {editorMode === "edit" ? t("form.editTitle") : t("form.quickEntry")}
                    </p>
                    <h3 className="mt-1 text-2xl font-bold text-primary">
                        {editorMode === "edit"
                            ? t("form.editProductName", {
                                name: editingProduct?.name ?? "Product",
                            })
                            : t("form.createTitle")}
                    </h3>
                </div>
                {editorMode === "edit" ? (
                    <button
                        type="button"
                        onClick={onReset}
                        className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-primary"
                    >
                        {t("form.newForm")}
                    </button>
                ) : null}
            </div>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                {/* Product Name */}
                <label className="block">
                    <span className="mb-2 block text-sm font-medium text-on-surface">
                        {t("form.name")}
                    </span>
                    <input
                        value={form.name}
                        onChange={(event) => onUpdateForm("name", event.target.value)}
                        required
                        className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none"
                        placeholder={t("form.namePlaceholder")}
                    />
                </label>

                {/* SKU + Barcode */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-on-surface">
                            {t("form.sku")}
                        </span>
                        <input
                            value={form.sku}
                            onChange={(event) => onUpdateForm("sku", event.target.value)}
                            disabled={editorMode === "edit"}
                            className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none disabled:opacity-60"
                            placeholder={t("form.skuPlaceholder")}
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-on-surface">
                            {t("form.barcode")}
                        </span>
                        <input
                            value={form.barcode}
                            onChange={(event) => onUpdateForm("barcode", event.target.value)}
                            disabled={editorMode === "edit"}
                            className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none disabled:opacity-60"
                            placeholder={t("form.barcodePlaceholder")}
                        />
                    </label>
                </div>

                {/* Description */}
                <label className="block">
                    <span className="mb-2 block text-sm font-medium text-on-surface">
                        {t("form.description")}
                    </span>
                    <textarea
                        value={form.description}
                        onChange={(event) => onUpdateForm("description", event.target.value)}
                        rows={3}
                        className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none"
                        placeholder={t("form.descriptionPlaceholder")}
                    />
                </label>

                {/* Category + Sub-Category */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-on-surface">
                            {t("form.category")}
                        </span>
                        <select
                            value={form.categoryId}
                            onChange={(event) => {
                                onUpdateForm("categoryId", event.target.value);
                                // Reset subcategory when parent changes
                                onUpdateForm("subCategoryId", "");
                            }}
                            className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none"
                        >
                            <option value="">{t("form.categoryPlaceholder")}</option>
                            {topLevelCategories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {getCategoryName(cat)}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-on-surface">
                            {t("form.subCategory")}
                        </span>
                        <select
                            value={form.subCategoryId}
                            onChange={(event) =>
                                onUpdateForm("subCategoryId", event.target.value)
                            }
                            disabled={subCategories.length === 0}
                            className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none disabled:opacity-60"
                        >
                            <option value="">{t("form.subCategoryPlaceholder")}</option>
                            {subCategories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {getCategoryName(cat)}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                {/* Unit + Initial Stock */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-on-surface">
                            {t("form.unit")}
                        </span>
                        <select
                            value={form.unit}
                            onChange={(event) => onUpdateForm("unit", event.target.value)}
                            required
                            className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none"
                        >
                            {unitOptions.map((unit) => (
                                <option key={unit.value} value={unit.value}>
                                    {isBn ? unit.labelBn : unit.labelEn}
                                </option>
                            ))}
                        </select>
                    </label>

                    {editorMode === "edit" ? (
                        <div className="space-y-3">
                            <label className="block">
                                <span className="mb-2 block text-sm font-medium text-on-surface">
                                    {t("form.currentStock")}
                                </span>
                                <input
                                    type="text"
                                    value={form.stockQty}
                                    disabled
                                    className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none opacity-60"
                                />
                            </label>
                            <label className="block">
                                <span className="mb-2 block text-sm font-medium text-primary">
                                    {t("form.restockQty")}
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.001"
                                    value={form.restockQty}
                                    onChange={(event) => onUpdateForm("restockQty", event.target.value)}
                                    className="w-full rounded-[20px] bg-primary/10 border border-primary/30 px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-on-surface-variant/50"
                                    placeholder={t("form.restockPlaceholder")}
                                />
                            </label>
                        </div>
                    ) : (
                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-on-surface">
                                {t("form.initialStock")}
                            </span>
                            <input
                                type="number"
                                min="0"
                                step="0.001"
                                value={form.stockQty}
                                onChange={(event) => onUpdateForm("stockQty", event.target.value)}
                                className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50"
                                placeholder="0"
                            />
                        </label>
                    )}
                </div>

                {/* Cost Price + Sell Price */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-on-surface">
                            {t("form.costPrice")}
                        </span>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.costPrice}
                            onChange={(event) => onUpdateForm("costPrice", event.target.value)}
                            required
                            className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none"
                            placeholder="80"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-on-surface">
                            {t("form.sellPrice")}
                        </span>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.sellPrice}
                            onChange={(event) => onUpdateForm("sellPrice", event.target.value)}
                            required
                            className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none"
                            placeholder="95"
                        />
                    </label>
                </div>

                {/* Purchase Date + Expiry Date */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-on-surface">
                            {t("form.purchaseDate")}
                        </span>
                        <input
                            type="date"
                            value={form.purchaseDate}
                            onChange={(event) => onUpdateForm("purchaseDate", event.target.value)}
                            className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-on-surface">
                            {t("form.expiryDate")}
                        </span>
                        <input
                            type="date"
                            value={form.expiryDate}
                            onChange={(event) => onUpdateForm("expiryDate", event.target.value)}
                            className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none"
                        />
                    </label>
                </div>

                {/* Reorder Point */}
                <label className="block">
                    <span className="mb-2 block text-sm font-medium text-on-surface">
                        {t("form.reorderPoint")}
                    </span>
                    <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={form.reorderPoint}
                        onChange={(event) =>
                            onUpdateForm("reorderPoint", event.target.value)
                        }
                        className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none"
                        placeholder="20"
                    />
                </label>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-full bg-gradient-to-br from-primary to-primary-container px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubmitting
                        ? t("form.submit.saving")
                        : editorMode === "edit"
                            ? t("form.submit.edit")
                            : t("form.submit.create")}
                </button>
            </form>
        </section>
    );
}
