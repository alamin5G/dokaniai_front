"use client";

import { useBusinessStore } from "@/store/businessStore";
import type { CategoryResponse } from "@/types/category";
import type {
    Product,
    ProductCreateRequest,
    ProductStatsResponse,
    ProductStatus,
    ProductUpdateRequest,
} from "@/types/product";
import {
    downloadProductImportTemplate,
    exportProductsCsv,
    importProductsCsv,
} from "@/lib/productApi";
import { adjustInventory } from "@/lib/inventoryApi";
import { useProducts, useProductStats, useLowStockProducts } from "@/hooks/useProducts";
import { useCategoriesByBusinessType } from "@/hooks/useCategories";
import { useProductMutations } from "@/hooks/useProductMutations";
import { useSSEStockAlerts } from "@/hooks/useSSEStockAlerts";
import { invalidateProducts } from "@/lib/swrMutations";
import { getAvailablePlans, getCurrentSubscription } from "@/lib/subscriptionApi";
import { useTranslations } from "next-intl";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";

import ProductStatsCards from "./ProductStatsCards";
import ProductInsightPanel from "./ProductInsightPanel";
import ProductTable from "./ProductTable";
import ProductForm, {
    type EditorMode,
    type ProductFormState,
    initialFormState,
    toFormState,
} from "./ProductForm";
import VoiceCommandBar from "./VoiceCommandBar";
import InventoryTab from "./InventoryTab";
import RestockInsightCard from "./RestockInsightCard";
import { useRestockInsight } from "@/hooks/useRestockIntelligence";

function toCreatePayload(form: ProductFormState): ProductCreateRequest {
    return {
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        barcode: form.barcode.trim() || undefined,
        description: form.description.trim() || undefined,
        unit: form.unit.trim(),
        costPrice: Number(form.costPrice),
        sellPrice: Number(form.sellPrice),
        stockQty: form.stockQty.trim() ? Number(form.stockQty) : undefined,
        reorderPoint: form.reorderPoint.trim() ? Number(form.reorderPoint) : undefined,
        purchaseDate: form.purchaseDate || null,
        expiryDate: form.expiryDate || null,
        categoryId: form.categoryId || undefined,
        subCategoryId: form.subCategoryId || undefined,
    };
}

function toUpdatePayload(form: ProductFormState): ProductUpdateRequest {
    return {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        unit: form.unit.trim(),
        costPrice: form.costPrice.trim() ? Number(form.costPrice) : undefined,
        sellPrice: form.sellPrice.trim() ? Number(form.sellPrice) : undefined,
        reorderPoint: form.reorderPoint.trim() ? Number(form.reorderPoint) : undefined,
        purchaseDate: form.purchaseDate || null,
        expiryDate: form.expiryDate || null,
        categoryId: form.categoryId || undefined,
        subCategoryId: form.subCategoryId || undefined,
    };
}

