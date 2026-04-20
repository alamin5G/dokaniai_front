"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import type { CategoryResponse } from "@/types/category";
import { updateCategory, deactivateCategory } from "@/lib/categoryApi";

export default function CategoryDetailView({
  category,
  categories,
  onClose,
}: {
  category: CategoryResponse;
  categories: CategoryResponse[];
  onClose: () => void;
}) {
  const t = useTranslations("admin.categories.taxonomy");
  const isReadOnlySystemCategory = category.isSystem;
  const [editing, setEditing] = useState(false);
  const [editNameBn, setEditNameBn] = useState(category.nameBn);
  const [editNameEn, setEditNameEn] = useState(category.nameEn || "");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const children = useMemo(
    () => categories.filter((c) => c.parentId === category.id),
    [category.id, categories],
  );

  const breadcrumb = useMemo(() => {
    const path: CategoryResponse[] = [];
    let current = category;
    while (current.parentId) {
      const parent = categories.find((c) => c.id === current.parentId);
      if (!parent) break;
      path.unshift(parent);
      current = parent;
    }
    return path;
  }, [category, categories]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateCategory(category.id, {
        nameBn: editNameBn,
        nameEn: editNameEn || undefined,
      });
      setEditing(false);
      setNotice(t("saved"));
      setTimeout(() => setNotice(null), 3000);
    } catch {
      setNotice(t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!confirm(t("confirmDeactivate"))) return;
    setSaving(true);
    try {
      await deactivateCategory(category.id);
      onClose();
    } catch {
      setNotice(t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-5">
      {notice && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {notice}
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-body text-on-surface-variant mb-2">
            {breadcrumb.map((b, i) => (
              <span key={b.id} className="flex items-center gap-1">
                {i > 0 && <span className="material-symbols-outlined text-[14px]">chevron_right</span>}
                <span>{b.nameBn}</span>
              </span>
            ))}
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-on-surface font-medium">{category.nameBn}</span>
          </div>

          {editing ? (
            <div className="space-y-2">
              <input
                value={editNameBn}
                onChange={(e) => setEditNameBn(e.target.value)}
                className="w-full bg-surface-container-low text-on-surface rounded-xl px-4 py-2.5 text-xl font-bold border border-primary focus:outline-none"
                placeholder="বাংলায় নাম"
              />
              <input
                value={editNameEn}
                onChange={(e) => setEditNameEn(e.target.value)}
                className="w-full bg-surface-container-low text-on-surface rounded-xl px-4 py-2 text-base border border-outline-variant/20 focus:border-primary focus:outline-none"
                placeholder="English name"
              />
            </div>
          ) : (
            <>
              <h3 className="font-headline font-bold text-2xl text-on-surface">{category.nameBn}</h3>
              {category.nameEn && (
                <p className="text-on-surface-variant text-base">{category.nameEn}</p>
              )}
            </>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editNameBn.trim()}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving ? "…" : t("save")}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                disabled={isReadOnlySystemCategory}
                className="bg-surface-container-high text-on-surface px-3 py-2 rounded-lg text-sm font-medium hover:bg-surface-container-highest transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                title={isReadOnlySystemCategory ? t("systemCategoryReadOnly") : t("edit")}
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                {t("edit")}
              </button>
              <button
                onClick={handleDeactivate}
                disabled={saving || category.isSystem}
                className="text-error hover:bg-error-container px-3 py-2 rounded-lg transition-colors disabled:opacity-30"
                title={category.isSystem ? t("systemCategory") : t("deactivate")}
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-surface-container-low p-3 rounded-xl">
          <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">{t("status")}</div>
          <div className="font-medium text-sm text-on-surface flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${category.isActive ? "bg-primary-fixed" : "bg-error"}`} />
            {category.isActive ? t("active") : t("inactive")}
          </div>
        </div>
        <div className="bg-surface-container-low p-3 rounded-xl">
          <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">{t("scope")}</div>
          <div className="font-medium text-sm text-on-surface">{category.scope}</div>
        </div>
        <div className="bg-surface-container-low p-3 rounded-xl">
          <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">{t("subCategories")}</div>
          <div className="font-medium text-lg text-on-surface">{children.length}</div>
        </div>
        <div className="bg-surface-container-low p-3 rounded-xl">
          <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">{t("businessType")}</div>
          <div className="font-medium text-sm text-on-surface">{category.businessType?.replace(/_/g, " ") ?? "—"}</div>
        </div>
      </div>

      {children.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-on-surface mb-2">{t("subCategoriesList")}</h4>
          <div className="flex flex-wrap gap-2">
            {children.map((child) => (
              <span
                key={child.id}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-container-low text-on-surface text-sm rounded-lg"
              >
                {child.nameBn}
                {child.nameEn && <span className="text-on-surface-variant text-xs">({child.nameEn})</span>}
                <span className={`ml-1 text-[9px] px-1 py-0.5 rounded ${
                  child.scope === "GLOBAL" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                }`}>
                  {child.scope}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {category.isSystem && (
        <div className="bg-surface-container-low p-4 rounded-xl flex items-center gap-3">
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">info</span>
          <p className="text-xs text-on-surface-variant">{t("systemCategoryInfo")}</p>
        </div>
      )}
    </div>
  );
}
