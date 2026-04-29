"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { CategoryResponse } from "@/types/category";
import type {
  CategoryRequestSubmitResult,
  CategorySuggestion,
} from "@/types/categoryRequest";
import { submitCategoryRequest, confirmCategoryRequest, cancelCategoryRequest } from "@/lib/categoryApi";
import type { AxiosError } from "axios";

type Step = "form" | "suggestions" | "submitted";

export default function CategoryRequestSheet({
  businessId,
  categories,
  onClose,
  onUseExistingCategory,
}: {
  businessId: string;
  categories: CategoryResponse[];
  onClose: () => void;
  onUseExistingCategory?: (categoryId: string) => void;
}) {
  const t = useTranslations("shop.categoryRequest");

  const [nameBn, setNameBn] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [justification, setJustification] = useState("");
  const description = "";
  const [requestedScope, setRequestedScope] = useState<"GLOBAL" | "BUSINESS">("GLOBAL");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>("form");
  const [result, setResult] = useState<CategoryRequestSubmitResult | null>(null);

  const parentCategories = categories.filter((c) => !c.parentId);
  const [parentId, setParentId] = useState("");

  /**
   * Extract a human-readable error message from the API response.
   * The backend returns errors in: { success: false, message: "..." }
   * or as validation errors in the data field.
   */
  function extractErrorMessage(err: unknown): string {
    if (err && typeof err === "object" && "response" in err) {
      const axiosErr = err as AxiosError<{ message?: string; data?: { message?: string } }>;
      const serverMsg = axiosErr.response?.data?.message || axiosErr.response?.data?.data?.message;
      if (serverMsg) return serverMsg;
    }
    return t("submitError");
  }

  async function handleSubmit() {
    if (!nameBn.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitCategoryRequest(businessId, {
        nameBn: nameBn.trim(),
        nameEn: nameEn.trim() || undefined,
        parentId: parentId || undefined,
        justification: justification.trim() || undefined,
        description: description.trim() || undefined,
        requestedScope,
      });
      setResult(res);

      if (res.exactMatch) {
        setStep("submitted");
      } else if (res.similarCategories && res.similarCategories.length > 0) {
        setStep("suggestions");
      } else {
        setStep("submitted");
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm() {
    if (!result?.requestId) return;
    setSubmitting(true);
    try {
      await confirmCategoryRequest(result.requestId);
      setStep("submitted");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * Cancel the pending request when user chooses to use an existing category.
   * This prevents orphaned PENDING requests in the database.
   */
  async function handleUseSuggestion(suggestion: CategorySuggestion) {
    // Cancel the pending request first (fire-and-forget, don't block UI)
    if (result?.requestId) {
      cancelCategoryRequest(result.requestId).catch(() => {
        /* Silently ignore cancel failures — the request will be cleaned up by the backend */
      });
    }
    onUseExistingCategory?.(suggestion.id);
    onClose();
  }

  /**
   * Handle closing the sheet — if we're in the suggestions step,
   * cancel the pending request to prevent orphaned PENDING records.
   */
  async function handleClose() {
    if (step === "suggestions" && result?.requestId) {
      cancelCategoryRequest(result.requestId).catch(() => {
        /* Silently ignore cancel failures */
      });
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full sm:max-w-lg bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-6 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-on-surface">{t("title")}</h3>
          <button onClick={handleClose} className="text-on-surface-variant hover:text-on-surface p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 mb-4">{error}</div>
        )}

        {step === "form" && (
          <div className="space-y-4">
            <p className="text-sm text-on-surface-variant">{t("subtitle")}</p>

            <div>
              <label className="text-xs font-medium text-on-surface-variant mb-1 block">
                {t("nameBn")} <span className="text-error">*</span>
              </label>
              <input
                value={nameBn}
                onChange={(e) => setNameBn(e.target.value)}
                className="w-full bg-surface-container-low text-on-surface rounded-xl px-4 py-2.5 text-sm border border-outline-variant/20 focus:border-primary focus:outline-none"
                placeholder="যেমন: স্পেশাল আইটেম"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-on-surface-variant mb-1 block">{t("nameEn")}</label>
              <input
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="w-full bg-surface-container-low text-on-surface rounded-xl px-4 py-2.5 text-sm border border-outline-variant/20 focus:border-primary focus:outline-none"
                placeholder="e.g., Special Items"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-on-surface-variant mb-1 block">{t("parentCategory")}</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full bg-surface-container-low text-on-surface rounded-xl px-4 py-2.5 text-sm border border-outline-variant/20 focus:border-primary focus:outline-none"
              >
                <option value="">{t("noParent")}</option>
                {parentCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nameBn} {cat.nameEn ? `(${cat.nameEn})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-on-surface-variant mb-1 block">{t("justification")}</label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={2}
                className="w-full bg-surface-container-low text-on-surface rounded-xl px-4 py-2.5 text-sm border border-outline-variant/20 focus:border-primary focus:outline-none resize-none"
                placeholder={t("justificationPlaceholder")}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-on-surface-variant mb-1 block">{t("scope")}</label>
              <div className="flex gap-2">
                {(["GLOBAL", "BUSINESS"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRequestedScope(s)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${requestedScope === s
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-low text-on-surface-variant"
                      }`}
                  >
                    <span className="material-symbols-outlined text-[16px] align-middle mr-1">
                      {s === "GLOBAL" ? "public" : "storefront"}
                    </span>
                    {t(`scopeOptions.${s}`)}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-on-surface-variant mt-1">{t("scopeHelp")}</p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !nameBn.trim()}
              className="w-full bg-primary text-on-primary py-3 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/30 border-t-on-primary" />
              ) : (
                <span className="material-symbols-outlined text-[18px]">send</span>
              )}
              {submitting ? t("submitting") : t("submit")}
            </button>
          </div>
        )}

        {step === "suggestions" && result && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-amber-600 text-[20px]">auto_awesome</span>
                <p className="text-sm font-bold text-amber-700">{t("similarFound")}</p>
              </div>
              <p className="text-xs text-amber-600">{t("similarFoundDesc")}</p>
            </div>

            <div className="space-y-2">
              {result.similarCategories?.map((sug) => (
                <div
                  key={sug.id}
                  className="bg-surface-container-low rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-on-surface">{sug.nameBn}</p>
                    {sug.nameEn && <p className="text-xs text-on-surface-variant">{sug.nameEn}</p>}
                    <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${sug.scope === "GLOBAL" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                      }`}>
                      {sug.scope}
                    </span>
                  </div>
                  <button
                    onClick={() => handleUseSuggestion(sug)}
                    className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    {t("useExisting")}
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-surface-container pt-4">
              <p className="text-xs text-on-surface-variant mb-3">{t("stillWantNew")}</p>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="w-full bg-primary text-on-primary py-3 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {submitting ? "…" : t("confirmNew")}
              </button>
            </div>
          </div>
        )}

        {step === "submitted" && result && (
          <div className="text-center py-4 space-y-4">
            {result.exactMatch ? (
              <>
                <span className="material-symbols-outlined text-4xl text-amber-500">info</span>
                <h4 className="font-bold text-on-surface">{t("exactMatchTitle")}</h4>
                <div className="bg-amber-50 rounded-xl p-4">
                  <p className="font-semibold text-amber-800">{result.exactMatch.nameBn}</p>
                  {result.exactMatch.nameEn && <p className="text-xs text-amber-600">{result.exactMatch.nameEn}</p>}
                </div>
                <p className="text-sm text-on-surface-variant">{t("exactMatchDesc")}</p>
                <button
                  onClick={() => result.exactMatch && handleUseSuggestion(result.exactMatch)}
                  className="w-full bg-primary text-on-primary py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  {t("useExisting")}
                </button>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-4xl text-primary">check_circle</span>
                <h4 className="font-bold text-on-surface">{t("submittedTitle")}</h4>
                <p className="text-sm text-on-surface-variant">{t("submittedDesc")}</p>
              </>
            )}
            <button
              onClick={onClose}
              className="w-full bg-surface-container-low text-on-surface py-3 rounded-xl text-sm font-semibold hover:bg-surface-container transition-colors"
            >
              {t("done")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
