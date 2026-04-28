/**
 * Admin Module Types
 * Aligned with backend: AdminController (19 endpoints)
 */

// ─── Enums ──────────────────────────────────────────────────────────────────

export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED" | "DELETED";

// ─── User (Admin view) ──────────────────────────────────────────────────────

export interface AdminUserBusiness {
    id: string;
    name: string;
    type: string | null;
    status: string | null;
    // Optional fields for compatibility with AdminBusiness (populated on expand)
    userId?: string;
    slug?: string;
    archivedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface AdminUser {
    id: string;
    name: string | null;
    phone: string;
    phoneVerified: boolean;
    email: string | null;
    emailVerified: boolean;
    role: UserRole;
    status: UserStatus;
    trial1Used: boolean;
    trial1StartedAt: string | null;
    trial1ExpiredAt: string | null;
    trial2Used: boolean;
    trial2StartedAt: string | null;
    trial2ExpiredAt: string | null;
    deviceFingerprint: string | null;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
    businesses: AdminUserBusiness[];
}

// ─── Paginated Users ────────────────────────────────────────────────────────

export interface PagedUsers {
    content: AdminUser[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

// ─── Audit Log ──────────────────────────────────────────────────────────────

export interface AuditLog {
    id: string;
    actorId: string;
    targetUserId: string | null;
    action: string;
    targetEntity: string | null;
    targetEntityId: string | null;
    details: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    severity: string;
    status: string;
    businessId: string | null;
    description: string | null;
    sessionId: string | null;
    createdAt: string;
}

export interface PagedAuditLogs {
    content: AuditLog[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

export interface AuditFacetCount {
    label: string;
    count: number;
}

export interface AuditLogHighlight {
    id: string;
    actorId: string;
    action: string;
    severity: string;
    status: string;
    targetEntity: string | null;
    details: string | null;
    ipAddress: string | null;
    createdAt: string;
}

export interface AuditLogSummary {
    totalLogs: number;
    warningCount: number;
    criticalCount: number;
    failedCount: number;
    authEventCount: number;
    exportCount: number;
    uniqueActors: number;
    topActions: AuditFacetCount[];
    topEntities: AuditFacetCount[];
    highlights: AuditLogHighlight[];
}

// ─── System Stats ───────────────────────────────────────────────────────────

export interface SubscriptionStats {
    totalActive: number;
    trialUsers: number;
    basicUsers: number;
    proUsers: number;
    plusUsers: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export interface TicketStatsResponse {
    totalOpen: number;
    totalInProgress: number;
    totalResolved: number;
    totalClosed: number;
    unassignedCount: number;
    averageResolutionTime: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export interface SystemStats {
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    userCount: number;
    adminCount: number;
    superAdminCount: number;
    subscriptionStats: SubscriptionStats;
    ticketStats: TicketStatsResponse;
}

// ─── Request Types ──────────────────────────────────────────────────────────

export interface SuspendUserRequest {
    reason: string;
    duration?: number; // days, null for indefinite
}

export interface ExtendTrialRequest {
    days: number;
    reason?: string;
}

export interface ComplimentaryUpgradeRequest {
    planId: string;
    duration: number; // days
    reason?: string;
}

export interface UpdateRoleRequest {
    role: UserRole;
}

export interface AssignTicketRequest {
    adminId: string;
}

export interface TicketResponseRequest {
    message: string;
    isInternal: boolean;
    newStatus?: string; // TicketStatus
}

export interface InternalNoteRequest {
    note: string;
}

export interface EscalateTicketRequest {
    reason?: string;
}

// ─── List Users Filters ─────────────────────────────────────────────────────

export interface ListUsersParams {
    role?: UserRole;
    status?: UserStatus;
    search?: string;
    plan?: string;
    page?: number;
    size?: number;
}

// ─── List Tickets Filters ───────────────────────────────────────────────────

export interface AdminListTicketsParams {
    status?: string;
    assignedTo?: string;
    page?: number;
    size?: number;
}

// ─── Audit Log Filters ──────────────────────────────────────────────────────

export interface AuditLogParams {
    search?: string;
    actorId?: string;
    userId?: string;
    targetUserId?: string;
    action?: string;
    severity?: string;
    status?: string;
    targetEntity?: string;
    ipAddress?: string;
    startDate?: string; // ISO datetime
    endDate?: string;   // ISO datetime
    page?: number;
    size?: number;
}

// ─── Referral Events ─────────────────────────────────────────────────────────

export interface ReferralEvent {
    id: string;
    referrerUserId: string;
    referredUserId: string;
    referralCodeUsed: string;
    rewardType: string;
    rewardValue: number;
    rewardStatus: "PENDING" | "GRANTED" | "REVOKED" | "EXPIRED";
    rewardGrantedAt: string | null;
    expiresAt: string | null;
    ipAddress: string | null;
    deviceFingerprint: string | null;
    createdAt: string;
}

export interface PagedReferralEvents {
    content: ReferralEvent[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

export interface ReferralStats {
    totalEvents: number;
    pendingCount: number;
    grantedCount: number;
    revokedCount: number;
    expiredCount: number;
    totalGrantedRewardValue: number;
}

export interface ReferralEventsParams {
    status?: string;
    page?: number;
    size?: number;
}
