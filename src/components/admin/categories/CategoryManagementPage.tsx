"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCategoriesByBusinessType, useBusinessesByCategory, useCategoryTags } from "@/hooks/useCategories";
import type { CategoryResponse } from "@/types/category";
import type { CategoryRequestResponse } from "@/types/categoryRequest";
import { getPendingCategoryRequests, decideCategoryRequest, addCategoryTags, removeCategoryTag } from "@/lib/categoryApi";
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

function getRootIcon(businessType: string | null): string {
  if (!businessType) return "category";
  const map: Record<string, string> = {
    GROCERY: "local_mall",
    FASHION: "styler",
    ELECTRONICS: "devices",
    RESTAURANT: "restaurant",
    PHARMACY: "local_pharmacy",
    HARDWARE: "handyman",
    BAKERY: "bakery_dining",
    MOBILE_SHOP: "smartphone",
    TAILORING: "checkroom",
    SWEETS_SHOP: "cake",
    COSMETICS: "spa",
    BOOKSHOP: "menu_book",
    JEWELLERY: "diamond",
    PRINTING: "print",
    STATIONERY: "edit",
    OTHER: "category",
  };
  return map[businessType] || "category";
}

function TreeNodeItem({
  node,
  selectedId,
  onSelect,
  depth = 0,
  businessType,
}: {
  node: TreeNode;
  selectedId: string | null;
  onSelect: (cat: CategoryResponse) => void;
  depth?: number;
  businessType: string;
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
        className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors font-body text-sm ${
          isSelected
            ? "bg-surface-container-high text-on-surface cursor-pointer"
            : "text-on-surface-variant hover:bg-surface-container-low cursor-pointer"
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {hasChildren ? (
          <span className="material-symbols-outlined text-[18px] transition-transform" style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)" }}>
            {expanded ? "keyboard_arrow_down" : "keyboard_arrow_right"}
          </span>
        ) : (
          <span className="material-symbols-outlined text-[18px] opacity-0">keyboard_arrow_right</span>
        )}
        {depth === 0 && (
          <span className="material-symbols-outlined text-[18px]">{getRootIcon(businessType)}</span>
        )}
        <span className="font-medium flex-1">{node.category.nameBn}</span>
        <span className="text-xs text-on-surface-variant bg-surface-container-highest px-1.5 py-0.5 rounded">{node.children.length}</span>
      </button>
      {expanded && hasChildren && (
        <div className="pl-6 mt-1 space-y-1">
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.category.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
              businessType={businessType}
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
  const [businessesPage, setBusinessesPage] = useState(0);
  const [newTagName, setNewTagName] = useState("");
  const [addingTag, setAddingTag] = useState(false);

  const { categories, isLoading, mutate } = useCategoriesByBusinessType(businessType);

  const { businesses, totalPages, isLoading: loadingBusinesses, mutate: mutateBusinesses } = useBusinessesByCategory(
    selectedCategory?.id ?? null,
    businessesPage,
  );

  const { tags, isLoading: loadingTags, mutate: mutateTags } = useCategoryTags(
    selectedCategory?.id ?? null,
  );

  useEffect(() => { setBusinessesPage(0); }, [selectedCategory?.id]);

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

  useEffect(() => { loadPendingRequests(); }, [loadPendingRequests]);

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

  const selectedChildren = useMemo(
    () => (selectedCategory ? categories.filter((c) => c.parentId === selectedCategory.id) : []),
    [selectedCategory, categories],
  );

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
                      <p className="font-body text-xs text-on-surface-variant">
                        {req.businessType?.replace(/_/g, " ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuickApprove(req.id)}
                        className="bg-primary-fixed text-on-primary-fixed font-body text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-fixed-dim transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => router.push(`/admin/categories/requests/${req.id}`)}
                        className="bg-surface-container-high text-on-surface font-body text-sm font-medium px-4 py-2 rounded-lg hover:bg-surface-container-highest transition-colors"
                      >
                        Review
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
            <button className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
            </button>
          </div>

          <div className="mb-3">
            <select
              value={businessType}
              onChange={(e) => { setBusinessType(e.target.value); setSelectedCategory(null); }}
              className="w-full bg-surface-container-low text-on-surface rounded-lg px-3 py-2 text-sm border border-outline-variant/20 focus:border-primary focus:outline-none font-body"
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
              placeholder="Search categories..."
              className="w-full bg-surface-container-low text-on-surface rounded-full pl-10 pr-4 py-2 text-sm font-body border-none focus:ring-0 focus:border-b-2 focus:border-b-secondary transition-all outline-none placeholder:text-on-surface-variant/70"
            />
          </div>

          <div className="space-y-1 max-h-[60vh] overflow-y-auto font-body text-sm">
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
                  onSelect={(cat) => { setSelectedCategory(cat); mutate(); }}
                  businessType={businessType}
                />
              ))
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-surface-container-high">
            <p className="text-xs text-on-surface-variant font-body">
              {t("taxonomy.totalCategories", { count: categories.length })}
            </p>
          </div>
        </div>

        <div className="lg:w-2/3 space-y-6">
          {selectedCategory ? (
            <>
              <div className="bg-surface-container-lowest rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-headline font-bold text-2xl text-on-surface">{selectedCategory.nameBn}</h3>
                    {selectedCategory.nameEn && (
                      <p className="font-body text-on-surface-variant text-base">{selectedCategory.nameEn}</p>
                    )}
                  </div>
                  <CategoryDetailView category={selectedCategory} categories={categories} onClose={() => setSelectedCategory(null)} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-surface-container-low p-4 rounded-lg">
                    <div className="text-xs font-body text-on-surface-variant mb-1">{t("taxonomy.status")}</div>
                    <div className="font-body font-medium text-sm text-on-surface flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${selectedCategory.isActive ? "bg-primary-fixed" : "bg-error"}`} />
                      {selectedCategory.isActive ? t("taxonomy.active") : t("taxonomy.inactive")}
                    </div>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-lg">
                    <div className="text-xs font-body text-on-surface-variant mb-1">{t("taxonomy.scope")}</div>
                    <div className="font-body font-medium text-sm text-on-surface">{selectedCategory.scope}</div>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-lg">
                    <div className="text-xs font-body text-on-surface-variant mb-1">{t("taxonomy.subCategories")}</div>
                    <div className="font-body font-medium text-lg text-on-surface">{selectedChildren.length}</div>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-lg">
                    <div className="text-xs font-body text-on-surface-variant mb-1">{t("taxonomy.businessType")}</div>
                    <div className="font-body font-medium text-sm text-on-surface">{selectedCategory.businessType?.replace(/_/g, " ") ?? "—"}</div>
                  </div>
                </div>

                {selectedChildren.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-headline font-semibold text-sm text-on-surface mb-2">{t("taxonomy.subCategoriesList")}</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedChildren.map((child) => (
                        <span key={child.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-container-low text-on-surface text-sm font-body rounded-lg">
                          {child.nameBn}
                          {child.nameEn && <span className="text-on-surface-variant text-xs">({child.nameEn})</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-surface-container-low p-5 rounded-lg relative">
                  <div className="absolute inset-0 bg-surface-container-lowest/60 backdrop-blur-md rounded-lg pointer-events-none" />
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="bg-gradient-to-br from-primary to-primary-container text-on-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-headline font-semibold text-sm text-on-surface mb-2">
                        AI Suggested Attributes for &ldquo;{selectedCategory.nameBn}&rdquo;
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {loadingTags ? (
                          <div className="h-5 w-20 animate-pulse bg-surface-container-high rounded-full" />
                        ) : (
                          <>
                            {tags.currentTags.map((tag) => (
                              <span key={tag} className="bg-primary-fixed text-on-primary-fixed text-xs font-body font-medium px-3 py-1 rounded-full flex items-center gap-1">
                                {tag}
                                <button
                                  onClick={async () => {
                                    try { await removeCategoryTag(selectedCategory.id, tag); mutateTags(); } catch {}
                                  }}
                                  className="material-symbols-outlined text-[14px] cursor-pointer hover:opacity-70"
                                >close</button>
                              </span>
                            ))}
                            {tags.suggestedTags.slice(0, 3).map((tag) => (
                              <button
                                key={tag}
                                onClick={async () => {
                                  try { await addCategoryTags(selectedCategory.id, [tag]); mutateTags(); } catch {}
                                }}
                                className="bg-primary-fixed/40 text-on-primary-fixed text-xs font-body font-medium px-3 py-1 rounded-full flex items-center gap-1 hover:bg-primary-fixed transition-colors"
                              >
                                + {tag}
                              </button>
                            ))}
                            <div className="inline-flex items-center gap-1">
                              <input
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                onKeyDown={async (e) => {
                                  if (e.key === "Enter" && newTagName.trim()) {
                                    setAddingTag(true);
                                    try {
                                      await addCategoryTags(selectedCategory.id, [newTagName.trim()]);
                                      setNewTagName("");
                                      mutateTags();
                                    } catch {} finally { setAddingTag(false); }
                                  }
                                }}
                                placeholder="Add tag"
                                className="bg-surface-container-high text-on-surface text-xs font-body px-2 py-1 rounded-full w-24 border-none focus:ring-0 placeholder:text-on-surface-variant/50"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-6">
                <h3 className="font-headline font-semibold text-lg text-on-surface mb-4">
                  {t("businessesInCategory")}
                </h3>
                <div className="overflow-x-auto">
                  {loadingBusinesses ? (
                    <div className="flex justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-3 border-surface-container-high border-t-primary" />
                    </div>
                  ) : businesses.length === 0 ? (
                    <p className="text-center text-sm text-on-surface-variant py-8">{t("noBusinessesInCategory")}</p>
                  ) : (
                    <table className="w-full text-left font-body text-sm">
                      <thead>
                        <tr className="text-on-surface-variant border-b-2 border-surface-container-low">
                          <th className="pb-3 font-medium">{t("colBusiness")}</th>
                          <th className="pb-3 font-medium">{t("taxonomy.hierarchy")}</th>
                          <th className="pb-3 font-medium">{t("colStatus")}</th>
                          <th className="pb-3 font-medium text-right">{t("colActions")}</th>
                        </tr>
                      </thead>
                      <tbody className="text-on-surface">
                        {businesses.map((biz) => (
                          <tr key={biz.businessId} className="border-b border-surface-container-high hover:bg-surface-container-low/50 transition-colors">
                            <td className="py-4">
                              <div className="font-medium">{biz.businessName}</div>
                              <div className="text-xs text-on-surface-variant">{biz.businessType.replace(/_/g, " ")}</div>
                            </td>
                            <td className="py-4">{biz.primaryCategory}</td>
                            <td className="py-4">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                biz.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-surface-container-high text-on-surface-variant"
                              }`}>
                                {biz.status}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <button className="text-on-surface-variant hover:text-primary transition-colors">
                                <span className="material-symbols-outlined text-[20px]">more_vert</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setBusinessesPage((p) => Math.max(0, p - 1))}
                      disabled={businessesPage === 0}
                      className="text-sm text-primary hover:text-primary-container disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-on-surface-variant">
                      {businessesPage + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => setBusinessesPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={businessesPage >= totalPages - 1}
                      className="text-sm text-primary hover:text-primary-container disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-surface-container-lowest rounded-xl p-12 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">category</span>
              <p className="text-on-surface-variant text-sm font-body">{t("taxonomy.selectCategory")}</p>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateCategoryModal
          businessType={businessType}
          categories={categories}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); mutate(); }}
        />
      )}
    </div>
  );
}
