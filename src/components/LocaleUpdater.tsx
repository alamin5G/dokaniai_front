"use client";

import { useEffect } from "react";
import { useLanguageStore } from "@/store/languageStore";

/**
 * Updates the <html> lang attribute dynamically based on the selected locale.
 * Must be rendered inside I18nProvider (client component tree).
 */
export function LocaleUpdater() {
  const locale = useLanguageStore((s) => s.locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
