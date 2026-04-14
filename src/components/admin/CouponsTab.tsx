"use client";

import { useLocale, useTranslations } from "next-intl";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type {
    Coupon,
    CouponCreateRequest,
    CouponStats,
    CouponType,
    CouponUpdateRequest,
    PagedCoupons,
} from "@/types/coupon";
import {
    activateCoupon,
    createCoupon,
    deactivateCoupon,
    deleteCoupon,
    getCouponStats,
    listCoupons,
    updateCoupon,
} from "@/lib/couponApi";

// ─── Helpers ─────────────────────────────────────────────

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

function formatDate(dateStr: string): string {
    return new Intl.DateTimeFormat(resolveLocale(), {
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(new Date(dateStr));
}

function formatDateTime(dateStr: string): string {
    return new Intl.DateTimeFormat(resolveLocale(), {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(dateStr));
}

function isExpired(coupon: Coupon): boolean {
    return new Date(coupon.validUntil) < new Date();
}

// ─── Form State ──────────────────────────────────────────

interface FormState {
    code: string;
    description: string;
    type: CouponType;
    value: string;
    minPurchaseAmount: string;
    maxDiscountAmount: string;
    usageLimit: string;
    perUserLimit: string;
    firstPurchaseOnly: boolean;
    validFrom: string;
    validUntil: string;
}

const initialFormState: FormState = {
    code: "",
    description: "",
    type: "PERCENTAGE",
    value: "",
    minPurchaseAmount: "",
    maxDiscountAmount: "",
    usageLimit: "100",
    perUserLimit: "1",
    firstPurchaseOnly: false,
    validFrom: new Date().toISOString().slice(0, 16),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
};

function couponToForm(coupon: Coupon): FormState {
    return {
        code: coupon.code,
        description: coupon.description || "",
        type: coupon.type,
        value: String(coupon.value),
        minPurchaseAmount: coupon.minPurchaseAmount ? String(coupon.minPurchaseAmount) : "",
        maxDiscountAmount: coupon.maxDiscountAmount ? String(coupon.maxDiscountAmount) : "",
        usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
        perUserLimit: String(coupon.perUserLimit),
        firstPurchaseOnly: coupon.firstPurchaseOnly,
        validFrom: coupon.validFrom.slice(0, 16),
        validUntil: coupon.validUntil.slice(0, 16),
    };
}

// ─── Icon ────────────────────────────────────────────────

function IconTag({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
    );
}

// ─── Main Component ──────────────────────────────────────

export default function CouponsTab() {
    const t = useTranslations("admin.coupons");
    const locale = useLocale();
    const loc = resolveLocale(locale);

    // Data
    const [coupons, setCoupons] = useState<PagedCoupons | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [typeFilter, setTypeFilter] = useState<CouponType | "">("");
    const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive" | "expired">("");

    // Form
    const [showForm, setShowForm] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [form, setForm] = useState<FormState>(initialFormState);
    const [submitting, setSubmitting] = useState(false);

    // Stats modal
    const [statsCoupon, setStatsCoupon] = useState<CouponStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);

    // Notices
    const [notice, setNotice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // ─── Load Coupons ───────────────────────────────────
    const loadCoupons = useCallback(async () => {
        setLoading(true);
        try {
            const isActive =
                statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined;
            const data = await listCoupons({
                isActive,
                type: typeFilter || undefined,
                page,
                size: 15,
            });
            setCoupons(data);
        } catch {
            setError(t("messages.loadError"));
        } finally {
            setLoading(false);
        }
    }, [page, typeFilter, statusFilter, t]);

    useEffect(() => {
        loadCoupons();
    }, [loadCoupons]);

    useEffect(() => {
        setPage(0);
    }, [typeFilter, statusFilter]);

    // ─── Form Handlers ──────────────────────────────────
    function openCreateForm() {
        setEditingCoupon(null);
        setForm(initialFormState);
        setShowForm(true);
        setError(null);
        setNotice(null);
    }

    function openEditForm(coupon: Coupon) {
        setEditingCoupon(coupon);
        setForm(couponToForm(coupon));
        setShowForm(true);
        setError(null);
        setNotice(null);
    }

    function closeForm() {
        setShowForm(false);
        setEditingCoupon(null);
        setForm(initialFormState);
    }

    function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            if (editingCoupon) {
                const updateReq: CouponUpdateRequest = {
                    description: form.description || undefined,
                    value: Number(form.value),
                    minPurchaseAmount: form.minPurchaseAmount ? Number(form.minPurchaseAmount) : undefined,
                    maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
                    usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
                    validFrom: new Date(form.validFrom).toISOString(),
                    validUntil: new Date(form.validUntil).toISOString(),
                };
                await updateCoupon(editingCoupon.id, updateReq);
                setNotice(t("messages.updated"));
            } else {
                const createReq: CouponCreateRequest = {
                    code: form.code.trim().toUpperCase(),
                    description: form.description || undefined,
                    type: form.type,
                    value: Number(form.value),
                    minPurchaseAmount: form.minPurchaseAmount ? Number(form.minPurchaseAmount) : undefined,
                    maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
                    firstPurchaseOnly: form.firstPurchaseOnly,
                    usageLimit: form.usageLimit ? Number(form.usageLimit) : 100,
                    perUserLimit: Number(form.perUserLimit) || 1,
                    validFrom: new Date(form.validFrom).toISOString(),
                    validUntil: new Date(form.validUntil).toISOString(),
                };
                await createCoupon(createReq);
                setNotice(t("messages.created"));
            }
            closeForm();
            await loadCoupons();
        } catch {
            setError(editingCoupon ? t("messages.updateError") : t("messages.createError"));
        } finally {
            setSubmitting(false);
        }
    }

    // ─── Actions ────────────────────────────────────────
    async function handleToggleActive(coupon: Coupon) {
        try {
            if (coupon.isActive) {
                await deactivateCoupon(coupon.id);
                setNotice(t("messages.deactivated"));
            } else {
                await activateCoupon(coupon.id);
                setNotice(t("messages.activated"));
            }
            await loadCoupons();
        } catch {
            setError(t("messages.loadError"));
        }
    }

    async function handleDelete(coupon: Coupon) {
        if (!window.confirm(t("messages.confirmDelete"))) return;
        try {
            await deleteCoupon(coupon.id);
            setNotice(t("messages.deleted"));
            await loadCoupons();
        } catch {
            setError(t("messages.deleteError"));
        }
    }

    async function handleViewStats(coupon: Coupon) {
        setStatsLoading(true);
        setStatsCoupon(null);
        try {
            const stats = await getCouponStats(coupon.id);
            setStatsCoupon(stats);
        } catch {
            setError(t("messages.loadError"));
        } finally {
            setStatsLoading(false);
        }
    }

    // ─── Computed Stats ─────────────────────────────────
    const totalCoupons = coupons?.totalElements ?? 0;
    const activeCoupons = coupons?.content.filter((c) => c.isActive && !isExpired(c)).length ?? 0;
    const totalRedemptions = coupons?.content.reduce((sum, c) => sum + c.usedCount, 0) ?? 0;

    // ─── Formatters ─────────────────────────────────────
    const numberFormatter = new Intl.NumberFormat(loc, { maximumFractionDigits: 2 });
    function fmtNum(value: number | null | undefined): string {
        return numberFormatter.format(value ?? 0);
    }

    function valueLabel(type: CouponType): string {
        switch (type) {
            case "PERCENTAGE": return "%";
            case "FIXED_AMOUNT": return "৳";
            case "FREE_DAYS": return " days";
        }
    }

    function couponStatusLabel(coupon: Coupon): { label: string; className: string } {
        if (isExpired(coupon)) {
            return { label: t("expired"), className: "bg-gray-100 text-gray-700" };
        }
        if (!coupon.isActive) {
            return { label: t("inactive"), className: "bg-red-50 text-red-700" };
        }
        return { label: t("active"), className: "bg-emerald-50 text-emerald-700" };
    }

    // ─── Render ─────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Notices */}
            {notice && (
                <div className="rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
                    {notice}
                </div>
            )}
            {error && (
                <div className="rounded-2xl bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
                    {error}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                    { label: t("stats.totalCoupons"), value: totalCoupons, icon: "🏷️" },
                    { label: t("stats.activeCoupons"), value: activeCoupons, icon: "✅" },
                    { label: t("stats.totalRedemptions"), value: totalRedemptions, icon: "🔄" },
                    { label: t("stats.totalDiscount"), value: "—", icon: "৳" },
                ].map((card) => (
                    <div key={card.label} className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-outline-variant/10">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{card.icon}</span>
                            <p className="text-xs font-medium text-on-surface-variant">{card.label}</p>
                        </div>
                        <p className="mt-3 text-2xl font-bold text-on-surface">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Header + Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as CouponType | "")}
                        className="rounded-xl bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20"
                    >
                        <option value="">{t("allTypes")}</option>
                        <option value="PERCENTAGE">{t("type.PERCENTAGE")}</option>
                        <option value="FIXED_AMOUNT">{t("type.FIXED_AMOUNT")}</option>
                        <option value="FREE_DAYS">{t("type.FREE_DAYS")}</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                        className="rounded-xl bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20"
                    >
                        <option value="">{t("allStatus")}</option>
                        <option value="active">{t("active")}</option>
                        <option value="inactive">{t("inactive")}</option>
                        <option value="expired">{t("expired")}</option>
                    </select>
                </div>
                <button
                    onClick={openCreateForm}
                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary hover:opacity-90 transition-opacity"
                >
                    <IconTag className="w-4 h-4" /> {t("createNew")}
                </button>
            </div>

            {/* Coupons Table */}
            <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="bg-surface-container-low text-sm font-bold text-on-surface-variant">
                            <tr>
                                <th className="px-6 py-4">{t("table.code")}</th>
                                <th className="px-6 py-4">{t("table.type")}</th>
                                <th className="px-6 py-4 text-right">{t("table.value")}</th>
                                <th className="px-6 py-4 text-center">{t("table.usage")}</th>
                                <th className="px-6 py-4">{t("table.validity")}</th>
                                <th className="px-6 py-4 text-center">{t("table.status")}</th>
                                <th className="px-6 py-4 text-right">{t("table.actions")}</th>
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
                            ) : !coupons || coupons.content.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant">
                                        {t("noCoupons")}
                                    </td>
                                </tr>
                            ) : (
                                coupons.content
                                    .filter((c) => {
                                        if (statusFilter === "expired") return isExpired(c);
                                        return true;
                                    })
                                    .map((coupon) => {
                                        const status = couponStatusLabel(coupon);
                                        return (
                                            <tr key={coupon.id} className="hover:bg-surface-container-low transition-colors">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-mono font-bold text-on-surface">{coupon.code}</p>
                                                        {coupon.description && (
                                                            <p className="text-xs text-on-surface-variant truncate max-w-[200px]">
                                                                {coupon.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center rounded-full bg-primary-container/10 px-3 py-1 text-xs font-semibold text-primary">
                                                        {t(`type.${coupon.type}`)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-semibold text-on-surface">
                                                    {fmtNum(coupon.value)}{valueLabel(coupon.type)}
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm text-on-surface-variant">
                                                    {coupon.usedCount} / {coupon.usageLimit ?? "∞"}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap">
                                                    {formatDate(coupon.validFrom)} — {formatDate(coupon.validUntil)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => handleViewStats(coupon)}
                                                            className="rounded-lg px-2 py-1 text-xs text-on-surface-variant hover:bg-surface-container-low transition-colors"
                                                            title={t("actions.stats")}
                                                        >
                                                            📊
                                                        </button>
                                                        <button
                                                            onClick={() => openEditForm(coupon)}
                                                            className="rounded-lg px-2 py-1 text-xs text-on-surface-variant hover:bg-surface-container-low transition-colors"
                                                            title={t("actions.edit")}
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleActive(coupon)}
                                                            className="rounded-lg px-2 py-1 text-xs text-on-surface-variant hover:bg-surface-container-low transition-colors"
                                                            title={coupon.isActive ? t("actions.deactivate") : t("actions.activate")}
                                                        >
                                                            {coupon.isActive ? "⏸️" : "▶️"}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(coupon)}
                                                            className="rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50 transition-colors"
                                                            title={t("actions.delete")}
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {coupons && coupons.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-surface-container px-6 py-3">
                        <button
                            onClick={() => setPage(Math.max(0, page - 1))}
                            disabled={coupons.first}
                            className="text-sm text-on-surface-variant hover:text-on-surface disabled:opacity-40"
                        >
                            ← {t("prev")}
                        </button>
                        <span className="text-sm text-on-surface-variant">
                            {t("pageInfo", { page: page + 1, total: coupons.totalPages })}
                        </span>
                        <button
                            onClick={() => setPage(Math.min(coupons.totalPages - 1, page + 1))}
                            disabled={coupons.last}
                            className="text-sm text-on-surface-variant hover:text-on-surface disabled:opacity-40"
                        >
                            {t("next")} →
                        </button>
                    </div>
                )}
            </div>

            {/* ─── Create/Edit Form Modal ─────────────────── */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-surface-container-lowest p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-on-surface">
                            {editingCoupon ? t("form.editTitle") : t("form.title")}
                        </h3>

                        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                            {/* Code (only for create) */}
                            {!editingCoupon && (
                                <label className="block">
                                    <span className="text-sm font-medium text-on-surface-variant">{t("form.code")}</span>
                                    <input
                                        type="text"
                                        value={form.code}
                                        onChange={(e) => updateForm("code", e.target.value.toUpperCase())}
                                        required
                                        placeholder={t("form.codePlaceholder")}
                                        className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm font-mono text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none"
                                    />
                                </label>
                            )}

                            {/* Description */}
                            <label className="block">
                                <span className="text-sm font-medium text-on-surface-variant">{t("form.description")}</span>
                                <input
                                    type="text"
                                    value={form.description}
                                    onChange={(e) => updateForm("description", e.target.value)}
                                    placeholder={t("form.descriptionPlaceholder")}
                                    className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none"
                                />
                            </label>

                            {/* Type + Value */}
                            <div className="grid grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="text-sm font-medium text-on-surface-variant">{t("form.type")}</span>
                                    <select
                                        value={form.type}
                                        onChange={(e) => updateForm("type", e.target.value as CouponType)}
                                        disabled={!!editingCoupon}
                                        className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none disabled:opacity-50"
                                    >
                                        <option value="PERCENTAGE">{t("type.PERCENTAGE")}</option>
                                        <option value="FIXED_AMOUNT">{t("type.FIXED_AMOUNT")}</option>
                                        <option value="FREE_DAYS">{t("type.FREE_DAYS")}</option>
                                    </select>
                                </label>
                                <label className="block">
                                    <span className="text-sm font-medium text-on-surface-variant">{t("form.value")}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={form.value}
                                        onChange={(e) => updateForm("value", e.target.value)}
                                        required
                                        placeholder={
                                            form.type === "PERCENTAGE" ? t("form.valuePlaceholderPercent") :
                                                form.type === "FIXED_AMOUNT" ? t("form.valuePlaceholderFixed") :
                                                    t("form.valuePlaceholderDays")
                                        }
                                        className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none"
                                    />
                                </label>
                            </div>

                            {/* Min Purchase + Max Discount */}
                            <div className="grid grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="text-sm font-medium text-on-surface-variant">{t("form.minPurchase")}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={form.minPurchaseAmount}
                                        onChange={(e) => updateForm("minPurchaseAmount", e.target.value)}
                                        placeholder={t("form.minPurchasePlaceholder")}
                                        className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-sm font-medium text-on-surface-variant">{t("form.maxDiscount")}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={form.maxDiscountAmount}
                                        onChange={(e) => updateForm("maxDiscountAmount", e.target.value)}
                                        placeholder={t("form.maxDiscountPlaceholder")}
                                        className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none"
                                    />
                                </label>
                            </div>

                            {/* Usage Limit + Per User Limit */}
                            <div className="grid grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="text-sm font-medium text-on-surface-variant">{t("form.usageLimit")}</span>
                                    <input
                                        type="number"
                                        min="1"
                                        value={form.usageLimit}
                                        onChange={(e) => updateForm("usageLimit", e.target.value)}
                                        placeholder={t("form.usageLimitPlaceholder")}
                                        className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-sm font-medium text-on-surface-variant">{t("form.perUserLimit")}</span>
                                    <input
                                        type="number"
                                        min="1"
                                        value={form.perUserLimit}
                                        onChange={(e) => updateForm("perUserLimit", e.target.value)}
                                        placeholder={t("form.perUserLimitPlaceholder")}
                                        className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none"
                                    />
                                </label>
                            </div>

                            {/* First Purchase Only */}
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={form.firstPurchaseOnly}
                                    onChange={(e) => updateForm("firstPurchaseOnly", e.target.checked)}
                                    className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-medium text-on-surface-variant">{t("form.firstPurchaseOnly")}</span>
                            </label>

                            {/* Valid From + Valid Until */}
                            <div className="grid grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="text-sm font-medium text-on-surface-variant">{t("form.validFrom")}</span>
                                    <input
                                        type="datetime-local"
                                        value={form.validFrom}
                                        onChange={(e) => updateForm("validFrom", e.target.value)}
                                        required
                                        className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-sm font-medium text-on-surface-variant">{t("form.validUntil")}</span>
                                    <input
                                        type="datetime-local"
                                        value={form.validUntil}
                                        onChange={(e) => updateForm("validUntil", e.target.value)}
                                        required
                                        className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none"
                                    />
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="rounded-xl px-5 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
                                >
                                    {t("form.cancel")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary hover:opacity-90 disabled:opacity-50 transition-opacity"
                                >
                                    {submitting ? "…" : editingCoupon ? t("form.update") : t("form.submit")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── Stats Modal ────────────────────────────── */}
            {(statsCoupon || statsLoading) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-on-surface">{t("statsModal.title")}</h3>
                            <button
                                onClick={() => setStatsCoupon(null)}
                                className="rounded-lg px-2 py-1 text-on-surface-variant hover:bg-surface-container-low"
                            >
                                ✕
                            </button>
                        </div>

                        {statsLoading ? (
                            <div className="flex justify-center py-10">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-container-high border-t-primary" />
                            </div>
                        ) : statsCoupon ? (
                            <div className="mt-5 space-y-4">
                                <div className="rounded-xl bg-surface-container-low p-4">
                                    <p className="text-sm font-medium text-on-surface-variant">{t("statsModal.totalRedemptions")}</p>
                                    <p className="mt-1 text-2xl font-bold text-on-surface">{fmtNum(statsCoupon.totalRedemptions)}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-xl bg-surface-container-low p-4">
                                        <p className="text-xs font-medium text-on-surface-variant">{t("statsModal.usedCount")}</p>
                                        <p className="mt-1 text-xl font-bold text-on-surface">{fmtNum(statsCoupon.usedCount)}</p>
                                    </div>
                                    <div className="rounded-xl bg-surface-container-low p-4">
                                        <p className="text-xs font-medium text-on-surface-variant">{t("statsModal.remainingUses")}</p>
                                        <p className="mt-1 text-xl font-bold text-on-surface">{fmtNum(statsCoupon.remainingUses)}</p>
                                    </div>
                                </div>
                                <div className="rounded-xl bg-surface-container-low p-4">
                                    <p className="text-xs font-medium text-on-surface-variant">{t("statsModal.totalDiscount")}</p>
                                    <p className="mt-1 text-xl font-bold text-on-surface">৳ {fmtNum(statsCoupon.totalDiscountGiven)}</p>
                                </div>
                                {statsCoupon.recentRedemptions.length > 0 && (
                                    <div className="rounded-xl bg-surface-container-low p-4">
                                        <p className="text-xs font-medium text-on-surface-variant">{t("statsModal.recentRedemptions")}</p>
                                        <div className="mt-2 space-y-1">
                                            {statsCoupon.recentRedemptions.slice(0, 5).map((id) => (
                                                <p key={id} className="text-xs font-mono text-on-surface-variant">{id.slice(0, 12)}…</p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}
