"use client";

import { useBusinessCategoryTags } from "@/hooks/useCategories";
import { useLocale, useTranslations } from "next-intl";
import type { FormEvent } from "react";
import type { CategoryResponse } from "@/types/category";
import type { Product } from "@/types/product";

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
    categoryId: string;
    subCategoryId: string;
}

export const initialFormState: ProductFormState = {
    name: "",
    sku: "",
    barcode: "",
    description: "",
    unit: "piece",
    costPrice: "",
    sellPrice: "",
    stockQty: "",
    reorderPoint: "",
    categoryId: "",
    subCategoryId: "",
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
        categoryId: product.categoryId ?? "",
        subCategoryId: product.subCategoryId ?? "",
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
    const selectedTaxonomyId = form.subCategoryId || form.categoryId || null;
    const { tags, isLoading: loadingTags } = useBusinessCategoryTags(
        businessId,
        selectedTaxonomyId,
    );

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
                <div className="grid gap-4 sm:grid-cols-2">
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
                <div className="grid gap-4 sm:grid-cols-2">
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

                {selectedTaxonomyId ? (
                    <div className="rounded-[22px] border border-surface-container-high bg-surface-container-low px-4 py-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-primary">
                                    {t("form.categoryTagsTitle")}
                                </p>
                                <p className="mt-1 text-xs leading-6 text-on-surface-variant">
                                    {t("form.categoryTagsHelp")}
                                </p>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-on-surface-variant">
                                {loadingTags
                                    ? t("form.categoryTagsLoading")
                                    : t(
                                        tags.suggestionSource === "AI"
                                            ? "form.categoryTagsSourceAi"
                                            : "form.categoryTagsSourceRule",
                                    )}
                            </span>
                        </div>

                        {tags.currentTags.length > 0 ? (
                            <div className="mt-4">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                                    {t("form.savedTags")}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {tags.currentTags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {tags.suggestedTags.length > 0 ? (
                            <div className="mt-4">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                                    {t("form.suggestedTags")}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {tags.suggestedTags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="rounded-full bg-surface-container-highest px-3 py-1.5 text-xs font-semibold text-on-surface"
                                        >
                                            + {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                ) : null}

                {/* Unit + Initial Stock */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-on-surface">
                            {t("form.unit")}
                        </span>
                        <input
                            value={form.unit}
                            onChange={(event) => onUpdateForm("unit", event.target.value)}
                            required
                            className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none"
                            placeholder={t("form.unitPlaceholder")}
                        />
                    </label>

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
                            disabled={editorMode === "edit"}
                            className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none disabled:opacity-60"
                            placeholder="0"
                        />
                    </label>
                </div>

                {/* Cost Price + Sell Price */}
                <div className="grid gap-4 sm:grid-cols-2">
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
