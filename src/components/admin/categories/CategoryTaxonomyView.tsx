"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useCategoriesByBusinessType } from "@/hooks/useCategories";
import type { CategoryResponse } from "@/types/category";
import CategoryDetailView from "./CategoryDetailView";
import CreateCategoryModal from "./CreateCategoryModal";

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
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors text-sm ${
          isSelected
            ? "bg-primary-fixed text-on-primary-fixed font-semibold"
            : "text-on-surface-variant hover:bg-surface-container-low"
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {hasChildren ? (
          <span className="material-symbols-outlined text-[16px] transition-transform" style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)" }}>
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

export default function CategoryTaxonomyView() {
  const t = useTranslations("admin.categories.taxonomy");
  const [businessType, setBusinessType] = useState("GROCERY");
  const [selectedCategory, setSelectedCategory] = useState<CategoryResponse | null>(null);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { categories, isLoading } = useCategoriesByBusinessType(businessType);

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

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-1/3 bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline font-semibold text-lg text-on-surface">{t("hierarchy")}</h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            {t("create")}
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
            placeholder={t("searchPlaceholder")}
            className="w-full bg-surface-container-low text-on-surface rounded-xl pl-9 pr-3 py-2 text-sm border border-outline-variant/20 focus:border-primary focus:outline-none placeholder:text-on-surface-variant/60"
          />
        </div>

        <div className="space-y-0.5 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-3 border-surface-container-high border-t-primary" />
            </div>
          ) : filteredTree.length === 0 ? (
            <p className="text-center text-sm text-on-surface-variant py-8">{t("noCategories")}</p>
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
            {t("totalCategories", { count: categories.length })}
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
          <div className="bg-surface-container-lowest rounded-2xl p-12 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">category</span>
            <p className="text-on-surface-variant text-sm">{t("selectCategory")}</p>
          </div>
        )}
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
