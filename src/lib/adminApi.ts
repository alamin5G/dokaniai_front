/**
 * Admin Module API
 * Aligned with backend: AdminController (/admin/*)
 */

import apiClient from "@/lib/api";
import type {
    AdminUser,
    AdminListTicketsParams,
    AdminNotificationFilters,
    PagedAdminNotifications,
    AuditLogParams,
    AuditLogSummary,
    AssignTicketRequest,
    ComplimentaryUpgradeRequest,
    EscalateTicketRequest,
    ExtendTrialRequest,
    InternalNoteRequest,
    ListUsersParams,
    PagedAuditLogs,
    PagedReferralEvents,
    PagedUsers,
    ReferralEventsParams,
    ReferralStats,
    RevenueTrendData,
    UserGrowthData,
    AiTokenStats,
    SuspendUserRequest,
    SystemStats,
    TicketResponseRequest,
    UpdateRoleRequest,
} from "@/types/admin";
import type { SupportTicket } from "@/types/support";

// ─── User Management ────────────────────────────────────────────────────────

export async function listUsers(params?: ListUsersParams): Promise<PagedUsers> {
    const query = new URLSearchParams();
    if (params?.role) query.set("role", params.role);
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    if (params?.plan) query.set("plan", params.plan);
    if (params?.page !== undefined) query.set("page", String(params.page));
    if (params?.size !== undefined) query.set("size", String(params.size));

    const qs = query.toString();
    const url = `/admin/users${qs ? `?${qs}` : ""}`;
    const { data: response } = await apiClient.get(url);
    console.log("[AdminUsers] API response:", {
        url,
        success: response?.success,
        userCount: response?.data?.content?.length,
        totalElements: response?.data?.totalElements,
        totalPages: response?.data?.totalPages,
    });
    return response.data;
}

export async function getUserDetails(userId: string): Promise<AdminUser> {
    const { data } = await apiClient.get(`/admin/users/${userId}`);
    return data.data;
}

export interface AdminBusiness {
    id: string;
    userId: string;
    name: string;
    slug: string;
    type: string | null;
    status: string;
    archivedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export async function getUserBusinesses(userId: string): Promise<AdminBusiness[]> {
    const { data } = await apiClient.get(`/admin/users/${userId}/businesses`);
    return data.data;
}

export async function suspendUser(userId: string, request: SuspendUserRequest): Promise<void> {
    await apiClient.post(`/admin/users/${userId}/suspend`, request);
}

export async function unsuspendUser(userId: string): Promise<void> {
    await apiClient.post(`/admin/users/${userId}/unsuspend`);
}

export async function archiveUser(userId: string, reason?: string): Promise<void> {
    const query = reason ? `?reason=${encodeURIComponent(reason)}` : "";
    await apiClient.post(`/admin/users/${userId}/archive${query}`);
}

export async function restoreUser(userId: string, reason?: string): Promise<void> {
    const query = reason ? `?reason=${encodeURIComponent(reason)}` : "";
    await apiClient.post(`/admin/users/${userId}/restore${query}`);
}

export async function deleteUser(userId: string, reason?: string): Promise<void> {
    const query = reason ? `?reason=${encodeURIComponent(reason)}` : "";
    await apiClient.delete(`/admin/users/${userId}${query}`);
}

export async function extendTrial(userId: string, request: ExtendTrialRequest): Promise<void> {
    await apiClient.post(`/admin/users/${userId}/extend-trial`, request);
}

export async function grantComplimentaryUpgrade(
    userId: string,
    request: ComplimentaryUpgradeRequest
): Promise<void> {
    await apiClient.post(`/admin/users/${userId}/complimentary`, request);
}

export async function resetUserPassword(userId: string): Promise<void> {
    await apiClient.post(`/admin/users/${userId}/reset-password`);
}

export async function updateUserRole(userId: string, request: UpdateRoleRequest): Promise<void> {
    await apiClient.put(`/admin/users/${userId}/role`, request);
}

export async function exportUsersCsv(): Promise<Blob> {
    const { data } = await apiClient.get("/admin/users/export", {
        responseType: "blob",
    });
    return data;
}

// ─── Support Ticket Management ──────────────────────────────────────────────

export async function adminListTickets(
    params?: AdminListTicketsParams
): Promise<{ content: SupportTicket[]; totalElements: number; totalPages: number; number: number; size: number }> {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.assignedTo) query.set("assignedTo", params.assignedTo);
    if (params?.page !== undefined) query.set("page", String(params.page));
    if (params?.size !== undefined) query.set("size", String(params.size));