export default function ProductInventoryPage({
    businessId,
}: {
    businessId: string;
}) {
    const t = useTranslations("shop.products");
    const activeBusiness = useBusinessStore((state) => state.activeBusiness);

    // UI filter state (drives SWR keys)
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<"" | ProductStatus>("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [page, setPage] = useState(0);

    // Data — SWR-backed (shared cache, auto-revalidation)
    const { products, totalPages, totalElements, isLoading } = useProducts(businessId, {
        page,
        size: 12,
        search: search || undefined,
        status: status || undefined,
        category: selectedCategoryId || undefined,
    });
    const { stats } = useProductStats(businessId);
    const { lowStockProducts } = useLowStockProducts(businessId);
    const { categories, mutate: mutateCategories } = useCategoriesByBusinessType(activeBusiness?.type ?? null);

    // SSE-driven optimistic cache updates for stock alerts (no extra DB hit)
    useSSEStockAlerts(businessId);

    useEffect(() => {
        const handleNotification = (event: Event) => {
            const detail = (event as CustomEvent).detail as { type?: string } | undefined;
            if (detail?.type === "CATEGORY_REQUEST") {
                mutateCategories();
            }
        };

        window.addEventListener("sse:notification-new", handleNotification);
        return () => window.removeEventListener("sse:notification-new", handleNotification);
    }, [mutateCategories]);

    // Mutations — SWR-backed with cache invalidation
    const { submitCreate, submitUpdate, submitArchive } = useProductMutations(businessId);

    // UI-only state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    // Restock insight state — tracks the last restocked product to show AI insight
    const [lastRestockedProductId, setLastRestockedProductId] = useState<string | null>(null);
    const { insight: restockInsight } = useRestockInsight(businessId, lastRestockedProductId);

    // Editor state
    const [editorMode, setEditorMode] = useState<EditorMode>("create");
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [form, setForm] = useState<ProductFormState>(initialFormState);

    // Top-level tab: "products" or "inventory"
    const [activeTopTab, setActiveTopTab] = useState<"products" | "inventory">("products");

    // Permissions
    const [canBulkImport, setCanBulkImport] = useState(true);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const formContainerRef = useRef<HTMLDivElement | null>(null);

    function scrollToForm() {
        const formNode = formContainerRef.current;
        if (!formNode) return;

        const topBarOffset = 88;
        const targetTop = window.scrollY + formNode.getBoundingClientRect().top - topBarOffset;
        window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
    }

    // Debounced search — updates the `search` state that drives the SWR key
    useEffect(() => {
        const timer = window.setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(0);
        }, 250);
        return () => window.clearTimeout(timer);
    }, [searchInput]);

    // Check bulk import permission
    useEffect(() => {
        let cancelled = false;
        const loadImportPermission = async () => {
            try {
                const [subscription, plans] = await Promise.all([
                    getCurrentSubscription(),
                    getAvailablePlans(),
                ]);
                if (cancelled) return;
                if (!subscription) { setCanBulkImport(false); return; }
                const plan = plans.find((item) => item.id === subscription.planId);
                const planName = plan?.name?.toUpperCase() ?? "";
                setCanBulkImport(["PRO", "PLUS", "ENTERPRISE"].includes(planName));
            } catch {
                if (!cancelled) setCanBulkImport(false);
            }
        };
        void loadImportPermission();
        return () => {
            cancelled = true;
        };
    }, []);

    // Editor helpers
    function resetEditor() {
        setEditorMode("create");
        setEditingProduct(null);
        setForm(initialFormState);
    }

    function handleEdit(product: Product) {
        setEditorMode("edit");
        setEditingProduct(product);
        setForm(toFormState(product));
        setNotice(null);

        // In responsive layouts the form can be above the product list.
        // Bring it into view immediately after switching to edit mode.
        window.requestAnimationFrame(() => {
            scrollToForm();
        });
    }

    function updateForm<K extends keyof ProductFormState>(
        key: K,
        value: ProductFormState[K],
    ) {
        setForm((current) => ({ ...current, [key]: value }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setNotice(null);

        try {
            if (editorMode === "edit" && editingProduct) {
                await submitUpdate(editingProduct.id, toUpdatePayload(form));
                // Handle restock if quantity provided
                const restockQty = Number(form.restockQty);
                if (restockQty > 0) {
                    await adjustInventory(businessId, {
                        productId: editingProduct.id,
                        quantity: restockQty,
                        reason: "এডিট ফর্ম থেকে রিস্টক",
                        action: "RESTOCK",
                    });
                    // Track restocked product for AI insight display
                    setLastRestockedProductId(editingProduct.id);
                }
                setNotice(t("messages.updated"));
            } else {
                await submitCreate(toCreatePayload(form));
                setNotice(t("messages.created"));
            }
            resetEditor();
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : t("messages.saveError"),
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleArchive(product: Product) {
        const confirmed = window.confirm(
            t("messages.confirmArchive", { name: product.name }),
        );
        if (!confirmed) return;

        try {
            await submitArchive(product.id);
            if (editingProduct?.id === product.id) {
                resetEditor();
            }
            setNotice(t("messages.archived"));
        } catch (archiveError) {
            setError(
                archiveError instanceof Error
                    ? archiveError.message
                    : t("messages.archiveError"),
            );
        }
    }

    async function handleTemplateDownload() {
        try {
            const blob = await downloadProductImportTemplate(businessId);
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `product-import-template-${businessId}.csv`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.URL.revokeObjectURL(url);
        } catch (downloadError) {
            setError(
                downloadError instanceof Error
                    ? downloadError.message
                    : t("messages.templateError"),
            );
        }
    }

    async function handleExport() {
        try {
            const blob = await exportProductsCsv(businessId);
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `products-${businessId}.csv`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.URL.revokeObjectURL(url);
        } catch (downloadError) {
            setError(
                downloadError instanceof Error
                    ? downloadError.message
                    : t("messages.exportError"),
            );
        }
    }

    async function handleImport(event: ChangeEvent<HTMLInputElement>) {
        if (!canBulkImport) {
            setError(t("messages.importLocked"));
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setError(null);
        setNotice(null);

        try {
            const result = await importProductsCsv(businessId, file);
            setNotice(
                t("messages.importResult", {
                    success: result.successCount,
                    failed: result.errorCount,
                    total: result.totalRows,
                }),
            );
            await invalidateProducts(businessId);
        } catch (importError) {
            setError(
                importError instanceof Error
                    ? importError.message
                    : t("messages.importError"),
            );
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    // Top-level tab options
    const topTabs: { key: "products" | "inventory"; label: string }[] = [
        { key: "products", label: t("tabProducts") },
        { key: "inventory", label: t("tabInventory") },
    ];

    return (
        <section className="space-y-6 overflow-x-hidden">
            {/* AI Voice Command Bar + action buttons — wraps on mobile */}
            <div className="flex flex-wrap items-center gap-2 max-w-full">
                <div className="flex-1 min-w-0">
                    <VoiceCommandBar />
                </div>
                {activeTopTab === "products" && (
                    <div className="flex items-center gap-2 shrink-0 max-w-full">
                        {/* CSV Upload — tooltip shows plan-locked warning when disabled */}
                        <div className="relative group">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={!canBulkImport || isImporting}
                                title={canBulkImport ? (isImporting ? t("actions.importing") : t("actions.csvImport")) : undefined}
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-on-surface transition hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-lg">upload</span>
                            </button>
                            {!canBulkImport && (
                                <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                    {t("messages.importLocked")}
                                    {/* Arrow */}
                                    <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-amber-200 bg-amber-50" />
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={handleTemplateDownload}
                            title={t("actions.templateDownload")}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-lowest text-primary transition hover:bg-primary-fixed"
                        >
                            <span className="material-symbols-outlined text-lg">download</span>
                        </button>
                    </div>
                )}
            </div>

            {/* ─── Top-level Tab Navigation ─────────────────── */}
            <div className="flex gap-2 border-b border-surface-container pb-0 overflow-x-auto scrollbar-none max-w-full">
                {topTabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTopTab(tab.key)}
                        className={`rounded-t-xl px-4 py-3 text-sm font-semibold transition whitespace-nowrap sm:px-5 lg:px-6 ${activeTopTab === tab.key
                            ? "bg-surface-container-lowest text-primary shadow-sm"
                            : "text-on-surface-variant hover:text-on-surface"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Hidden file input for CSV import */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                disabled={!canBulkImport}
                onChange={handleImport}
            />

            {/* Error / Notice banners */}
            {error ? (
                <div className="rounded-[24px] bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
                    {error}
                </div>
            ) : null}

            {notice ? (
                <div className="rounded-[24px] bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
                    {notice}
                </div>
            ) : null}

            {/* Restock AI Insight Card — shown after a restock via edit form */}
            {restockInsight && (
                <RestockInsightCard
                    insight={restockInsight}
                    onDismiss={() => setLastRestockedProductId(null)}
                />
            )}

            {/* ─── Products Tab Content ──────────────────────── */}
            {activeTopTab === "products" && (
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                    {/* Main content — below form on mobile, left column on desktop */}
                    <div className="space-y-6 order-2 xl:order-1 min-w-0">
                        {/* Stats Cards */}
                        <ProductStatsCards stats={stats} />

                        {/* AI Insight Panel */}
                        <ProductInsightPanel
                            businessId={businessId}
                            products={products}
                            lowStockProducts={lowStockProducts}
                            onEdit={handleEdit}
                        />

                        {/* Product Table */}
                        <ProductTable
                            products={products}
                            isLoading={isLoading}
                            searchInput={searchInput}
                            onSearchInputChange={setSearchInput}
                            status={status}
                            onStatusChange={(newStatus) => {
                                setStatus(newStatus);
                                setPage(0);
                            }}
                            categories={categories}
                            selectedCategoryId={selectedCategoryId}
                            onCategorySelect={(categoryId) => {
                                setSelectedCategoryId(categoryId);
                                setPage(0);
                            }}
                            businessId={businessId}
                            page={page}
                            totalPages={totalPages}
                            totalElements={totalElements}
                            onEdit={handleEdit}
                            onArchive={handleArchive}
                            onPageChange={setPage}
                        />
                    </div>

                    {/* Sidebar — above table on mobile, right column on desktop */}
                    <aside ref={formContainerRef} className="space-y-6 order-1 xl:order-2 min-w-0">
                        {/* Product Form */}
                        <ProductForm
                            businessId={businessId}
                            form={form}
                            editorMode={editorMode}
                            editingProduct={editingProduct}
                            categories={categories}
                            isSubmitting={isSubmitting}
                            onSubmit={handleSubmit}
                            onUpdateForm={updateForm}
                            onReset={resetEditor}
                        />

                    </aside>
                </div>
            )}

            {/* ─── Inventory Tab Content ─────────────────────── */}
            {activeTopTab === "inventory" && (
                <InventoryTab businessId={businessId} />
            )}
        </section>
    );
}
