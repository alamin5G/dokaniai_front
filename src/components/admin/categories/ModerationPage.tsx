"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCategoriesByBusinessType } from "@/hooks/useCategories";
import type { CategoryRequestResponse, CategoryRequestStatus } from "@/types/categoryRequest";
import { getPendingCategoryRequests, getCategoryRequestsByStatus, decideCategoryRequest } from "@/lib/categoryApi";

const BUSINESS_TYPES = [
  "GROCERY", "FASHION", "ELECTRONICS", "RESTAURANT", "PHARMACY",
  "STATIONERY", "HARDWARE", "BAKERY", "MOBILE_SHOP", "TAILORING",
  "SWEETS_SHOP", "COSMETICS", "BOOKSHOP", "JEWELLERY", "PRINTING", "OTHER",
];

const CATEGORY_ICONS: Record<string, string> = {
  GROCERY: "shopping_cart",
  FASHION: "styler",
  ELECTRONICS: "devices",
  RESTAURANT: "restaurant",
  PHARMACY: "local_pharmacy",
  STATIONERY: "edit",
  HARDWARE: "handyman",
  BAKERY: "bakery_dining",
  MOBILE_SHOP: "smartphone",
  TAILORING: "checkroom",
  SWEETS_SHOP: "cake",
  COSMETICS: "spa",
  BOOKSHOP: "menu_book",
  JEWELLERY: "diamond",
  PRINTING: "print",
  OTHER: "category",
};

function getStatusBadgeClasses(status: CategoryRequestStatus) {
  const map: Record<string, string> = {
    PENDING: "bg-error-container text-on-error-container",
    UNDER_REVIEW: "bg-secondary-container text-on-secondary-container",
    APPROVED_GLOBAL: "bg-emerald-100 text-emerald-700",
    APPROVED_BUSINESS: "bg-blue-100 text-blue-700",
    REJECTED: "bg-red-100 text-red-700",
    CANCELLED: "bg-surface-container-high text-on-surface-variant",
    DUPLICATE_SUGGESTED: "bg-amber-100 text-amber-700",
  };
  return map[status] ?? "bg-surface-container-high text-on-surface-variant";
}

function getStatusIcon(status: CategoryRequestStatus) {
  const map: Record<string, string> = {
    PENDING: "schedule",
    UNDER_REVIEW: "visibility",
    APPROVED_GLOBAL: "public",
    APPROVED_BUSINESS: "storefront",
    REJECTED: "block",
    CANCELLED: "cancel",
    DUPLICATE_SUGGESTED: "content_copy",
  };
  return map[status] ?? "help";
}

