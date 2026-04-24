"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { CategoryResponse } from "@/types/category";
import type { Product, ProductStatus } from "@/types/product";
import CategoryRequestSheet from "@/components/categories/CategoryRequestSheet";
import CategoryRequestStatusSheet from "@/components/categories/CategoryRequestStatusSheet";
import { getProductUnitLabel } from "@/lib/productUnits";

interface ProductTableProps {
    products: Product[];
    isLoading: boolean;
    searchInput: string;
    onSearchInputChange: (value: string) => void;
    status: "" | ProductStatus;
    onStatusChange: (status: "" | ProductStatus) => void;
    categories: CategoryResponse[];
    selectedCategoryId: string | null;
    onCategorySelect: (categoryId: string | null) => void;
    businessId: string;
    page: number;
    totalPages: number;
    totalElements: number;
    onEdit: (product: Product) => void;
    onArchive: (product: Product) => void;
    onPageChange: (page: number) => void;
}

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

function mapStatusClasses(status: ProductStatus) {
    switch (status) {
        case "LOW_STOCK":
            return "bg-amber-100 text-amber-800";
        case "OUT_OF_STOCK":
            return "bg-rose-100 text-rose-800";
        case "ARCHIVED":
            return "bg-slate-200 text-slate-700";
        default:
            return "bg-emerald-100 text-emerald-800";
    }
}

