"use client";

import { useLocale, useTranslations } from "next-intl";
import type { FormEvent } from "react";
import type {
    Expense,
    ExpenseCategoryResponse,
    ExpenseCreateRequest,
    ExpenseUpdateRequest,
    MonthlyExpenseSummary,
} from "@/types/expense";
import {
    createExpense,
    deleteExpense,
    getExpenseCategories,
    getMonthlySummary,
    listExpenses,
    updateExpense,
} from "@/lib/expenseApi";
import { useCallback, useEffect, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

interface FormState {
    category: string;
    customCategoryName: string;
    amount: string;
    description: string;
    expenseDate: string;
    paymentMethod: string;
}

const initialFormState: FormState = {
    category: "",
    customCategoryName: "",
    amount: "",
    description: "",
    expenseDate: new Date().toISOString().slice(0, 10),
    paymentMethod: "CASH",
};

function toFormState(expense: Expense): FormState {
    return {
        category: expense.category,
        customCategoryName: expense.customCategoryName ?? "",
        amount: expense.amount.toString(),
        description: expense.description ?? "",
        expenseDate: expense.expenseDate?.slice(0, 10) ?? "",
        paymentMethod: expense.paymentMethod ?? "CASH",
    };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ExpenseWorkspace({
    businessId,
}: {
    businessId: string;
}) {
    const t = useTranslations("shop.expenses");
    const locale = useLocale();
    const loc = resolveLocale(locale);
    const isBn = locale.toLowerCase().startsWith("bn");

    const currencyFormatter = new Intl.NumberFormat(loc, { maximumFractionDigits: 0 });
    const qtyFormatter = new Intl.NumberFormat(loc, { maximumFractionDigits: 0 });

    function formatMoney(value: number | null | undefined): string {
        return currencyFormatter.format(value ?? 0);
    }
    function formatQty(value: number | null | undefined): string {
        return qtyFormatter.format(value ?? 0);
    }

    // Data
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<ExpenseCategoryResponse[]>([]);
    const [summary, setSummary] = useState<MonthlyExpenseSummary | null>(null);

    // UI
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    // Editor
    const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [form, setForm] = useState<FormState>(initialFormState);

    // Load categories
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const cats = await getExpenseCategories(businessId);
                if (!cancelled) setCategories(cats);
            } catch { /* optional */ }
        };
        void load();
        return () => { cancelled = true; };
    }, [businessId]);

    // Load summary
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const now = new Date();
                const s = await getMonthlySummary(businessId, now.getFullYear(), now.getMonth() + 1);
                if (!cancelled) setSummary(s);
            } catch { /* optional */ }
        };
        void load();
        return () => { cancelled = true; };
    }, [businessId]);

    // Load expenses
    const loadExpenses = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await listExpenses(businessId, {
                page,
                size: 12,
                category: filterCategory || undefined,
            });
            setExpenses(response.content);
            setTotalPages(Math.max(response.totalPages, 1));
            setTotalElements(response.totalElements);
        } catch {
            setError(t("messages.loadError"));
        } finally {
            setIsLoading(false);
        }
    }, [businessId, page, filterCategory, t]);

    useEffect(() => {
        void loadExpenses();
    }, [loadExpenses]);

    // Category name helper
    function getCategoryName(cat: string): string {
        const key = `categories.${cat}` as Parameters<typeof t>[0];
        try {
            return t(key);
        } catch {
            return cat;
        }
    }

    // Form helpers
    function resetEditor() {
        setEditorMode("create");
        setEditingExpense(null);
        setForm(initialFormState);
    }

    function handleEdit(expense: Expense) {
        setEditorMode("edit");
        setEditingExpense(expense);
        setForm(toFormState(expense));
        setNotice(null);
    }

    function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((current) => ({ ...current, [key]: value }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setNotice(null);

        try {
            if (editorMode === "edit" && editingExpense) {
                const payload: ExpenseUpdateRequest = {
                    category: form.category,
                    customCategoryName: form.category === "CUSTOM" ? form.customCategoryName : undefined,
                    amount: Number(form.amount),
                    description: form.description || undefined,
                    expenseDate: form.expenseDate || undefined,
                    paymentMethod: form.paymentMethod || undefined,
                };
                await updateExpense(businessId, editingExpense.id, payload);
                setNotice(t("messages.updated"));
            } else {
                const payload: ExpenseCreateRequest = {
                    category: form.category,
                    customCategoryName: form.category === "CUSTOM" ? form.customCategoryName : undefined,
                    amount: Number(form.amount),
                    description: form.description || undefined,
                    expenseDate: form.expenseDate || undefined,
                    paymentMethod: form.paymentMethod || undefined,
                    recordedVia: "MANUAL",
                };
                await createExpense(businessId, payload);
                setNotice(t("messages.created"));
            }
            resetEditor();
            await loadExpenses();
            // Refresh summary
            try {
                const now = new Date();
                const s = await getMonthlySummary(businessId, now.getFullYear(), now.getMonth() + 1);
                setSummary(s);
            } catch { /* ignore */ }
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : t("messages.saveError"));
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete(expense: Expense) {
        const confirmed = window.confirm(t("messages.confirmDelete"));
        if (!confirmed) return;

        try {
            await deleteExpense(businessId, expense.id);
            setNotice(t("messages.deleted"));
            await loadExpenses();
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : t("messages.deleteError"));
        }
    }

    // Filter expenses by search
    const filteredExpenses = useMemo(() => {
        if (!searchInput.trim()) return expenses;
        const q = searchInput.toLowerCase();
        return expenses.filter(
            (e) =>
                e.description?.toLowerCase().includes(q) ||
                e.category.toLowerCase().includes(q) ||
                e.customCategoryName?.toLowerCase().includes(q),
        );
    }, [expenses, searchInput]);

    const topCategory = useMemo(() => {
        if (!summary?.categories?.length) return null;
        return summary.categories.reduce((max, c) => (c.totalAmount > max.totalAmount ? c : max), summary.categories[0]);
    }, [summary]);

    return (
        <section className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-on-surface-variant">
                    <span>{t("dashboard")}</span>
                    <span className="text-on-surface-variant/50">/</span>
                    <span className="font-semibold text-on-surface">{t("title")}</span>
                </div>
                <button
                    type="button"
                    onClick={resetEditor}
                    className="rounded-full bg-gradient-to-br from-primary to-primary-container px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(0,55,39,0.18)] transition hover:opacity-95"
                >
                    {t("actions.addNew")}
                </button>
            </div>

            {/* Error / Notice */}
            {error ? (
                <div className="rounded-[24px] bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">{error}</div>
            ) : null}
            {notice ? (
                <div className="rounded-[24px] bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">{notice}</div>
            ) : null}

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <article className="rounded-[24px] bg-surface-container-lowest p-6 shadow-sm">
                    <p className="text-sm font-medium text-on-surface-variant">{t("stats.totalExpenses")}</p>
                    <h2 className="mt-2 text-3xl font-black text-on-surface">৳{formatMoney(summary?.totalExpenses)}</h2>
                    <p className="mt-2 text-xs font-semibold text-secondary">
                        {t("stats.expenseCount", { count: formatQty(summary?.expenseCount) })}
                    </p>
                </article>
                <article className="rounded-[24px] bg-surface-container-lowest p-6 shadow-sm">
                    <p className="text-sm font-medium text-on-surface-variant">{t("breakdown.title")}</p>
                    <div className="mt-4 space-y-2">
                        {summary?.categories?.slice(0, 3).map((cat) => (
                            <div key={cat.category} className="flex items-center justify-between text-sm">
                                <span className="text-on-surface-variant">{cat.categoryName}</span>
                                <span className="font-semibold text-on-surface">৳{formatMoney(cat.totalAmount)}</span>
                            </div>
                        )) ?? <p className="text-sm text-on-surface-variant">—</p>}
                    </div>
                </article>
                <article className="rounded-[24px] bg-surface-container-lowest p-6 shadow-sm">
                    <p className="text-sm font-medium text-on-surface-variant">{t("stats.topCategory")}</p>
                    <h2 className="mt-2 text-2xl font-black text-primary">
                        {topCategory ? topCategory.categoryName : "—"}
                    </h2>
                    <p className="mt-2 text-xs font-semibold text-secondary">
                        {topCategory ? `৳${formatMoney(topCategory.totalAmount)}` : ""}
                    </p>
                </article>
            </div>

            {/* Main grid */}
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_380px]">
                <div className="space-y-6">
                    {/* Table */}
                    <section className="overflow-hidden rounded-[28px] bg-surface-container-lowest shadow-sm">
                        {/* Table header */}
                        <div className="flex flex-col gap-4 bg-surface-container-low/50 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-primary">{t("table.title")}</h3>
                                <p className="mt-1 text-sm text-on-surface-variant">{t("table.subtitle")}</p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <label className="flex min-w-[200px] items-center gap-3 rounded-full bg-surface px-4 py-3 text-sm text-on-surface-variant">
                                    <span className="material-symbols-outlined text-base">search</span>
                                    <input
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        className="w-full bg-transparent text-on-surface outline-none placeholder:text-on-surface-variant"
                                        placeholder={t("filter.search")}
                                    />
                                </label>
                                <select
                                    value={filterCategory}
                                    onChange={(e) => { setFilterCategory(e.target.value); setPage(0); }}
                                    className="rounded-full bg-surface px-4 py-3 text-sm font-medium text-on-surface outline-none"
                                >
                                    <option value="">{t("filter.all")}</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.name}>{cat.displayName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Table body */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left">
                                <thead className="bg-surface-container-low text-sm font-bold text-on-surface-variant">
                                    <tr>
                                        <th className="px-6 py-4">{t("table.description")}</th>
                                        <th className="px-6 py-4">{t("table.category")}</th>
                                        <th className="px-6 py-4 text-right">{t("table.amount")}</th>
                                        <th className="px-6 py-4">{t("table.date")}</th>
                                        <th className="px-6 py-4 text-right">{t("table.action")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-container">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-14 text-center text-sm text-on-surface-variant">
                                                {t("table.loading")}
                                            </td>
                                        </tr>
                                    ) : filteredExpenses.length > 0 ? (
                                        filteredExpenses.map((expense) => (
                                            <tr key={expense.id} className="transition-colors hover:bg-surface-container-lowest">
                                                <td className="px-6 py-5">
                                                    <p className="font-semibold text-on-surface">
                                                        {expense.description || expense.customCategoryName || expense.category}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold text-on-surface-variant">
                                                        {expense.category === "CUSTOM" && expense.customCategoryName
                                                            ? expense.customCategoryName
                                                            : getCategoryName(expense.category)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right font-bold text-on-surface">
                                                    ৳{formatMoney(expense.amount)}
                                                </td>
                                                <td className="px-6 py-5 text-sm text-on-surface-variant">
                                                    {expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString(isBn ? "bn-BD" : "en-US") : "—"}
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEdit(expense)}
                                                            className="rounded-full bg-surface-container px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary-fixed"
                                                        >
                                                            {t("actions.edit")}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(expense)}
                                                            className="rounded-full bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                                                        >
                                                            {t("actions.delete")}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-14 text-center text-sm text-on-surface-variant">
                                                {t("table.empty")}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex flex-col gap-4 border-t border-surface-container bg-surface-container-lowest px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-on-surface-variant">
                                {t("table.showing", { shown: formatQty(filteredExpenses.length), total: formatQty(totalElements) })}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage((c) => Math.max(c - 1, 0))}
                                    disabled={page === 0}
                                    className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant text-on-surface transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <span className="material-symbols-outlined">chevron_left</span>
                                </button>
                                <span className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white">
                                    {formatQty(page + 1)} / {formatQty(totalPages)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setPage((c) => Math.min(c + 1, totalPages - 1))}
                                    disabled={page >= totalPages - 1}
                                    className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant text-on-surface transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <span className="material-symbols-outlined">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Sidebar: Form */}
                <aside className="space-y-6">
                    <section className="rounded-[28px] bg-surface-container p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-secondary">
                                    {editorMode === "edit" ? t("form.editTitle") : t("form.createTitle")}
                                </p>
                            </div>
                            {editorMode === "edit" ? (
                                <button type="button" onClick={resetEditor} className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-primary">
                                    {t("form.newForm")}
                                </button>
                            ) : null}
                        </div>

                        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                            {/* Category */}
                            <label className="block">
                                <span className="mb-2 block text-sm font-medium text-on-surface">{t("form.category")}</span>
                                <select
                                    value={form.category}
                                    onChange={(e) => updateForm("category", e.target.value)}
                                    required
                                    className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none"
                                >
                                    <option value="">{t("form.categoryPlaceholder")}</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.name}>{cat.displayName}</option>
                                    ))}
                                </select>
                            </label>

                            {/* Custom category name */}
                            {form.category === "CUSTOM" ? (
                                <label className="block">
                                    <span className="mb-2 block text-sm font-medium text-on-surface">{t("form.customCategory")}</span>
                                    <input
                                        value={form.customCategoryName}
                                        onChange={(e) => updateForm("customCategoryName", e.target.value)}
                                        className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none"
                                        placeholder={t("form.customCategoryPlaceholder")}
                                    />
                                </label>
                            ) : null}

                            {/* Amount */}
                            <label className="block">
                                <span className="mb-2 block text-sm font-medium text-on-surface">{t("form.amount")}</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.amount}
                                    onChange={(e) => updateForm("amount", e.target.value)}
                                    required
                                    className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none"
                                    placeholder={t("form.amountPlaceholder")}
                                />
                            </label>

                            {/* Description */}
                            <label className="block">
                                <span className="mb-2 block text-sm font-medium text-on-surface">{t("form.description")}</span>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => updateForm("description", e.target.value)}
                                    rows={3}
                                    className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none"
                                    placeholder={t("form.descriptionPlaceholder")}
                                />
                            </label>

                            {/* Date + Payment Method */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block">
                                    <span className="mb-2 block text-sm font-medium text-on-surface">{t("form.date")}</span>
                                    <input
                                        type="date"
                                        value={form.expenseDate}
                                        onChange={(e) => updateForm("expenseDate", e.target.value)}
                                        className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none"
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-2 block text-sm font-medium text-on-surface">{t("form.paymentMethod")}</span>
                                    <select
                                        value={form.paymentMethod}
                                        onChange={(e) => updateForm("paymentMethod", e.target.value)}
                                        className="w-full rounded-[20px] bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none"
                                    >
                                        <option value="CASH">Cash</option>
                                        <option value="BKASH">bKash</option>
                                        <option value="NAGAD">Nagad</option>
                                        <option value="BANK">Bank</option>
                                    </select>
                                </label>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full rounded-full bg-gradient-to-br from-primary to-primary-container px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSubmitting
                                    ? t("form.submit.saving")
                                    : editorMode === "edit"
                                        ? t("form.submit.edit")
                                        : t("form.submit.create")}
                            </button>
                        </form>
                    </section>
                </aside>
            </div>
        </section>
    );
}
