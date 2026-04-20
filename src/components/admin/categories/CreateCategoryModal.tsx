"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useCategoriesByBusinessType } from "@/hooks/useCategories";
import type { CategoryResponse } from "@/types/category";
import type { BusinessOptionResponse } from "@/types/business";
import { createBusinessScopedCategory, createGlobalCategory } from "@/lib/categoryApi";
import { listAdminBusinessesByType } from "@/lib/businessApi";

const BUSINESS_TYPES = [
  "GROCERY", "FASHION", "ELECTRONICS", "RESTAURANT", "PHARMACY",
  "STATIONERY", "HARDWARE", "BAKERY", "MOBILE_SHOP", "TAILORING",
  "SWEETS_SHOP", "COSMETICS", "BOOKSHOP", "JEWELLERY", "PRINTING", "OTHER",
];

export default function CreateCategoryModal({
  businessType: initialBusinessType,
  categories,
  onClose,
  onCreated,
}: {
  businessType: string;
  categories: CategoryResponse[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const t = useTranslations("admin.categories.taxonomy");

  const [nameBn, setNameBn] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [businessType, setBusinessType] = useState(initialBusinessType);
  const [parentId, setParentId] = useState("");
  const [scope, setScope] = useState<"GLOBAL" | "BUSINESS">("GLOBAL");
  const [targetBusinessId, setTargetBusinessId] = useState("");
  const [businessOptions, setBusinessOptions] = useState<BusinessOptionResponse[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { categories: scopedCategories } = useCategoriesByBusinessType(businessType);
  const parentOptions = (scopedCategories.length > 0 ? scopedCategories : categories).filter((c) => !c.parentId);

  useEffect(() => {
    let cancelled = false;
    if (scope !== "BUSINESS") {
      setBusinessOptions([]);
      setTargetBusinessId("");
      return;
    }

    setLoadingBusinesses(true);
    void listAdminBusinessesByType(businessType)
      .then((items) => {
        if (cancelled) return;
        setBusinessOptions(items);
        setTargetBusinessId((current) => current || items[0]?.id || "");
      })
      .catch(() => {
        if (cancelled) return;
        setBusinessOptions([]);
        setTargetBusinessId("");
      })
      .finally(() => {
        if (!cancelled) setLoadingBusinesses(false);
      });

    return () => {
      cancelled = true;
    };
  }, [businessType, scope]);

  async function handleSubmit() {
    if (!nameBn.trim()) return;
    if (scope === "BUSINESS" && !targetBusinessId) return;
    setSubmitting(true);
    setError(null);
    try {
      if (scope === "BUSINESS") {
        await createBusinessScopedCategory(targetBusinessId, {
          nameBn: nameBn.trim(),
          nameEn: nameEn.trim() || undefined,
          businessType,
          parentId: parentId || undefined,
          description: description.trim() || undefined,
        });
      } else {
        await createGlobalCategory({
          nameBn: nameBn.trim(),
          nameEn: nameEn.trim() || undefined,
          businessType,
          parentId: parentId || undefined,
          scope,
          description: description.trim() || undefined,
        });
      }
      onCreated();
    } catch {
      setError(t("createError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-surface-container-lowest shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden border-b border-surface-container-high bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-primary-fixed/35 px-6 py-6">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary-fixed/50 blur-2xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-surface-container-high px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px]">category</span>
                {t("modalEyebrow")}
              </div>
              <h3 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">
                {t("createTitle")}
              </h3>
              <p className="max-w-xl text-sm leading-6 text-on-surface-variant">
                {t("modalSubtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-on-surface-variant transition hover:bg-white hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>
        )}

        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-4 rounded-[24px] bg-surface-container-low p-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">{t("nameBn")}</label>
              <input
                value={nameBn}
                onChange={(e) => setNameBn(e.target.value)}
                className="w-full rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary"
                placeholder="বাংলায় ক্যাটেগরির নাম"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">{t("nameEn")}</label>
              <input
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="w-full rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary"
                placeholder="Category name in English"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">{t("businessType")}</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary"
              >
                {BUSINESS_TYPES.map((bt) => (
                  <option key={bt} value={bt}>{bt.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">{t("parentCategory")}</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary"
              >
                <option value="">{t("noParent")}</option>
                {parentOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nameBn} {cat.nameEn ? `(${cat.nameEn})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-[24px] bg-surface-container-low p-5">
            <label className="mb-3 block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">{t("scope")}</label>
            <div className="grid gap-3 md:grid-cols-2">
              {(["GLOBAL", "BUSINESS"] as const).map((s) => {
                const isSelected = scope === s;
                const icon = s === "GLOBAL" ? "public" : "storefront";
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScope(s)}
                    className={`rounded-[22px] border px-4 py-4 text-left transition ${
                      isSelected
                        ? "border-primary bg-primary-fixed text-on-primary-fixed shadow-sm"
                        : "border-outline-variant/20 bg-surface-container-lowest text-on-surface hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`material-symbols-outlined text-[20px] ${isSelected ? "text-on-primary-fixed" : "text-primary"}`}>
                        {icon}
                      </span>
                      <div>
                        <p className="text-sm font-bold">{t(`scopeOptions.${s}`)}</p>
                        <p className={`mt-1 text-xs leading-5 ${isSelected ? "text-on-primary-fixed/80" : "text-on-surface-variant"}`}>
                          {s === "GLOBAL"
                            ? t("scopeDescriptionGlobal")
                            : t("scopeDescriptionBusiness")}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {scope === "BUSINESS" && (
            <div className="rounded-[24px] border border-primary/10 bg-gradient-to-br from-primary-fixed/35 to-surface-container-lowest p-5">
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-primary">
                  <span className="material-symbols-outlined text-[20px]">business_center</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">{t("targetBusiness")}</p>
                  <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                    {businessOptions.length > 0 ? t("businessHelp") : t("businessEmpty")}
                  </p>
                </div>
              </div>
              <select
                value={targetBusinessId}
                onChange={(e) => setTargetBusinessId(e.target.value)}
                disabled={loadingBusinesses || businessOptions.length === 0}
                className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary disabled:opacity-60"
              >
                <option value="">
                  {loadingBusinesses ? t("businessLoading") : t("businessPlaceholder")}
                </option>
                {businessOptions.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">{t("descriptionOptional")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary resize-none"
              placeholder={t("descriptionPlaceholder")}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-surface-container-high bg-surface-container-low px-6 py-5">
          <p className="text-xs leading-5 text-on-surface-variant">
            {scope === "GLOBAL"
              ? t("footerGlobal")
              : t("footerBusiness")}
          </p>
          <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !nameBn.trim() || (scope === "BUSINESS" && !targetBusinessId)}
            className="rounded-xl bg-gradient-to-r from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-on-primary hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm"
          >
            {submitting ? "…" : t("create")}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
