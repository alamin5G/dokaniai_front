"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
    CategoryRequestDecisionAction,
    CategoryRequestResponse,
    SimilarCategoryResult,
} from "@/types/categoryRequest";
import type { CategoryResponse } from "@/types/category";
import {
    decideCategoryRequest,
    getPendingCategoryRequests,
    getCategoriesByBusinessType,
} from "@/lib/categoryApi";

// ─── Decision Form State ─────────────────────────────────

interface DecisionForm {
    action: CategoryRequestDecisionAction;
    approvedScope: "GLOBAL" | "BUSINESS";
    reviewNotes: string;
    rejectionReason: string;
    suggestedCategoryId: string;
}

const initialDecision: DecisionForm = {
    action: "APPROVE_GLOBAL",
    approvedScope: "GLOBAL",
    reviewNotes: "",
    rejectionReason: "",
    suggestedCategoryId: "",
};

// ─── Main Component ──────────────────────────────────────

export default function CategoryRequestsTab() {
    const t = useTranslations("admin.categories");

    // Data
    const [requests, setRequests] = useState<CategoryRequestResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // Decision modal
    const [selectedRequest, setSelectedRequest] = useState<CategoryRequestResponse | null>(null);
    const [decision, setDecision] = useState<DecisionForm>(initialDecision);
    const [submitting, setSubmitting] = useState(false);

    // Merge: category list + search
    const [categories, setCategories] = useState<CategoryResponse[]>([]);
    const [categorySearch, setCategorySearch] = useState("");
    const [loadingCategories, setLoadingCategories] = useState(false);

    // Notices
    const [notice, setNotice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // ─── Load Requests ──────────────────────────────────
    const loadRequests = useCallback(async () => {
        setLoading(true);
        try {
            const { content, totalPages } = await getPendingCategoryRequests(page, 20);
            setRequests(content);
            setHasMore(page + 1 < totalPages);
        } catch {
            setError(t("messages.loadError"));
        } finally {
            setLoading(false);
        }
    }, [page, t]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    // ─── Load categories for MERGE ─────────────────────
    const loadCategories = useCallback(async (businessType: string | null) => {
        if (!businessType) return;
        setLoadingCategories(true);
        try {
            const cats = await getCategoriesByBusinessType(businessType);
            setCategories(cats);
        } catch {
            setCategories([]);
        } finally {
            setLoadingCategories(false);
        }
    }, []);

    // Filtered categories by search
    const filteredCategories = useMemo(() => {
        if (!categorySearch.trim()) return categories;
        const q = categorySearch.toLowerCase();
        return categories.filter(
            (c) =>
                c.nameBn.toLowerCase().includes(q) ||
                (c.nameEn && c.nameEn.toLowerCase().includes(q))
        );
    }, [categories, categorySearch]);

    // ─── Open Decision Modal ────────────────────────────
    function openDecision(request: CategoryRequestResponse, action: CategoryRequestDecisionAction) {
        setSelectedRequest(request);
        setDecision({
            ...initialDecision,
            action,
            approvedScope: action === "APPROVE_GLOBAL" ? "GLOBAL" : "BUSINESS",
            suggestedCategoryId: request.suggestedCategoryId || "",
        });
        setError(null);
        setNotice(null);
        setCategorySearch("");

        // Pre-load categories if MERGE
        if (action === "MERGE") {
            loadCategories(request.businessType);
        }
    }

    function closeDecision() {
        setSelectedRequest(null);
        setDecision(initialDecision);
        setCategories([]);
        setCategorySearch("");
    }

    // ─── Handle action change (re-load categories if MERGE) ──
    function handleActionChange(action: CategoryRequestDecisionAction) {
        setDecision((d) => ({ ...d, action, suggestedCategoryId: "" }));
        if (action === "MERGE" && selectedRequest?.businessType) {
            loadCategories(selectedRequest.businessType);
        }
    }

    // ─── Submit Decision ────────────────────────────────
    async function handleSubmitDecision() {
        if (!selectedRequest) return;
        setSubmitting(true);
        setError(null);

        try {
            await decideCategoryRequest(selectedRequest.id, {
                action: decision.action,
                approvedScope: decision.action.startsWith("APPROVE") ? decision.approvedScope : undefined,
                reviewNotes: decision.reviewNotes || undefined,
                rejectionReason: decision.action === "REJECT" ? decision.rejectionReason : undefined,
                suggestedCategoryId: decision.action === "MERGE" ? decision.suggestedCategoryId || undefined : undefined,
            });
            setNotice(
                decision.action === "REJECT"
                    ? t("messages.rejected")
                    : decision.action === "MERGE"
                        ? t("messages.merged")
                        : t("messages.approved")
            );
            closeDecision();
            await loadRequests();
        } catch {
            setError(t("messages.error"));
        } finally {
            setSubmitting(false);
        }
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

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-on-surface">{t("title")}</h2>
                    <p className="text-sm text-on-surface-variant">{t("subtitle")}</p>
                </div>
            </div>

            {/* Requests Table */}
            <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="bg-surface-container-low text-sm font-bold text-on-surface-variant">
                            <tr>
                                <th className="px-6 py-4">{t("colBusiness")}</th>
                                <th className="px-6 py-4">{t("colCategory")}</th>
                                <th className="px-6 py-4">{t("colType")}</th>
                                <th className="px-6 py-4">{t("colJustification")}</th>
                                <th className="px-6 py-4">{t("colDate")}</th>
                                <th className="px-6 py-4 text-right">{t("colActions")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex justify-center">
                                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-container-high border-t-primary" />
                                        </div>
                                    </td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">
                                        {t("noRequests")}
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-surface-container-low transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-on-surface">
                                                    {req.businessName || req.businessId.slice(0, 8) + "…"}
                                                </p>
                                                <p className="text-xs text-on-surface-variant">
                                                    {req.requestedByName || "Unknown"}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-on-surface">{req.nameBn}</p>
                                                {req.nameEn && (
                                                    <p className="text-xs text-on-surface-variant">{req.nameEn}</p>
                                                )}
                                                {/* Show suggested category badge if backend suggests a duplicate */}
                                                {req.suggestedCategoryName && (
                                                    <p className="mt-1 text-xs text-amber-600">
                                                        {t("decisionModal.similarCategory")}: {req.suggestedCategoryName}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant">
                                            {req.businessType || "—"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant max-w-[200px] truncate">
                                            {req.justification || req.description || "—"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap">
                                            {new Date(req.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => openDecision(req, "APPROVE_GLOBAL")}
                                                    className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                                                >
                                                    {t("actions.approveGlobal")}
                                                </button>
                                                <button
                                                    onClick={() => openDecision(req, "APPROVE_BUSINESS")}
                                                    className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                                >
                                                    {t("actions.approveBusiness")}
                                                </button>
                                                <button
                                                    onClick={() => openDecision(req, "MERGE")}
                                                    className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                                                >
                                                    {t("actions.merge")}
                                                </button>
                                                <button
                                                    onClick={() => openDecision(req, "REJECT")}
                                                    className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                                                >
                                                    {t("actions.reject")}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-surface-container px-6 py-3">
                    <button
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                        className="text-sm text-on-surface-variant hover:text-on-surface disabled:opacity-40"
                    >
                        ← {t("prev")}
                    </button>
                    <span className="text-sm text-on-surface-variant">
                        {t("pageInfo", { page: page + 1, total: hasMore ? `${page + 1}+` : `${page + 1}` })}
                    </span>
                    <button
                        onClick={() => setPage(page + 1)}
                        disabled={!hasMore}
                        className="text-sm text-on-surface-variant hover:text-on-surface disabled:opacity-40"
                    >
                        {t("next")} →
                    </button>
                </div>
            </div>

            {/* ─── Decision Modal ──────────────────────────── */}
            {selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-surface-container-lowest p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-on-surface">
                            {t("decisionModal.title")}
                        </h3>

                        {/* Request Details */}
                        <div className="mt-4 space-y-3 rounded-xl bg-surface-container-low p-4">
                            <div className="flex justify-between">
                                <span className="text-sm text-on-surface-variant">{t("decisionModal.categoryName")}</span>
                                <span className="text-sm font-medium text-on-surface">
                                    {selectedRequest.nameBn}
                                    {selectedRequest.nameEn && ` (${selectedRequest.nameEn})`}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-on-surface-variant">{t("decisionModal.businessName")}</span>
                                <span className="text-sm font-medium text-on-surface">
                                    {selectedRequest.businessName || "—"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-on-surface-variant">{t("decisionModal.businessType")}</span>
                                <span className="text-sm text-on-surface">{selectedRequest.businessType || "—"}</span>
                            </div>
                            {selectedRequest.description && (
                                <div>
                                    <span className="text-sm text-on-surface-variant">{t("decisionModal.description")}</span>
                                    <p className="mt-1 text-sm text-on-surface">{selectedRequest.description}</p>
                                </div>
                            )}
                            {selectedRequest.justification && (
                                <div>
                                    <span className="text-sm text-on-surface-variant">{t("decisionModal.justification")}</span>
                                    <p className="mt-1 text-sm text-on-surface">{selectedRequest.justification}</p>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-sm text-on-surface-variant">{t("decisionModal.requestedScope")}</span>
                                <span className="inline-flex items-center rounded-full bg-primary-container/10 px-3 py-1 text-xs font-semibold text-primary">
                                    {selectedRequest.requestedScope || "—"}
                                </span>
                            </div>

                            {/* Similar / Suggested Category from backend */}
                            {selectedRequest.suggestedCategoryName && (
                                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                                    <p className="text-xs font-semibold text-amber-700">
                                        {t("decisionModal.suggestedCategory")}
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-amber-800">
                                        {selectedRequest.suggestedCategoryName}
                                    </p>
                                </div>
                            )}

                            {/* AI Similarity Results */}
                            {selectedRequest.similarCategories && selectedRequest.similarCategories.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-on-surface-variant">
                                        {t("decisionModal.aiSimilarCategories")}
                                    </p>
                                    {selectedRequest.similarCategories.map((sim) => (
                                        <div
                                            key={sim.categoryId}
                                            className="flex items-center justify-between rounded-lg bg-surface-container-low p-3"
                                        >
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-on-surface">
                                                    {sim.nameBn}
                                                    {sim.nameEn && <span className="text-on-surface-variant"> ({sim.nameEn})</span>}
                                                </p>
                                                {sim.reason && (
                                                    <p className="mt-0.5 text-xs text-on-surface-variant">{sim.reason}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 ml-3">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${sim.detectionMethod === "AI_SEMANTIC"
                                                        ? "bg-purple-100 text-purple-700"
                                                        : sim.detectionMethod === "EXACT"
                                                            ? "bg-red-100 text-red-700"
                                                            : "bg-amber-100 text-amber-700"
                                                    }`}>
                                                    {Math.round(sim.similarityScore * 100)}%
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDecision((d) => ({ ...d, action: "MERGE", suggestedCategoryId: sim.categoryId }));
                                                    }}
                                                    className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                                                >
                                                    {t("decisionModal.useThis")}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {selectedRequest.aiReasoning && (
                                        <p className="text-xs text-on-surface-variant italic">
                                            AI: {selectedRequest.aiReasoning}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Decision Action */}
                        <div className="mt-5 space-y-4">
                            <div>
                                <span className="text-sm font-medium text-on-surface-variant">{t("decisionModal.action")}</span>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    {(
                                        [
                                            { value: "APPROVE_GLOBAL", label: t("actions.approveGlobal"), color: "border-emerald-500 bg-emerald-50 text-emerald-700" },
                                            { value: "APPROVE_BUSINESS", label: t("actions.approveBusiness"), color: "border-blue-500 bg-blue-50 text-blue-700" },
                                            { value: "MERGE", label: t("actions.merge"), color: "border-amber-500 bg-amber-50 text-amber-700" },
                                            { value: "REJECT", label: t("actions.reject"), color: "border-red-500 bg-red-50 text-red-700" },
                                        ] as const
                                    ).map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => handleActionChange(opt.value as CategoryRequestDecisionAction)}
                                            className={`rounded-xl border-2 px-3 py-2 text-xs font-semibold transition ${decision.action === opt.value
                                                ? opt.color
                                                : "border-surface-container bg-white text-on-surface-variant"
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Scope selector for approve */}
                            {decision.action.startsWith("APPROVE") && (
                                <div className="flex gap-2">
                                    {(["GLOBAL", "BUSINESS"] as const).map((scope) => (
                                        <button
                                            key={scope}
                                            type="button"
                                            onClick={() => setDecision((d) => ({ ...d, approvedScope: scope }))}
                                            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${decision.approvedScope === scope
                                                ? "bg-primary text-on-primary"
                                                : "bg-surface-container-low text-on-surface-variant"
                                                }`}
                                        >
                                            {scope}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Merge: Category Selector */}
                            {decision.action === "MERGE" && (
                                <div className="space-y-3">
                                    <label className="block">
                                        <span className="text-sm font-medium text-on-surface-variant">
                                            {t("decisionModal.mergeCategory")}
                                        </span>
                                        {/* Search input */}
                                        <input
                                            type="text"
                                            value={categorySearch}
                                            onChange={(e) => setCategorySearch(e.target.value)}
                                            placeholder={t("decisionModal.mergeCategorySearch")}
                                            className="mt-1 w-full rounded-xl bg-surface-container-low p-3 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none"
                                        />
                                    </label>

                                    {/* Category list */}
                                    {loadingCategories ? (
                                        <div className="flex justify-center py-4">
                                            <div className="h-6 w-6 animate-spin rounded-full border-3 border-surface-container-high border-t-primary" />
                                        </div>
                                    ) : filteredCategories.length === 0 ? (
                                        <p className="py-3 text-center text-sm text-on-surface-variant">
                                            {t("decisionModal.noCategories")}
                                        </p>
                                    ) : (
                                        <div className="max-h-48 overflow-y-auto rounded-xl border border-outline-variant/20">
                                            {filteredCategories.map((cat) => (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setDecision((d) => ({ ...d, suggestedCategoryId: cat.id }))}
                                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${decision.suggestedCategoryId === cat.id
                                                        ? "bg-amber-50 text-amber-800 font-medium"
                                                        : "hover:bg-surface-container-low text-on-surface"
                                                        }`}
                                                >
                                                    <span>
                                                        {cat.nameBn}
                                                        {cat.nameEn && <span className="text-on-surface-variant"> ({cat.nameEn})</span>}
                                                    </span>
                                                    <span className="text-xs text-on-surface-variant">
                                                        {cat.scope}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Selected category confirmation */}
                                    {decision.suggestedCategoryId && (
                                        <p className="text-xs font-medium text-amber-700">
                                            {t("decisionModal.mergeInto")}:{" "}
                                            {categories.find((c) => c.id === decision.suggestedCategoryId)?.nameBn || "…"}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Review Notes */}
                            <label className="block">
                                <span className="text-sm font-medium text-on-surface-variant">{t("decisionModal.reviewNotes")}</span>
                                <textarea
                                    value={decision.reviewNotes}
                                    onChange={(e) => setDecision((d) => ({ ...d, reviewNotes: e.target.value }))}
                                    rows={2}
                                    placeholder={t("decisionModal.reviewNotesPlaceholder")}
                                    className="mt-1 w-full rounded-xl bg-surface-container-low p-3 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none resize-none"
                                />
                            </label>

                            {/* Rejection Reason */}
                            {decision.action === "REJECT" && (
                                <label className="block">
                                    <span className="text-sm font-medium text-on-surface-variant">{t("decisionModal.rejectionReason")}</span>
                                    <textarea
                                        value={decision.rejectionReason}
                                        onChange={(e) => setDecision((d) => ({ ...d, rejectionReason: e.target.value }))}
                                        rows={2}
                                        placeholder={t("decisionModal.rejectionReasonPlaceholder")}
                                        className="mt-1 w-full rounded-xl bg-red-50 p-3 text-sm text-on-surface border border-red-200 focus:border-red-400 focus:outline-none resize-none"
                                    />
                                </label>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex gap-3 justify-end">
                            <button
                                onClick={closeDecision}
                                className="rounded-xl px-5 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
                            >
                                {t("decisionModal.cancel")}
                            </button>
                            <button
                                onClick={handleSubmitDecision}
                                disabled={
                                    submitting ||
                                    (decision.action === "REJECT" && !decision.rejectionReason.trim()) ||
                                    (decision.action === "MERGE" && !decision.suggestedCategoryId)
                                }
                                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary hover:opacity-90 disabled:opacity-50 transition-opacity"
                            >
                                {submitting ? "…" : t("decisionModal.submit")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
