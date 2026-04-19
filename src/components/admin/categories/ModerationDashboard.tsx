"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { CategoryRequestResponse, CategoryRequestStatus } from "@/types/categoryRequest";
import { getPendingCategoryRequests, getCategoryRequestsByStatus } from "@/lib/categoryApi";
import RequestDetailModal from "./RequestDetailModal";

const STATUS_TABS: { value: CategoryRequestStatus | "ALL"; color: string }[] = [
  { value: "ALL", color: "bg-surface-container-high text-on-surface" },
  { value: "PENDING", color: "bg-error-container text-on-error-container" },
  { value: "UNDER_REVIEW", color: "bg-secondary-container text-on-secondary-container" },
  { value: "APPROVED_GLOBAL", color: "bg-primary-fixed text-on-primary-fixed" },
  { value: "APPROVED_BUSINESS", color: "bg-secondary-fixed text-on-secondary-fixed" },
  { value: "REJECTED", color: "bg-error/10 text-error" },
];

const STATUS_ICONS: Record<string, string> = {
  PENDING: "schedule",
  UNDER_REVIEW: "visibility",
  APPROVED_GLOBAL: "public",
  APPROVED_BUSINESS: "storefront",
  REJECTED: "block",
  CANCELLED: "cancel",
  DUPLICATE_SUGGESTED: "content_copy",
};

export default function ModerationDashboard() {
  const t = useTranslations("admin.categories.moderation");
  const [statusFilter, setStatusFilter] = useState<CategoryRequestStatus | "ALL">("PENDING");
  const [requests, setRequests] = useState<CategoryRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CategoryRequestResponse | null>(null);

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

  function getStatusBadge(status: CategoryRequestStatus) {
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-on-surface">{t("title")}</h2>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              statusFilter === tab.value
                ? tab.color
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {tab.value === "ALL"
              ? t("allStatuses")
              : t(`status.${tab.value}` as `status.${CategoryRequestStatus}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-container-high border-t-primary" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-12 shadow-sm flex flex-col items-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-3">task_alt</span>
          <p className="text-on-surface-variant text-sm">{t("noRequests")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((req) => (
            <button
              key={req.id}
              onClick={() => setSelectedRequest(req)}
              className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm text-left hover:bg-surface-container-low transition-colors group"
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(req.status)}`}>
                  {t(`status.${req.status}` as `status.${CategoryRequestStatus}`)}
                </span>
                <span className="text-xs font-semibold text-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">storefront</span>
                  {req.businessType?.replace(/_/g, " ") ?? "—"}
                </span>
              </div>

              <div className="mb-3">
                <h4 className="text-xl font-semibold text-on-surface leading-tight">{req.nameBn}</h4>
                {req.nameEn && <p className="text-sm text-on-surface-variant mt-0.5">({req.nameEn})</p>}
              </div>

              <p className="text-xs text-on-surface-variant mb-3">
                {t("requestedBy")}: <span className="font-medium text-on-surface">{req.businessName || req.requestedByName || "—"}</span>
                <span className="mx-1">·</span>
                {new Date(req.createdAt).toLocaleDateString()}
              </p>

              {req.similarCategories && req.similarCategories.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg">
                  <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                  {t("aiDetected", { count: req.similarCategories.length })}
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <span className="flex-1 py-1.5 text-center rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  {t("review")}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {requests.length > 0 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="text-sm text-on-surface-variant hover:text-on-surface disabled:opacity-40"
          >
            ← {t("prev")}
          </button>
          <span className="text-sm text-on-surface-variant">
            {t("pageInfo", { page: page + 1 })}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={!hasMore}
            className="text-sm text-on-surface-variant hover:text-on-surface disabled:opacity-40"
          >
            {t("next")} →
          </button>
        </div>
      )}

      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={() => { setSelectedRequest(null); }}
          onDecided={() => { setSelectedRequest(null); loadRequests(); }}
        />
      )}
    </div>
  );
}
