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
  title: {
    default: "DokaniAI – বাংলাদেশের ছোট দোকানদারদের AI সহকারী",
    template: "%s | DokaniAI",
  },
  description:
    "DokaniAI হলো বাংলাদেশের ছোট ও মাঝারি দোকানদারদের জন্য AI-চালিত ব্যবসা ব্যবস্থাপনা অ্যাপ। বিক্রয়, খরচ, বাকি খাতা, ইনভেন্টরি ও রিপোর্ট সহজে পরিচালনা করুন।",
  keywords: [
    "দোকান ম্যানেজমেন্ট",
    "AI ব্যবসা সহকারী",
    "বাংলাদেশ দোকান",
    "খুচরা ব্যবসা অ্যাপ",
    "বিক্রয় ব্যবস্থাপনা",
    "বাকি খাতা",
    "ইনভেন্টরি ম্যানেজমেন্ট",
    "DokaniAI",
    "shop management Bangladesh",
    "AI business assistant",
    "retail POS Bangladesh",
  ],
  authors: [{ name: "DokaniAI Team" }],
  creator: "DokaniAI",
  publisher: "DokaniAI",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/icons/apple-icon-180.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DokaniAI",
  },
  openGraph: {
    type: "website",
    locale: "bn_BD",
    alternateLocale: "en_US",
    siteName: "DokaniAI",
    title: "DokaniAI – দোকানদারদের AI সহকারী",
    description:
      "বিক্রয়, খরচ, বাকি খাতা, ইনভেন্টরি ও রিপোর্ট সহজে পরিচালনা করতে DokaniAI ব্যবহার করুন।",
    images: [{ url: "/icons/icon.svg", width: 512, height: 512, alt: "DokaniAI Logo" }],
  },
  twitter: {
    card: "summary",
    title: "DokaniAI – AI ব্যবসা সহকারী",
    description:
      "বাংলাদেশের ছোট দোকানদারদের জন্য AI-চালিত ব্যবসা ব্যবস্থাপনা।",
    images: ["/icons/icon.svg"],
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
