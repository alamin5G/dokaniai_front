"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getCategoryMarketInsight } from "@/lib/categoryApi";

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
    const [insight, setInsight] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setError(false);
        setInsight(null);

        getCategoryMarketInsight(categoryId, businessType)
            .then((result) => {
                if (!cancelled) {
                    setInsight(result || null);
                    setIsLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError(true);
                    setIsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [categoryId, businessType]);

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
                <p className="text-sm leading-relaxed text-on-surface">
                    {insight}
                </p>
            ) : (
                <p className="text-sm text-on-surface-variant">
                    {t("marketInsight.noInsight")}
                </p>
            )}
        </div>
    );
}
