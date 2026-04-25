"use client";

import { useTranslations } from "next-intl";
import { useCategoryMarketInsight } from "@/hooks/useCategoryMarketInsight";
import CategoryInsightContent from "@/components/shared/CategoryInsightContent";

interface CategoryMarketInsightCardProps {
    categoryId: string;
    categoryName: string;
    businessType?: string;
}

export default function CategoryMarketInsightCard({
    categoryId,
    categoryName,
    businessType,
}: CategoryMarketInsightCardProps) {
    const t = useTranslations("shop.products");
    const { insight, isLoading, error } = useCategoryMarketInsight(categoryId, businessType);

    return (
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-5">
            <div className="mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                <h4 className="text-sm font-bold text-primary">
                    {t("marketInsight.title", { category: categoryName })}
                </h4>
            </div>

            {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                    {t("marketInsight.loading")}
                </div>
            ) : error ? (
                <p className="text-sm text-on-surface-variant">
                    {t("marketInsight.error")}
                </p>
            ) : insight ? (
                <CategoryInsightContent insight={insight} />
            ) : (
                <p className="text-sm text-on-surface-variant">
                    {t("marketInsight.noInsight")}
                </p>
            )}
        </div>
    );
}