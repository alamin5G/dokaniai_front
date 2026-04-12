"use client";

import { useBusinessStore } from "@/store/businessStore";
import type {
  Product,
  ProductCreateRequest,
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
import { getAvailablePlans, getCurrentSubscription } from "@/lib/subscriptionApi";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

const currencyFormatter = new Intl.NumberFormat("bn-BD", {
  maximumFractionDigits: 0,
});

const qtyFormatter = new Intl.NumberFormat("bn-BD", {
  maximumFractionDigits: 3,
});

type EditorMode = "create" | "edit";

interface ProductFormState {
  name: string;
  sku: string;
  barcode: string;
  description: string;
  unit: string;
  costPrice: string;
  sellPrice: string;
  stockQty: string;
  reorderPoint: string;
}

const initialFormState: ProductFormState = {
  name: "",
  sku: "",
  barcode: "",
  description: "",
  unit: "piece",
  costPrice: "",
  sellPrice: "",
  stockQty: "",
  reorderPoint: "",
};

function formatMoney(value: number | null | undefined): string {
  return currencyFormatter.format(value ?? 0);
}

function formatQty(value: number | null | undefined): string {
  return qtyFormatter.format(value ?? 0);
}

function mapStatusLabel(status: ProductStatus) {
  switch (status) {
    case "LOW_STOCK":
      return "অল্প স্টক";
    case "OUT_OF_STOCK":
      return "স্টক আউট";
    case "ARCHIVED":
      return "আর্কাইভড";
    default:
      return "পর্যাপ্ত";
  }
}

function mapStatusClasses(status: ProductStatus) {
  switch (status) {
    case "LOW_STOCK":
      return "bg-amber-100 text-amber-800";
    case "OUT_OF_STOCK":
      return "bg-rose-100 text-rose-800";
    case "ARCHIVED":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-emerald-100 text-emerald-800";
  }
}

function toFormState(product: Product): ProductFormState {
  return {
    name: product.name,
    sku: product.sku,
    barcode: product.barcode ?? "",
    description: product.description ?? "",
    unit: product.unit,
    costPrice: product.costPrice.toString(),
    sellPrice: product.sellPrice.toString(),
    stockQty: product.stockQty.toString(),
    reorderPoint: product.reorderPoint?.toString() ?? "",
  };
}

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
  };
}

