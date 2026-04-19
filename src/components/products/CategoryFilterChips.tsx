"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { CategoryResponse } from "@/types/category";
import CategoryRequestSheet from "@/components/categories/CategoryRequestSheet";
import CategoryRequestStatusSheet from "@/components/categories/CategoryRequestStatusSheet";

interface CategoryFilterChipsProps {
    categories: CategoryResponse[];
    selectedCategoryId: string | null;
    onSelect: (categoryId: string | null) => void;
    businessId: string;
}

export default function CategoryFilterChips({
    categories,
    selectedCategoryId,
    onSelect,
    businessId,
}: CategoryFilterChipsProps) {
    const t = useTranslations("shop.products");
    const ct = useTranslations("shop.categoryRequest");
    const locale = useLocale();
    const isBn = locale.toLowerCase().startsWith("bn");

    const [showRequestSheet, setShowRequestSheet] = useState(false);
    const [showStatusSheet, setShowStatusSheet] = useState(false);

    const topLevelCategories = categories.filter((c) => c.parentId === null);

    if (topLevelCategories.length === 0) {
        return null;
    }

    function getCategoryName(category: CategoryResponse): string {
        if (isBn) return category.nameBn;
        return category.nameEn ?? category.nameBn;
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

                {topLevelCategories.map((category) => (
                    <button
                        key={category.id}
                        type="button"
                        onClick={() =>
                            onSelect(selectedCategoryId === category.id ? null : category.id)
                        }
                        className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${selectedCategoryId === category.id
                                ? "bg-primary text-white"
                                : "bg-surface text-on-surface hover:bg-surface-container-high"
                            }`}
                    >
                        {getCategoryName(category)}
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
