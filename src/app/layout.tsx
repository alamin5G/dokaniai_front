import { LocaleUpdater } from "@/components/LocaleUpdater";
import { I18nProvider } from "@/i18n/provider";
import type { Metadata, Viewport } from "next";
import { Hind_Siliguri, Manrope } from "next/font/google";
import "./globals.css";

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
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
  themeColor: "#003727",
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
      <body suppressHydrationWarning className={`${hindSiliguri.variable} ${manrope.variable} font-body bg-background text-on-surface min-h-screen antialiased`}>
        <I18nProvider>
          <LocaleUpdater />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
