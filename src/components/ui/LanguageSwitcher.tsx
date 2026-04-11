"use client";

import { useTranslations } from "next-intl";
import { useLanguageStore, Locale } from "@/store/languageStore";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const t = useTranslations("common");
  const { locale, setLocale } = useLanguageStore();

  const toggleLocale = () => {
    setLocale(locale === "bn" ? "en" : "bn");
  };

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors active:scale-95 duration-150 ${className}`}
      aria-label={t("language")}
    >
      <span className="material-symbols-outlined text-lg">language</span>
      <span className="font-medium text-sm">{locale === "bn" ? "EN" : "বাংলা"}</span>
    </button>
  );
}
