"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
    listVendors,
    createVendor,
    updateVendor,
    toggleVendorActive,
} from "@/lib/vendorApi";
import type { Vendor, VendorRequest } from "@/types/vendor";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface VendorWorkspaceProps {
    businessId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function bn(text: string, locale: string): string {
    return locale === "bn" ? text : undefined as unknown as string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function VendorWorkspace({ businessId }: VendorWorkspaceProps) {
    const t = useTranslations("vendor");
    const locale = useLocale();
    const isBn = locale === "bn";

    // ---- state ----
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // form overlay
    const [showForm, setShowForm] = useState(false);
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
    const [form, setForm] = useState<VendorRequest>({ name: "", phone: "", address: "", notes: "", isActive: true });
    const [submitting, setSubmitting] = useState(false);

    // ---- fetch ----
    const fetchVendors = useCallback(async () => {
        try {
            setLoading(true);
            const data = await listVendors(businessId);
            setVendors(Array.isArray(data) ? data : []);
        } catch {
            /* toast later */
        } finally {
            setLoading(false);
        }
    }, [businessId]);

    useEffect(() => {
        fetchVendors();
    }, [fetchVendors]);

    // ---- SSE auto-refresh ----
    useEffect(() => {
        const handler = () => fetchVendors();
        window.addEventListener("sse:vendor-changed", handler);
        return () => window.removeEventListener("sse:vendor-changed", handler);
    }, [fetchVendors]);

    // ---- filtered ----
    const filtered = vendors.filter((v) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            v.name.toLowerCase().includes(q) ||
            (v.phone && v.phone.toLowerCase().includes(q)) ||
            (v.address && v.address.toLowerCase().includes(q))
        );
    });

    // ---- handlers ----
    function openAdd() {
        setEditingVendor(null);
        setForm({ name: "", phone: "", address: "", notes: "", isActive: true });
        setShowForm(true);
    }

    function openEdit(v: Vendor) {
        setEditingVendor(v);
        setForm({ name: v.name, phone: v.phone ?? "", address: v.address ?? "", notes: v.notes ?? "", isActive: v.isActive });
        setShowForm(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            setSubmitting(true);
            if (editingVendor) {
                await updateVendor(businessId, editingVendor.id, form);
            } else {
                await createVendor(businessId, form);
            }
            setShowForm(false);
            await fetchVendors();
        } catch {
            /* toast later */
        } finally {
            setSubmitting(false);
        }
    }

    async function handleToggle(v: Vendor) {
        try {
            await toggleVendorActive(businessId, v.id);
            await fetchVendors();
        } catch {
            /* toast later */
        }
    }

    // ---- render ----
    return (
        <div className="space-y-4 p-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {isBn ? "ভেন্ডর ম্যানেজমেন্ট" : t("title")}
                </h1>
                <button
                    onClick={openAdd}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    {isBn ? "ভেন্ডর যোগ করুন" : t("addVendor")}
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
                    search
                </span>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={isBn ? "ভেন্ডর খুঁজুন..." : t("searchPlaceholder")}
                    className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
            </div>

            {/* Vendor List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center dark:border-gray-600">
                    <span className="material-symbols-outlined text-[48px] text-gray-300 dark:text-gray-600">
                        local_shipping
                    </span>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {search
                            ? isBn ? "কোনো ভেন্ডর পাওয়া যায়নি" : t("noResults")
                            : isBn ? "কোনো ভেন্ডর যোগ করা হয়নি" : t("emptyState")}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((v) => (
                        <div
                            key={v.id}
                            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                        >
                            {/* Info */}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 dark:text-white truncate">
                                        {v.name}
                                    </span>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${v.isActive
                                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                            : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                                            }`}
                                    >
                                        {v.isActive
                                            ? isBn ? "সক্রিয়" : t("active")
                                            : isBn ? "নিষ্ক্রিয়" : t("inactive")}
                                    </span>
                                </div>
                                {(v.phone || v.address) && (
                                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {[v.phone, v.address].filter(Boolean).join(" · ")}
                                    </p>
                                )}
                                {v.notes && (
                                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 truncate">
                                        {v.notes}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 ml-3 shrink-0">
                                <button
                                    onClick={() => handleToggle(v)}
                                    title={v.isActive ? (isBn ? "নিষ্ক্রিয় করুন" : t("deactivate")) : (isBn ? "সক্রিয় করুন" : t("activate"))}
                                    className={`rounded-lg p-2 text-sm transition-colors ${v.isActive
                                        ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                        : "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {v.isActive ? "toggle_on" : "toggle_off"}
                                    </span>
                                </button>
                                <button
                                    onClick={() => openEdit(v)}
                                    title={isBn ? "সম্পাদনা" : t("edit")}
                                    className="rounded-lg p-2 text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ---- Add / Edit Overlay ---- */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {editingVendor
                                ? isBn ? "ভেন্ডর সম্পাদনা" : t("editVendor")
                                : isBn ? "নতুন ভেন্ডর" : t("addVendor")}
                        </h2>

                        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                            {/* Name */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    {isBn ? "নাম *" : t("nameLabel")}
                                </label>
                                <input
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                    placeholder={isBn ? "ভেন্ডরের নাম" : t("namePlaceholder")}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    {isBn ? "ফোন" : t("phoneLabel")}
                                </label>
                                <input
                                    value={form.phone ?? ""}
                                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                                    placeholder={isBn ? "০১৭XXXXXXXX" : t("phonePlaceholder")}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            {/* Address */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    {isBn ? "ঠিকানা" : t("addressLabel")}
                                </label>
                                <input
                                    value={form.address ?? ""}
                                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                                    placeholder={isBn ? "ঠিকানা" : t("addressPlaceholder")}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    {isBn ? "নোট" : t("notesLabel")}
                                </label>
                                <textarea
                                    value={form.notes ?? ""}
                                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                                    placeholder={isBn ? "অতিরিক্ত তথ্য" : t("notesPlaceholder")}
                                    rows={2}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
                                />
                            </div>

                            {/* Active toggle */}
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={form.isActive}
                                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                {isBn ? "সক্রিয়" : t("active")}
                            </label>

                            {/* Buttons */}
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    {isBn ? "বাতিল" : t("cancel")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                >
                                    {submitting
                                        ? (isBn ? "সংরক্ষণ হচ্ছে..." : t("saving"))
                                        : (isBn ? "সংরক্ষণ" : t("save"))}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}