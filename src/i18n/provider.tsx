"use client";

import { NextIntlClientProvider } from "next-intl";
import { useLanguageStore } from "@/store/languageStore";
import bn from "../../messages/bn.json";
import en from "../../messages/en.json";

const messagesMap: Record<string, Record<string, any>> = { bn, en };

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useLanguageStore((s) => s.locale);
  const messages = messagesMap[locale] || messagesMap.bn;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
