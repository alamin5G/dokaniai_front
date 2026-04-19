"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import * as adminApi from "@/lib/adminApi";
import type {
    AdminUser,
    AuditLog,
    SystemStats,
    UserRole,
    UserStatus,
} from "@/types/admin";
import type { SupportTicket } from "@/types/support";
import CouponsTab from "./CouponsTab";
import CategoryRequestsTab from "./CategoryRequestsTab";
import PaymentsTab from "./PaymentsTab";
import ReferralConfigTab from "./ReferralConfigTab";
import ReferralEventsTab from "./ReferralEventsTab";

// ─── Icons (inline SVG) ─────────────────────────────────────────────────────

function IconUsers({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
    );
}

function IconShield({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
    );
}

function IconTicket({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
        </svg>
    );
}

function IconClipboard({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
    );
}

function IconSearch({ className = "w-4 h-4" }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
    );
}

function IconDownload({ className = "w-4 h-4" }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
    );
}

function IconChevron({ className = "w-4 h-4" }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
    );
}

function IconTag({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
    );
}

function IconFolder({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
    );
}

function IconPayment({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
    );
}

// ─── Tab type ────────────────────────────────────────────────────────────────

type TabKey = "dashboard" | "users" | "coupons" | "categories" | "payments" | "referral" | "referralEvents" | "tickets" | "audit";

// ─── Status Badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        ACTIVE: "bg-green-100 text-green-800",
        SUSPENDED: "bg-red-100 text-red-800",
        ARCHIVED: "bg-gray-100 text-gray-800",
        DELETED: "bg-red-200 text-red-900",
        OPEN: "bg-blue-100 text-blue-800",
        IN_PROGRESS: "bg-yellow-100 text-yellow-800",
        WAITING_USER: "bg-orange-100 text-orange-800",
        RESOLVED: "bg-green-100 text-green-800",
        CLOSED: "bg-gray-100 text-gray-600",
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}>
            {status}
        </span>
    );
}

function RoleBadge({ role }: { role: string }) {
    const colors: Record<string, string> = {
        USER: "bg-surface-container-low text-on-surface-variant",
        ADMIN: "bg-primary-container/20 text-primary",
        SUPER_ADMIN: "bg-tertiary-container/30 text-tertiary",
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${colors[role] || "bg-gray-100 text-gray-800"}`}>
            {role}
        </span>
    );
}

// ─── Severity Badge ─────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
    const colors: Record<string, string> = {
        INFO: "bg-blue-100 text-blue-800",
        WARNING: "bg-yellow-100 text-yellow-800",
        ERROR: "bg-red-100 text-red-800",
        CRITICAL: "bg-red-200 text-red-900",
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[severity] || "bg-gray-100 text-gray-800"}`}>
            {severity}
        </span>
    );
}