export default function ProductTable({
    products,
    isLoading,
    searchInput,
    onSearchInputChange,
    status,
    onStatusChange,
    categories,
    selectedCategoryId,
    onCategorySelect,
    businessId,
    page,
    totalPages,
    totalElements,
    onEdit,
    onArchive,
    onPageChange,
}: ProductTableProps) {
    const t = useTranslations("shop.products");
    const locale = useLocale();
    const loc = resolveLocale(locale);
    const isBn = locale.toLowerCase().startsWith("bn");

    const currencyFormatter = new Intl.NumberFormat(loc, {
        maximumFractionDigits: 0,
    });

    const qtyFormatter = new Intl.NumberFormat(loc, {
        maximumFractionDigits: 3,
    });

    function formatMoney(value: number | null | undefined): string {
        return currencyFormatter.format(value ?? 0);
    }

    function formatQty(value: number | null | undefined): string {
        return qtyFormatter.format(value ?? 0);
    }

    function formatUnit(unit: string): string {
        return getProductUnitLabel(unit, locale);
    }

    function getCategoryName(category: CategoryResponse): string {
        if (isBn) return category.nameBn;
        return category.nameEn ?? category.nameBn;
    }

    /**
     * FR-SRC-03: Highlight matching text in search results.
     * Wraps matching substrings in a <mark> element.
     */
    function highlightText(text: string, query: string): React.ReactNode {
        if (!query || query.length < 1) return text;
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const index = lowerText.indexOf(lowerQuery);
        if (index === -1) return text;
        return (
            <>
                {text.slice(0, index)}
                <mark className="bg-yellow-200 text-on-surface rounded px-0.5">
                    {text.slice(index, index + query.length)}
                </mark>
                {text.slice(index + query.length)}
            </>
        );
    }

    // Build a category lookup for displaying breadcrumbs in the table
    const categoryMap = new Map<string, CategoryResponse>();
    for (const cat of categories) {
        categoryMap.set(cat.id, cat);
    }

    function getCategoryBreadcrumb(product: Product): string | null {
        if (!product.categoryId) return null;
        const parent = categoryMap.get(product.categoryId);
        if (!parent) return null;
        const parentName = getCategoryName(parent);

        if (product.subCategoryId) {
            const child = categoryMap.get(product.subCategoryId);
            if (child) {
                return `${parentName} > ${getCategoryName(child)}`;
            }
        }
        return parentName;
    }

    return (
        <section className="overflow-hidden rounded-[28px] bg-surface-container-lowest shadow-sm">
            {/* Header */}
            <div className="flex flex-col gap-4 bg-surface-container-low/50 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h3 className="text-xl font-bold text-primary">{t("table.title")}</h3>
                    <p className="mt-1 text-sm text-on-surface-variant">
                        {t("table.subtitle")}
                    </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <label className="flex min-w-[220px] items-center gap-3 rounded-full bg-surface px-4 py-3 text-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-base">search</span>
                        <input
                            value={searchInput}
                            onChange={(event) => onSearchInputChange(event.target.value)}
                            className="w-full bg-transparent text-on-surface outline-none placeholder:text-on-surface-variant"
                            placeholder={t("filter.search")}
                        />
                    </label>

                    <select
                        value={status}
                        onChange={(event) =>
                            onStatusChange(event.target.value as "" | ProductStatus)
                        }
                        className="rounded-full bg-surface px-4 py-3 text-sm font-medium text-on-surface outline-none"
                    >
                        <option value="">{t("filter.all")}</option>
                        <option value="ACTIVE">{t("status.ACTIVE")}</option>
                        <option value="LOW_STOCK">{t("status.LOW_STOCK")}</option>
                        <option value="OUT_OF_STOCK">{t("status.OUT_OF_STOCK")}</option>
                        <option value="ARCHIVED">{t("status.ARCHIVED")}</option>
                    </select>
                </div>
            </div>

            {/* Category Filter Chips */}
            <div className="px-6 pb-2">
                <CategoryFilterChipsInline
                    categories={categories}
                    selectedCategoryId={selectedCategoryId}
                    onSelect={onCategorySelect}
                    isBn={isBn}
                    t={t}
                    businessId={businessId}
                />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                    <thead className="bg-surface-container-low text-sm font-bold text-on-surface-variant">
                        <tr>
                            <th className="px-6 py-4">{t("table.product")}</th>
                            <th className="px-6 py-4">{t("table.stock")}</th>
                            <th className="px-6 py-4 text-right">{t("table.costPrice")}</th>
                            <th className="px-6 py-4 text-right">{t("table.sellPrice")}</th>
                            <th className="px-6 py-4 text-right">{t("table.margin")}</th>
                            <th className="px-6 py-4">{t("table.status")}</th>
                            <th className="px-6 py-4 text-right">{t("table.action")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container">
                        {isLoading ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-6 py-14 text-center text-sm text-on-surface-variant"
                                >
                                    {t("table.loading")}
                                </td>
                            </tr>
                        ) : products.length > 0 ? (
                            products.map((product) => {
                                const margin = product.sellPrice - product.costPrice;
                                const breadcrumb = getCategoryBreadcrumb(product);
                                return (
                                    <tr
                                        key={product.id}
                                        className="transition-colors hover:bg-surface-container-lowest"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded bg-surface-container text-primary">
                                                    <span className="material-symbols-outlined">
                                                        inventory
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-on-surface">
                                                        {highlightText(product.name, searchInput)}
                                                    </p>
                                                    <p className="text-xs text-on-surface-variant">
                                                        {breadcrumb
                                                            ? breadcrumb
                                                            : product.barcode
                                                                ? t("table.skuBarcode", {
                                                                    sku: product.sku,
                                                                    barcode: product.barcode,
                                                                })
                                                                : t("table.sku", { sku: product.sku })}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 font-bold text-on-surface">
                                            {formatQty(product.stockQty)} {formatUnit(product.unit)}
                                        </td>
                                        <td className="px-6 py-5 text-right font-semibold text-on-surface">
                                            ৳{formatMoney(product.costPrice)}
                                        </td>
                                        <td className="px-6 py-5 text-right font-bold text-primary">
                                            ৳{formatMoney(product.sellPrice)}
                                        </td>
                                        <td className="px-6 py-5 text-right font-semibold text-on-surface">
                                            ৳{formatMoney(margin)}
                                        </td>
                                        <td className="px-6 py-5">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-bold ${mapStatusClasses(product.status)}`}
                                            >
                                                {t(`status.${product.status}`)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => onEdit(product)}
                                                    className="rounded-full bg-surface-container px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary-fixed"
                                                >
                                                    {t("actions.edit")}
                                                </button>
                                                {product.status !== "ARCHIVED" ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => onArchive(product)}
                                                        className="rounded-full bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                                                    >
                                                        {t("actions.archive")}
                                                    </button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-6 py-14 text-center text-sm text-on-surface-variant"
                                >
                                    {t("table.empty")}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-4 border-t border-surface-container bg-surface-container-lowest px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-on-surface-variant">
                    {t("table.showing", {
                        shown: formatQty(products.length),
                        total: formatQty(totalElements),
                    })}
                </p>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onPageChange(Math.max(page - 1, 0))}
                        disabled={page === 0}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant text-on-surface transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <span className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white">
                        {t("pagination.page", {
                            current: formatQty(page + 1),
                            total: formatQty(totalPages),
                        })}
                    </span>
                    <button
                        type="button"
                        onClick={() => onPageChange(Math.min(page + 1, totalPages - 1))}
                        disabled={page >= totalPages - 1}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant text-on-surface transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>
            </div>
        </section>
    );
}

/* -------------------------------------------------------------------------- */
/* Inline Category Filter Chips (used inside the table section)               */
/* -------------------------------------------------------------------------- */

function CategoryFilterChipsInline({
    categories,
    selectedCategoryId,
    onSelect,
    isBn,
    t,
    businessId,
}: {
    categories: CategoryResponse[];
    selectedCategoryId: string | null;
    onSelect: (categoryId: string | null) => void;
    isBn: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: any;
    businessId: string;
}) {
    const ct = useTranslations("shop.categoryRequest");
    const [showRequestSheet, setShowRequestSheet] = useState(false);
    const [showStatusSheet, setShowStatusSheet] = useState(false);

    const topLevelCategories = categories.filter((c) => c.parentId === null);
    if (topLevelCategories.length === 0) return null;

    function getName(cat: CategoryResponse): string {
        return isBn ? cat.nameBn : (cat.nameEn ?? cat.nameBn);
    }

    return (
        <>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                    type="button"
                    onClick={() => onSelect(null)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${selectedCategoryId === null
                        ? "bg-primary text-white"
                        : "bg-surface text-on-surface hover:bg-surface-container-high"
                    }`}
                >
                    {t("filter.allCategories")}
                </button>
                {topLevelCategories.map((cat) => (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() =>
                            onSelect(selectedCategoryId === cat.id ? null : cat.id)
                        }
                        className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${selectedCategoryId === cat.id
                            ? "bg-primary text-white"
                            : "bg-surface text-on-surface hover:bg-surface-container-high"
                        }`}
                    >
                        {getName(cat)}
                    </button>
                ))}
                <button
                    type="button"
                    onClick={() => setShowStatusSheet(true)}
                    className="shrink-0 rounded-full px-3 py-2 text-xs font-semibold bg-surface-container-low text-on-surface-variant hover:bg-surface-container transition-colors flex items-center gap-1"
                >
                    <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                    {ct("myRequests")}
                </button>
                <button
                    type="button"
                    onClick={() => setShowRequestSheet(true)}
                    className="shrink-0 rounded-full px-3 py-2 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1"
                >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    {ct("requestCategory")}
                </button>
            </div>

            {showRequestSheet && (
                <CategoryRequestSheet
                    businessId={businessId}
                    categories={categories}
                    onUseExistingCategory={onSelect}
                    onClose={() => setShowRequestSheet(false)}
                />
            )}
            {showStatusSheet && (
                <CategoryRequestStatusSheet
                    businessId={businessId}
                    onClose={() => setShowStatusSheet(false)}
                />
            )}
        </>
    );
}
