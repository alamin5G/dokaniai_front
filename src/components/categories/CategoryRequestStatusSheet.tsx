"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { CategoryRequestResponse, CategoryRequestStatus } from "@/types/categoryRequest";
import { getBusinessCategoryRequests, cancelCategoryRequest } from "@/lib/categoryApi";

const statusIcon: Record<CategoryRequestStatus, string> = {
  PENDING: "schedule",
  UNDER_REVIEW: "visibility",
  APPROVED_GLOBAL: "public",
  APPROVED_BUSINESS: "storefront",
  REJECTED: "block",
  CANCELLED: "cancel",
  DUPLICATE_SUGGESTED: "content_copy",
};

const statusColor: Record<CategoryRequestStatus, string> = {
  PENDING: "bg-error-container text-on-error-container",
  UNDER_REVIEW: "bg-secondary-container text-on-secondary-container",
  APPROVED_GLOBAL: "bg-emerald-100 text-emerald-700",
  APPROVED_BUSINESS: "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-surface-container-high text-on-surface-variant",
  DUPLICATE_SUGGESTED: "bg-amber-100 text-amber-700",
};

export default function CategoryRequestStatusSheet({
  businessId,
  onClose,
}: {
  businessId: string;
  onClose: () => void;
}) {
  const t = useTranslations("shop.categoryRequest");
  const [requests, setRequests] = useState<CategoryRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBusinessCategoryRequests(businessId);
      setRequests(data);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  async function handleCancel(requestId: string) {
    setCancelling(requestId);
    try {
      await cancelCategoryRequest(requestId);
      await loadRequests();
    } catch {}
    setCancelling(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full sm:max-w-lg bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-6 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-on-surface">{t("myRequests")}</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-surface-container-high border-t-primary" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 mb-2">inbox</span>
            <p className="text-sm text-on-surface-variant">{t("noRequests")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="bg-surface-container-low rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-on-surface">{req.nameBn}</p>
                    {req.nameEn && <p className="text-xs text-on-surface-variant">{req.nameEn}</p>}
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor[req.status]}`}>
                    <span className="material-symbols-outlined text-[12px]">{statusIcon[req.status]}</span>
                    {t(`status.${req.status}`)}
                  </span>
                </div>

                <p className="text-xs text-on-surface-variant mb-2">
                  {new Date(req.createdAt).toLocaleDateString()}
                </p>

                {req.rejectionReason && (
                  <div className="bg-red-50 rounded-lg px-3 py-2 text-xs text-red-700 mb-2">
                    <span className="font-bold">{t("rejectionReason")}:</span> {req.rejectionReason}
                  </div>
                )}

                {req.reviewNotes && (
                  <div className="bg-surface-container rounded-lg px-3 py-2 text-xs text-on-surface-variant mb-2">
                    <span className="font-bold">{t("adminNotes")}:</span> {req.reviewNotes}
                  </div>
                )}

                {req.approvedScope && (
                  <div className="bg-emerald-50 rounded-lg px-3 py-2 text-xs text-emerald-700 mb-2">
                    <span className="font-bold">{t("approvedScope")}:</span> {t(`scope.${req.approvedScope}`)}
                  </div>
                )}

                {req.status === "DUPLICATE_SUGGESTED" && req.suggestedCategoryName && (
                  <div className="bg-amber-50 rounded-lg px-3 py-2 text-xs text-amber-700 mb-2">
                    <span className="font-bold">{t("mergedWith")}:</span> {req.suggestedCategoryName}
                  </div>
                )}

                {req.status === "PENDING" && (
                  <button
                    onClick={() => handleCancel(req.id)}
                    disabled={cancelling === req.id}
                    className="text-xs text-error hover:underline disabled:opacity-50"
                  >
                    {cancelling === req.id ? "…" : t("cancelRequest")}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
