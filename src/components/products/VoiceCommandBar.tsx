"use client";

import { useTranslations } from "next-intl";

export default function VoiceCommandBar() {
    const t = useTranslations("shop.products");

    return (
        <div className="rounded-[28px] bg-gradient-to-r from-primary to-primary-container p-1">
            <div className="flex flex-col gap-3 rounded-[24px] bg-primary px-4 py-4 text-white md:flex-row md:items-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                    <span className="material-symbols-outlined">mic</span>
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold">{t("voice.title")}</p>
                    <p className="text-sm text-white/75">{t("voice.example")}</p>
                </div>
                <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium">
                    {t("voice.comingSoon")}
                </div>
            </div>
        </div>
    );
}
