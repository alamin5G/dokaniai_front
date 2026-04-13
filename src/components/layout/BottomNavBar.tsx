"use client";

import { buildShopPath, replaceShopBusinessInPath } from "@/lib/shopRouting";
import { useBusinessStore } from "@/store/businessStore";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Inline SVG Icons (24×24, filled variant for active state)
// ---------------------------------------------------------------------------

function IconDashboard({ filled = false, className = "w-6 h-6" }: { filled?: boolean; className?: string }) {
  if (filled) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M3 6a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm14.25-3a3 3 0 0 0-3 3v2.25a3 3 0 0 0 3 3H19.5a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3h-2.25ZM3 15.75a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2.25Zm14.25-3a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3H19.5a3 3 0 0 0 3-3v-2.25a3 3 0 0 0-3-3h-2.25Z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
  );
}

function IconCart({ filled = false, className = "w-6 h-6" }: { filled?: boolean; className?: string }) {
  if (filled) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M2.25 2.25a.75.75 0 0 0 0 1.5h1.386c.17 0 .318.107.367.262l2.66 9.958a2.25 2.25 0 0 0 2.167 1.668h7.268a2.25 2.25 0 0 0 2.166-1.668l.955-3.582H8.18a.75.75 0 0 1 0-1.5h10.69l.617-2.312A2.25 2.25 0 0 0 17.348 3.75H5.654a2.25 2.25 0 0 0-2.14 1.566L2.25 2.25ZM6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
  );
}

function IconExpense({ filled = false, className = "w-6 h-6" }: { filled?: boolean; className?: string }) {
  if (filled) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 7.5a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5ZM13.5 12a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0ZM6 16.5a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5ZM18 16.5a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  );
}

function IconBook({ filled = false, className = "w-6 h-6" }: { filled?: boolean; className?: string }) {
  if (filled) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function IconBox({ filled = false, className = "w-6 h-6" }: { filled?: boolean; className?: string }) {
  if (filled) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M7.5 6v.75H5.514c-.913 0-1.715.608-1.936 1.494L2.25 14.25v.75c0 .414.336.75.75.75h16.5a.75.75 0 0 0 .75-.75v-.75l-1.328-6.006A2.25 2.25 0 0 0 17.486 6.75H15.5V6a2.25 2.25 0 0 0-2.25-2.25h-4.5A2.25 2.25 0 0 0 6.5 6v.75Zm6 0v.75h-5V6A.75.75 0 0 1 8.75 5.25h4.5a.75.75 0 0 1 .75.75v.75Zm-8.25 7.5h14.5l-1.219-5.506a.75.75 0 0 0-.73-.594H6.2a.75.75 0 0 0-.73.594L4.25 13.5Z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Nav items for bottom bar (5 items)
// ---------------------------------------------------------------------------

interface BottomNavItem {
  key: string;
  section: string;
  icon: React.FC<{ filled?: boolean; className?: string }>;
}

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { key: "dashboard", section: "", icon: IconDashboard },
  { key: "sales", section: "/sales", icon: IconCart },
  { key: "expenses", section: "/expenses", icon: IconExpense },
  { key: "dueLedger", section: "/due-ledger", icon: IconBook },
  { key: "products", section: "/products", icon: IconBox },
];

// ---------------------------------------------------------------------------
// BottomNavBar component
// ---------------------------------------------------------------------------

interface BottomNavBarProps {
  businessId?: string;
}

export default function BottomNavBar({ businessId }: BottomNavBarProps) {
  const router = useRouter();
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { activeBusiness, businesses, setActiveBusiness } = useBusinessStore();
  const rootPath = businessId ? buildShopPath(businessId) : "/businesses";

  const activeBusinesses = businesses.filter((business) => business.status === "ACTIVE");
  const canSwitchBusiness = Boolean(businessId) && activeBusinesses.length > 1;
  const activeBusinessName = activeBusiness?.name ?? activeBusinesses.find((business) => business.id === businessId)?.name;

  const handleSwitchBusiness = (nextBusinessId: string) => {
    const nextBusiness = activeBusinesses.find((business) => business.id === nextBusinessId);
    if (!nextBusiness) return;

    setActiveBusiness(nextBusiness);
    const nextPath = pathname.startsWith("/shop/")
      ? replaceShopBusinessInPath(pathname, nextBusinessId)
      : buildShopPath(nextBusinessId);

    router.push(nextPath);
  };

  const isActive = (href: string) => {
    if (href === rootPath) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 min-w-[300px] max-w-[92vw] space-y-2">
      {canSwitchBusiness ? (
        <div className="rounded-full bg-surface-container-lowest px-3 py-2 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <button
              type="button"
              onClick={() => router.push("/businesses")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-low text-on-surface"
              aria-label={t("dashboard")}
            >
              <span className="material-symbols-outlined text-base">menu</span>
            </button>

            <label className="sr-only" htmlFor="mobile-business-switcher">{t("dashboard")}</label>
            <div className="flex-1 min-w-0 inline-flex items-center gap-1 rounded-full bg-surface-container-low px-2 py-1">
              <span className="material-symbols-outlined text-base">storefront</span>
              <select
                id="mobile-business-switcher"
                value={activeBusiness?.id ?? businessId}
                onChange={(event) => handleSwitchBusiness(event.target.value)}
                className="w-full bg-transparent font-semibold text-on-surface outline-none"
              >
                {activeBusinesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-low text-on-surface"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-base">notifications</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/account/profile")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-low text-on-surface"
              aria-label="Profile"
            >
              <span className="material-symbols-outlined text-base">person</span>
            </button>
          </div>
        </div>
      ) : activeBusinessName ? (
        <div className="rounded-full bg-surface-container-lowest px-3 py-2 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <button
              type="button"
              onClick={() => router.push("/businesses")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-low text-on-surface"
              aria-label={t("dashboard")}
            >
              <span className="material-symbols-outlined text-base">menu</span>
            </button>
            <div className="flex-1 min-w-0 inline-flex items-center gap-1 rounded-full bg-surface-container-low px-3 py-1">
              <span className="material-symbols-outlined text-base">storefront</span>
              <span className="truncate font-semibold text-on-surface">{activeBusinessName}</span>
            </div>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-low text-on-surface"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-base">notifications</span>
            </button>
            <button
              type="button"
              onClick={() => router.push("/account/profile")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-low text-on-surface"
              aria-label="Profile"
            >
              <span className="material-symbols-outlined text-base">person</span>
            </button>
          </div>
        </div>
      ) : null}

      <nav
        className="flex items-center bg-surface-container-lowest rounded-full p-1.5 backdrop-blur-md"
        style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex w-full items-center justify-between">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const href = businessId ? buildShopPath(businessId, item.section) : "/businesses";
            const active = isActive(href);
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                href={href}
                className={`flex items-center gap-2 px-5 py-3 rounded-full transition-all active:scale-95 ${active
                    ? "bg-primary/10 text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                  }`}
              >
                <Icon filled={active} className="w-6 h-6" />
                {active && (
                  <span className="text-xs font-semibold whitespace-nowrap">
                    {t(item.key)}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
