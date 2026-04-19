/**
 * Admin Module API
 * Aligned with backend: AdminController (/admin/*)
 */

import apiClient from "@/lib/api";
import type {
    AdminUser,
    AdminListTicketsParams,
    AuditLogParams,
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
    if (params?.page !== undefined) query.set("page", String(params.page));
    if (params?.size !== undefined) query.set("size", String(params.size));

    const qs = query.toString();
    const { data } = await apiClient.get(`/admin/users${qs ? `?${qs}` : ""}`);
    return data.data;
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
    if (params?.userId) query.set("userId", params.userId);
    if (params?.action) query.set("action", params.action);
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);
    if (params?.page !== undefined) query.set("page", String(params.page));
    if (params?.size !== undefined) query.set("size", String(params.size));

    const qs = query.toString();
    const { data } = await apiClient.get(`/admin/audit-logs${qs ? `?${qs}` : ""}`);
    return data.data;
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
