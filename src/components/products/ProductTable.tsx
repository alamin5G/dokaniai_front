"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { CategoryResponse } from "@/types/category";
import type { Product, ProductStatus } from "@/types/product";
import CategoryRequestSheet from "@/components/categories/CategoryRequestSheet";
import CategoryRequestStatusSheet from "@/components/categories/CategoryRequestStatusSheet";
import CategoryMarketInsightCard from "@/components/products/CategoryMarketInsightCard";
import PredictionPopover from "@/components/products/PredictionPopover";
import { getProductUnitLabel } from "@/lib/productUnits";
import { useProductPredictions } from "@/hooks/useProductPredictions";

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

    const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null);
    const [predictionPopoverProduct, setPredictionPopoverProduct] = useState<Product | null>(null);
    const mobileDropdownRef = useRef<HTMLDivElement>(null);
    const desktopDropdownRef = useRef<HTMLDivElement>(null);

    // Fetch product IDs that have active AI predictions
    const { productIds: productsWithPredictions } = useProductPredictions(businessId);

    const closePredictionPopover = useCallback(() => {
        setPredictionPopoverProduct(null);
    }, []);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            const target = e.target as Node;
            const insideMobile = mobileDropdownRef.current?.contains(target) ?? false;
            const insideDesktop = desktopDropdownRef.current?.contains(target) ?? false;
            if (!insideMobile && !insideDesktop) {
                setDropdownOpenId(null);
            }
        }
        if (dropdownOpenId) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownOpenId]);

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
            {/* Search + Filters */}
            <div className="flex flex-col gap-3 p-4 lg:flex-row sm:p-6">
                <label className="flex w-full items-center gap-3 rounded-full bg-surface px-4 py-3 text-sm text-on-surface-variant">
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
                    className="w-full rounded-full bg-surface px-4 py-3 text-sm font-medium text-on-surface outline-none lg:w-auto"
                >
                    <option value="">{t("filter.all")}</option>
                    <option value="ACTIVE">{t("status.ACTIVE")}</option>
                    <option value="LOW_STOCK">{t("status.LOW_STOCK")}</option>
                    <option value="OUT_OF_STOCK">{t("status.OUT_OF_STOCK")}</option>
                    <option value="ARCHIVED">{t("status.ARCHIVED")}</option>
                </select>
            </div>

            {/* Category Filter Chips */}
            <div className="px-4 pb-2 sm:px-6">
                <CategoryFilterChipsInline
                    categories={categories}
                    selectedCategoryId={selectedCategoryId}
                    onSelect={onCategorySelect}
                    isBn={isBn}
                    t={t}
                    businessId={businessId}
                />
            </div>

            {/* Mobile Card View */}
            <div className="space-y-3 p-4 lg:hidden">
                {isLoading ? (
                    <p className="py-10 text-center text-sm text-on-surface-variant">{t("table.loading")}</p>
                ) : products.length > 0 ? (
                    products.map((product) => {
                        const margin = product.sellPrice - product.costPrice;
                        return (
                            <div key={product.id} className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container text-primary">
                                            <span className="material-symbols-outlined">inventory</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate font-bold text-on-surface">
                                                {highlightText(product.name, searchInput)}
                                            </p>
                                            <p className="text-xs text-on-surface-variant">
                                                {formatQty(product.stockQty)} {formatUnit(product.unit)}
                                                {productsWithPredictions.has(product.id) && (
                                                    <span
                                                        className="ml-1 cursor-pointer hover:scale-110 transition-transform"
                                                        title="AI পূর্বাভাস দেখুন"
                                                        onClick={(e) => { e.stopPropagation(); setPredictionPopoverProduct(product); }}
                                                    >🔮</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${mapStatusClasses(product.status)}`}>
                                        {t(`status.${product.status}`)}
                                    </span>
                                </div>
                                <div className="mt-3 flex items-center justify-between border-t border-surface-container pt-3">
                                    <div className="text-sm">
                                        <span className="font-bold text-primary">৳{formatMoney(product.sellPrice)}</span>
                                        <span className="ml-2 text-xs text-on-surface-variant">৳{formatMoney(margin)} {t("table.margin")}</span>
                                    </div>
                                    <div className="relative inline-block">
                                        <button
                                            type="button"
                                            onClick={() => setDropdownOpenId(dropdownOpenId === product.id ? null : product.id)}
                                            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-surface-container"
                                        >
                                            <span className="material-symbols-outlined text-xl">settings</span>
                                        </button>
                                        {dropdownOpenId === product.id && (
                                            <div ref={mobileDropdownRef} className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-xl bg-surface-container-lowest py-1 shadow-lg ring-1 ring-black/5">
                                                <button
                                                    type="button"
                                                    onClick={() => { setDropdownOpenId(null); onEdit(product); }}
                                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-on-surface transition hover:bg-primary/10"
                                                >
                                                    <span className="material-symbols-outlined text-base">edit</span>
                                                    {t("actions.edit")}
                                                </button>
                                                {product.status !== "ARCHIVED" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => { setDropdownOpenId(null); onArchive(product); }}
                                                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-700 transition hover:bg-rose-50"
                                                    >
                                                        <span className="material-symbols-outlined text-base">archive</span>
                                                        {t("actions.archive")}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {predictionPopoverProduct?.id === product.id && (
                                    <PredictionPopover
                                        businessId={businessId}
                                        productId={product.id}
                                        productName={product.name}
                                        onClose={closePredictionPopover}
                                    />
                                )}
                            </div>
                        );
                    })
                ) : (
                    <p className="py-6 text-center text-sm text-on-surface-variant">{t("table.empty")}</p>
                )}
            </div>

            {/* Desktop Table — hidden on mobile */}
            <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full text-left">
                    <thead className="bg-surface-container-low text-sm font-bold text-on-surface-variant">
                        <tr>
                            <th className="px-4 py-4 lg:px-6">{t("table.product")}</th>
                            <th className="hidden px-4 py-4 md:table-cell lg:px-6">{t("table.skuBarcode")}</th>
                            <th className="px-4 py-4 lg:px-6">{t("table.stock")}</th>
                            <th className="hidden px-4 py-4 lg:table-cell lg:px-6">{t("table.peDate")}</th>
                            <th className="hidden px-4 py-4 text-right md:table-cell lg:px-6">{t("table.costPrice")}</th>
                            <th className="px-4 py-4 text-right lg:px-6">{t("table.sellPrice")}</th>
                            <th className="hidden px-4 py-4 text-right lg:table-cell lg:px-6">{t("table.margin")}</th>
                            <th className="px-4 py-4 lg:px-6">{t("table.status")}</th>
                            <th className="px-4 py-4 text-right lg:px-6">{t("table.action")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container">
                        {isLoading ? (
                            <tr>
                                <td
                                    colSpan={9}
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
                                        <td className="px-4 py-5 lg:px-6">
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
                                                    {breadcrumb && (
                                                        <p className="text-xs text-on-surface-variant">
                                                            {breadcrumb}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden px-4 py-5 md:table-cell lg:px-6">
                                            <p className="text-sm font-medium text-on-surface">{product.sku}</p>
                                            {product.barcode && (
                                                <p className="text-xs text-on-surface-variant">{product.barcode}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-5 font-bold text-on-surface lg:px-6">
                                            <div className="flex items-center gap-1 relative">
                                                <span>
                                                    {formatQty(product.stockQty)} {formatUnit(product.unit)}
                                                </span>
                                                {productsWithPredictions.has(product.id) && (
                                                    <span
                                                        className="cursor-pointer hover:scale-110 transition-transform"
                                                        title="AI পূর্বাভাস দেখুন"
                                                        onClick={(e) => { e.stopPropagation(); setPredictionPopoverProduct(product); }}
                                                    >🔮</span>
                                                )}
                                                {predictionPopoverProduct?.id === product.id && (
                                                    <PredictionPopover
                                                        businessId={businessId}
                                                        productId={product.id}
                                                        productName={product.name}
                                                        onClose={closePredictionPopover}
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        <td className="hidden px-4 py-5 lg:table-cell lg:px-6">
                                            <p className="text-xs text-on-surface-variant">
                                                {product.purchaseDate
                                                    ? `${t("table.purchaseLabel")} ${new Date(product.purchaseDate).toLocaleDateString(loc)}`
                                                    : t("table.noDate")}
                                            </p>
                                            <p className={`text-xs ${product.expiryDate
                                                ? (new Date(product.expiryDate) < new Date()
                                                    ? "font-semibold text-rose-600"
                                                    : (new Date(product.expiryDate).getTime() - Date.now()) < 7 * 86400000
                                                        ? "font-medium text-amber-600"
                                                        : "text-on-surface-variant")
                                                : "text-on-surface-variant"
                                                }`}>
                                                {product.expiryDate
                                                    ? (new Date(product.expiryDate) < new Date()
                                                        ? `⚠ ${t("table.expired", { date: new Date(product.expiryDate).toLocaleDateString(loc) })}`
                                                        : (new Date(product.expiryDate).getTime() - Date.now()) < 7 * 86400000
                                                            ? `⏰ ${t("table.expiringSoon", { date: new Date(product.expiryDate).toLocaleDateString(loc) })}`
                                                            : `${t("table.expiryLabel")} ${new Date(product.expiryDate).toLocaleDateString(loc)}`)
                                                    : t("table.noDate")}
                                            </p>
                                        </td>
                                        <td className="hidden px-4 py-5 text-right font-semibold text-on-surface md:table-cell lg:px-6">
                                            ৳{formatMoney(product.costPrice)}
                                        </td>
                                        <td className="px-4 py-5 text-right font-bold text-primary lg:px-6">
                                            ৳{formatMoney(product.sellPrice)}
                                        </td>
                                        <td className="hidden px-4 py-5 text-right font-semibold text-on-surface lg:table-cell lg:px-6">
                                            ৳{formatMoney(margin)}
                                        </td>
                                        <td className="px-4 py-5 lg:px-6">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-bold ${mapStatusClasses(product.status)}`}
                                            >
                                                {t(`status.${product.status}`)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-5 text-right lg:px-6">
                                            <div className="relative inline-block">
                                                <button
                                                    type="button"
                                                    onClick={() => setDropdownOpenId(dropdownOpenId === product.id ? null : product.id)}
                                                    className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-surface-container"
                                                >
                                                    <span className="material-symbols-outlined text-xl">settings</span>
                                                </button>
                                                {dropdownOpenId === product.id && (
                                                    <div ref={desktopDropdownRef} className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-xl bg-surface-container-lowest py-1 shadow-lg ring-1 ring-black/5">
                                                        <button
                                                            type="button"
                                                            onClick={() => { setDropdownOpenId(null); onEdit(product); }}
                                                            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-on-surface transition hover:bg-primary/10"
                                                        >
                                                            <span className="material-symbols-outlined text-base">edit</span>
                                                            {t("actions.edit")}
                                                        </button>
                                                        {product.status !== "ARCHIVED" && (
                                                            <button
                                                                type="button"
                                                                onClick={() => { setDropdownOpenId(null); onArchive(product); }}
                                                                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-700 transition hover:bg-rose-50"
                                                            >
                                                                <span className="material-symbols-outlined text-base">archive</span>
                                                                {t("actions.archive")}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={9} className="px-6 py-8">
                                    {selectedCategoryId ? (
                                        <div className="mx-auto max-w-lg space-y-4 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="material-symbols-outlined text-4xl text-primary/40">category</span>
                                                <p className="text-sm font-medium text-on-surface-variant">
                                                    {t("table.emptyCategory", {
                                                        category: getCategoryName(categoryMap.get(selectedCategoryId)!),
                                                    })}
                                                </p>
                                            </div>
                                            <CategoryMarketInsightCard
                                                categoryId={selectedCategoryId}
                                                categoryName={getCategoryName(categoryMap.get(selectedCategoryId)!)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const addBtn = document.querySelector<HTMLButtonElement>('[data-action="add-product"]');
                                                    addBtn?.click();
                                                }}
                                                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
                                            >
                                                <span className="material-symbols-outlined text-base">add</span>
                                                {t("actions.addNew")}
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-on-surface-variant">
                                            {t("table.empty")}
                                        </p>
                                    )}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-4 border-t border-surface-container bg-surface-container-lowest px-4 py-4 lg:flex-row lg:items-center lg:justify-between sm:px-6">
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
        </section >
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

