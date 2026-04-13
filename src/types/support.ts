/**
 * Support Module Types
 * Aligned with backend: SupportTicketController
 */

export type TicketCategory =
    | "GENERAL"
    | "BILLING"
    | "TECHNICAL"
    | "CATEGORY_REQUEST"
    | "FEATURE_REQUEST"
    | "ACCOUNT"
    | "OTHER";

export type TicketPriority =
    | "LOW"
    | "NORMAL"
    | "MEDIUM"
    | "HIGH"
    | "URGENT";

export type TicketStatus =
    | "OPEN"
    | "IN_PROGRESS"
    | "WAITING_USER"
    | "RESOLVED"
    | "CLOSED";

export interface SupportTicket {
    id: string;
    userId: string;
    assignedAdminId: string | null;
    subject: string;
    body: string;
    category: TicketCategory;
    status: TicketStatus;
    priority: TicketPriority;
    adminNote: string | null;
    resolution: string | null;
    resolvedAt: string | null;
    closedAt: string | null;
    lastResponseAt: string | null;
    messages: SupportTicketMessage[];
    createdAt: string;
    updatedAt: string;
}

export interface SupportTicketMessage {
    id: string;
    ticketId: string;
    senderId: string;
    message: string;
    isInternal: boolean;
    attachments: Array<Record<string, string>> | null;
    createdAt: string;
}

export interface TicketCreateRequest {
    subject: string;
    body: string;
    category: TicketCategory;
    priority: TicketPriority;
}

export interface TicketStats {
    totalOpen: number;
    totalInProgress: number;
    totalResolved: number;
    totalClosed: number;
    unassignedCount: number;
    averageResolutionTime: number;
}

export interface PagedTickets {
    content: SupportTicket[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}
