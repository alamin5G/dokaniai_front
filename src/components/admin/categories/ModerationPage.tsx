"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { CategoryRequestResponse, CategoryRequestStatus } from "@/types/categoryRequest";
import { getPendingCategoryRequests, getCategoryRequestsByStatus, decideCategoryRequest } from "@/lib/categoryApi";
import { useCategoryRequestStats } from "@/hooks/useCategories";

const STATUS_TABS: { key: CategoryRequestStatus | "ALL"; labelKey: string }[] = [
  { key: "ALL", labelKey: "all" },
  { key: "PENDING", labelKey: "pending" },
  { key: "UNDER_REVIEW", labelKey: "underReview" },
  { key: "APPROVED_GLOBAL", labelKey: "approvedGlobal" },
  { key: "REJECTED", labelKey: "rejected" },
];

const BUSINESS_TYPE_ICONS: Record<string, string> = {
  GROCERY: "shopping_cart",
  FASHION: "styler",
  ELECTRONICS: "devices",
  RESTAURANT: "restaurant",
  PHARMACY: "local_pharmacy",
  HARDWARE: "handyman",
  BAKERY: "bakery_dining",
  MOBILE_SHOP: "smartphone",
  TAILORING: "checkroom",
  SWEETS_SHOP: "cake",
  COSMETICS: "spa",
  BOOKSHOP: "menu_book",
  JEWELLERY: "diamond",
  PRINTING: "print",
  STATIONERY: "edit",
  OTHER: "category",
};

const statusBadgeStyle = (status: CategoryRequestStatus) => {
  switch (status) {
    case "PENDING":
      return "bg-error-container text-on-error-container";
    case "UNDER_REVIEW":
      return "bg-secondary-container text-on-secondary-container";
    case "APPROVED_GLOBAL":
    case "APPROVED_BUSINESS":
      return "bg-primary-fixed text-on-primary-fixed";
    case "REJECTED":
      return "bg-tertiary-fixed text-on-tertiary-fixed";
    default:
      return "bg-surface-container-high text-on-surface";
  }
};

