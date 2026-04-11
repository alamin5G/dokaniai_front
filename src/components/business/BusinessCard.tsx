"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { BusinessResponse } from "@/types/business";

// ---------------------------------------------------------------------------
// Type label mapping — maps backend type values to i18n keys
// ---------------------------------------------------------------------------

const TYPE_KEY_MAP: Record<string, string> = {
    grocery: "grocery",
    electronics: "electronics",
    clothing: "clothing",
    fashion: "clothing",
    pharmacy: "pharmacy",
    restaurant: "restaurant",
    stationery: "stationery",
    hardware: "hardware",
    other: "other",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BusinessCardProps {
    business: BusinessResponse;
    isActive: boolean;
    onSelect: (business: BusinessResponse) => void;
    onEdit: (business: BusinessResponse) => void;
    onArchive: (business: BusinessResponse) => void;
    onDelete: (business: BusinessResponse) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BusinessCard({
    business,
    isActive,
    onSelect,
    onEdit,
    onArchive,
    onDelete,
}: BusinessCardProps) {
    const t = useTranslations("business");
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on outside click
    useEffect(() => {
        if (!menuOpen) return;
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [menuOpen]);

    const typeKey = TYPE_KEY_MAP[business.type?.toLowerCase()] ?? "other";
    const typeLabel = t(`types.${typeKey}`);

    const formattedDate = new Date(business.createdAt).toLocaleDateString(
        undefined,
        { year: "numeric", month: "short", day: "numeric" }
    );

    const isArchived = business.status === "ARCHIVED";

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onSelect(business)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onSelect(business);
            }}
            className={`
        relative cursor-pointer rounded-2xl p-6 transition-colors
        bg-surface-container-low
        hover:bg-surface-container
        ${isActive ? "ring-2 ring-primary bg-primary/5" : ""}
        ${isArchived ? "opacity-60" : ""}
      `}
        >
            {/* Top row: name + menu */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-bold text-on-surface truncate">
                        {business.name}
                    </h3>
                </div>

                {/* Three-dot menu */}
                <div ref={menuRef} className="relative flex-shrink-0">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen((prev) => !prev);
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors"
                        aria-label="More actions"
                    >
                        <span className="material-symbols-outlined text-xl">
                            more_vert
                        </span>
                    </button>

                    {/* Dropdown */}
                    {menuOpen && (
                        <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-2xl bg-surface-container-lowest p-2">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(false);
                                    onEdit(business);
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">
                                    edit
                                </span>
                                {t("list.selectBusiness")}
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(false);
                                    onArchive(business);
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">
                                    archive
                                </span>
                                {t("list.archived")}
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(false);
                                    onDelete(business);
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-error hover:bg-surface-container-high transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">
                                    delete
                                </span>
                                {t("danger.deleteButton")}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Type badge */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium">
                    {typeLabel}
                </span>
                {isActive && (
                    <span className="bg-secondary/10 text-secondary rounded-full px-3 py-1 text-sm font-medium">
                        {t("list.active")}
                    </span>
                )}
                {isArchived && (
                    <span className="bg-on-surface-variant/10 text-on-surface-variant rounded-full px-3 py-1 text-sm font-medium">
                        {t("list.archivedLabel")}
                    </span>
                )}
            </div>

            {/* Created date */}
            <p className="mt-4 text-sm text-on-surface-variant">{formattedDate}</p>
        </div>
    );
}
