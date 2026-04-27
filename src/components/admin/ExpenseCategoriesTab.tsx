"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import * as adminApi from "@/lib/adminApi";
import type { AdminExpenseCategory } from "@/lib/adminApi";

export default function ExpenseCategoriesTab() {
    const t = useTranslations("admin");
    const { userRole } = useAuthStore();
    const isSuperAdmin = userRole === "SUPER_ADMIN";

    const [categories, setCategories] = useState<AdminExpenseCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [scopeFilter, setScopeFilter] = useState<string>("");
    const [activeFilter, setActiveFilter] = useState<string>("");

    // Create/edit modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editCat, setEditCat] = useState<AdminExpenseCategory | null>(null);
    const [formName, setFormName] = useState("");
    const [formNameBn, setFormNameBn] = useState("");
    const [formIcon, setFormIcon] = useState("");
    const [formColor, setFormColor] = useState("");
    const [formSortOrder, setFormSortOrder] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadCategories = useCallback(async () => {
        setLoading(true);
        try {
            const params: Parameters<typeof adminApi.listAdminExpenseCategories>[0] = {};
            if (scopeFilter) params.scope = scopeFilter;
            if (activeFilter === "true") params.active = true;
            else if (activeFilter === "false") params.active = false;
            if (search.trim()) params.search = search.trim();
            const result = await adminApi.listAdminExpenseCategories(params);
            setCategories(result);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [scopeFilter, activeFilter, search]);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    function openCreate() {
        setEditCat(null);
        setFormName("");
        setFormNameBn("");
        setFormIcon("");
        setFormColor("");
        setFormSortOrder("");
        setError(null);
        setModalOpen(true);
    }

    function openEdit(cat: AdminExpenseCategory) {
        setEditCat(cat);
        setFormName(cat.name);
        setFormNameBn(cat.nameBn || "");
        setFormIcon(cat.icon || "");
        setFormColor(cat.color || "");
        setFormSortOrder(String(cat.sortOrder));
        setError(null);
        setModalOpen(true);
    }

    async function handleSave() {
        if (!formName.trim()) return;
        setSaving(true);
        setError(null);
        try {
            if (editCat) {
                await adminApi.updateAdminExpenseCategory(editCat.id, {
                    name: formName.trim(),
                    nameBn: formNameBn.trim() || undefined,
                    icon: formIcon.trim() || undefined,
                    color: formColor.trim() || undefined,
                    sortOrder: formSortOrder ? parseInt(formSortOrder) : undefined,
                });
            } else {
                await adminApi.createAdminExpenseCategory({
                    name: formName.trim(),
                    nameBn: formNameBn.trim() || undefined,
                    icon: formIcon.trim() || undefined,
                    color: formColor.trim() || undefined,
                    sortOrder: formSortOrder ? parseInt(formSortOrder) : undefined,
                });
            }
            setModalOpen(false);
            loadCategories();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    }

    async function handleToggle(cat: AdminExpenseCategory) {
        try {
            await adminApi.toggleAdminExpenseCategory(cat.id);
            loadCategories();
        } catch {
            // silent
        }
    }

    async function handleDelete(cat: AdminExpenseCategory) {
        if (!confirm(`Delete "${cat.displayName}"? This cannot be undone.`)) return;
        try {
            await adminApi.deleteAdminExpenseCategory(cat.id);
            loadCategories();
        } catch {
            // silent
        }
    }

    return (
        <div className="space-y-6">
            {/* Header + Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search categories..."
                        className="rounded-xl bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary w-64"
                    />
                    <select
                        value={scopeFilter}
                        onChange={(e) => setScopeFilter(e.target.value)}
                        className="rounded-xl bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20"
                    >
                        <option value="">All Scopes</option>
                        <option value="GLOBAL">Global</option>
                        <option value="BUSINESS">Business</option>
                    </select>
                    <select
                        value={activeFilter}
                        onChange={(e) => setActiveFilter(e.target.value)}
                        className="rounded-xl bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20"
                    >
                        <option value="">All Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                </div>
                <button
                    onClick={openCreate}
                    className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary hover:opacity-90 transition-opacity"
                >
                    + Add Category
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-outline-variant/10">
                    <p className="text-xs font-medium text-on-surface-variant">Total</p>
                    <p className="mt-1 text-2xl font-bold text-on-surface">{categories.length}</p>
                </div>
                <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-outline-variant/10">
                    <p className="text-xs font-medium text-on-surface-variant">Active</p>
                    <p className="mt-1 text-2xl font-bold text-green-700">{categories.filter((c) => c.isActive).length}</p>
                </div>
                <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-outline-variant/10">
                    <p className="text-xs font-medium text-on-surface-variant">Inactive</p>
                    <p className="mt-1 text-2xl font-bold text-red-600">{categories.filter((c) => !c.isActive).length}</p>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="bg-surface-container-low text-sm font-bold text-on-surface-variant">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Bengali</th>
                                <th className="px-6 py-4">Scope</th>
                                <th className="px-6 py-4">Icon</th>
                                <th className="px-6 py-4">Sort</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="flex justify-center">
                                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-container-high border-t-primary" />
                                        </div>
                                    </td>
                                </tr>
                            ) : categories.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant">No categories found</td>
                                </tr>
                            ) : (
                                categories.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-surface-container-low transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {cat.color && (
                                                    <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                                )}
                                                <span className="font-medium text-on-surface">{cat.displayName}</span>
                                            </div>
                                            <p className="text-xs text-on-surface-variant">{cat.name}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant">{cat.nameBn || "—"}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cat.scope === "GLOBAL" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                                                {cat.scope}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant">{cat.icon || "—"}</td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant">{cat.sortOrder}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggle(cat)}
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${cat.isActive ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-red-100 text-red-800 hover:bg-red-200"}`}
                                            >
                                                {cat.isActive ? "Active" : "Inactive"}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEdit(cat)}
                                                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                {isSuperAdmin && cat.scope === "GLOBAL" && (
                                                    <button
                                                        onClick={() => handleDelete(cat)}
                                                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-on-surface">
                            {editCat ? "Edit Category" : "Add New Category"}
                        </h3>

                        {error && (
                            <p className="mt-2 text-sm text-red-600">{error}</p>
                        )}

                        <div className="mt-4 space-y-4">
                            <label className="block">
                                <span className="text-sm font-medium text-on-surface-variant">Name (English) *</span>
                                <input
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none"
                                    placeholder="e.g. ELECTRICITY"
                                />
                            </label>
                            <label className="block">
                                <span className="text-sm font-medium text-on-surface-variant">Name (Bengali)</span>
                                <input
                                    value={formNameBn}
                                    onChange={(e) => setFormNameBn(e.target.value)}
                                    className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none"
                                    placeholder="যেমন: বিদ্যুৎ বিল"
                                />
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="text-sm font-medium text-on-surface-variant">Icon</span>
                                    <input
                                        value={formIcon}
                                        onChange={(e) => setFormIcon(e.target.value)}
                                        className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none"
                                        placeholder="bolt"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-sm font-medium text-on-surface-variant">Color</span>
                                    <div className="mt-1 flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={formColor || "#6750A4"}
                                            onChange={(e) => setFormColor(e.target.value)}
                                            className="h-9 w-9 rounded border-0 cursor-pointer"
                                        />
                                        <input
                                            value={formColor}
                                            onChange={(e) => setFormColor(e.target.value)}
                                            className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none"
                                            placeholder="#FF7043"
                                        />
                                    </div>
                                </label>
                            </div>
                            <label className="block">
                                <span className="text-sm font-medium text-on-surface-variant">Sort Order</span>
                                <input
                                    type="number"
                                    value={formSortOrder}
                                    onChange={(e) => setFormSortOrder(e.target.value)}
                                    className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none"
                                    placeholder="100"
                                />
                            </label>
                        </div>

                        <div className="mt-6 flex gap-3 justify-end">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="rounded-xl px-5 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !formName.trim()}
                                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary hover:opacity-90 disabled:opacity-50 transition-opacity"
                            >
                                {saving ? "Saving..." : editCat ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}