"use client";

import { useLanguageStore } from "@/store/languageStore";
import { NextIntlClientProvider } from "next-intl";
import bn from "../../messages/bn.json";
import en from "../../messages/en.json";

type Messages = typeof en;
const messagesMap: Record<string, Messages> = { bn, en };
const DEFAULT_TIME_ZONE = "Asia/Dhaka";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useLanguageStore((s) => s.locale);
  const messages = messagesMap[locale] || messagesMap.bn;

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={DEFAULT_TIME_ZONE}
    >
      {children}
    </NextIntlClientProvider>
  );
}
