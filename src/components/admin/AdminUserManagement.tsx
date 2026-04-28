"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import * as adminApi from "@/lib/adminApi";
import type { AdminUser, AdminUserBusiness, UserRole, UserStatus } from "@/types/admin";
import type { AdminBusiness } from "@/lib/adminApi";

const AVATAR_COLORS = [
    "bg-primary-fixed/30 text-primary",
    "bg-secondary-container/30 text-on-secondary-container",
    "bg-tertiary-fixed/30 text-tertiary",
    "bg-error-container/30 text-on-error-container",
    "bg-primary-container/20 text-on-primary-container",
];

function avatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initial(name: string | null, phone: string): string {
    if (name) return name.charAt(0).toUpperCase();
    return phone.charAt(0);
}

function PlanBadge({ business }: { business: AdminUserBusiness }) {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary-fixed/30 text-on-primary-fixed text-[10px] font-bold">
            <span className="material-symbols-outlined text-[12px]">storefront</span>
            Active
        </span>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === "ACTIVE") {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed/40 text-on-primary text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Active
            </span>
        );
    }
    if (status === "SUSPENDED") {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container/50 text-on-error-container text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-error" />
                Suspended
            </span>
        );
    }
    if (status === "ARCHIVED") {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-on-surface-variant" />
                Archived
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-bold">
            {status}
        </span>
    );
}

function BusinessRow({ business, t }: { business: AdminUserBusiness; t: (key: string) => string }) {
    return (
        <div className="grid grid-cols-12 gap-4 items-center px-6 py-3 bg-surface-container-lowest rounded-xl hover:bg-surface-container-high transition-colors">
            <div className="col-span-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">storefront</span>
                </div>
                <span className="text-sm font-semibold text-on-surface">{business.name}</span>
            </div>
            <div className="col-span-3 text-xs font-medium text-on-surface-variant">
                {business.type || "—"}
            </div>
            <div className="col-span-2">
                <PlanBadge business={business} />
            </div>
            <div className="col-span-3 flex justify-end gap-3">
                <span className="text-xs font-bold text-primary hover:text-primary-container transition-colors cursor-pointer">
                    {t("viewShop")}
                </span>
            </div>
        </div>
    );
}

