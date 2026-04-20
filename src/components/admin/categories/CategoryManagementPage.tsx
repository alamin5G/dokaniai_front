"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCategoriesByBusinessType, useCategoryRequestStats } from "@/hooks/useCategories";
import type { CategoryResponse } from "@/types/category";
import type { CategoryRequestResponse } from "@/types/categoryRequest";
import { getPendingCategoryRequests, decideCategoryRequest } from "@/lib/categoryApi";
import CategoryDetailView from "./CategoryDetailView";
import CreateCategoryModal from "./CreateCategoryModal";
import { useMemo } from "react";

const BUSINESS_TYPES = [
  "GROCERY", "FASHION", "ELECTRONICS", "RESTAURANT", "PHARMACY",
  "STATIONERY", "HARDWARE", "BAKERY", "MOBILE_SHOP", "TAILORING",
  "SWEETS_SHOP", "COSMETICS", "BOOKSHOP", "JEWELLERY", "PRINTING", "OTHER",
];

interface TreeNode {
  category: CategoryResponse;
  children: TreeNode[];
}

function buildTree(categories: CategoryResponse[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const cat of categories) {
    map.set(cat.id, { category: cat, children: [] });
  }

  for (const cat of categories) {
    const node = map.get(cat.id)!;
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function TreeNodeItem({
  node,
  selectedId,
  onSelect,
  depth = 0,
}: {
  node: TreeNode;
  selectedId: string | null;
  onSelect: (cat: CategoryResponse) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const isSelected = selectedId === node.category.id;
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <button
        onClick={() => {
          onSelect(node.category);
          if (hasChildren) setExpanded(!expanded);
        }}
        className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors text-sm ${
          isSelected
            ? "bg-primary-fixed text-on-primary-fixed font-semibold"
            : "text-on-surface-variant hover:bg-surface-container-low"
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {hasChildren ? (
          <span className="material-symbols-outlined text-[18px] transition-transform" style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)" }}>
            keyboard_arrow_down
          </span>
        ) : (
          <span className="w-4" />
        )}
        <span className="flex-1 truncate">{node.category.nameBn}</span>
        {node.category.nameEn && (
          <span className={`text-[10px] truncate max-w-[80px] ${isSelected ? "opacity-70" : "text-on-surface-variant/60"}`}>
            {node.category.nameEn}
          </span>
        )}
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
          node.category.scope === "GLOBAL" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
        }`}>
          {node.category.scope === "GLOBAL" ? "G" : "B"}
        </span>
      </button>
      {expanded && hasChildren && (
        <div className="mt-0.5">
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.category.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoryManagementPage() {
  const t = useTranslations("admin.categories");
  const router = useRouter();
  const [businessType, setBusinessType] = useState("GROCERY");
  const [selectedCategory, setSelectedCategory] = useState<CategoryResponse | null>(null);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<CategoryRequestResponse[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const { categories, isLoading } = useCategoriesByBusinessType(businessType);
  const { stats } = useCategoryRequestStats();

  const tree = useMemo(() => buildTree(categories), [categories]);

  const filteredTree = useMemo(() => {
    if (!search.trim()) return tree;
    const q = search.toLowerCase();

    function matches(node: TreeNode): boolean {
      const cat = node.category;
      if (cat.nameBn.toLowerCase().includes(q)) return true;
      if (cat.nameEn && cat.nameEn.toLowerCase().includes(q)) return true;
      return node.children.some(matches);
    }

    function filterNodes(nodes: TreeNode[]): TreeNode[] {
      return nodes.filter(matches).map((node) => ({
        ...node,
        children: filterNodes(node.children),
      }));
    }

    return filterNodes(tree);
  }, [tree, search]);

  const loadPendingRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const { content } = await getPendingCategoryRequests(0, 5);
      setPendingRequests(content);
    } catch {
      setPendingRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    loadPendingRequests();
  }, [loadPendingRequests]);

  async function handleQuickApprove(requestId: string) {
    try {
      await decideCategoryRequest(requestId, { action: "APPROVE_GLOBAL" });
      loadPendingRequests();
    } catch {}
  }

  async function handleQuickReject(requestId: string) {
    try {
      await decideCategoryRequest(requestId, { action: "REJECT", rejectionReason: "Not suitable" });
      loadPendingRequests();
    } catch {}
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-headline text-4xl font-bold text-on-surface tracking-tight">
            {t("taxonomyTitle")}
          </h2>
          <p className="font-body text-on-surface-variant text-base">
            {t("taxonomySubtitle")}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-primary to-primary-container text-on-primary font-body font-semibold px-6 py-3 rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity w-fit shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          {t("taxonomy.create")}
        </button>
      </div>

      {pendingRequests.length > 0 && (
        <section className="bg-surface-container-lowest rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-error" />
          <div className="flex items-start gap-4">
            <div className="bg-error-container text-on-error-container p-2 rounded-lg flex-shrink-0">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>assignment_late</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-headline font-semibold text-lg text-on-surface">
                  {t("pendingRequestsTitle")}
                </h3>
                <button
                  onClick={() => router.push("/admin/categories/moderation")}
                  className="text-sm font-semibold text-primary hover:text-primary-container transition-colors flex items-center gap-1"
                >
                  {t("moderation.viewAll")} <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </button>
              </div>
              <p className="font-body text-sm text-on-surface-variant mb-4">
                {t("pendingRequestsDesc", { count: pendingRequests.length })}
              </p>
              <div className="space-y-3">
                {pendingRequests.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    className="bg-surface-container-low rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-body font-medium text-sm text-on-surface">&ldquo;{req.nameBn}&rdquo;</span>
                        <span className="text-xs font-body text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded">
                          {t("moderation.requestedBy")}: {req.businessName || req.requestedByName || "—"}
                        </span>
                      </div>
                      {req.businessType && (
                        <p className="font-body text-xs text-on-surface-variant">
                          {req.businessType.replace(/_/g, " ")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuickApprove(req.id)}
                        className="bg-primary-fixed text-on-primary-fixed font-body text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-fixed-dim transition-colors"
                      >
                        {t("moderation.approveGlobal")}
                      </button>
                      <button
                        onClick={() => router.push(`/admin/categories/requests/${req.id}`)}
                        className="bg-surface-container-high text-on-surface font-body text-sm font-medium px-4 py-2 rounded-lg hover:bg-surface-container-highest transition-colors"
                      >
                        {t("moderation.review")}
                      </button>
                      <button
                        onClick={() => handleQuickReject(req.id)}
                        className="text-error hover:bg-error-container px-3 py-2 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/3 bg-surface-container-lowest rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline font-semibold text-xl text-on-surface">{t("taxonomy.hierarchy")}</h3>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
            </button>
          </div>

          <div className="mb-3">
            <select
              value={businessType}
              onChange={(e) => { setBusinessType(e.target.value); setSelectedCategory(null); }}
              className="w-full bg-surface-container-low text-on-surface rounded-xl px-3 py-2 text-sm border border-outline-variant/20 focus:border-primary focus:outline-none"
            >
              {BUSINESS_TYPES.map((bt) => (
                <option key={bt} value={bt}>{bt.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          <div className="relative mb-3">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("taxonomy.searchPlaceholder")}
              className="w-full bg-surface-container-low text-on-surface rounded-xl pl-9 pr-3 py-2 text-sm border border-outline-variant/20 focus:border-primary focus:outline-none placeholder:text-on-surface-variant/60"
            />
          </div>

          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-3 border-surface-container-high border-t-primary" />
              </div>
            ) : filteredTree.length === 0 ? (
              <p className="text-center text-sm text-on-surface-variant py-8">{t("taxonomy.noCategories")}</p>
            ) : (
              filteredTree.map((node) => (
                <TreeNodeItem
                  key={node.category.id}
                  node={node}
                  selectedId={selectedCategory?.id ?? null}
                  onSelect={setSelectedCategory}
                />
              ))
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-surface-container-high">
            <p className="text-xs text-on-surface-variant">
              {t("taxonomy.totalCategories", { count: categories.length })}
            </p>
          </div>
        </div>

        <div className="lg:w-2/3">
          {selectedCategory ? (
            <CategoryDetailView
              category={selectedCategory}
              categories={categories}
              onClose={() => setSelectedCategory(null)}
            />
          ) : (
            <div className="bg-surface-container-lowest rounded-xl p-12 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">category</span>
              <p className="text-on-surface-variant text-sm">{t("taxonomy.selectCategory")}</p>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateCategoryModal
          businessType={businessType}
          categories={categories}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
