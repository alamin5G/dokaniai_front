"use client";

import { useLocale, useTranslations } from "next-intl";
import type { CategoryResponse } from "@/types/category";
import type { Product } from "@/types/product";
import type { CartItem } from "@/types/sale";

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

    // Cart item quantities for display
    function getCartQty(productId: string): number {
        return cartItems.find((ci) => ci.productId === productId)?.quantity ?? 0;
    }

    return (
        <section className="flex flex-1 flex-col overflow-hidden p-6">
            {/* Search + Scanner */}
            <div className="mb-6 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                            search
                        </span>
                        <input
                            className="w-full rounded-xl border-none bg-surface-container-lowest py-3 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-primary-fixed-dim"
                            placeholder={t("productSearch")}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
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
                        <div className="py-14 text-center text-sm text-on-surface-variant">
                            No products found.
                        </div>
                    ) : (
                        products.map((product) => {
                            const isLowStock =
                                product.status === "LOW_STOCK" ||
                                product.status === "OUT_OF_STOCK";
                            const cartQty = getCartQty(product.id);

                            return (
                                <div
                                    key={product.id}
                                    className={`group grid grid-cols-12 items-center rounded-xl bg-surface-container-lowest p-4 transition-all hover:bg-surface-container-low ${isLowStock
                                            ? "border-l-4 border-tertiary"
                                            : ""
                                        }`}
                                >
                                    <div className="col-span-6">
                                        <p className="font-semibold text-on-surface">
                                            {product.name}
                                        </p>
                                        {isLowStock ? (
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
                                            className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition-transform active:scale-90"
                                        >
                                            <span className="material-symbols-outlined">add</span>
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
