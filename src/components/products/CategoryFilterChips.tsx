"use client";

import { useLocale, useTranslations } from "next-intl";
import type { CategoryResponse } from "@/types/category";

interface CategoryFilterChipsProps {
    categories: CategoryResponse[];
    selectedCategoryId: string | null;
    onSelect: (categoryId: string | null) => void;
}

export default function CategoryFilterChips({
    categories,
    selectedCategoryId,
    onSelect,
}: CategoryFilterChipsProps) {
    const t = useTranslations("shop.products");
    const locale = useLocale();
    const isBn = locale.toLowerCase().startsWith("bn");

    // Only show top-level categories (parentId === null)
    const topLevelCategories = categories.filter((c) => c.parentId === null);

    if (topLevelCategories.length === 0) {
        return null;
    }

    function getCategoryName(category: CategoryResponse): string {
        if (isBn) return category.nameBn;
        return category.nameEn ?? category.nameBn;
    }

    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {/* "All Categories" chip */}
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
        </div>
    );
}