export default function AdminUserManagement() {
    const t = useTranslations("admin.userManagement");
    const { userRole } = useAuthStore();
    const isSuperAdmin = userRole === "SUPER_ADMIN";

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [businessSearch, setBusinessSearch] = useState("");
    const [planFilter, setPlanFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState<UserStatus | "">("");

    const [expandedUser, setExpandedUser] = useState<string | null>(null);
    const [userBusinesses, setUserBusinesses] = useState<Record<string, AdminBusiness[]>>({});
    const [loadingBusinesses, setLoadingBusinesses] = useState<Record<string, boolean>>({});

    const [actionUser, setActionUser] = useState<AdminUser | null>(null);
    const [actionType, setActionType] = useState<string | null>(null);
    const [actionReason, setActionReason] = useState("");
    const [actionDays, setActionDays] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const combinedSearch = [search, businessSearch].filter(Boolean).join(" ");
            const result = await adminApi.listUsers({
                search: combinedSearch || undefined,
                status: statusFilter || undefined,
                plan: planFilter || undefined,
                page,
                size: 20,
            });
            setUsers(result?.content ?? []);
            setTotalPages(result?.totalPages ?? 0);
        } catch (error) {
            console.error("[AdminUsers] Failed to load users:", error);
            setUsers([]);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    }, [search, businessSearch, statusFilter, planFilter, page]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    async function toggleExpand(user: AdminUser) {
        if (expandedUser === user.id) {
            setExpandedUser(null);
            return;
        }
        setExpandedUser(user.id);
        if (!userBusinesses[user.id]) {
            setLoadingBusinesses((prev) => ({ ...prev, [user.id]: true }));
            try {
                const businesses = await adminApi.getUserBusinesses(user.id);
                setUserBusinesses((prev) => ({ ...prev, [user.id]: businesses }));
            } catch {
                setUserBusinesses((prev) => ({ ...prev, [user.id]: [] }));
            } finally {
                setLoadingBusinesses((prev) => ({ ...prev, [user.id]: false }));
            }
        }
    }

    async function handleAction() {
        if (!actionUser || !actionType) return;
        setActionLoading(true);
        try {
            switch (actionType) {
                case "suspend":
                    await adminApi.suspendUser(actionUser.id, { reason: actionReason, duration: actionDays ? parseInt(actionDays) : undefined });
                    break;
                case "unsuspend":
                    await adminApi.unsuspendUser(actionUser.id);
                    break;
                case "archive":
                    await adminApi.archiveUser(actionUser.id, actionReason || undefined);
                    break;
                case "restore":
                    await adminApi.restoreUser(actionUser.id, actionReason || undefined);
                    break;
                case "delete":
                    if (isSuperAdmin) await adminApi.deleteUser(actionUser.id, actionReason || undefined);
                    break;
                case "extendTrial":
                    await adminApi.extendTrial(actionUser.id, { days: parseInt(actionDays) || 7, reason: actionReason || undefined });
                    break;
                case "resetPassword":
                    await adminApi.resetUserPassword(actionUser.id);
                    break;
                case "role_USER":
                    if (isSuperAdmin) await adminApi.updateUserRole(actionUser.id, { role: "USER" });
                    break;
                case "role_ADMIN":
                    if (isSuperAdmin) await adminApi.updateUserRole(actionUser.id, { role: "ADMIN" });
                    break;
                case "role_SUPER_ADMIN":
                    if (isSuperAdmin) await adminApi.updateUserRole(actionUser.id, { role: "SUPER_ADMIN" });
                    break;
            }
            setActionUser(null);
            setActionType(null);
            setActionReason("");
            setActionDays("");
            loadUsers();
        } catch {
            // silent
        } finally {
            setActionLoading(false);
        }
    }

    async function handleExport() {
        try {
            const blob = await adminApi.exportUsersCsv();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "users.csv";
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            // silent
        }
    }

    function openAction(user: AdminUser, action: string) {
        setActionUser(user);
        setActionType(action);
        setActionReason("");
        setActionDays("");
    }

    const needsReason = actionType === "suspend" || actionType === "archive" || actionType === "delete" || actionType === "extendTrial";
    const needsDays = actionType === "suspend" || actionType === "extendTrial";

    return (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
            <div className="mb-4">
                <h2 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface mb-2">
                    {t("title")}
                </h2>
                <p className="text-on-surface-variant text-base max-w-2xl">
                    {t("subtitle")}
                </p>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-2xl flex flex-wrap items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="flex-1 min-w-[180px] bg-surface-container-low rounded-xl px-4 py-3 flex items-center gap-3 relative overflow-hidden group">
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-secondary scale-x-0 group-focus-within:scale-x-100 transition-transform origin-left" />
                    <span className="material-symbols-outlined text-on-surface-variant">phone_iphone</span>
                    <input
                        className="bg-transparent border-none outline-none text-sm w-full focus:ring-0 p-0 placeholder:text-on-surface-variant/60"
                        placeholder={t("searchPhone")}
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    />
                </div>
                <div className="flex-1 min-w-[180px] bg-surface-container-low rounded-xl px-4 py-3 flex items-center gap-3 relative overflow-hidden group">
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-secondary scale-x-0 group-focus-within:scale-x-100 transition-transform origin-left" />
                    <span className="material-symbols-outlined text-on-surface-variant">storefront</span>
                    <input
                        className="bg-transparent border-none outline-none text-sm w-full focus:ring-0 p-0 placeholder:text-on-surface-variant/60"
                        placeholder={t("searchBusiness")}
                        type="text"
                        value={businessSearch}
                        onChange={(e) => { setBusinessSearch(e.target.value); setPage(0); }}
                    />
                </div>
                <div className="flex-1 min-w-[180px] bg-surface-container-low rounded-xl px-4 py-3 flex items-center gap-3 relative overflow-hidden group">
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-secondary scale-x-0 group-focus-within:scale-x-100 transition-transform origin-left" />
                    <span className="material-symbols-outlined text-on-surface-variant">workspace_premium</span>
                    <select
                        className="bg-transparent border-none outline-none text-sm w-full focus:ring-0 p-0 text-on-surface appearance-none cursor-pointer"
                        value={planFilter}
                        onChange={(e) => { setPlanFilter(e.target.value); setPage(0); }}
                    >
                        <option value="">{t("allPlans")}</option>
                        <option value="pro">Pro Plan</option>
                        <option value="basic">Basic Plan</option>
                        <option value="plus">Plus Plan</option>
                        <option value="free">Free Tier</option>
                    </select>
                </div>
                <button
                    onClick={() => { setPage(0); loadUsers(); }}
                    className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-3 rounded-xl text-sm font-bold tracking-wide hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2 shrink-0"
                >
                    <span className="material-symbols-outlined text-sm">filter_list</span>
                    {t("applyFilters")}
                </button>
            </div>

            <div className="bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-[0_20px_60px_rgb(0,0,0,0.05)] p-2">
                <div className="grid grid-cols-12 gap-4 px-8 py-4 text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider">
                    <div className="col-span-3">{t("colOwner")}</div>
                    <div className="col-span-2">{t("colContact")}</div>
                    <div className="col-span-3">{t("colBusinesses")}</div>
                    <div className="col-span-2">{t("colStatus")}</div>
                    <div className="col-span-2 text-right">{t("colActions")}</div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-surface-container-high border-t-primary" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-16 text-on-surface-variant">{t("noUsers")}</div>
                ) : (
                    users.map((user) => {
                        const isExpanded = expandedUser === user.id;
                        const businesses = user.businesses || userBusinesses[user.id] || [];
                        const isLoadingBiz = loadingBusinesses[user.id];

                        return (
                            <div key={user.id} className="flex flex-col mb-2">
                                <div className={`grid grid-cols-12 gap-4 px-8 py-5 items-center rounded-2xl hover:bg-surface-container-high transition-colors ${user.status === "SUSPENDED" ? "opacity-75" : ""}`}>
                                    <div className="col-span-3 flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full ${avatarColor(user.name || user.phone)} flex items-center justify-center font-bold text-lg`}>
                                            {initial(user.name, user.phone)}
                                        </div>
                                        <div>
                                            <p className="text-lg font-semibold text-on-surface leading-tight">{user.name || "—"}</p>
                                            <p className="text-xs text-on-surface-variant mt-0.5">{t("joined")} {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</p>
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-sm font-medium text-on-surface">{user.phone}</p>
                                        {user.email && <p className="text-xs text-on-surface-variant truncate">{user.email}</p>}
                                    </div>
                                    <div className="col-span-3">
                                        {businesses.length > 0 ? (
                                            <>
                                                <p className="text-sm font-semibold text-on-surface">{businesses[0].name}</p>
                                                {businesses.length > 1 && (
                                                    <span className="inline-flex w-fit items-center px-2 py-0.5 rounded-md bg-surface-container-highest text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
                                                        + {businesses.length - 1} {t("moreShops")}
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-sm text-on-surface-variant">{t("noBusinesses")}</span>
                                        )}
                                    </div>
                                    <div className="col-span-2">
                                        <StatusBadge status={user.status} />
                                    </div>
                                    <div className="col-span-2 flex justify-end gap-2">
                                        {user.status === "SUSPENDED" ? (
                                            <button
                                                onClick={() => openAction(user, "unsuspend")}
                                                className="px-4 h-10 rounded-xl bg-surface-container-highest hover:bg-surface-dim flex items-center justify-center text-on-surface text-sm font-bold transition-colors"
                                            >
                                                {t("reactivate")}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => openAction(user, "manage")}
                                                className="w-10 h-10 rounded-xl bg-surface-container-highest hover:bg-surface-dim flex items-center justify-center text-on-surface transition-colors"
                                                title={t("manageUser")}
                                            >
                                                <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => toggleExpand(user)}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isExpanded ? "bg-primary/10 text-primary" : "bg-surface-container-highest hover:bg-surface-dim text-on-surface"}`}
                                            title={t("expandBusinesses")}
                                        >
                                            <span className={`material-symbols-outlined text-[20px] transition-transform ${isExpanded ? "rotate-180" : ""}`}>expand_more</span>
                                        </button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="pl-20 pr-8 pb-4 pt-2">
                                        {isLoadingBiz ? (
                                            <div className="flex justify-center py-8">
                                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-container-high border-t-primary" />
                                            </div>
                                        ) : businesses.length === 0 ? (
                                            <div className="bg-surface-container-low rounded-2xl p-6 text-center text-on-surface-variant text-sm">
                                                {t("noBusinessesFound")}
                                            </div>
                                        ) : (
                                            <div className="bg-surface-container-low rounded-2xl p-2 flex flex-col gap-1">
                                                {businesses.map((biz) => (
                                                    <BusinessRow key={biz.id} business={biz} t={t} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}

                {totalPages > 1 && (
                    <div className="mt-4 flex justify-end pb-4 pr-4">
                        <div className="flex items-center gap-2 bg-surface-container-lowest p-2 rounded-xl shadow-sm">
                            <button
                                onClick={() => setPage(Math.max(0, page - 1))}
                                disabled={page === 0}
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                            </button>
                            <span className="text-sm text-on-surface px-4 font-medium">
                                {t("pageInfo", { page: page + 1, total: totalPages })}
                            </span>
                            <button
                                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                                disabled={page >= totalPages - 1}
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {actionUser && actionType && actionType !== "manage" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-on-surface">
                            {t(`action_${actionType}`, { name: actionUser.name || actionUser.phone })}
                        </h3>
                        <p className="mt-2 text-sm text-on-surface-variant">
                            {t("actionUser")}: <span className="font-medium">{actionUser.name || actionUser.phone}</span>
                        </p>

                        {needsReason && (
                            <label className="mt-4 block">
                                <span className="text-sm font-medium text-on-surface-variant">{t("reason")}</span>
                                <textarea
                                    value={actionReason}
                                    onChange={(e) => setActionReason(e.target.value)}
                                    rows={3}
                                    className="mt-1 w-full rounded-xl bg-surface-container-low p-3 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none"
                                />
                            </label>
                        )}

                        {needsDays && (
                            <label className="mt-4 block">
                                <span className="text-sm font-medium text-on-surface-variant">{t("days")}</span>
                                <input
                                    type="number"
                                    value={actionDays}
                                    onChange={(e) => setActionDays(e.target.value)}
                                    min={1}
                                    className="mt-1 w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none"
                                />
                            </label>
                        )}

                        <div className="mt-6 flex gap-3 justify-end">
                            <button
                                onClick={() => { setActionUser(null); setActionType(null); }}
                                className="rounded-xl px-5 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
                            >
                                {t("cancel")}
                            </button>
                            <button
                                onClick={handleAction}
                                disabled={actionLoading}
                                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary hover:opacity-90 disabled:opacity-50 transition-opacity"
                            >
                                {actionLoading ? t("loading") : t("confirm")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {actionUser && actionType === "manage" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-on-surface">{actionUser.name || actionUser.phone}</h3>
                            <button onClick={() => { setActionUser(null); setActionType(null); }} className="text-on-surface-variant hover:text-on-surface">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="space-y-1">
                            <ActionItem label={t("actSuspend")} show={actionUser.status === "ACTIVE"} onClick={() => { setActionType("suspend"); }} danger />
                            <ActionItem label={t("actUnsuspend")} show={actionUser.status === "SUSPENDED"} onClick={() => { setActionType("unsuspend"); }} />
                            <ActionItem label={t("actArchive")} show={actionUser.status === "ACTIVE" || actionUser.status === "SUSPENDED"} onClick={() => { setActionType("archive"); }} />
                            <ActionItem label={t("actRestore")} show={actionUser.status === "ARCHIVED" || actionUser.status === "SUSPENDED"} onClick={() => { setActionType("restore"); }} />
                            <ActionItem label={t("actExtendTrial")} show={true} onClick={() => { setActionType("extendTrial"); }} />
                            <ActionItem label={t("actResetPassword")} show={true} onClick={() => { setActionType("resetPassword"); }} />
                            {isSuperAdmin && <ActionItem label={t("actDelete")} show={actionUser.status !== "DELETED"} onClick={() => { setActionType("delete"); }} danger />}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ActionItem({ label, show, onClick, danger }: { label: string; show: boolean; onClick: () => void; danger?: boolean }) {
    if (!show) return null;
    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium hover:bg-surface-container-low transition-colors ${danger ? "text-error" : "text-on-surface"}`}
        >
            {label}
        </button>
    );
}