export default function ModerationPage() {
  const t = useTranslations("admin.categories.moderation");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CategoryRequestStatus | "ALL">("ALL");
  const [requests, setRequests] = useState<CategoryRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const { stats, mutate: mutateStats } = useCategoryRequestStats();

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const result =
        activeTab === "ALL"
          ? await getPendingCategoryRequests(page, 20)
          : await getCategoryRequestsByStatus(activeTab, page, 20);
      setRequests(result.content);
      setTotalPages(result.totalPages);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  async function handleQuickApprove(requestId: string) {
    try {
      await decideCategoryRequest(requestId, { action: "APPROVE_GLOBAL" });
      loadRequests();
      mutateStats();
    } catch { }
  }

  async function handleQuickReject(requestId: string) {
    try {
      await decideCategoryRequest(requestId, { action: "REJECT", rejectionReason: "Not suitable" });
      loadRequests();
      mutateStats();
    } catch { }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-on-surface leading-tight">
            {t("title")}
          </h2>
          <p className="text-on-surface-variant font-body mt-2 text-lg max-w-2xl">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex gap-3">
          {stats && (
            <div className="flex items-center gap-2 bg-surface-container-lowest rounded-full px-4 py-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
              <span className="text-sm font-body font-semibold text-on-surface">
                {stats.pending} {t("pending")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setPage(0); }}
            className={`px-4 py-2 rounded-full font-label text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === tab.key
                ? "bg-primary text-on-primary"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
              }`}
          >
            {t(`status.${tab.labelKey}`)}
            {tab.key === "PENDING" && stats?.pending
              ? ` (${stats.pending})`
              : ""}
          </button>
        ))}
      </div>

      {/* Asymmetric Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Pending Requests List (Left Column - 4 spans) */}
        <section className="xl:col-span-4 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-headline font-bold text-on-surface">{t("pendingRequests")}</h3>
            <button
              onClick={() => { setActiveTab("ALL"); setPage(0); }}
              className="text-sm font-label font-semibold text-primary hover:text-primary-container transition-colors flex items-center gap-1"
            >
              {t("viewAll")} <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-container-high border-t-primary" />
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-2xl p-8 flex flex-col items-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-3">task_alt</span>
                <p className="text-sm text-on-surface-variant font-body">{t("noRequests")}</p>
              </div>
            ) : (
              requests.slice(0, 8).map((req) => (
                <div
                  key={req.id}
                  onClick={() => router.push(`/admin/categories/requests/${req.id}`)}
                  className="bg-surface-container-lowest p-5 rounded-2xl group hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusBadgeStyle(req.status)}`}>
                      {t(`status.${req.status}`)}
                    </span>
                    <span className="text-xs font-label font-semibold text-secondary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        {BUSINESS_TYPE_ICONS[req.businessType ?? ""] || "category"}
                      </span>
                      {req.businessType?.replace(/_/g, " ") ?? "—"}
                    </span>
                  </div>
                  <div className="mb-4">
                    <h4 className="text-2xl font-bengali font-semibold text-on-surface leading-tight">{req.nameBn}</h4>
                    <p className="text-sm text-on-surface-variant mt-1 font-body">
                      {t("requestedBy")}: <span className="font-medium text-on-surface">{req.businessName || req.requestedByName || "—"}</span>
                    </p>
                    {req.similarCategories && req.similarCategories.length > 0 && (
                      <div className="mt-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-primary-container">auto_awesome</span>
                        <span className="text-xs font-label text-primary-container font-semibold">
                          {req.similarCategories.length} {t("aiMatches")}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleQuickApprove(req.id); }}
                      className="flex-1 py-2 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full font-label text-xs font-bold transition-all hover:opacity-90"
                    >
                      {t("approve")}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/admin/categories/requests/${req.id}`); }}
                      className="flex-1 py-2 bg-surface-container-highest text-on-surface rounded-full font-label text-xs font-bold transition-all hover:bg-surface-variant"
                    >
                      {t("review")}
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="text-sm text-primary hover:text-primary-container disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {t("previous")}
                </button>
                <span className="text-xs text-on-surface-variant">{page + 1} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="text-sm text-primary hover:text-primary-container disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {t("next")}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Stats & Recent Activity (Right Column - 8 spans) */}
        <section className="xl:col-span-8 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-xl font-headline font-bold text-on-surface">{t("recentActivity")}</h3>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface-container-lowest p-5 rounded-2xl text-center">
                <div className="text-3xl font-headline font-extrabold text-error">{stats.pending}</div>
                <div className="text-xs font-label text-on-surface-variant mt-1">{t("status.pending")}</div>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-2xl text-center">
                <div className="text-3xl font-headline font-extrabold text-secondary">{stats.underReview}</div>
                <div className="text-xs font-label text-on-surface-variant mt-1">{t("status.underReview")}</div>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-2xl text-center">
                <div className="text-3xl font-headline font-extrabold text-primary">{stats.approvedGlobal + stats.approvedBusiness}</div>
                <div className="text-xs font-label text-on-surface-variant mt-1">{t("approved")}</div>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-2xl text-center">
                <div className="text-3xl font-headline font-extrabold text-tertiary">{stats.rejected}</div>
                <div className="text-xs font-label text-on-surface-variant mt-1">{t("status.rejected")}</div>
              </div>
            </div>
          )}

          {/* Request Detail Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.slice(0, 4).map((req) => (
              <div
                key={req.id}
                onClick={() => router.push(`/admin/categories/requests/${req.id}`)}
                className="bg-surface-container-lowest p-6 rounded-[24px] flex flex-col h-full relative overflow-hidden group cursor-pointer hover:shadow-md transition-all"
              >
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary-fixed/20 rounded-full blur-3xl group-hover:bg-primary-fixed/30 transition-all duration-500" />
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {BUSINESS_TYPE_ICONS[req.businessType ?? ""] || "category"}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bengali font-bold text-lg text-on-surface">{req.nameBn}</h4>
                      <p className="text-xs text-on-surface-variant">{req.businessName || req.requestedByName || "—"}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusBadgeStyle(req.status)}`}>
                    {t(`status.${req.status}`)}
                  </span>
                </div>

                {req.similarCategories && req.similarCategories.length > 0 ? (
                  <div className="relative z-10 mt-auto">
                    <div className="flex items-center gap-1 mb-2">
                      <span className="material-symbols-outlined text-[14px] text-primary-container">auto_awesome</span>
                      <span className="text-xs font-label text-primary-container font-semibold">AI: {req.aiRecommendation || "MERGE"}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {req.similarCategories.slice(0, 3).map((sim) => (
                        <span key={sim.categoryId} className="px-2 py-0.5 bg-surface-container-low text-on-surface text-xs font-bengali rounded-lg">
                          {sim.nameBn} ({Math.round(sim.similarityScore * 100)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10 mt-auto flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-on-surface-variant/40">verified</span>
                    <span className="text-xs text-on-surface-variant/60 font-body">{t("noSimilar")}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}