"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import type {
  CategoryRequestDecisionAction,
  CategoryRequestResponse,
} from "@/types/categoryRequest";
import type { CategoryResponse } from "@/types/category";
import {
  decideCategoryRequest,
  getCategoriesByBusinessType,
  startReviewCategoryRequest,
} from "@/lib/categoryApi";

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

export default function RequestDetailModal({
  request,
  onClose,
  onDecided,
}: {
  request: CategoryRequestResponse;
  onClose: () => void;
  onDecided: () => void;
}) {
  const t = useTranslations("admin.categories.moderation");

  const [decision, setDecision] = useState<DecisionForm>({
    ...initialDecision,
    suggestedCategoryId: request.suggestedCategoryId || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(false);

  const loadCategories = useCallback(async (bt: string | null) => {
    if (!bt) return;
    setLoadingCategories(true);
    try {
      const cats = await getCategoriesByBusinessType(bt);
      setCategories(cats);
    } catch {
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    startReviewCategoryRequest(request.id).catch(() => {});
  }, [request.id]);

  useEffect(() => {
    if (decision.action === "MERGE") {
      loadCategories(request.businessType);
    }
  }, [decision.action, request.businessType, loadCategories]);

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const q = categorySearch.toLowerCase();
    return categories.filter(
      (c) => c.nameBn.toLowerCase().includes(q) || (c.nameEn && c.nameEn.toLowerCase().includes(q)),
    );
  }, [categories, categorySearch]);

  async function handleSubmit() {
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
      onDecided();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-surface-container-lowest shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 bg-surface-container-high text-on-surface text-[10px] font-bold rounded-full tracking-wider uppercase">
                  {request.id.slice(0, 8)}
                </span>
                <span className="px-2.5 py-1 bg-error-container text-on-error-container text-[10px] font-bold rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">schedule</span>
                  {request.status}
                </span>
              </div>
              <h1 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight flex items-baseline gap-3">
                <span>{request.nameBn}</span>
                {request.nameEn && (
                  <span className="text-lg text-on-surface-variant font-medium">({request.nameEn})</span>
                )}
              </h1>
              <p className="text-sm text-on-surface-variant mt-1">
                {t("requestedBy")}{" "}
                <span className="font-bold text-primary">{request.businessName || request.requestedByName || "—"}</span>
                <span className="mx-1">·</span>
                {new Date(request.createdAt).toLocaleString()}
              </p>
            </div>
            <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Left: Request Attributes */}
            <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-6 border border-surface-container">
              <h2 className="text-base font-headline font-bold text-on-surface mb-5 border-b-2 border-surface-container-low pb-2">
                {t("requestAttributes")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10">
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">{t("labelBn")}</p>
                  <p className="text-xl text-on-surface">{request.nameBn}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">{t("labelEn")}</p>
                  <p className="text-lg text-on-surface">{request.nameEn || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">{t("businessType")}</p>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-surface-container-low rounded-lg text-primary">
                      <span className="material-symbols-outlined text-[18px]">storefront</span>
                    </span>
                    <span className="text-sm font-medium text-on-surface">{request.businessType?.replace(/_/g, " ") ?? "—"}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">{t("requestedScope")}</p>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-surface-container-low rounded-lg text-primary">
                      <span className="material-symbols-outlined text-[18px]">{request.requestedScope === "GLOBAL" ? "public" : "storefront"}</span>
                    </span>
                    <span className="text-sm font-medium text-on-surface">{request.requestedScope ?? "—"}</span>
                  </div>
                </div>
              </div>

              {request.justification && (
                <div className="md:col-span-2 mt-5 bg-surface-container-low rounded-xl p-5">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">{t("justification")}</p>
                  <p className="text-sm text-on-surface italic leading-relaxed border-l-4 border-outline-variant pl-4">
                    &ldquo;{request.justification}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Right: AI Similarity Card */}
            <div className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-xl p-6 relative overflow-hidden border border-outline-variant/15 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-fixed/30 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center gap-2 mb-4 relative z-10">
                <span className="material-symbols-outlined text-primary-container">auto_awesome</span>
                <h2 className="text-base font-headline font-bold text-primary-container">{t("aiAnalysis")}</h2>
              </div>

              {request.similarCategories && request.similarCategories.length > 0 ? (
                <>
                  <p className="text-xs text-on-surface-variant mb-4 relative z-10">
                    {t("aiAnalysisDesc")}
                  </p>
                  <div className="flex flex-col gap-3 relative z-10">
                    {request.similarCategories.map((sim) => (
                      <div
                        key={sim.categoryId}
                        className="bg-surface-container-low rounded-lg p-3.5 flex justify-between items-center group hover:bg-surface-container transition-colors cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-on-surface truncate">{sim.nameBn}</p>
                          <p className="text-xs text-on-surface-variant truncate">
                            {sim.nameEn ?? ""} · {Math.round(sim.similarityScore * 100)}% · {methodLabel(sim.detectionMethod)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-2 shrink-0">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${scoreColor(sim.similarityScore)}`}>
                            {Math.round(sim.similarityScore * 100)}%
                          </span>
                          <button
                            onClick={() => setDecision((d) => ({ ...d, action: "MERGE", suggestedCategoryId: sim.categoryId }))}
                            className="text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-surface-container-highest rounded-full"
                            title={t("mergeInto")}
                          >
                            <span className="material-symbols-outlined text-[18px]">call_merge</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {request.aiReasoning && (
                    <p className="text-xs text-on-surface-variant italic mt-3 relative z-10">
                      AI: {request.aiReasoning}
                    </p>
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

          {/* Decision Panel */}
          <div className="bg-surface-container-lowest rounded-xl p-6 border border-surface-container">
            <h2 className="text-base font-headline font-bold text-on-surface mb-5 border-b-2 border-surface-container-low pb-2">
              {t("decision")}
            </h2>

            {error && (
              <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 mb-4">{error}</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              <button
                onClick={() => handleActionChange("APPROVE_GLOBAL")}
                className={`p-5 rounded-xl text-left flex flex-col justify-between transition-all h-32 ${
                  decision.action === "APPROVE_GLOBAL"
                    ? "bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-md -translate-y-0.5"
                    : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                }`}
              >
                <span className="material-symbols-outlined mb-2 text-[20px]">public</span>
                <div>
                  <p className="font-bold text-sm">{t("approveGlobal")}</p>
                  <p className={`text-xs mt-0.5 ${decision.action === "APPROVE_GLOBAL" ? "opacity-80" : "text-on-surface-variant"}`}>
                    {t("approveGlobalDesc")}
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleActionChange("APPROVE_BUSINESS")}
                className={`p-5 rounded-xl text-left flex flex-col justify-between transition-all h-32 ${
                  decision.action === "APPROVE_BUSINESS"
                    ? "bg-blue-600 text-white shadow-md -translate-y-0.5"
                    : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                }`}
              >
                <span className="material-symbols-outlined mb-2 text-[20px]">storefront</span>
                <div>
                  <p className="font-bold text-sm">{t("approveBusiness")}</p>
                  <p className={`text-xs mt-0.5 ${decision.action === "APPROVE_BUSINESS" ? "opacity-80" : "text-on-surface-variant"}`}>
                    {t("approveBusinessDesc")}
                  </p>
                </div>
              </button>

              <div className={`p-4 rounded-xl flex flex-col justify-between h-32 border-2 transition-colors ${
                decision.action === "MERGE" ? "border-secondary bg-secondary/5" : "border-transparent bg-surface-container-low"
              }`}>
                <div className="flex items-center gap-2 text-secondary">
                  <span className="material-symbols-outlined text-[18px]">call_merge</span>
                  <span className="font-bold text-sm">{t("merge")}</span>
                </div>
                {decision.action === "MERGE" ? (
                  <div className="relative mt-1">
                    <select
                      value={decision.suggestedCategoryId}
                      onChange={(e) => setDecision((d) => ({ ...d, suggestedCategoryId: e.target.value }))}
                      className="w-full bg-surface-container-lowest border-none rounded-lg text-xs py-1.5 px-2 text-on-surface focus:ring-0 cursor-pointer appearance-none"
                    >
                      <option value="">{t("selectTarget")}</option>
                      {filteredCategories.slice(0, 20).map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.nameBn} {cat.nameEn ? `(${cat.nameEn})` : ""}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <button onClick={() => handleActionChange("MERGE")} className="text-xs text-on-surface-variant hover:text-secondary">
                    {t("selectMergeTarget")}
                  </button>
                )}
              </div>

              <div className={`p-4 rounded-xl flex flex-col justify-between h-32 border-2 transition-colors ${
                decision.action === "REJECT" ? "border-error bg-error-container/30" : "border-transparent bg-surface-container-low"
              }`}>
                <div className="flex items-center gap-2 text-error">
                  <span className="material-symbols-outlined text-[18px]">block</span>
                  <span className="font-bold text-sm">{t("reject")}</span>
                </div>
                {decision.action === "REJECT" ? (
                  <input
                    value={decision.rejectionReason}
                    onChange={(e) => setDecision((d) => ({ ...d, rejectionReason: e.target.value }))}
                    placeholder={t("rejectionPlaceholder")}
                    className="w-full bg-surface-container-lowest border-none rounded-lg text-xs py-1.5 px-2 text-on-surface focus:ring-0 placeholder:text-on-surface-variant/50"
                  />
                ) : (
                  <button onClick={() => handleActionChange("REJECT")} className="text-xs text-on-surface-variant hover:text-error">
                    {t("provideReason")}
                  </button>
                )}
              </div>
            </div>

            {decision.action.startsWith("APPROVE") && (
              <div className="flex gap-2 mb-4">
                {(["GLOBAL", "BUSINESS"] as const).map((scope) => (
                  <button
                    key={scope}
                    onClick={() => setDecision((d) => ({ ...d, approvedScope: scope }))}
                    className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                      decision.approvedScope === scope
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-low text-on-surface-variant"
                    }`}
                  >
                    {scope}
                  </button>
                ))}
              </div>
            )}

            <div className="mb-4">
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

            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
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
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {submitting ? "…" : t("submitDecision")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