    const qs = query.toString();
    const { data } = await apiClient.get(`/admin/support/tickets${qs ? `?${qs}` : ""}`);
    return data.data;
}

export async function assignTicket(
    ticketId: string,
    request: AssignTicketRequest
): Promise<void> {
    await apiClient.post(`/admin/support/tickets/${ticketId}/assign`, request);
}

export async function respondToTicket(
    ticketId: string,
    request: TicketResponseRequest
): Promise<void> {
    await apiClient.post(`/admin/support/tickets/${ticketId}/respond`, request);
}

export async function addInternalNote(
    ticketId: string,
    request: InternalNoteRequest
): Promise<void> {
    await apiClient.post(`/admin/support/tickets/${ticketId}/internal-note`, request);
}

export async function escalateTicket(
    ticketId: string,
    request?: EscalateTicketRequest
): Promise<void> {
    await apiClient.post(`/admin/support/tickets/${ticketId}/escalate`, request ?? {});
}

// ─── Audit Logs ─────────────────────────────────────────────────────────────

export async function getAuditLogs(params?: AuditLogParams): Promise<PagedAuditLogs> {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.actorId) query.set("actorId", params.actorId);
    if (params?.userId) query.set("userId", params.userId);
    if (params?.targetUserId) query.set("targetUserId", params.targetUserId);
    if (params?.action) query.set("action", params.action);
    if (params?.severity) query.set("severity", params.severity);
    if (params?.status) query.set("status", params.status);
    if (params?.targetEntity) query.set("targetEntity", params.targetEntity);
    if (params?.ipAddress) query.set("ipAddress", params.ipAddress);
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);
    if (params?.page !== undefined) query.set("page", String(params.page));
    if (params?.size !== undefined) query.set("size", String(params.size));

    const qs = query.toString();
    const { data } = await apiClient.get(`/admin/audit-logs${qs ? `?${qs}` : ""}`);
    return data.data;
}

export async function getAuditLogSummary(params?: AuditLogParams): Promise<AuditLogSummary> {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.actorId) query.set("actorId", params.actorId);
    if (params?.userId) query.set("userId", params.userId);
    if (params?.targetUserId) query.set("targetUserId", params.targetUserId);
    if (params?.action) query.set("action", params.action);
    if (params?.severity) query.set("severity", params.severity);
    if (params?.status) query.set("status", params.status);
    if (params?.targetEntity) query.set("targetEntity", params.targetEntity);
    if (params?.ipAddress) query.set("ipAddress", params.ipAddress);
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);

    const qs = query.toString();
    const { data } = await apiClient.get(`/admin/audit-logs/summary${qs ? `?${qs}` : ""}`);
    return data.data;
}

export async function downloadAuditLogsCsv(params?: AuditLogParams): Promise<Blob> {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.actorId) query.set("actorId", params.actorId);
    if (params?.userId) query.set("userId", params.userId);
    if (params?.targetUserId) query.set("targetUserId", params.targetUserId);
    if (params?.action) query.set("action", params.action);
    if (params?.severity) query.set("severity", params.severity);
    if (params?.status) query.set("status", params.status);
    if (params?.targetEntity) query.set("targetEntity", params.targetEntity);
    if (params?.ipAddress) query.set("ipAddress", params.ipAddress);
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);

    const qs = query.toString();
    const { data } = await apiClient.get(`/admin/audit-logs/export${qs ? `?${qs}` : ""}`, {
        responseType: "blob",
    });
    return data;
}

// ─── System Stats ───────────────────────────────────────────────────────────

export async function getSystemStats(): Promise<SystemStats> {
    const { data } = await apiClient.get("/admin/stats");
    return data.data;
}

// ─── Referral Events ─────────────────────────────────────────────────────────

export async function getReferralStats(): Promise<ReferralStats> {
    const { data } = await apiClient.get("/admin/referrals/stats");
    return data.data;
}

export async function getReferralEvents(params?: ReferralEventsParams): Promise<PagedReferralEvents> {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.page !== undefined) query.set("page", String(params.page));
    if (params?.size !== undefined) query.set("size", String(params.size));

    const qs = query.toString();
    const { data } = await apiClient.get(`/admin/referrals/events${qs ? `?${qs}` : ""}`);
    return data.data;
}

export async function getReferralEventsByUser(
    userId: string,
    page = 0,
    size = 20
): Promise<PagedReferralEvents> {
    const { data } = await apiClient.get(
        `/admin/referrals/users/${userId}?page=${page}&size=${size}`
    );
    return data.data;
}

export async function revokeReferralEvent(eventId: string): Promise<void> {
    await apiClient.patch(`/admin/referrals/events/${eventId}/revoke`);
}

