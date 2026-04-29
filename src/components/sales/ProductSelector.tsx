"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CategoryResponse } from "@/types/category";
import type { Product } from "@/types/product";
import type { CartItem } from "@/types/sale";
import { useCategoryMarketInsight } from "@/hooks/useCategoryMarketInsight";
import CategoryInsightContent from "@/components/shared/CategoryInsightContent";

interface ProductSelectorProps {
    products: Product[];
    categories: CategoryResponse[];
    isLoading: boolean;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedCategoryId: string | null;
    onCategorySelect: (id: string | null) => void;
    onAddProduct: (product: Product) => void;
    cartItems: CartItem[];
}

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

export default function ProductSelector({
    products,
    categories,
    isLoading,
    searchQuery,
    onSearchChange,
    selectedCategoryId,
    onCategorySelect,
    onAddProduct,
    cartItems,
}: ProductSelectorProps) {
    const t = useTranslations("shop.sales");
    const locale = useLocale();
    const loc = resolveLocale(locale);
    const isBn = locale.toLowerCase().startsWith("bn");

    // FR-SRC-07: Autocomplete state
    const [showAutocomplete, setShowAutocomplete] = useState(false);
    const [autocompleteIndex, setAutocompleteIndex] = useState(-1);
    const searchWrapperRef = useRef<HTMLDivElement>(null);

    const qtyFormatter = new Intl.NumberFormat(loc, {
        maximumFractionDigits: 3,
    });

    const currencyFormatter = new Intl.NumberFormat(loc, {
        maximumFractionDigits: 2,
    });

    function formatQty(value: number | null | undefined): string {
        return qtyFormatter.format(value ?? 0);
    }

    function formatMoney(value: number | null | undefined): string {
        return currencyFormatter.format(value ?? 0);
    }

    // Top-level categories
    const topLevelCategories = categories.filter((c) => c.parentId === null);

    function getCategoryName(cat: CategoryResponse): string {
        return isBn ? cat.nameBn : (cat.nameEn ?? cat.nameBn);
    }

    // Selected category for AI market insight in empty state
    const selectedCategory = selectedCategoryId
        ? categories.find((c) => c.id === selectedCategoryId)
        : null;
    const { insight: categoryInsight, isLoading: insightLoading } = useCategoryMarketInsight(
        selectedCategoryId,
    );

    // Cart item quantities for display
    function getCartQty(productId: string): number {
        return cartItems.find((ci) => ci.productId === productId)?.quantity ?? 0;
    }

    // Inspiring empty-state message (random but stable per render cycle)
    const emptyMessage = useMemo(() => {
        const messages = t.raw("emptyProductMessages") as string[];
        if (!Array.isArray(messages) || messages.length === 0) {
            return isBn ? "এই ক্যাটাগরিতে এখনো কোনো পণ্য নেই। শীঘ্রই যুক্ত হবে!" : "No products in this category yet. Coming soon!";
        }
        return messages[Math.floor(Math.random() * messages.length)];
    }, [t, isBn]);

    // FR-SRC-07: Autocomplete suggestions — show after 2 characters typed
    const autocompleteItems = searchQuery.length >= 2 ? products.slice(0, 8) : [];

    // Close autocomplete on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
                setShowAutocomplete(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearchKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (!showAutocomplete || autocompleteItems.length === 0) return;
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setAutocompleteIndex((i) => Math.min(i + 1, autocompleteItems.length - 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setAutocompleteIndex((i) => Math.max(i - 1, -1));
            } else if (e.key === "Enter" && autocompleteIndex >= 0) {
                e.preventDefault();
                const product = autocompleteItems[autocompleteIndex];
                onAddProduct(product);
                onSearchChange("");
                setShowAutocomplete(false);
                setAutocompleteIndex(-1);
            } else if (e.key === "Escape") {
                setShowAutocomplete(false);
                setAutocompleteIndex(-1);
            }
        },
        [showAutocomplete, autocompleteItems, autocompleteIndex, onAddProduct, onSearchChange]
    );

    return (
        <section className="flex flex-1 min-h-0 flex-col lg:overflow-hidden p-4 lg:p-6">
            {/* Search + Scanner */}
            <div className="mb-6 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1" ref={searchWrapperRef}>
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                            search
                        </span>
                        <input
                            className="w-full rounded-xl border-none bg-surface-container-lowest py-3 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-primary-fixed-dim"
                            placeholder={t("productSearch")}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                onSearchChange(e.target.value);
                                setShowAutocomplete(e.target.value.length >= 2);
                                setAutocompleteIndex(-1);
                            }}
                            onFocus={() => {
                                if (searchQuery.length >= 2) setShowAutocomplete(true);
                            }}
                            onKeyDown={handleSearchKeyDown}
                        />

                        {/* FR-SRC-07: Autocomplete dropdown */}
                        {showAutocomplete && autocompleteItems.length > 0 && (
                            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-xl bg-surface-container-lowest shadow-lg ring-1 ring-outline-variant/20">
                                {autocompleteItems.map((product, idx) => (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => {
                                            onAddProduct(product);
                                            onSearchChange("");
                                            setShowAutocomplete(false);
                                            setAutocompleteIndex(-1);
                                        }}
                                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${idx === autocompleteIndex
                                            ? "bg-primary/10 text-primary"
                                            : "text-on-surface hover:bg-surface-container-low"
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-base text-on-surface-variant">
                                            inventory_2
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold">
                                                {product.name}
                                            </p>
                                            <p className="text-xs text-on-surface-variant">
                                                {product.unit} · ৳{formatMoney(product.sellPrice)}
                                            </p>
                                        </div>
                                        <span className="material-symbols-outlined text-base text-primary">
                                            add
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button className="flex items-center gap-2 rounded-xl bg-surface-container-highest px-4 py-3 font-medium text-on-surface transition-colors hover:bg-surface-variant">
                        <span className="material-symbols-outlined">barcode_scanner</span>
                        <span>{t("scanner")}</span>
                    </button>
                </div>

                {/* Category Filter Chips */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    <button
                        type="button"
                        onClick={() => onCategorySelect(null)}
                        className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-colors ${selectedCategoryId === null
                            ? "bg-primary text-white"
                            : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                            }`}
                    >
                        {t("allCategories")}
                    </button>
                    {topLevelCategories.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() =>
                                onCategorySelect(selectedCategoryId === cat.id ? null : cat.id)
                            }
                            className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-colors ${selectedCategoryId === cat.id
                                ? "bg-primary text-white"
                                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                                }`}
                        >
                            {getCategoryName(cat)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto pr-2">
                <div className="grid grid-cols-1 gap-2">
                    {/* Header Row */}
                    <div className="sticky top-0 z-[5] grid grid-cols-12 gap-4 bg-surface px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        <div className="col-span-6">{t("productHeader.name")}</div>
                        <div className="col-span-2 text-center">
                            {t("productHeader.unit")}
                        </div>
                        <div className="col-span-2 text-right">
                            {t("productHeader.price")}
                        </div>
                        <div className="col-span-2" />
                    </div>

                    {isLoading ? (
                        <div className="py-14 text-center text-sm text-on-surface-variant">
                            Loading...
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center gap-4 py-14">
                            <span className="material-symbols-outlined text-5xl text-primary/40">
                                storefront
                            </span>

                            {/* Show AI market insight if a category is selected and insight is available */}
                            {selectedCategory && selectedCategoryId ? (
                                <div className="w-full max-w-md">
                                    {insightLoading ? (
                                        <div className="flex items-center justify-center gap-2 text-sm text-on-surface-variant">
                                            <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                                            {isBn ? "বাজার বিশ্লেষণ লোড হচ্ছে..." : "Loading market insight..."}
                                        </div>
                                    ) : categoryInsight ? (
                                        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
                                            <div className="mb-2 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-sm text-primary">auto_awesome</span>
                                                <span className="text-xs font-bold text-primary">
                                                    {isBn ? `${getCategoryName(selectedCategory)} — বাজার বিশ্লেষণ` : `${getCategoryName(selectedCategory)} — Market Insight`}
                                                </span>
                                            </div>
                                            <CategoryInsightContent insight={categoryInsight} />
                                        </div>
                                    ) : (
                                        <p className="max-w-xs text-center text-sm leading-relaxed text-on-surface-variant">
                                            {emptyMessage}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="max-w-xs text-center text-sm leading-relaxed text-on-surface-variant">
                                    {emptyMessage}
                                </p>
                            )}
                        </div>
                    ) : (
                        products.map((product) => {
                            const isOutOfStock = product.status === "OUT_OF_STOCK" || product.stockQty <= 0;
                            const isLowStock =
                                product.status === "LOW_STOCK" || product.status === "OUT_OF_STOCK";
                            const cartQty = getCartQty(product.id);

                            return (
                                <div
                                    key={product.id}
                                    className={`group grid grid-cols-12 items-center rounded-xl bg-surface-container-lowest p-4 transition-all hover:bg-surface-container-low ${isOutOfStock
                                        ? "opacity-60"
                                        : isLowStock
                                            ? "border-l-4 border-tertiary"
                                            : ""
                                        }`}
                                >
                                    <div className="col-span-6">
                                        <p className={`text-base font-semibold ${isOutOfStock ? "text-on-surface-variant line-through" : "text-on-surface"}`}>
                                            {product.name}
                                        </p>
                                        {isOutOfStock ? (
                                            <span className="rounded-full bg-error-container px-2 py-0.5 text-xs font-bold text-error">
                                                {t("outOfStock")}
                                            </span>
                                        ) : isLowStock ? (
                                            <span className="rounded-full bg-error-container px-2 py-0.5 text-xs font-bold text-tertiary">
                                                {t("lowStock", {
                                                    qty: formatQty(product.stockQty),
                                                    unit: product.unit,
                                                })}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-on-surface-variant">
                                                {t("stock", {
                                                    qty: formatQty(product.stockQty),
                                                    unit: product.unit,
                                                })}
                                            </span>
                                        )}
                                    </div>
                                    <div className="col-span-2 text-center text-on-surface-variant">
                                        {product.unit}
                                    </div>
                                    <div className="col-span-2 text-right font-bold text-on-surface">
                                        ৳ {formatMoney(product.sellPrice)}
                                    </div>
                                    <div className="col-span-2 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => onAddProduct(product)}
                                            disabled={isOutOfStock}
                                            className={`relative flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition-transform ${isOutOfStock
                                                ? "cursor-not-allowed bg-surface-container-high text-on-surface-variant"
                                                : "bg-primary text-white active:scale-90"
                                                }`}
                                        >
                                            <span className="material-symbols-outlined">
                                                {isOutOfStock ? "block" : "add"}
                                            </span>
                                            {cartQty > 0 && (
                                                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-white">
                                                    {cartQty}
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </section>
    );
}
