import { LocaleUpdater } from "@/components/LocaleUpdater";
import SSEListener from "@/components/providers/SSEListener";
import { I18nProvider } from "@/i18n/provider";
import SWRProvider from "@/providers/SWRProvider";
import type { Metadata, Viewport } from "next";
import { Noto_Sans_Bengali, Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-sans-bengali",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DokaniAI - AI Business Assistant",
  description: "AI Business Assistant for Bangladeshi Micro Shop Keepers",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DokaniAI",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#00503a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className="scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL,GRAD,opsz@400,0,0,24&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body suppressHydrationWarning className={`${notoSansBengali.variable} ${plusJakartaSans.variable} ${inter.variable} font-body bg-background text-on-surface min-h-screen antialiased`}>
        <SWRProvider>
          <I18nProvider>
            <SSEListener />
            <LocaleUpdater />
            {children}
          </I18nProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
