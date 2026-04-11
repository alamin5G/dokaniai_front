"use client";

import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

// ---------------------------------------------------------------------------
// Inline SVG Icons
// ---------------------------------------------------------------------------

function IconBell({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  );
}

function IconUser({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TopAppBarProps {
  /** Breadcrumb or page title shown on desktop */
  title?: string;
}

// ---------------------------------------------------------------------------
// TopAppBar component
// ---------------------------------------------------------------------------

export default function TopAppBar({ title }: TopAppBarProps) {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-40 flex justify-between items-center w-full px-6 py-3 bg-surface-container-low/80 backdrop-blur-md">
      {/* Left: mobile logo / desktop breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="md:hidden">
          <h1 className="text-xl font-bold text-primary">DokaniAI</h1>
        </div>
        <div className="hidden md:block">
          <p className="text-on-surface-variant font-medium text-sm">
            {title ?? `${t("dashboard")} /`}
          </p>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <LanguageSwitcher className="!px-2 !py-2" />

        <button
          type="button"
          className="p-2 rounded-full text-primary-container hover:bg-surface-container-high transition-colors"
          aria-label="Notifications"
        >
          <IconBell className="w-5 h-5" />
        </button>

        <button
          type="button"
          className="p-2 rounded-full text-primary-container hover:bg-surface-container-high transition-colors"
          aria-label="Account"
        >
          <IconUser className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