// ─── KPI Card ───────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon: React.ReactNode }) {
    return (
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/10">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-on-surface-variant">{label}</p>
                    <p className="mt-2 text-3xl font-bold text-on-surface">{value}</p>
                    {sub && <p className="mt-1 text-xs text-on-surface-variant">{sub}</p>}
                </div>
                <div className="rounded-xl bg-primary-container/20 p-3 text-primary">{icon}</div>
            </div>
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AdminWorkspace() {
    const t = useTranslations("admin");
    const { userRole } = useAuthStore();
    const isSuperAdmin = userRole === "SUPER_ADMIN";

    const [activeTab, setActiveTab] = useState<TabKey>("dashboard");

    const tabs: { key: TabKey; label: string; icon: React.ReactNode; superAdminOnly?: boolean }[] = [
        { key: "dashboard", label: t("tabs.dashboard"), icon: <IconShield /> },
        { key: "users", label: t("tabs.users"), icon: <IconUsers /> },
        { key: "coupons", label: t("tabs.coupons"), icon: <IconTag /> },
        { key: "categories", label: t("tabs.categories"), icon: <IconFolder /> },
        { key: "payments", label: t("tabs.payments"), icon: <IconPayment /> },
        { key: "referral", label: t("tabs.referral"), icon: <IconTag /> },
        { key: "referralEvents", label: t("tabs.referralEvents"), icon: <IconClipboard /> },
        { key: "tickets", label: t("tabs.tickets"), icon: <IconTicket /> },
        { key: "audit", label: t("tabs.audit"), icon: <IconClipboard />, superAdminOnly: true },
    ];

    const visibleTabs = tabs.filter((tab) => !tab.superAdminOnly || isSuperAdmin);

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-on-surface">{t("title")}</h1>
                    <p className="mt-1 text-sm text-on-surface-variant">{t("subtitle")}</p>
                </div>
                <RoleBadge role={userRole || "USER"} />
            </header>

            {/* Tab Navigation */}
            <nav className="flex gap-2 overflow-x-auto pb-2">
                {visibleTabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-all ${activeTab === tab.key
                            ? "bg-primary text-on-primary shadow-sm"
                            : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </nav>

            {/* Tab Content */}
            {activeTab === "dashboard" && <DashboardTab />}
            {activeTab === "users" && <UsersTab />}
            {activeTab === "coupons" && <CouponsTab />}
            {activeTab === "categories" && <CategoryRequestsTab />}
            {activeTab === "payments" && <PaymentsTab />}
            {activeTab === "referral" && <ReferralConfigTab />}
            {activeTab === "referralEvents" && <ReferralEventsTab />}
            {activeTab === "tickets" && <TicketsTab />}
            {activeTab === "audit" && isSuperAdmin && <AuditTab />}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Dashboard Tab
// ═══════════════════════════════════════════════════════════════════════════

export function DashboardTab() {
    const t = useTranslations("admin.dashboard");
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminApi.getSystemStats().then(setStats).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-surface-container-high border-t-primary" />
            </div>
        );
    }

    if (!stats) {
        return <p className="text-center text-on-surface-variant py-20">{t("error")}</p>;
    }

    const sub = stats.subscriptionStats as Record<string, number> | null;
    const tk = stats.ticketStats as Record<string, number> | null;

    return (
        <div className="space-y-8">
            {/* User KPIs */}
            <section>
                <h2 className="text-lg font-bold text-on-surface mb-4">{t("userStats")}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard label={t("totalUsers")} value={stats.totalUsers} icon={<IconUsers />} />
                    <KpiCard label={t("activeUsers")} value={stats.activeUsers} sub={`${Math.round((stats.activeUsers / Math.max(stats.totalUsers, 1)) * 100)}%`} icon={<IconUsers className="w-5 h-5 text-green-600" />} />
                    <KpiCard label={t("suspendedUsers")} value={stats.suspendedUsers} icon={<IconShield className="w-5 h-5 text-red-500" />} />
                    <KpiCard label={t("adminCount")} value={stats.adminCount + stats.superAdminCount} sub={`SA: ${stats.superAdminCount}`} icon={<IconShield />} />
                </div>
            </section>

            {/* Subscription Stats */}
            {sub && (
                <section>
                    <h2 className="text-lg font-bold text-on-surface mb-4">{t("subscriptionStats")}</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {(["totalActive", "trialUsers", "basicUsers", "proUsers", "plusUsers"] as const).map((key) => (
                            <div key={key} className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-outline-variant/10">
                                <p className="text-xs font-medium text-on-surface-variant">{t(key)}</p>
                                <p className="mt-2 text-2xl font-bold text-on-surface">{sub[key] ?? 0}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Ticket Stats */}
            {tk && (
                <section>
                    <h2 className="text-lg font-bold text-on-surface mb-4">{t("ticketStats")}</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {(["totalOpen", "totalInProgress", "totalResolved", "totalClosed", "unassignedCount"] as const).map((key) => (
                            <div key={key} className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-outline-variant/10">
                                <p className="text-xs font-medium text-on-surface-variant">{t(key)}</p>
                                <p className="mt-2 text-2xl font-bold text-on-surface">{tk[key] ?? 0}</p>
                            </div>
                        ))}
                        <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-outline-variant/10">
                            <p className="text-xs font-medium text-on-surface-variant">{t("avgResolution")}</p>
                            <p className="mt-2 text-2xl font-bold text-on-surface">{tk.averageResolutionTime ? `${tk.averageResolutionTime}h` : "—"}</p>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Users Tab
// ═══════════════════════════════════════════════════════════════════════════

export function UsersTab() {
    const t = useTranslations("admin.users");
    const { userRole } = useAuthStore();
    const isSuperAdmin = userRole === "SUPER_ADMIN";

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
    const [statusFilter, setStatusFilter] = useState<UserStatus | "">("");

    // Action modal state
    const [actionUser, setActionUser] = useState<AdminUser | null>(null);
    const [actionType, setActionType] = useState<string | null>(null);
    const [actionReason, setActionReason] = useState("");
    const [actionDays, setActionDays] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const result = await adminApi.listUsers({
                search: search || undefined,
                role: roleFilter || undefined,
                status: statusFilter || undefined,
                page,
                size: 20,
            });
            setUsers(result.content);
            setTotalPages(result.totalPages);
        } catch {
            // error handled silently
        } finally {
            setLoading(false);
        }
    }, [search, roleFilter, statusFilter, page]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

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
                    await adminApi.deleteUser(actionUser.id, actionReason || undefined);
                    break;
                case "extendTrial":
                    await adminApi.extendTrial(actionUser.id, { days: parseInt(actionDays) || 7, reason: actionReason || undefined });
                    break;
                case "resetPassword":
                    await adminApi.resetUserPassword(actionUser.id);
                    break;
                case "role_USER":
                    await adminApi.updateUserRole(actionUser.id, { role: "USER" });
                    break;
                case "role_ADMIN":
                    await adminApi.updateUserRole(actionUser.id, { role: "ADMIN" });
                    break;
                case "role_SUPER_ADMIN":
                    await adminApi.updateUserRole(actionUser.id, { role: "SUPER_ADMIN" });
                    break;
            }
            setActionUser(null);
            setActionType(null);
            setActionReason("");
            setActionDays("");
            loadUsers();
        } catch {
            // error handled silently
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
            // error handled silently
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
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                        placeholder={t("searchPlaceholder")}
                        className="w-full rounded-xl bg-surface-container-lowest py-2.5 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/60 border border-outline-variant/20 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => { setRoleFilter(e.target.value as UserRole | ""); setPage(0); }}
                    className="rounded-xl bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20"
                >
                    <option value="">{t("allRoles")}</option>
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                    {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value as UserStatus | ""); setPage(0); }}
                    className="rounded-xl bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20"
                >
                    <option value="">{t("allStatuses")}</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="ARCHIVED">Archived</option>
                    {isSuperAdmin && <option value="DELETED">Deleted</option>}
                </select>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 rounded-xl bg-secondary-container/20 px-4 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-secondary-container/30 transition-colors"
                >
                    <IconDownload /> {t("export")}
                </button>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="bg-surface-container-low text-sm font-bold text-on-surface-variant">
                            <tr>
                                <th className="px-6 py-4">{t("colName")}</th>
                                <th className="px-6 py-4">{t("colPhone")}</th>
                                <th className="px-6 py-4">{t("colRole")}</th>
                                <th className="px-6 py-4">{t("colStatus")}</th>
                                <th className="px-6 py-4">{t("colLastLogin")}</th>
                                <th className="px-6 py-4">{t("colCreated")}</th>
                                <th className="px-6 py-4 text-right">{t("colActions")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant">
                                        <div className="flex justify-center">
                                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-container-high border-t-primary" />
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant">{t("noUsers")}</td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-surface-container-low transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-on-surface">{user.name || "—"}</p>
                                                <p className="text-xs text-on-surface-variant">{user.email || ""}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant">{user.phone}</td>
                                        <td className="px-6 py-4"><RoleBadge role={user.role} /></td>
                                        <td className="px-6 py-4"><StatusBadge status={user.status} /></td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant">
                                            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "—"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <UserActionsMenu user={user} onAction={openAction} isSuperAdmin={isSuperAdmin} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-surface-container px-6 py-3">
                        <button
                            onClick={() => setPage(Math.max(0, page - 1))}
                            disabled={page === 0}
                            className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface disabled:opacity-40"
                        >
                            <IconChevron className="w-4 h-4 rotate-180" /> {t("prev")}
                        </button>
                        <span className="text-sm text-on-surface-variant">
                            {t("pageInfo", { page: page + 1, total: totalPages })}
                        </span>
                        <button
                            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                            disabled={page >= totalPages - 1}
                            className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface disabled:opacity-40"
                        >
                            {t("next")} <IconChevron />
                        </button>
                    </div>
                )}
            </div>

            {/* Action Modal */}
            {actionUser && actionType && (
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
        </div>
    );
}

// ─── User Actions Dropdown ──────────────────────────────────────────────────

function UserActionsMenu({
    user,
    onAction,
    isSuperAdmin,
}: {
    user: AdminUser;
    onAction: (user: AdminUser, action: string) => void;
    isSuperAdmin: boolean;
}) {
    const [open, setOpen] = useState(false);
    const t = useTranslations("admin.users");

    const actions: { key: string; label: string; show: boolean; danger?: boolean }[] = [
        { key: "suspend", label: t("actSuspend"), show: user.status === "ACTIVE" },
        { key: "unsuspend", label: t("actUnsuspend"), show: user.status === "SUSPENDED" },
        { key: "archive", label: t("actArchive"), show: user.status === "ACTIVE" || user.status === "SUSPENDED" },
        { key: "restore", label: t("actRestore"), show: user.status === "ARCHIVED" || user.status === "SUSPENDED" },
        { key: "delete", label: t("actDelete"), show: isSuperAdmin && user.status !== "DELETED", danger: true },
        { key: "extendTrial", label: t("actExtendTrial"), show: true },
        { key: "resetPassword", label: t("actResetPassword"), show: true },
        { key: "role_ADMIN", label: t("actRoleAdmin"), show: isSuperAdmin && user.role !== "ADMIN" },
        { key: "role_SUPER_ADMIN", label: t("actRoleSuperAdmin"), show: isSuperAdmin && user.role !== "SUPER_ADMIN" },
        { key: "role_USER", label: t("actRoleUser"), show: isSuperAdmin && user.role !== "USER" },
    ];

    const visibleActions = actions.filter((a) => a.show);

    if (visibleActions.length === 0) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="rounded-lg px-3 py-1.5 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
                ⋯
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 z-50 mt-1 w-48 rounded-xl bg-surface-container-lowest shadow-lg border border-outline-variant/10 py-1">
                        {visibleActions.map((action) => (
                            <button
                                key={action.key}
                                onClick={() => { setOpen(false); onAction(user, action.key); }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-surface-container-low transition-colors ${action.danger ? "text-red-600" : "text-on-surface"
                                    }`}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tickets Tab (Admin-side support ticket management)
// ═══════════════════════════════════════════════════════════════════════════

export function TicketsTab() {
    const t = useTranslations("admin.tickets");
    const { userId: currentAdminId } = useAuthStore();

    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");

    // Detail view
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [replyText, setReplyText] = useState("");
    const [noteText, setNoteText] = useState("");
    const [replyLoading, setReplyLoading] = useState(false);

    const loadTickets = useCallback(async () => {
        setLoading(true);
        try {
            const result = await adminApi.adminListTickets({
                status: statusFilter || undefined,
                page,
                size: 20,
            });
            setTickets(result.content);
            setTotalPages(result.totalPages);
        } catch {
            // error handled silently
        } finally {
            setLoading(false);
        }
    }, [statusFilter, page]);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    async function handleAssign(ticket: SupportTicket) {
        if (!currentAdminId) return;
        try {
            await adminApi.assignTicket(ticket.id, { adminId: currentAdminId });
            loadTickets();
        } catch {
            // error handled silently
        }
    }

    async function handleReply() {
        if (!selectedTicket || !replyText.trim()) return;
        setReplyLoading(true);
        try {
            await adminApi.respondToTicket(selectedTicket.id, {
                message: replyText,
                isInternal: false,
            });
            setReplyText("");
            // Refresh ticket list
            loadTickets();
            // Update selected ticket's messages optimistically
            setSelectedTicket((prev) =>
                prev
                    ? {
                        ...prev,
                        messages: [
                            ...prev.messages,
                            {
                                id: `temp-${Date.now()}`,
                                ticketId: prev.id,
                                senderId: currentAdminId || "",
                                message: replyText,
                                isInternal: false,
                                attachments: null,
                                createdAt: new Date().toISOString(),
                            },
                        ],
                    }
                    : null
            );
        } catch {
            // error handled silently
        } finally {
            setReplyLoading(false);
        }
    }

    async function handleInternalNote() {
        if (!selectedTicket || !noteText.trim()) return;
        setReplyLoading(true);
        try {
            await adminApi.addInternalNote(selectedTicket.id, { note: noteText });
            setNoteText("");
        } catch {
            // error handled silently
        } finally {
            setReplyLoading(false);
        }
    }

    async function handleEscalate(ticket: SupportTicket) {
        try {
            await adminApi.escalateTicket(ticket.id);
            loadTickets();
        } catch {
            // error handled silently
        }
    }

    // ── Ticket Detail View ──
    if (selectedTicket) {
        return (
            <div className="space-y-6">
                <button
                    onClick={() => setSelectedTicket(null)}
                    className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
                >
                    <IconChevron className="w-4 h-4 rotate-180" /> {t("backToList")}
                </button>

                <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-on-surface">{selectedTicket.subject}</h2>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <StatusBadge status={selectedTicket.status} />
                                <span className="inline-flex items-center rounded-full bg-surface-container-low px-2.5 py-0.5 text-xs font-medium text-on-surface-variant">
                                    {selectedTicket.category}
                                </span>
                                <span className="inline-flex items-center rounded-full bg-surface-container-low px-2.5 py-0.5 text-xs font-medium text-on-surface-variant">
                                    {selectedTicket.priority}
                                </span>
                            </div>
                            <p className="mt-3 text-sm text-on-surface-variant whitespace-pre-wrap">{selectedTicket.body}</p>
                        </div>
                        <div className="flex gap-2">
                            {!selectedTicket.assignedAdminId && (
                                <button
                                    onClick={() => handleAssign(selectedTicket)}
                                    className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:opacity-90 transition-opacity"
                                >
                                    {t("assignToMe")}
                                </button>
                            )}
                            {selectedTicket.status !== "CLOSED" && selectedTicket.status !== "RESOLVED" && (
                                <button
                                    onClick={() => handleEscalate(selectedTicket)}
                                    className="rounded-xl bg-tertiary-container/20 px-4 py-2 text-sm font-medium text-tertiary hover:bg-tertiary-container/30 transition-colors"
                                >
                                    {t("escalate")}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Message Thread */}
                    <div className="mt-6 space-y-3">
                        <h3 className="text-sm font-bold text-on-surface-variant">{t("messages")}</h3>
                        {selectedTicket.messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`rounded-xl p-4 ${msg.isInternal
                                    ? "bg-yellow-50 border border-yellow-200"
                                    : "bg-surface-container-low"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-on-surface-variant">
                                        {msg.senderId === selectedTicket.userId ? t("senderUser") : t("senderAdmin")}
                                        {msg.isInternal && ` · ${t("internalNote")}`}
                                    </span>
                                    <span className="text-xs text-on-surface-variant">
                                        {new Date(msg.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <p className="mt-2 text-sm text-on-surface whitespace-pre-wrap">{msg.message}</p>
                            </div>
                        ))}
                    </div>

                    {/* Reply + Internal Note */}
                    <div className="mt-6 space-y-4">
                        <div>
                            <label className="text-sm font-medium text-on-surface-variant">{t("replyLabel")}</label>
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows={3}
                                placeholder={t("replyPlaceholder")}
                                className="mt-1 w-full rounded-xl bg-surface-container-low p-3 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none"
                            />
                            <button
                                onClick={handleReply}
                                disabled={replyLoading || !replyText.trim()}
                                className="mt-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary hover:opacity-90 disabled:opacity-50 transition-opacity"
                            >
                                {replyLoading ? t("sending") : t("sendReply")}
                            </button>
                        </div>

                        <div className="border-t border-surface-container pt-4">
                            <label className="text-sm font-medium text-on-surface-variant">{t("internalNoteLabel")}</label>
                            <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                rows={2}
                                placeholder={t("internalNotePlaceholder")}
                                className="mt-1 w-full rounded-xl bg-yellow-50 p-3 text-sm text-on-surface border border-yellow-200 focus:border-yellow-400 focus:outline-none"
                            />
                            <button
                                onClick={handleInternalNote}
                                disabled={replyLoading || !noteText.trim()}
                                className="mt-2 rounded-xl bg-yellow-100 px-5 py-2.5 text-sm font-medium text-yellow-800 hover:bg-yellow-200 disabled:opacity-50 transition-colors"
                            >
                                {t("addNote")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Ticket List View ──
    return (
        <div className="space-y-6">
            {/* Filter */}
            <div className="flex items-center gap-3">
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                    className="rounded-xl bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20"
                >
                    <option value="">{t("allStatuses")}</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="WAITING_USER">Waiting User</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                </select>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="bg-surface-container-low text-sm font-bold text-on-surface-variant">
                            <tr>
                                <th className="px-6 py-4">{t("colSubject")}</th>
                                <th className="px-6 py-4">{t("colCategory")}</th>
                                <th className="px-6 py-4">{t("colPriority")}</th>
                                <th className="px-6 py-4">{t("colStatus")}</th>
                                <th className="px-6 py-4">{t("colAssigned")}</th>
                                <th className="px-6 py-4">{t("colDate")}</th>
                                <th className="px-6 py-4 text-right">{t("colActions")}</th>
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
                            ) : tickets.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant">{t("noTickets")}</td>
                                </tr>
                            ) : (
                                tickets.map((ticket) => (
                                    <tr key={ticket.id} className="hover:bg-surface-container-low transition-colors cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-on-surface">{ticket.subject}</p>
                                            <p className="text-xs text-on-surface-variant truncate max-w-xs">{ticket.body}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant">{ticket.category}</td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant">{ticket.priority}</td>
                                        <td className="px-6 py-4"><StatusBadge status={ticket.status} /></td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant">
                                            {ticket.assignedAdminId ? t("assigned") : <span className="text-yellow-600 font-medium">{t("unassigned")}</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant">
                                            {new Date(ticket.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                                                {!ticket.assignedAdminId && (
                                                    <button
                                                        onClick={() => handleAssign(ticket)}
                                                        className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                                                    >
                                                        {t("assignToMe")}
                                                    </button>
                                                )}
                                                {ticket.status !== "CLOSED" && ticket.status !== "RESOLVED" && (
                                                    <button
                                                        onClick={() => handleEscalate(ticket)}
                                                        className="rounded-lg bg-tertiary-container/10 px-3 py-1 text-xs font-medium text-tertiary hover:bg-tertiary-container/20 transition-colors"
                                                    >
                                                        {t("escalate")}
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

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-surface-container px-6 py-3">
                        <button
                            onClick={() => setPage(Math.max(0, page - 1))}
                            disabled={page === 0}
                            className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface disabled:opacity-40"
                        >
                            <IconChevron className="w-4 h-4 rotate-180" /> {t("prev")}
                        </button>
                        <span className="text-sm text-on-surface-variant">
                            {t("pageInfo", { page: page + 1, total: totalPages })}
                        </span>
                        <button
                            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                            disabled={page >= totalPages - 1}
                            className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface disabled:opacity-40"
                        >
                            {t("next")} <IconChevron />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Audit Logs Tab (Super Admin only)
// ═══════════════════════════════════════════════════════════════════════════

export function AuditTab() {
    const t = useTranslations("admin.audit");

    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);

    const [actionFilter, setActionFilter] = useState("");
    const [userIdFilter, setUserIdFilter] = useState("");

    const loadLogs = useCallback(async () => {
        setLoading(true);
        try {
            const result = await adminApi.getAuditLogs({
                action: actionFilter || undefined,
                userId: userIdFilter || undefined,
                page,
                size: 50,
            });
            setLogs(result.content);
            setTotalPages(result.totalPages);
        } catch {
            // error handled silently
        } finally {
            setLoading(false);
        }
    }, [actionFilter, userIdFilter, page]);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    const actionTypes = useMemo(
        () => [
            "LOGIN", "LOGOUT", "PASSWORD_RESET", "PASSWORD_CHANGE",
            "SUSPEND_USER", "ACTIVATE_USER", "ARCHIVE_USER", "DELETE_USER",
            "ROLE_CHANGE", "SUBSCRIPTION_CHANGE", "TRIAL_EXTENSION",
            "ASSIGN_TICKET", "RESPOND_TICKET", "ESCALATE_TICKET",
            "SALE_CREATE", "DATA_EXPORT", "EXPORT_USERS",
        ],
        []
    );

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                    type="text"
                    value={userIdFilter}
                    onChange={(e) => { setUserIdFilter(e.target.value); setPage(0); }}
                    placeholder={t("filterUserId")}
                    className="rounded-xl bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20 focus:border-primary focus:outline-none"
                />
                <select
                    value={actionFilter}
                    onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
                    className="rounded-xl bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20"
                >
                    <option value="">{t("allActions")}</option>
                    {actionTypes.map((a) => (
                        <option key={a} value={a}>{a}</option>
                    ))}
                </select>
            </div>

            {/* Logs Table */}
            <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="bg-surface-container-low text-sm font-bold text-on-surface-variant">
                            <tr>
                                <th className="px-6 py-4">{t("colTimestamp")}</th>
                                <th className="px-6 py-4">{t("colAction")}</th>
                                <th className="px-6 py-4">{t("colActor")}</th>
                                <th className="px-6 py-4">{t("colTarget")}</th>
                                <th className="px-6 py-4">{t("colSeverity")}</th>
                                <th className="px-6 py-4">{t("colDetails")}</th>
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
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">{t("noLogs")}</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-surface-container-low transition-colors">
                                        <td className="px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center rounded-full bg-primary-container/10 px-2.5 py-0.5 text-xs font-mono font-medium text-primary">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant font-mono">
                                            {log.actorId.slice(0, 8)}…
                                        </td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant font-mono">
                                            {log.targetUserId ? `${log.targetUserId.slice(0, 8)}…` : "—"}
                                        </td>
                                        <td className="px-6 py-4"><SeverityBadge severity={log.severity} /></td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant max-w-xs truncate">
                                            {log.details || "—"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-surface-container px-6 py-3">
                        <button
                            onClick={() => setPage(Math.max(0, page - 1))}
                            disabled={page === 0}
                            className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface disabled:opacity-40"
                        >
                            <IconChevron className="w-4 h-4 rotate-180" /> {t("prev")}
                        </button>
                        <span className="text-sm text-on-surface-variant">
                            {t("pageInfo", { page: page + 1, total: totalPages })}
                        </span>
                        <button
                            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                            disabled={page >= totalPages - 1}
                            className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface disabled:opacity-40"
                        >
                            {t("next")} <IconChevron />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