export default function ModerationPage() {
  const t = useTranslations("admin.categories");
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<CategoryRequestStatus | "ALL">("PENDING");
  const [requests, setRequests] = useState<CategoryRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>("GROCERY");

  const { categories, isLoading: loadingCategories } = useCategoriesByBusinessType(selectedBusinessType);

  const groupedByBusinessType = useMemo(() => {
    const groups: Record<string, typeof categories> = {};
    for (const cat of categories) {
      const bt = cat.businessType || "OTHER";
      if (!groups[bt]) groups[bt] = [];
      groups[bt].push(cat);
    }
    return groups;
  }, [categories]);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      if (statusFilter === "ALL") {
        const { content } = await getPendingCategoryRequests(page, 20);
        setRequests(content);
        setHasMore(content.length === 20);
      } else {
        const { content, totalPages } = await getCategoryRequestsByStatus(statusFilter, page, 20);
        setRequests(content);
        setHasMore(page + 1 < totalPages);
      }
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    setPage(0);
  }, [statusFilter]);

  async function handleQuickApprove(requestId: string) {
    try {
      await decideCategoryRequest(requestId, { action: "APPROVE_GLOBAL" });
      loadRequests();
    } catch {}
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-on-surface leading-tight">
            {t("moderationPageTitle")}
          </h2>
          <p className="text-on-surface-variant font-body mt-2 text-lg max-w-2xl">
            {t("moderationPageSubtitle")}
          </p>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={() => router.push("/admin/categories")}
            className="flex items-center gap-2 py-3 px-6 bg-surface-container-highest text-on-surface rounded-full font-label text-sm font-bold hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            {t("taxonomy.createTitle")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12 items-start">
        <section className="xl:col-span-4 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-headline font-bold text-on-surface">{t("moderation.pendingTitle")}</h3>
            <button className="text-sm font-label font-semibold text-primary hover:text-primary-container transition-colors flex items-center gap-1">
              {t("moderation.viewAll")} <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 mb-2">
            {(["ALL", "PENDING", "UNDER_REVIEW"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  statusFilter === s
                    ? getStatusBadgeClasses(s === "ALL" ? "PENDING" : s)
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                {s === "ALL" ? t("moderation.allStatuses") : t(`moderation.status.${s}`)}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-container-high border-t-primary" />
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-2xl p-12 shadow-sm flex flex-col items-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-3">task_alt</span>
                <p className="text-on-surface-variant text-sm">{t("moderation.noRequests")}</p>
              </div>
            ) : (
              requests.slice(0, 6).map((req) => (
                <div
                  key={req.id}
                  className="bg-surface-container-lowest p-5 rounded-2xl group hover:bg-surface-container-low transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/categories/requests/${req.id}`)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClasses(req.status)}`}>
                      {t(`moderation.status.${req.status}`)}
                    </span>
                    <span className="text-xs font-label font-semibold text-secondary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">storefront</span>
                      {(req.businessType?.replace(/_/g, " ") ?? "—").toUpperCase()}
                    </span>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-2xl font-semibold text-on-surface leading-tight">{req.nameBn}</h4>
                    <p className="text-sm text-on-surface-variant mt-1 font-body">
                      {t("moderation.requestedBy")}: <span className="font-medium text-on-surface">{req.businessName || req.requestedByName || "—"}</span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleQuickApprove(req.id); }}
                      className="flex-1 py-2 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full font-label text-xs font-bold transition-all hover:opacity-90"
                    >
                      {t("moderation.approveGlobal")}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/admin/categories/requests/${req.id}`); }}
                      className="flex-1 py-2 bg-surface-container-highest text-on-surface rounded-full font-label text-xs font-bold transition-all hover:bg-surface-variant"
                    >
                      {t("moderation.review")}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {requests.length > 6 && (
            <div className="flex items-center justify-center">
              <button
                onClick={() => router.push("/admin/categories/moderation")}
                className="text-sm font-label font-semibold text-primary hover:text-primary-container transition-colors"
              >
                {t("moderation.viewAllRequests")}
              </button>
            </div>
          )}
        </section>

        <section className="xl:col-span-8 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-xl font-headline font-bold text-on-surface">{t("taxonomy.hierarchy")}</h3>
            <div className="relative flex items-center w-full sm:w-64 bg-surface-container-lowest rounded-full px-4 py-2">
              <span className="material-symbols-outlined text-on-surface-variant mr-2 text-sm">filter_list</span>
              <select
                value={selectedBusinessType}
                onChange={(e) => setSelectedBusinessType(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-sm font-body text-on-surface p-0 appearance-none cursor-pointer"
              >
                {BUSINESS_TYPES.map((bt) => (
                  <option key={bt} value={bt}>{bt.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingCategories ? (
              <div className="md:col-span-2 flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-container-high border-t-primary" />
              </div>
            ) : categories.length === 0 ? (
              <div className="md:col-span-2 bg-surface-container-lowest rounded-2xl p-12 shadow-sm text-center">
                <p className="text-on-surface-variant text-sm">{t("taxonomy.noCategories")}</p>
              </div>
            ) : (
              (() => {
                const roots = categories.filter((c) => !c.parentId);
                const childrenMap = new Map<string, typeof categories>();
                for (const c of categories) {
                  if (c.parentId) {
                    const arr = childrenMap.get(c.parentId) || [];
                    arr.push(c);
                    childrenMap.set(c.parentId, arr);
                  }
                }

                return roots.slice(0, 4).map((root, idx) => {
                  const children = childrenMap.get(root.id) || [];
                  const isFullWidth = idx >= 2 && roots.length <= 3;

                  return (
                    <div
                      key={root.id}
                      className={`bg-surface-container-lowest p-6 rounded-[24px] flex flex-col h-full relative overflow-hidden group ${
                        isFullWidth ? "md:col-span-2" : ""
                      }`}
                    >
                      <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl group-hover:opacity-100 transition-all duration-500 ${
                        idx % 2 === 0 ? "bg-primary-fixed/20" : "bg-secondary-container/20"
                      }`} />

                      <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center ${
                            idx % 2 === 0 ? "text-primary" : "text-secondary"
                          }`}>
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                              {CATEGORY_ICONS[root.businessType || "OTHER"] || "category"}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-headline font-bold text-lg text-on-surface tracking-tight uppercase">
                              {root.nameBn}
                            </h4>
                            <p className="text-xs text-on-surface-variant font-label">
                              {children.length} {children.length === 1 ? "subcategory" : "subcategories"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {children.length > 0 && (
                        <div className="space-y-4 relative z-10 flex-1">
                          {children.slice(0, 2).map((child) => {
                            const grandchildren = childrenMap.get(child.id) || [];
                            return (
                              <div key={child.id}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-semibold text-on-surface">{child.nameBn}</span>
                                  {grandchildren.length > 0 && (
                                    <span className="material-symbols-outlined text-on-surface-variant text-[14px]">chevron_right</span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {grandchildren.slice(0, 3).map((gc) => (
                                    <span key={gc.id} className="px-3 py-1 bg-surface-container-low text-on-surface text-sm rounded-lg">
                                      {gc.nameBn}
                                    </span>
                                  ))}
                                  {grandchildren.length > 3 && (
                                    <span className="px-3 py-1 bg-surface-container-low text-on-surface-variant text-xs font-label rounded-lg flex items-center">
                                      +{grandchildren.length - 3}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                });
              })()
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
