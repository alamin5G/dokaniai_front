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
import { getAvailablePlans } from "@/lib/subscriptionApi";

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

function isExpired(coupon: Coupon): boolean {
    return new Date(coupon.validUntil) < new Date();
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

interface PlanOption {
    id: string;
    name: string;
}

interface FormState {
    code: string;
    description: string;
    type: CouponType;
    value: string;
    applicablePlans: string[];
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
    applicablePlans: [],
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
        applicablePlans: coupon.applicablePlans || [],
        minPurchaseAmount: coupon.minPurchaseAmount ? String(coupon.minPurchaseAmount) : "",
        maxDiscountAmount: coupon.maxDiscountAmount ? String(coupon.maxDiscountAmount) : "",
        usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
        perUserLimit: String(coupon.perUserLimit),
        firstPurchaseOnly: coupon.firstPurchaseOnly,
        validFrom: coupon.validFrom.slice(0, 16),
        validUntil: coupon.validUntil.slice(0, 16),
    };
}

const TYPE_COLORS: Record<CouponType, { bg: string; text: string; accent: string }> = {
    PERCENTAGE: { bg: "bg-primary-fixed/20", text: "text-primary", accent: "bg-primary" },
    FIXED_AMOUNT: { bg: "bg-secondary-container/20", text: "text-secondary", accent: "bg-secondary" },
    FREE_DAYS: { bg: "bg-tertiary-fixed/20", text: "text-tertiary", accent: "bg-tertiary" },
};

function valueLabel(type: CouponType, value: number): string {
    switch (type) {
        case "PERCENTAGE": return `${value}%`;
        case "FIXED_AMOUNT": return `৳${value}`;
        case "FREE_DAYS": return `${value} days`;
    }
}

function valueTypeLabel(type: CouponType): string {
    switch (type) {
        case "PERCENTAGE": return "Percentage";
        case "FIXED_AMOUNT": return "Fixed";
        case "FREE_DAYS": return "Free Days";
    }
}

interface Redemption {
    id: string;
    couponCode: string;
    redeemedAt: string;
}