export default function ShopProductsWorkspace({ businessId }: { businessId: string }) {
  const activeBusiness = useBusinessStore((state) => state.activeBusiness);
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [reorderProducts, setReorderProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<{
    totalProducts: number;
    activeProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    archivedProducts: number;
    totalInventoryValue: number;
  } | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | ProductStatus>("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>("create");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(initialFormState);
  const [canBulkImport, setCanBulkImport] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadWorkspace = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [productPage, lowStock, reorderNeeded, statsResponse] = await Promise.all([
        listProducts(businessId, {
          page,
          size: 12,
          search: search || undefined,
          status: status || undefined,
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
      setError(loadError instanceof Error ? loadError.message : "পণ্য তথ্য লোড করা যায়নি।");
    } finally {
      setIsLoading(false);
    }
  }, [businessId, page, search, status]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    let cancelled = false;
    const loadImportPermission = async () => {
      try {
        const [subscription, plans] = await Promise.all([
          getCurrentSubscription(),
          getAvailablePlans(),
        ]);
        if (cancelled) {
          return;
        }
        const plan = plans.find((item) => item.id === subscription.planId);
        const planName = plan?.name?.toUpperCase() ?? "";
        setCanBulkImport(["PRO", "PLUS", "ENTERPRISE"].includes(planName));
      } catch {
        if (!cancelled) {
          setCanBulkImport(false);
        }
      }
    };
    void loadImportPermission();
    return () => {
      cancelled = true;
    };
  }, []);

  const topLowStock = useMemo(() => lowStockProducts.slice(0, 3), [lowStockProducts]);

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

  function updateForm<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
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
        setNotice("পণ্যের তথ্য আপডেট হয়েছে।");
      } else {
        await createProduct(businessId, toCreatePayload(form));
        setNotice("নতুন পণ্য যোগ করা হয়েছে।");
      }

      resetEditor();
      await loadWorkspace();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "পণ্য সংরক্ষণ করা যায়নি।");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleArchive(product: Product) {
    const confirmed = window.confirm(`"${product.name}" আর্কাইভ করতে চান?`);
    if (!confirmed) {
      return;
    }

    try {
      await archiveProduct(businessId, product.id);
      if (editingProduct?.id === product.id) {
        resetEditor();
      }
      setNotice("পণ্য আর্কাইভ করা হয়েছে।");
      await loadWorkspace();
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : "পণ্য আর্কাইভ করা যায়নি।");
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
      setError(downloadError instanceof Error ? downloadError.message : "টেমপ্লেট ডাউনলোড করা যায়নি।");
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
      setError(downloadError instanceof Error ? downloadError.message : "CSV এক্সপোর্ট করা যায়নি।");
    }
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    if (!canBulkImport) {
      setError("CSV ইমপোর্ট Pro/Plus প্ল্যানে পাওয়া যায়।");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsImporting(true);
    setError(null);
    setNotice(null);

    try {
      const result = await importProductsCsv(businessId, file);
      setNotice(
        `ইমপোর্ট শেষ। সফল ${result.successCount}, ব্যর্থ ${result.errorCount}, মোট ${result.totalRows} লাইন।`,
      );
      await loadWorkspace();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "CSV ইমপোর্ট করা যায়নি।");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-secondary">
            স্টক ম্যানেজমেন্ট
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-primary">
            পণ্য ইনভেন্টরি
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-on-surface-variant">
            {activeBusiness?.name ?? "এই ব্যবসা"}-র পণ্য, দাম, স্টক অ্যালার্ট এবং দ্রুত এন্ট্রি এক জায়গা থেকে চালান।
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!canBulkImport}
            className="rounded-full bg-surface-container px-5 py-3 text-sm font-semibold text-on-surface transition hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isImporting ? "ইমপোর্ট হচ্ছে..." : "CSV ইমপোর্ট"}
          </button>
          <button
            type="button"
            onClick={handleTemplateDownload}
            className="rounded-full bg-surface-container-lowest px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary-fixed"
          >
            টেমপ্লেট ডাউনলোড
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="rounded-full bg-surface-container-lowest px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary-fixed"
          >
            CSV এক্সপোর্ট
          </button>
          <button
            type="button"
            onClick={resetEditor}
            className="rounded-full bg-gradient-to-br from-primary to-primary-container px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(0,55,39,0.18)] transition hover:opacity-95"
          >
            নতুন পণ্য যোগ করুন
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        disabled={!canBulkImport}
        onChange={handleImport}
      />

      {!canBulkImport ? (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          CSV bulk import ফিচারটি আপনার বর্তমান প্ল্যানে লক আছে। Pro বা তার উপরের প্ল্যানে আপগ্রেড করুন।
        </div>
      ) : null}

      <div className="rounded-[28px] bg-gradient-to-r from-primary to-primary-container p-1">
        <div className="flex flex-col gap-3 rounded-[24px] bg-primary px-4 py-4 text-white md:flex-row md:items-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <span className="material-symbols-outlined">mic</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">দ্রুত কমান্ড</p>
            <p className="text-sm text-white/75">
              উদাহরণ: &quot;মিনিকেট চাল ২৫ কেজি যোগ করো&quot; অথবা &quot;লো স্টক পণ্য দেখাও&quot;
            </p>
          </div>
          <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium">
            ভয়েস ও NLP product flow next step
          </div>
        </div>
      </div>

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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_380px]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-[24px] bg-surface-container-lowest p-6">
              <p className="text-sm font-medium text-on-surface-variant">মোট পণ্য</p>
              <div className="mt-4 flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-black text-on-surface">
                    {formatQty(stats?.totalProducts)}
                  </h2>
                  <p className="mt-2 text-xs font-semibold text-primary">
                    সক্রিয় {formatQty(stats?.activeProducts)}
                  </p>
                </div>
                <div className="rounded-2xl bg-surface-container p-3 text-primary">
                  <span className="material-symbols-outlined">inventory_2</span>
                </div>
              </div>
            </article>

            <article className="rounded-[24px] bg-surface-container-lowest p-6">
              <p className="text-sm font-medium text-on-surface-variant">মোট ইনভেন্টরি ভ্যালু</p>
              <div className="mt-4 flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-black text-on-surface">
                    ৳{formatMoney(stats?.totalInventoryValue)}
                  </h2>
                  <p className="mt-2 text-xs font-semibold text-secondary">
                    ক্রয়মূল্য ভিত্তিক হিসাব
                  </p>
                </div>
                <div className="rounded-2xl bg-surface-container p-3 text-secondary">
                  <span className="material-symbols-outlined">account_balance_wallet</span>
                </div>
              </div>
            </article>

            <article className="rounded-[24px] bg-surface-container-lowest p-6">
              <p className="text-sm font-medium text-on-surface-variant">স্টক অ্যালার্ট</p>
              <div className="mt-4 flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-black text-on-surface">
                    {formatQty(stats?.lowStockCount)}
                  </h2>
                  <p className="mt-2 text-xs font-semibold text-rose-600">
                    স্টক আউট {formatQty(stats?.outOfStockCount)}
                  </p>
                </div>
                <div className="rounded-2xl bg-rose-50 p-3 text-rose-600">
                  <span className="material-symbols-outlined">warning</span>
                </div>
              </div>
            </article>
          </div>

          <div className="rounded-[28px] bg-[rgba(225,227,223,0.6)] p-6 backdrop-blur-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-primary">স্টক ইনসাইট</p>
                <h3 className="mt-1 text-xl font-bold text-primary">
                  লো স্টক আর ইনভেন্টরি চাপ এক নজরে
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-on-surface-variant">
                  যেসব পণ্যের reorder point বা business threshold hit করেছে, সেগুলো এখানে আগে দেখানো হচ্ছে।
                </p>
              </div>
              <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary">
                মোট অ্যালার্ট {formatQty(lowStockProducts.length)}
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {topLowStock.length > 0 ? (
                topLowStock.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleEdit(product)}
                    className="rounded-[22px] bg-white px-4 py-4 text-left transition hover:bg-primary-fixed"
                  >
                    <p className="text-sm font-semibold text-on-surface">{product.name}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      SKU {product.sku} • স্টক {formatQty(product.stockQty)} {product.unit}
                    </p>
                    <p className="mt-3 text-xs font-semibold text-rose-600">
                      থ্রেশহোল্ড {formatQty(product.reorderPoint)}
                    </p>
                  </button>
                ))
              ) : (
                <div className="rounded-[22px] bg-white px-4 py-4 text-sm text-on-surface-variant md:col-span-3">
                  এই মুহূর্তে কোনো low-stock item নেই।
                </div>
              )}
            </div>
          </div>

          <section className="overflow-hidden rounded-[28px] bg-surface-container-lowest">
            <div className="flex flex-col gap-4 bg-surface-container-low px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-xl font-bold text-primary">পণ্য তালিকা</h3>
                <p className="mt-1 text-sm text-on-surface-variant">
                  ব্যবসার live catalog, stock position আর selling margin এখান থেকে দেখুন।
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="flex min-w-[220px] items-center gap-3 rounded-full bg-surface px-4 py-3 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-base">search</span>
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    className="w-full bg-transparent text-on-surface outline-none placeholder:text-on-surface-variant"
                    placeholder="নাম বা SKU দিয়ে খুঁজুন"
                  />
                </label>

                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value as "" | ProductStatus);
                    setPage(0);
                  }}
                  className="rounded-full bg-surface px-4 py-3 text-sm font-medium text-on-surface outline-none"
                >
                  <option value="">সব অবস্থা</option>
                  <option value="ACTIVE">পর্যাপ্ত</option>
                  <option value="LOW_STOCK">অল্প স্টক</option>
                  <option value="OUT_OF_STOCK">স্টক আউট</option>
                  <option value="ARCHIVED">আর্কাইভড</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-surface-container-low text-sm font-bold text-on-surface-variant">
                  <tr>
                    <th className="px-6 py-4">পণ্য</th>
                    <th className="px-6 py-4">স্টক</th>
                    <th className="px-6 py-4 text-right">ক্রয় মূল্য</th>
                    <th className="px-6 py-4 text-right">বিক্রয় মূল্য</th>
                    <th className="px-6 py-4 text-right">মার্জিন</th>
                    <th className="px-6 py-4">অবস্থা</th>
                    <th className="px-6 py-4 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-14 text-center text-sm text-on-surface-variant">
                        পণ্য তালিকা লোড হচ্ছে...
                      </td>
                    </tr>
                  ) : products.length > 0 ? (
                    products.map((product) => {
                      const margin = product.sellPrice - product.costPrice;
                      return (
                        <tr key={product.id} className="border-t border-surface-container hover:bg-surface-container-low">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-container text-primary">
                                <span className="material-symbols-outlined">inventory</span>
                              </div>
                              <div>
                                <p className="font-semibold text-on-surface">{product.name}</p>
                                <p className="text-xs text-on-surface-variant">
                                  SKU {product.sku}{product.barcode ? ` • Barcode ${product.barcode}` : ""}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 font-semibold text-on-surface">
                            {formatQty(product.stockQty)} {product.unit}
                          </td>
                          <td className="px-6 py-5 text-right font-semibold text-on-surface">
                            ৳{formatMoney(product.costPrice)}
                          </td>
                          <td className="px-6 py-5 text-right font-semibold text-primary">
                            ৳{formatMoney(product.sellPrice)}
                          </td>
                          <td className="px-6 py-5 text-right font-semibold text-on-surface">
                            ৳{formatMoney(margin)}
                          </td>
                          <td className="px-6 py-5">
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${mapStatusClasses(product.status)}`}>
                              {mapStatusLabel(product.status)}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(product)}
                                className="rounded-full bg-surface-container px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary-fixed"
                              >
                                এডিট
                              </button>
                              {product.status !== "ARCHIVED" ? (
                                <button
                                  type="button"
                                  onClick={() => handleArchive(product)}
                                  className="rounded-full bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                                >
                                  আর্কাইভ
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-14 text-center text-sm text-on-surface-variant">
                        কোনো পণ্য পাওয়া যায়নি।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 bg-surface-container-lowest px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-on-surface-variant">
                মোট {formatQty(totalElements)} পণ্যের মধ্যে এই পাতায় {formatQty(products.length)}টি দেখানো হচ্ছে।
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(current - 1, 0))}
                  disabled={page === 0}
                  className="rounded-full bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface disabled:cursor-not-allowed disabled:opacity-40"
                >
                  আগের
                </button>
                <span className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white">
                  {formatQty(page + 1)} / {formatQty(totalPages)}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(current + 1, totalPages - 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded-full bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface disabled:cursor-not-allowed disabled:opacity-40"
                >
                  পরের
                </button>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[28px] bg-surface-container p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-secondary">
                  {editorMode === "edit" ? "পণ্য সম্পাদনা" : "দ্রুত এন্ট্রি"}
                </p>
                <h3 className="mt-1 text-2xl font-bold text-primary">
                  {editorMode === "edit" ? editingProduct?.name ?? "পণ্য" : "নতুন পণ্য যোগ করুন"}
                </h3>
              </div>
              {editorMode === "edit" ? (
                <button
                  type="button"
                  onClick={resetEditor}
                  className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-primary"
                >
                  নতুন ফর্ম
                </button>
              ) : null}
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-on-surface">পণ্যের নাম</span>
                <input
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  required
                  className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none"
                  placeholder="যেমন মিনিকেট চাল"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-on-surface">SKU</span>
                  <input
                    value={form.sku}
                    onChange={(event) => updateForm("sku", event.target.value)}
                    disabled={editorMode === "edit"}
                    className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none disabled:opacity-60"
                    placeholder="ফাঁকা রাখলে auto হবে"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-on-surface">বারকোড</span>
                  <input
                    value={form.barcode}
                    onChange={(event) => updateForm("barcode", event.target.value)}
                    disabled={editorMode === "edit"}
                    className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none disabled:opacity-60"
                    placeholder="ঐচ্ছিক"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-on-surface">সংক্ষিপ্ত বিবরণ</span>
                <textarea
                  value={form.description}
                  onChange={(event) => updateForm("description", event.target.value)}
                  rows={3}
                  className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none"
                  placeholder="পণ্যের ছোট নোট বা বৈশিষ্ট্য"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-on-surface">ইউনিট</span>
                  <input
                    value={form.unit}
                    onChange={(event) => updateForm("unit", event.target.value)}
                    required
                    className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none"
                    placeholder="kg / piece / box"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-on-surface">শুরুর স্টক</span>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={form.stockQty}
                    onChange={(event) => updateForm("stockQty", event.target.value)}
                    disabled={editorMode === "edit"}
                    className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none disabled:opacity-60"
                    placeholder="0"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-on-surface">ক্রয় মূল্য</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.costPrice}
                    onChange={(event) => updateForm("costPrice", event.target.value)}
                    required
                    className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none"
                    placeholder="80"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-on-surface">বিক্রয় মূল্য</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.sellPrice}
                    onChange={(event) => updateForm("sellPrice", event.target.value)}
                    required
                    className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none"
                    placeholder="95"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-on-surface">রিঅর্ডার পয়েন্ট</span>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.reorderPoint}
                  onChange={(event) => updateForm("reorderPoint", event.target.value)}
                  className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none"
                  placeholder="20"
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full bg-gradient-to-br from-primary to-primary-container px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "সংরক্ষণ হচ্ছে..."
                  : editorMode === "edit"
                    ? "পরিবর্তন সংরক্ষণ"
                    : "পণ্য তৈরি করুন"}
              </button>
            </form>
          </section>

          <section className="rounded-[28px] bg-surface-container-low p-6">
            <p className="text-sm font-semibold text-secondary">ইনভেন্টরি অবস্থা</p>
            <div className="mt-5 space-y-3">
              <div className="rounded-[20px] bg-white px-4 py-4">
                <p className="text-sm font-medium text-on-surface-variant">সক্রিয় পণ্য</p>
                <p className="mt-2 text-2xl font-black text-on-surface">
                  {formatQty(stats?.activeProducts)}
                </p>
              </div>
              <div className="rounded-[20px] bg-white px-4 py-4">
                <p className="text-sm font-medium text-on-surface-variant">আর্কাইভড</p>
                <p className="mt-2 text-2xl font-black text-on-surface">
                  {formatQty(stats?.archivedProducts)}
                </p>
              </div>
              <div className="rounded-[20px] bg-white px-4 py-4">
                <p className="text-sm font-medium text-on-surface-variant">Low-stock rule</p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  Product reorder point আর business threshold দুইটাই এখন alert logic-e ধরা হচ্ছে।
                </p>
              </div>
              <div className="rounded-[20px] bg-white px-4 py-4">
                <p className="text-sm font-medium text-on-surface-variant">রিঅর্ডার প্রয়োজন</p>
                <p className="mt-2 text-2xl font-black text-on-surface">
                  {formatQty(reorderProducts.length)}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