export async function getTopReferrers(limit = 10): Promise<string[]> {
    const { data } = await apiClient.get(`/admin/referrals/top-referrers?limit=${limit}`);
    return data.data;
}

// ─── Expense Category Management ────────────────────────────────────────────

export interface AdminExpenseCategory {
    id: string;
    name: string;
    nameBn: string | null;
    displayName: string;
    scope: string;
    businessId: string | null;
    icon: string | null;
    color: string | null;
    sortOrder: number;
    isActive: boolean;
    createdBy: string | null;
    createdAt: string;
}

export async function listAdminExpenseCategories(params?: {
    scope?: string;
    active?: boolean;
    search?: string;
}): Promise<AdminExpenseCategory[]> {
    const query = new URLSearchParams();
    if (params?.scope) query.set("scope", params.scope);
    if (params?.active !== undefined) query.set("active", String(params.active));
    if (params?.search) query.set("search", params.search);
    const { data } = await apiClient.get(`/admin/expense-categories?${query.toString()}`);
    return data.data;
}

export async function createAdminExpenseCategory(payload: {
    name: string;
    nameBn?: string;
    icon?: string;
    color?: string;
    sortOrder?: number;
}): Promise<AdminExpenseCategory> {
    const { data } = await apiClient.post("/admin/expense-categories", payload);
    return data.data;
}

export async function updateAdminExpenseCategory(
    id: string,
    payload: { name?: string; nameBn?: string; icon?: string; color?: string; sortOrder?: number },
): Promise<AdminExpenseCategory> {
    const { data } = await apiClient.put(`/admin/expense-categories/${id}`, payload);
    return data.data;
}

export async function toggleAdminExpenseCategory(id: string): Promise<AdminExpenseCategory> {
    const { data } = await apiClient.patch(`/admin/expense-categories/${id}/toggle`);
    return data.data;
}

export async function deleteAdminExpenseCategory(id: string): Promise<void> {
    await apiClient.delete(`/admin/expense-categories/${id}`);
}

// ─── Plan Feature Management ────────────────────────────────────────────────

export interface AdminPlan {
    id: string;
    name: string;
    displayNameEn: string | null;
    displayNameBn: string | null;
    priceBdt: number;
    annualPriceBdt: number | null;
    durationDays: number;
    gracePeriodDays: number;
    maxBusinesses: number;
    maxProductsPerBusiness: number;
    aiQueriesPerDay: number;
    maxAiTokensPerQuery: number;
    maxQueryCharacters: number;
    conversationHistoryTurns: number;
    features: Record<string, boolean> | null;
    featureConfigs?: AdminPlanFeature[];
    isActive: boolean;
    highlight: boolean;
    badge: string | null;
    createdAt: string;
    updatedAt: string;
}

export type FeatureType = "BOOLEAN" | "LIMIT" | "QUOTA";
export type QuotaResetPeriod = "DAILY" | "WEEKLY" | "MONTHLY" | "NEVER";

export interface AdminFeature {
    id: string;
    key: string;
    nameEn: string | null;
    nameBn: string | null;
    description: string | null;
    category: string | null;
    icon: string | null;
    type: FeatureType;
    displayOrder: number | null;
    isPublic: boolean;
    isActive: boolean;
}

export interface AdminPlanFeature {
    planFeatureId: string | null;
    planId: string;
    planName: string | null;
    tierLevel: number | null;
    featureId: string;
    featureKey: string;
    nameEn: string | null;
    nameBn: string | null;
    category: string | null;
    type: FeatureType;
    enabled: boolean;
    limitValue: number | null;
    resetPeriod: QuotaResetPeriod | null;
    publicFeature: boolean | null;
    activeFeature: boolean | null;
    displayOrder: number | null;
}

export interface AdminPlanFeatureMatrix {
    planId: string;
    planName: string;
    displayNameEn: string | null;
    displayNameBn: string | null;
    tierLevel: number | null;
    features: AdminPlanFeature[];
}

export interface UpdatePlanFeaturePayload {
    enabled: boolean;
    limitValue?: number | null;
    resetPeriod?: QuotaResetPeriod | null;
}

export interface FeatureUpsertPayload {
    key: string;
    nameEn: string;
    nameBn: string;
    description?: string | null;
    category: string;
    icon?: string | null;
    type: FeatureType;
    displayOrder?: number | null;
    isPublic?: boolean | null;
    isActive?: boolean | null;
}