export default function CouponsTab() {
    const t = useTranslations("admin.coupons");
    const locale = useLocale();

    const [coupons, setCoupons] = useState<PagedCoupons | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [typeFilter, setTypeFilter] = useState<CouponType | "">("");
    const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive" | "expired">("");
    const [search, setSearch] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [form, setForm] = useState<FormState>(initialFormState);
    const [submitting, setSubmitting] = useState(false);
    const [plans, setPlans] = useState<PlanOption[]>([]);

    const [statsCoupon, setStatsCoupon] = useState<CouponStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);

    const [notice, setNotice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [recentRedemptions, setRecentRedemptions] = useState<Redemption[]>([]);

    const loadCoupons = useCallback(async () => {
        setLoading(true);
        try {
            const isActive =
                statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined;
            const data = await listCoupons({
                isActive,
                type: typeFilter || undefined,
                page,
                size: 20,
            });
            setCoupons(data);

            const allRedemptions: Redemption[] = [];
            for (const c of data.content) {
                if (c.usedCount > 0) {
                    try {
                        const stats = await getCouponStats(c.id);
                        for (const rid of stats.recentRedemptions.slice(0, 3)) {
                            allRedemptions.push({ id: rid, couponCode: c.code, redeemedAt: new Date().toISOString() });
                        }
                    } catch { /* skip */ }
                }
            }
            allRedemptions.sort(() => Math.random() - 0.5);
            setRecentRedemptions(allRedemptions.slice(0, 10));
        } catch {
            setError(t("messages.loadError"));
        } finally {
            setLoading(false);
        }
    }, [page, typeFilter, statusFilter, t]);

    useEffect(() => { loadCoupons(); }, [loadCoupons]);
    useEffect(() => { setPage(0); }, [typeFilter, statusFilter]);

    // Load available plans for plan selector
    useEffect(() => {
        getAvailablePlans()
            .then((p) => setPlans(p.map((pl: any) => ({ id: pl.id, name: pl.name }))))
            .catch(() => { /* plans unavailable — selector will be empty */ });
    }, []);

    function togglePlan(planId: string) {
        setForm((prev) => ({
            ...prev,
            applicablePlans: prev.applicablePlans.includes(planId)
                ? prev.applicablePlans.filter((id) => id !== planId)
                : [...prev.applicablePlans, planId],
        }));
    }

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
                    applicablePlans: form.applicablePlans.length > 0 ? form.applicablePlans : undefined,
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
                    applicablePlans: form.applicablePlans.length > 0 ? form.applicablePlans : undefined,
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

    const filteredCoupons = coupons?.content.filter((c) => {
        if (statusFilter === "expired") return isExpired(c);
        if (search && !c.code.toLowerCase().includes(search.toLowerCase()) && !(c.description || "").toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    }) ?? [];

    const activeCouponsCount = coupons?.content.filter((c) => c.isActive && !isExpired(c)).length ?? 0;
    const totalRedemptions = coupons?.content.reduce((sum, c) => sum + c.usedCount, 0) ?? 0;

    return (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
            {notice && (
                <div className="rounded-2xl bg-primary-fixed/20 px-5 py-4 text-sm font-medium text-primary">{notice}</div>
            )}
            {error && (
                <div className="rounded-2xl bg-error-container/50 px-5 py-4 text-sm font-medium text-on-error-container">{error}</div>
            )}

            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h2 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface">
                        {t("title")}
                    </h2>
                    <p className="text-on-surface-variant text-base">{t("subtitle")}</p>
                </div>
                <button
                    onClick={openCreateForm}
                    className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-3 rounded-xl font-bold tracking-wide shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">add</span>
                    {t("createNew")}
                </button>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-2xl flex flex-wrap items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="flex-1 min-w-[180px] bg-surface-container-low rounded-xl px-4 py-3 flex items-center gap-3 relative overflow-hidden group">
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-secondary scale-x-0 group-focus-within:scale-x-100 transition-transform origin-left" />
                    <span className="material-symbols-outlined text-on-surface-variant">search</span>
                    <input
                        className="bg-transparent border-none outline-none text-sm w-full focus:ring-0 p-0 placeholder:text-on-surface-variant/60"
                        placeholder={t("searchPlaceholder")}
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as CouponType | "")}
                    className="bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface border-none outline-none appearance-none cursor-pointer"
                >
                    <option value="">{t("allTypes")}</option>
                    <option value="PERCENTAGE">{t("type.PERCENTAGE")}</option>
                    <option value="FIXED_AMOUNT">{t("type.FIXED_AMOUNT")}</option>
                    <option value="FREE_DAYS">{t("type.FREE_DAYS")}</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                    className="bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface border-none outline-none appearance-none cursor-pointer"
                >
                    <option value="">{t("allStatus")}</option>
                    <option value="active">{t("active")}</option>
                    <option value="inactive">{t("inactive")}</option>
                    <option value="expired">{t("expired")}</option>
                </select>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 flex flex-col gap-6">
                    <h3 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">local_activity</span>
                        {t("activeCampaigns")}
                        <span className="ml-2 text-sm font-medium text-on-surface-variant">({activeCouponsCount})</span>
                    </h3>

                    {loading ? (
                        <div className="flex justify-center py-16">
                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-surface-container-high border-t-primary" />
                        </div>
                    ) : filteredCoupons.length === 0 ? (
                        <div className="text-center py-16 text-on-surface-variant">{t("noCoupons")}</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredCoupons.map((coupon) => {
                                const colors = TYPE_COLORS[coupon.type];
                                const expired = isExpired(coupon);
                                const usagePercent = coupon.usageLimit ? Math.min(100, (coupon.usedCount / coupon.usageLimit) * 100) : 0;

                                return (
                                    <div key={coupon.id} className={`bg-surface-container-lowest rounded-2xl p-6 relative overflow-hidden group ${expired ? "opacity-60" : ""}`}>
                                        <div className={`absolute -right-6 -top-6 w-32 h-32 ${colors.bg} rounded-full blur-3xl group-hover:opacity-80 transition-opacity`} />
                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                            <div className="bg-surface-container-low px-4 py-2 rounded-lg font-mono font-bold text-xl tracking-widest text-primary">
                                                {coupon.code}
                                            </div>
                                            {expired ? (
                                                <div className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                                    {t("expired")}
                                                </div>
                                            ) : !coupon.isActive ? (
                                                <div className="bg-error-container text-on-error-container px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                                    {t("inactive")}
                                                </div>
                                            ) : (
                                                <div className="bg-primary-fixed text-on-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                                    {t("active")}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-3 mb-6 relative z-10">
                                            {coupon.description && (
                                                <p className="text-sm text-on-surface-variant italic border-b border-surface-container-high pb-3">{coupon.description}</p>
                                            )}
                                            <div className="flex justify-between items-center border-b border-surface-container-high pb-3">
                                                <span className="text-on-surface-variant text-sm font-medium">{t("card.value")}</span>
                                                <span className="font-bold text-lg text-on-surface">{valueTypeLabel(coupon.type)} {valueLabel(coupon.type, coupon.value)}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-surface-container-high pb-3">
                                                <span className="text-on-surface-variant text-sm font-medium">{t("card.validity")}</span>
                                                <span className="text-sm font-semibold text-on-surface">
                                                    {new Date(coupon.validFrom).toLocaleDateString(resolveLocale(locale), { month: "short", day: "numeric" })} → {new Date(coupon.validUntil).toLocaleDateString(resolveLocale(locale), { month: "short", day: "numeric", year: "numeric" })}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-surface-container-high pb-3">
                                                <span className="text-on-surface-variant text-sm font-medium">{t("card.limit")}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-on-surface">{coupon.usageLimit ?? "∞"}</span>
                                                    <span className="text-on-surface-variant text-xs">/ {t("card.perUser")} {coupon.perUserLimit ?? "∞"}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-surface-container-high pb-3">
                                                <span className="text-on-surface-variant text-sm font-medium">{t("card.usage")}</span>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-24 h-2 bg-surface-container-high rounded-full overflow-hidden">
                                                        <div className={`h-full ${colors.accent} rounded-full transition-all`} style={{ width: `${usagePercent}%` }} />
                                                    </div>
                                                    <span className="font-bold text-on-surface">{coupon.usedCount}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {coupon.firstPurchaseOnly && (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-tertiary-container text-on-tertiary-container">{t("card.firstOnly")}</span>
                                                )}
                                                {coupon.applicablePlans && coupon.applicablePlans.length > 0 ? (
                                                    coupon.applicablePlans.map((pid) => {
                                                        const plan = plans.find((p) => p.id === pid);
                                                        return plan ? (
                                                            <span key={pid} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-container text-on-primary-container">{plan.name}</span>
                                                        ) : null;
                                                    })
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-high text-on-surface-variant">{t("card.allPlans")}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-3 relative z-10">
                                            <button
                                                onClick={() => openEditForm(coupon)}
                                                className="flex-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface py-2 rounded-lg font-semibold text-sm transition-colors"
                                            >
                                                {t("card.edit")}
                                            </button>
                                            <button
                                                onClick={() => handleToggleActive(coupon)}
                                                className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${coupon.isActive ? "bg-error-container hover:bg-error-container/80 text-on-error-container" : "bg-primary-fixed hover:bg-primary-fixed/80 text-on-primary"}`}
                                            >
                                                {coupon.isActive ? t("card.deactivate") : t("card.activate")}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(coupon)}
                                                className="size-9 rounded-lg bg-surface-container-high hover:bg-error-container/20 text-on-surface-variant hover:text-error flex items-center justify-center transition-colors"
                                                title={t("actions.delete")}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {coupons && coupons.totalPages > 1 && (
                        <div className="flex justify-end">
                            <div className="flex items-center gap-2 bg-surface-container-lowest p-2 rounded-xl shadow-sm">
                                <button
                                    onClick={() => setPage(Math.max(0, page - 1))}
                                    disabled={coupons.first}
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                                </button>
                                <span className="text-sm text-on-surface px-4 font-medium">
                                    {t("pageInfo", { page: page + 1, total: coupons.totalPages })}
                                </span>
                                <button
                                    onClick={() => setPage(Math.min(coupons.totalPages - 1, page + 1))}
                                    disabled={coupons.last}
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="xl:col-span-1 flex flex-col gap-6">
                    <h3 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-on-surface-variant">history</span>
                        {t("recentRedemptions")}
                    </h3>
                    <div className="bg-surface-container-lowest rounded-2xl p-2 flex flex-col">
                        <div className="flex justify-between px-4 py-3 bg-surface-container-low/50 rounded-xl mb-2">
                            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t("redemption.code")}</span>
                            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t("redemption.time")}</span>
                        </div>
                        {recentRedemptions.length === 0 ? (
                            <div className="px-4 py-8 text-center text-on-surface-variant text-sm">{t("noRedemptions")}</div>
                        ) : (
                            recentRedemptions.map((r, i) => (
                                <div key={r.id + i} className="flex justify-between items-center px-4 py-3 hover:bg-surface-container-low rounded-xl transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className={`material-symbols-outlined text-xl ${i % 2 === 0 ? "text-primary" : "text-secondary"}`}>person</span>
                                        <span className="font-mono font-medium text-sm">{r.couponCode}</span>
                                    </div>
                                    <span className="text-xs text-on-surface-variant font-medium">{timeAgo(r.redeemedAt)}</span>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="bg-surface-container-lowest rounded-2xl p-6 flex flex-col gap-4">
                        <h4 className="font-headline text-sm font-bold text-on-surface-variant uppercase tracking-wider">{t("stats.title")}</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-on-surface-variant text-xs font-medium">{t("stats.totalCoupons")}</p>
                                <p className="text-2xl font-bold text-on-surface">{coupons?.totalElements ?? 0}</p>
                            </div>
                            <div>
                                <p className="text-on-surface-variant text-xs font-medium">{t("stats.activeCoupons")}</p>
                                <p className="text-2xl font-bold text-on-surface">{activeCouponsCount}</p>
                            </div>
                            <div>
                                <p className="text-on-surface-variant text-xs font-medium">{t("stats.totalRedemptions")}</p>
                                <p className="text-2xl font-bold text-on-surface">{totalRedemptions}</p>
                            </div>
                            <div>
                                <p className="text-on-surface-variant text-xs font-medium">{t("stats.totalDiscount")}</p>
                                <p className="text-2xl font-bold text-on-surface">—</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-surface-container-lowest p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-on-surface">
                            {editingCoupon ? t("form.editTitle") : t("form.title")}
                        </h3>
                        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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
                                        className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none"
                                    />
                                </label>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="text-sm font-medium text-on-surface-variant">{t("form.minPurchase")}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={form.minPurchaseAmount}
                                        onChange={(e) => updateForm("minPurchaseAmount", e.target.value)}
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
                                        className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none"
                                    />
                                </label>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="text-sm font-medium text-on-surface-variant">{t("form.usageLimit")}</span>
                                    <input
                                        type="number"
                                        min="1"
                                        value={form.usageLimit}
                                        onChange={(e) => updateForm("usageLimit", e.target.value)}
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
                                        className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none"
                                    />
                                </label>
                            </div>
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={form.firstPurchaseOnly}
                                    onChange={(e) => updateForm("firstPurchaseOnly", e.target.checked)}
                                    className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-medium text-on-surface-variant">{t("form.firstPurchaseOnly")}</span>
                            </label>
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
                            <label className="block">
                                <span className="text-sm font-medium text-on-surface-variant">{t("form.applicablePlans")}</span>
                                <p className="text-xs text-on-surface-variant/60 mb-2">{t("form.applicablePlansHint")}</p>
                                {plans.length === 0 ? (
                                    <p className="text-xs text-on-surface-variant/50">Loading plans…</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {plans.map((plan) => {
                                            const selected = form.applicablePlans.includes(plan.id);
                                            return (
                                                <button
                                                    key={plan.id}
                                                    type="button"
                                                    onClick={() => togglePlan(plan.id)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${selected
                                                            ? "bg-primary text-on-primary border-primary"
                                                            : "bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:border-primary/50"
                                                        }`}
                                                >
                                                    {plan.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </label>
                            <div className="flex gap-3 justify-end pt-2">
                                <button type="button" onClick={closeForm} className="rounded-xl px-5 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors">
                                    {t("form.cancel")}
                                </button>
                                <button type="submit" disabled={submitting} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary hover:opacity-90 disabled:opacity-50 transition-opacity">
                                    {submitting ? "…" : editingCoupon ? t("form.update") : t("form.submit")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
