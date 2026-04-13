"use client";

import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import UserProfileSection from "@/components/ui/UserProfileSection";
import { buildShopPath, replaceShopBusinessInPath } from "@/lib/shopRouting";
import { useBusinessStore } from "@/store/businessStore";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
  /** Active business context from route/layout */
  businessId?: string;
}

// ---------------------------------------------------------------------------
// TopAppBar component
// ---------------------------------------------------------------------------

export default function TopAppBar({ title, businessId }: TopAppBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { activeBusiness, businesses, setActiveBusiness } = useBusinessStore();

  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const insideDesktop = desktopDropdownRef.current?.contains(target) ?? false;
      const insideMobile = mobileDropdownRef.current?.contains(target) ?? false;
      if (!insideDesktop && !insideMobile) {
        setIsSwitcherOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeBusinesses = businesses.filter((business) => business.status === "ACTIVE");
  const canSwitchBusiness = Boolean(businessId) && activeBusinesses.length > 1;
  const activeBusinessName = activeBusiness?.name ?? activeBusinesses.find((business) => business.id === businessId)?.name ?? "Business";

  const handleSwitchBusiness = (nextBusinessId: string) => {
    const nextBusiness = activeBusinesses.find((business) => business.id === nextBusinessId);
    if (!nextBusiness) return;

    setActiveBusiness(nextBusiness);
    setIsSwitcherOpen(false);

    const nextPath = pathname.startsWith("/shop/")
      ? replaceShopBusinessInPath(pathname, nextBusinessId)
      : buildShopPath(nextBusinessId);

    router.push(nextPath);
  };

  return (
    <header className="sticky top-0 z-40 flex justify-between items-center w-full px-6 py-3 bg-surface-container-low/80 backdrop-blur-md">
      {/* Left: mobile logo / desktop breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="md:hidden">
          {businessId ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/businesses")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-on-surface"
                aria-label={t("dashboard")}
              >
                <span className="material-symbols-outlined text-lg">menu</span>
              </button>

              <div className="relative" ref={mobileDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsSwitcherOpen((prev) => !prev)}
                  className="inline-flex max-w-[52vw] items-center gap-1 rounded-full bg-surface-container px-3 py-2 text-sm font-semibold text-on-surface"
                  aria-expanded={isSwitcherOpen}
                  aria-haspopup="listbox"
                >
                  <span className="material-symbols-outlined text-base">storefront</span>
                  <span className="truncate">{activeBusinessName}</span>
                  {canSwitchBusiness ? (
                    <span className="material-symbols-outlined text-base">expand_more</span>
                  ) : null}
                </button>

                {isSwitcherOpen && canSwitchBusiness && (
                  <div className="absolute left-0 mt-2 w-56 rounded-xl bg-surface-container-lowest py-1.5 shadow-xl z-50">
                    {activeBusinesses.map((business) => (
                      <button
                        key={business.id}
                        type="button"
                        onClick={() => handleSwitchBusiness(business.id)}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${business.id === activeBusiness?.id
                            ? "text-primary font-semibold bg-primary/10"
                            : "text-on-surface hover:bg-surface-container"
                          }`}
                      >
                        {business.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <h1 className="text-xl font-bold text-primary">DokaniAI</h1>
          )}
        </div>
        <div className="hidden md:block">
          <p className="text-on-surface-variant font-medium text-sm">
            {title ?? `${t("dashboard")} /`}
          </p>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {businessId && (
          <button
            type="button"
            onClick={() => router.push("/businesses")}
            className="hidden md:inline-flex rounded-full px-3 py-1.5 text-xs font-semibold text-secondary hover:bg-surface-container-high transition-colors"
          >
            All Businesses
          </button>
        )}

        {canSwitchBusiness && (
          <div className="relative" ref={desktopDropdownRef}>
            <button
              type="button"
              onClick={() => setIsSwitcherOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-full bg-surface-container px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
              aria-expanded={isSwitcherOpen}
              aria-haspopup="listbox"
            >
              <span className="max-w-24 truncate">{activeBusiness?.name ?? "Business"}</span>
              <span className="material-symbols-outlined text-base">expand_more</span>
            </button>

            {isSwitcherOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-surface-container-lowest py-1.5 shadow-xl z-50">
                {activeBusinesses.map((business) => (
                  <button
                    key={business.id}
                    type="button"
                    onClick={() => handleSwitchBusiness(business.id)}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors ${business.id === activeBusiness?.id
                        ? "text-primary font-semibold bg-primary/10"
                        : "text-on-surface hover:bg-surface-container"
                      }`}
                  >
                    {business.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="hidden md:block">
          <LanguageSwitcher className="!px-2 !py-2" />
        </div>

        <button
          type="button"
          className="p-2 rounded-full text-primary-container hover:bg-surface-container-high transition-colors"
          aria-label="Notifications"
        >
          <IconBell className="w-5 h-5" />
        </button>

        <UserProfileSection variant="compact" />
      </div>
    </header>
  );
}