export interface PlanUpdatePayload {
    priceBdt: number;
    annualPriceBdt?: number | null;
    durationDays: number;
    gracePeriodDays?: number | null;
    maxBusinesses?: number | null;
    maxProductsPerBusiness?: number | null;
    aiQueriesPerDay?: number | null;
    maxAiTokensPerQuery?: number | null;
    maxQueryCharacters?: number | null;
    conversationHistoryTurns?: number | null;
    isActive?: boolean | null;
    highlight?: boolean | null;
    badge?: string | null;
    displayNameBn?: string | null;
    displayNameEn?: string | null;
}

export async function getPlans(): Promise<AdminPlan[]> {
    const { data } = await apiClient.get("/admin/plans");
    return data.data;
}

export async function updatePlan(planId: string, payload: PlanUpdatePayload): Promise<AdminPlan> {
    const { data } = await apiClient.put(`/admin/plans/${planId}`, payload);
    return data.data;
}

export async function getFeatureCatalog(): Promise<AdminFeature[]> {
    const { data } = await apiClient.get("/admin/features");
    return data.data;
}

export async function createFeature(payload: FeatureUpsertPayload): Promise<AdminFeature> {
    const { data } = await apiClient.post("/admin/features", payload);
    return data.data;
}

export async function updateFeature(featureId: string, payload: FeatureUpsertPayload): Promise<AdminFeature> {
    const { data } = await apiClient.put(`/admin/features/${featureId}`, payload);
    return data.data;
}

export async function setFeatureActive(featureId: string, active: boolean): Promise<AdminFeature> {
    const { data } = await apiClient.patch(`/admin/features/${featureId}/active`, null, {
        params: { active },
    });
    return data.data;
}

export async function getPlanFeatureMatrix(): Promise<AdminPlanFeatureMatrix[]> {
    const { data } = await apiClient.get("/admin/plans/feature-matrix");
    return data.data;
}

export async function updatePlanFeatureConfig(
    planName: string,
    featureKey: string,
    payload: UpdatePlanFeaturePayload,
): Promise<AdminPlanFeature> {
    const { data } = await apiClient.put(`/admin/plans/${planName}/features/${featureKey}`, payload);
    return data.data;
}

export async function togglePlanFeature(
    planName: string,
    featureName: string,
    enabled: boolean
): Promise<AdminPlan> {
    const { data } = await apiClient.put(`/admin/plans/${planName}/features`, {
        featureName,
        enabled,
    });
    return data.data;
}

// ─── Admin Notifications ────────────────────────────────────────────────────

export async function getAdminNotifications(
    params?: AdminNotificationFilters
): Promise<PagedAdminNotifications> {
    const query = new URLSearchParams();
    if (params?.type) query.set("type", params.type);
    if (params?.severity) query.set("severity", params.severity);
    if (params?.page !== undefined) query.set("page", String(params.page));
    if (params?.size !== undefined) query.set("size", String(params.size));
    const qs = query.toString();
    const { data } = await apiClient.get(`/admin/notifications${qs ? `?${qs}` : ""}`);
    return data.data;
}

export async function getAdminNotificationCount(): Promise<number> {
    const { data } = await apiClient.get("/admin/notifications/count");
    return data.data;
}

export async function markAdminNotificationRead(id: number): Promise<void> {
    await apiClient.put(`/admin/notifications/${id}/read`);
}

export async function markAllAdminNotificationsRead(): Promise<void> {
    await apiClient.put("/admin/notifications/read-all");
}

export async function dismissAdminNotification(id: number): Promise<void> {
    await apiClient.put(`/admin/notifications/${id}/dismiss`);
}

// ─── Dashboard Analytics ─────────────────────────────────────────────────────

/** Convert frontend TimeRange to backend range param */
function toRangeParam(range: string): string {
    const map: Record<string, string> = { "7D": "7d", "30D": "30d", "90D": "90d", "1Y": "90d" };
    return map[range] ?? "7d";
}

export async function getDashboardRevenueTrend(range: string): Promise<RevenueTrendData> {
    const { data } = await apiClient.get(`/admin/dashboard/revenue-trend?range=${toRangeParam(range)}`);
    return data.data;
}

export async function getDashboardUserGrowth(range: string): Promise<UserGrowthData> {
    const { data } = await apiClient.get(`/admin/dashboard/user-growth?range=${toRangeParam(range)}`);
    return data.data;
}

export async function getDashboardAiTokenStats(range: string): Promise<AiTokenStats> {
    const { data } = await apiClient.get(`/admin/dashboard/ai-token-stats?range=${toRangeParam(range)}`);
    return data.data;
}

export async function exportDashboardCsv(range: string): Promise<Blob> {
    const { data } = await apiClient.get(`/admin/dashboard/export?range=${toRangeParam(range)}`, {
        responseType: "blob",
    });
    return data;
}
