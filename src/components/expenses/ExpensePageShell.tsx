"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import ExpenseWorkspace from "./ExpenseWorkspace";
import VendorWorkspace from "@/components/vendor/VendorWorkspace";

type TabKey = "expenses" | "vendors";

export default function ExpensePageShell({
    businessId,
    initialTab = "expenses",
}: {
    businessId: string;
    initialTab?: TabKey;
}) {
    const t = useTranslations("shop.expenses");
    const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

    const tabs: { key: TabKey; icon: string; label: string }[] = [
        { key: "expenses", icon: "receipt_long", label: t("tabs.expenses", { defaultValue: "Expenses" }) },
        { key: "vendors", icon: "local_shipping", label: t("tabs.vendors", { defaultValue: "Vendors" }) },
    ];

    return (
        <div className="space-y-4">
            {/* Tab Navigation */}
            <div className="flex gap-1 overflow-x-auto rounded-2xl bg-surface-container p-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${activeTab === tab.key
                            ? "bg-surface-container-lowest text-primary shadow-sm"
                            : "text-on-surface-variant hover:bg-surface-container-low"
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === "expenses" && <ExpenseWorkspace businessId={businessId} />}
            {activeTab === "vendors" && <VendorWorkspace businessId={businessId} />}
        </div>
    );
}