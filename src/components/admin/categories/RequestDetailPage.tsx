"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import type {
  CategoryRequestDecisionAction,
} from "@/types/categoryRequest";
import type { CategoryResponse } from "@/types/category";
import {
  decideCategoryRequest,
  getCategoriesByBusinessType,
  startReviewCategoryRequest,
} from "@/lib/categoryApi";
import { useCategoryRequestById } from "@/hooks/useCategories";

interface DecisionForm {
  action: CategoryRequestDecisionAction;
  approvedScope: "GLOBAL" | "BUSINESS";
  reviewNotes: string;
  rejectionReason: string;
  suggestedCategoryId: string;
}

const initialDecision: DecisionForm = {
  action: "APPROVE_GLOBAL",
  approvedScope: "GLOBAL",
  reviewNotes: "",
  rejectionReason: "",
  suggestedCategoryId: "",
};

export default function RequestDetailPage() {
  const t = useTranslations("admin.categories.moderation");
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;

  const { request, isLoading } = useCategoryRequestById(requestId);

  const [decision, setDecision] = useState<DecisionForm>({
    ...initialDecision,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const loadCategories = useCallback(async (bt: string | null) => {
    if (!bt) return;
    try {
      const cats = await getCategoriesByBusinessType(bt);
      setCategories(cats);
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    if (request) {
      startReviewCategoryRequest(request.id).catch(() => { });
      setDecision((d) => ({ ...d, suggestedCategoryId: request.suggestedCategoryId || "" }));
    }
  }, [request]);

  useEffect(() => {
    if (decision.action === "MERGE" && request?.businessType) {
      loadCategories(request.businessType);
    }
  }, [decision.action, request?.businessType, loadCategories]);

  const filteredCategories = useMemo(() => categories, [categories]);

  async function handleSubmit() {
    if (!request) return;
    setSubmitting(true);
    setError(null);
    try {
      await decideCategoryRequest(request.id, {
        action: decision.action,
        approvedScope: decision.action.startsWith("APPROVE") ? decision.approvedScope : undefined,
        reviewNotes: decision.reviewNotes || undefined,
        rejectionReason: decision.action === "REJECT" ? decision.rejectionReason : undefined,
        suggestedCategoryId: decision.action === "MERGE" ? decision.suggestedCategoryId || undefined : undefined,
      });
      router.push("/admin/categories/moderation");
    } catch {
      setError(t("decisionError"));
    } finally {
      setSubmitting(false);
    }
  }

  function handleActionChange(action: CategoryRequestDecisionAction) {
    setDecision((d) => ({ ...d, action, suggestedCategoryId: "" }));
  }

  const scoreColor = (score: number) => {
    if (score >= 0.85) return "bg-red-100 text-red-700";
    if (score >= 0.7) return "bg-amber-100 text-amber-700";
    return "bg-blue-100 text-blue-700";
  };

  const methodLabel = (method: string) => {
    if (method === "AI_SEMANTIC") return "AI";
    if (method === "EXACT") return "EXACT";
    return "TEXT";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-surface-container-high border-t-primary" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">error</span>
        <p className="text-on-surface-variant text-sm">{t("decisionError")}</p>
        <button
          onClick={() => router.push("/admin/categories/moderation")}
          className="text-primary font-medium text-sm hover:underline"
        >
          {t("cancel")}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col gap-8">
      <div className="flex items-center gap-3 text-sm text-on-surface-variant">
        <button
          onClick={() => router.push("/admin/categories/moderation")}
          className="flex items-center gap-1 hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          {t("backToModeration")}
        </button>
        <span>/</span>
        <span>{t("requestDetailBreadcrumb")}</span>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-surface-container-high text-on-surface text-xs font-bold rounded-full tracking-wider uppercase">
              {request.id.slice(0, 8).toUpperCase()}
            </span>
            <span className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed text-xs font-bold rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              {t(`status.${request.status}`)}
            </span>
          </div>
          <h1 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight mb-1 flex items-baseline gap-3">
            <span className="font-bengali">{request.nameBn}</span>
            {request.nameEn && (
              <span className="text-2xl text-on-surface-variant font-medium">({request.nameEn})</span>
            )}
          </h1>
          <p className="text-sm text-on-surface-variant flex items-center gap-2">
            {t("requestedBy")} <span className="font-bold text-primary">{request.businessName || request.requestedByName || "—"}</span>
            <span className="mx-1">&bull;</span>
            {new Date(request.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm h-full flex flex-col">
            <h2 className="text-lg font-headline font-bold text-on-surface mb-6 border-b-2 border-surface-container-low pb-2 inline-block">
              {t("requestAttributes")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12 flex-1">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">{t("labelBn")}</p>
                <p className="text-2xl text-on-surface">{request.nameBn}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">{t("labelEn")}</p>
                <p className="text-lg text-on-surface">{request.nameEn || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">{t("businessType")}</p>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-surface-container-low rounded-lg text-primary">
                    <span className="material-symbols-outlined text-[20px]">storefront</span>
                  </span>
                  <span className="text-md font-medium text-on-surface">{request.businessType?.replace(/_/g, " ") ?? "—"}</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">{t("requestedScope")}</p>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-surface-container-low rounded-lg text-primary">
                    <span className="material-symbols-outlined text-[20px]">
                      {request.requestedScope === "GLOBAL" ? "public" : "storefront"}
                    </span>
                  </span>
                  <span className="text-md font-medium text-on-surface">
                    {request.requestedScope === "GLOBAL" ? "Global Taxonomy" : request.requestedScope ?? "—"}
                  </span>
                </div>
              </div>

              {request.justification && (
                <div className="md:col-span-2 mt-4 bg-surface-container-low rounded-lg p-6">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">{t("justification")}</p>
                  <p className="text-md text-on-surface italic leading-relaxed border-l-4 border-outline-variant pl-4 py-1">
                    &ldquo;{request.justification}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-xl p-6 relative overflow-hidden border border-outline-variant/15 flex flex-col h-full shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-fixed/30 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-6 relative z-10">
              <span className="material-symbols-outlined text-primary-container">auto_awesome</span>
              <h2 className="text-lg font-headline font-bold text-primary-container">{t("aiAnalysis")}</h2>
            </div>

            {request.similarCategories && request.similarCategories.length > 0 ? (
              <>
                <p className="text-sm text-on-surface-variant mb-4 relative z-10">
                  {t("aiAnalysisDesc")}
                </p>

                {/* AI Recommendation Badge */}
                {request.aiRecommendation && (
                  <div className="mb-4 relative z-10 flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${request.aiRecommendation === "MERGE"
                        ? "bg-tertiary-fixed text-on-tertiary-fixed"
                        : "bg-primary-fixed text-on-primary-fixed"
                      }`}>
                      AI: {request.aiRecommendation}
                    </span>
                    {request.aiSimilarityCheck && (
                      <span className="px-2 py-0.5 bg-primary-fixed/40 text-primary-container text-[10px] font-bold rounded-full">
                        CHECKED
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-3 relative z-10 flex-1">
                  {request.similarCategories.map((sim) => (
                    <div
                      key={sim.categoryId}
                      className="bg-surface-container-low rounded-lg p-4 flex justify-between items-center group hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-lg text-on-surface font-bengali">{sim.nameBn}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${scoreColor(sim.similarityScore)}`}>
                            {methodLabel(sim.detectionMethod)}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant">
                          {sim.nameEn ?? ""} &bull; {Math.round(sim.similarityScore * 100)}% Match
                        </p>
                        {sim.reason && (
                          <p className="text-xs text-on-surface-variant/70 mt-1 truncate">{sim.reason}</p>
                        )}
                      </div>
                      <button
                        onClick={() => setDecision((d) => ({ ...d, action: "MERGE", suggestedCategoryId: sim.categoryId }))}
                        className="text-primary opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-surface-container-highest rounded-full flex-shrink-0"
                      >
                        <span className="material-symbols-outlined">call_merge</span>
                      </button>
                    </div>
                  ))}
                  <div className="mt-auto pt-3 text-center">
                    <button
                      onClick={() => router.push("/admin/categories")}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      {t("viewAllBranches")}
                    </button>
                  </div>
                </div>

                {/* AI Reasoning */}
                {request.aiReasoning && (
                  <div className="mt-4 relative z-10 bg-surface-container-low/50 rounded-lg p-3 border border-outline-variant/10">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">AI Reasoning</p>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{request.aiReasoning}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="relative z-10 flex flex-col items-center py-6">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 mb-2">verified</span>
                <p className="text-xs text-on-surface-variant text-center">{t("noSimilar")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
        <h2 className="text-lg font-headline font-bold text-on-surface mb-6 border-b-2 border-surface-container-low pb-2 inline-block">
          {t("decision")}
        </h2>

        {error && (
          <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 mb-4">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => handleActionChange("APPROVE_GLOBAL")}
            className={`p-6 rounded-xl text-left flex flex-col justify-between transition-all h-32 group ${decision.action === "APPROVE_GLOBAL"
                ? "bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-md -translate-y-1"
                : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
              }`}
          >
            <span className={`material-symbols-outlined mb-2 group-hover:scale-110 transition-transform`}>public</span>
            <div>
              <p className="font-bold text-sm">{t("approveGlobal")}</p>
              <p className={`text-xs mt-1 ${decision.action === "APPROVE_GLOBAL" ? "opacity-80" : "text-on-surface-variant"}`}>
                {t("approveGlobalDesc")}
              </p>
            </div>
          </button>

          <button
            onClick={() => handleActionChange("APPROVE_BUSINESS")}
            className={`p-6 rounded-xl text-left flex flex-col justify-between transition-all h-32 ${decision.action === "APPROVE_BUSINESS"
                ? "bg-surface-container-high text-on-surface shadow-md -translate-y-1"
                : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
              }`}
          >
            <span className={`material-symbols-outlined mb-2 ${decision.action !== "APPROVE_BUSINESS" ? "text-primary" : ""}`}>storefront</span>
            <div>
              <p className="font-bold text-sm">{t("approveBusiness")}</p>
              <p className={`text-xs mt-1 ${decision.action === "APPROVE_BUSINESS" ? "opacity-80" : "text-on-surface-variant"}`}>
                {t("approveBusinessDescDetailed", { businessType: request.businessType?.replace(/_/g, " ") ?? "business" })}
              </p>
            </div>
          </button>

          <div className={`bg-surface-container-low rounded-xl p-4 flex flex-col justify-between h-32 border-2 transition-colors relative ${decision.action === "MERGE" ? "border-secondary" : "border-transparent"
            }`}>
            <div className="flex items-center gap-2 mb-2 text-secondary">
              <span className="material-symbols-outlined text-[20px]">call_merge</span>
              <span className="font-bold text-sm">{t("merge")}</span>
            </div>
            <div className="relative w-full">
              <select
                value={decision.suggestedCategoryId}
                onChange={(e) => setDecision((d) => ({ ...d, action: "MERGE", suggestedCategoryId: e.target.value }))}
                className="w-full bg-surface-container-lowest border-none rounded-lg text-sm py-2 px-3 text-on-surface focus:ring-0 cursor-pointer appearance-none"
              >
                <option disabled value="">{t("selectTarget")}</option>
                {filteredCategories.slice(0, 20).map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nameBn} {cat.nameEn ? `(${cat.nameEn})` : ""}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-sm">expand_more</span>
            </div>
          </div>

          <div className={`bg-error-container/30 rounded-xl p-4 flex flex-col justify-between h-32 border-2 transition-colors ${decision.action === "REJECT" ? "border-error" : "border-transparent"
            }`}>
            <div className="flex items-center gap-2 mb-2 text-error">
              <span className="material-symbols-outlined text-[20px]">block</span>
              <span className="font-bold text-sm">{t("reject")}</span>
            </div>
            <input
              value={decision.rejectionReason}
              onChange={(e) => setDecision((d) => ({ ...d, action: "REJECT", rejectionReason: e.target.value }))}
              placeholder={t("rejectionPlaceholder")}
              type="text"
              className="w-full bg-surface-container-lowest border-none rounded-lg text-sm py-2 px-3 text-on-surface focus:ring-0 placeholder:text-on-surface-variant/50"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block">
            <span className="text-xs font-medium text-on-surface-variant">{t("reviewNotes")}</span>
            <textarea
              value={decision.reviewNotes}
              onChange={(e) => setDecision((d) => ({ ...d, reviewNotes: e.target.value }))}
              rows={2}
              placeholder={t("reviewNotesPlaceholder")}
              className="mt-1 w-full rounded-xl bg-surface-container-low p-3 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none resize-none"
            />
          </label>
        </div>

        <div className="flex gap-3 justify-end mt-4">
          <button
            onClick={() => router.push("/admin/categories/moderation")}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              submitting ||
              (decision.action === "REJECT" && !decision.rejectionReason.trim()) ||
              (decision.action === "MERGE" && !decision.suggestedCategoryId)
            }
            className="rounded-xl bg-gradient-to-r from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-on-primary hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {submitting ? "…" : t("submitDecision")}
          </button>
        </div>
      </div>
    </div>
  );
}
