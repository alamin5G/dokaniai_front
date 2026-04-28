"use client";

import { useTranslations } from "next-intl";

interface QueryData {
    query_type?: string;
    queryType?: string;
    result?: string;
    summary?: string;
    [key: string]: unknown;
}

export default function QueryResultCard({ data }: { data: QueryData }) {
    const t = useTranslations("shop.ai.confirmation");

    // For queries, show a simple informational display
    const summary = data.result ?? data.summary ?? JSON.stringify(data, null, 2);

    return (
        <div className="space-y-3">
            {/* Informational badge */}
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-primary">info</span>
                <span className="rounded-full bg-primary-container px-3 py-1 text-xs font-bold text-on-primary-container">
                    {t("infoBadge")}
                </span>
            </div>

            {/* Query result display */}
            <div className="rounded-xl bg-surface-container p-4">
                <p className="text-sm text-on-surface whitespace-pre-wrap">{summary}</p>
            </div>
        </div>
    );
}