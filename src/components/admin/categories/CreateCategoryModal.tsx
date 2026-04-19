"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { CategoryResponse } from "@/types/category";
import { createGlobalCategory } from "@/lib/categoryApi";

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
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parentOptions = categories.filter((c) => !c.parentId);

  async function handleSubmit() {
    if (!nameBn.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createGlobalCategory({
        nameBn: nameBn.trim(),
        nameEn: nameEn.trim() || undefined,
        businessType,
        parentId: parentId || undefined,
        scope,
        description: description.trim() || undefined,
      });
      onCreated();
    } catch {
      setError(t("createError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-surface-container-lowest p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-on-surface mb-5">{t("createTitle")}</h3>

        {error && (
          <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 mb-4">{error}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-on-surface-variant mb-1 block">{t("nameBn")}</label>
            <input
              value={nameBn}
              onChange={(e) => setNameBn(e.target.value)}
              className="w-full bg-surface-container-low text-on-surface rounded-xl px-4 py-2.5 text-sm border border-outline-variant/20 focus:border-primary focus:outline-none"
              placeholder="বাংলায় ক্যাটেগরির নাম"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-on-surface-variant mb-1 block">{t("nameEn")}</label>
            <input
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="w-full bg-surface-container-low text-on-surface rounded-xl px-4 py-2.5 text-sm border border-outline-variant/20 focus:border-primary focus:outline-none"
              placeholder="Category name in English"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-on-surface-variant mb-1 block">{t("businessType")}</label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full bg-surface-container-low text-on-surface rounded-xl px-4 py-2.5 text-sm border border-outline-variant/20 focus:border-primary focus:outline-none"
            >
              {BUSINESS_TYPES.map((bt) => (
                <option key={bt} value={bt}>{bt.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-on-surface-variant mb-1 block">{t("parentCategory")}</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full bg-surface-container-low text-on-surface rounded-xl px-4 py-2.5 text-sm border border-outline-variant/20 focus:border-primary focus:outline-none"
            >
              <option value="">{t("noParent")}</option>
              {parentOptions.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nameBn} {cat.nameEn ? `(${cat.nameEn})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-on-surface-variant mb-1 block">{t("scope")}</label>
            <div className="flex gap-2">
              {(["GLOBAL", "BUSINESS"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                    scope === s
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-low text-on-surface-variant"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-on-surface-variant mb-1 block">{t("descriptionOptional")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-surface-container-low text-on-surface rounded-xl px-4 py-2.5 text-sm border border-outline-variant/20 focus:border-primary focus:outline-none resize-none"
              placeholder={t("descriptionPlaceholder")}
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !nameBn.trim()}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {submitting ? "…" : t("create")}
          </button>
        </div>
      </div>
    </div>
  );
}
