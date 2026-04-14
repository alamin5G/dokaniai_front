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
    archiveProduct,
    createProduct,
    downloadProductImportTemplate,
    exportProductsCsv,
    getLowStockProducts,
    getReorderNeededProducts,
    getProductStats,
    importProductsCsv,
    listProducts,
    updateProduct,
} from "@/lib/productApi";
import { getCategoriesByBusinessType } from "@/lib/categoryApi";
import { getAvailablePlans, getCurrentSubscription } from "@/lib/subscriptionApi";
import { useTranslations } from "next-intl";
import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from "react";

import ProductStatsCards from "./ProductStatsCards";
import ProductInsightPanel from "./ProductInsightPanel";
import ProductTable from "./ProductTable";
import ProductForm, {
    type EditorMode,
    type ProductFormState,
    initialFormState,
    toFormState,
} from "./ProductForm";
import ProductSidebar from "./ProductSidebar";
import VoiceCommandBar from "./VoiceCommandBar";
import InventoryTab from "./InventoryTab";

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

    // Data state
    const [products, setProducts] = useState<Product[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
    const [reorderProducts, setReorderProducts] = useState<Product[]>([]);
    const [stats, setStats] = useState<ProductStatsResponse | null>(null);
    const [categories, setCategories] = useState<CategoryResponse[]>([]);

    // UI state
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<"" | ProductStatus>("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    // Editor state
    const [editorMode, setEditorMode] = useState<EditorMode>("create");
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [form, setForm] = useState<ProductFormState>(initialFormState);

    // Top-level tab: "products" or "inventory"
    const [activeTopTab, setActiveTopTab] = useState<"products" | "inventory">("products");

    // Permissions
    const [canBulkImport, setCanBulkImport] = useState(true);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Debounced search
    useEffect(() => {
        const timer = window.setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(0);
        }, 250);
        return () => window.clearTimeout(timer);
    }, [searchInput]);

    // Load categories based on business type
    useEffect(() => {
        if (!activeBusiness?.type) return;
        let cancelled = false;
        const loadCategories = async () => {
            try {
                const cats = await getCategoriesByBusinessType(activeBusiness.type);
                if (!cancelled) {
                    setCategories(cats);
                }
            } catch {
                // Categories are optional — silently fail
            }
        };
        void loadCategories();
        return () => {
            cancelled = true;
        };
    }, [activeBusiness?.type]);

    // Main data loading
    const loadWorkspace = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [productPage, lowStock, reorderNeeded, statsResponse] =
                await Promise.all([
                    listProducts(businessId, {
                        page,
                        size: 12,
                        search: search || undefined,
                        status: status || undefined,
                        category: selectedCategoryId || undefined,
                    }),
                    getLowStockProducts(businessId),
                    getReorderNeededProducts(businessId),
                    getProductStats(businessId),
                ]);

            setProducts(productPage.content);
            setTotalPages(Math.max(productPage.totalPages, 1));
            setTotalElements(productPage.totalElements);
            setLowStockProducts(lowStock);
            setReorderProducts(reorderNeeded);
            setStats(statsResponse);
        } catch (loadError) {
            setError(
                loadError instanceof Error
                    ? loadError.message
                    : t("messages.loadError"),
            );
        } finally {
            setIsLoading(false);
        }
    }, [businessId, page, search, status, selectedCategoryId, t]);

    useEffect(() => {
        void loadWorkspace();
    }, [loadWorkspace]);

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
                await updateProduct(businessId, editingProduct.id, toUpdatePayload(form));
                setNotice(t("messages.updated"));
            } else {
                await createProduct(businessId, toCreatePayload(form));
                setNotice(t("messages.created"));
            }
            resetEditor();
            await loadWorkspace();
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
            await archiveProduct(businessId, product.id);
            if (editingProduct?.id === product.id) {
                resetEditor();
            }
            setNotice(t("messages.archived"));
            await loadWorkspace();
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
            await loadWorkspace();
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
        <section className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-sm font-bold uppercase tracking-[0.28em] text-secondary">
                        {t("label")}
                    </p>
                    <h1 className="mt-2 text-4xl font-black tracking-tight text-primary">
                        {t("title")}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-on-surface-variant">
                        {t("subtitle", {
                            businessName: activeBusiness?.name ?? "Business",
                        })}
                    </p>
                </div>

                {/* Products tab action buttons */}
                {activeTopTab === "products" && (
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={!canBulkImport}
                            className="rounded-full bg-surface-container px-5 py-3 text-sm font-semibold text-on-surface transition hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isImporting ? t("actions.importing") : t("actions.csvImport")}
                        </button>
                        <button
                            type="button"
                            onClick={handleTemplateDownload}
                            className="rounded-full bg-surface-container-lowest px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary-fixed"
                        >
                            {t("actions.templateDownload")}
                        </button>
                        <button
                            type="button"
                            onClick={handleExport}
                            className="rounded-full bg-surface-container-lowest px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary-fixed"
                        >
                            {t("actions.csvExport")}
                        </button>
                        <button
                            type="button"
                            onClick={resetEditor}
                            className="rounded-full bg-gradient-to-br from-primary to-primary-container px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(0,55,39,0.18)] transition hover:opacity-95"
                        >
                            {t("actions.addNew")}
                        </button>
                    </div>
                )}
            </div>

            {/* ─── Top-level Tab Navigation ─────────────────── */}
            <div className="flex gap-2 border-b border-surface-container pb-0">
                {topTabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTopTab(tab.key)}
                        className={`rounded-t-xl px-6 py-3 text-sm font-semibold transition ${activeTopTab === tab.key
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

            {/* Import locked notice */}
            {!canBulkImport && activeTopTab === "products" ? (
                <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
                    {t("messages.importLocked")}
                </div>
            ) : null}

            {/* AI Voice Command Bar */}
            <VoiceCommandBar />

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

            {/* ─── Products Tab Content ──────────────────────── */}
            {activeTopTab === "products" && (
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_380px]">
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <ProductStatsCards stats={stats} />

                        {/* AI Insight Panel */}
                        <ProductInsightPanel
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
                            page={page}
                            totalPages={totalPages}
                            totalElements={totalElements}
                            onEdit={handleEdit}
                            onArchive={handleArchive}
                            onPageChange={setPage}
                        />
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-6">
                        {/* Product Form */}
                        <ProductForm
                            form={form}
                            editorMode={editorMode}
                            editingProduct={editingProduct}
                            categories={categories}
                            isSubmitting={isSubmitting}
                            onSubmit={handleSubmit}
                            onUpdateForm={updateForm}
                            onReset={resetEditor}
                        />

                        {/* Inventory Status Sidebar */}
                        <ProductSidebar stats={stats} reorderProducts={reorderProducts} />
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

