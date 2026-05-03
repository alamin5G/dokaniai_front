"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

interface Tab {
    id: string;
    labelKey: string; // i18n key under AdminDashboard.tabs
    icon: ReactNode;
    content: ReactNode;
}

interface DashboardMobileTabsProps {
    tabs: Tab[];
}

/**
 * Mobile-only tab navigation that collapses the dashboard into swipeable tabs.
 * Hidden on sm+ breakpoints where the full grid layout is used.
 */
export function DashboardMobileTabs({ tabs }: DashboardMobileTabsProps) {
    const t = useTranslations("AdminDashboard");
    const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "");

    const activeContent = tabs.find((tab) => tab.id === activeTab)?.content;

    return (
        <div className="flex flex-col gap-3">
            {/* Tab bar */}
            <div className="flex overflow-x-auto gap-1 p-1 rounded-xl bg-surface-container">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${activeTab === tab.id
                                ? "bg-primary text-on-primary shadow-sm"
                                : "text-on-surface/60 hover:bg-on-surface/5"
                            }`}
                    >
                        <span className="w-4 h-4">{tab.icon}</span>
                        {t(`tabs.${tab.labelKey}`)}
                    </button>
                ))}
            </div>

            {/* Active tab content */}
            <div>{activeContent}</div>
        </div>
    );
}