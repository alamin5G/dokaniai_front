import apiClient from "@/lib/api";
import type {
    SupportTicket,
    TicketCreateRequest,
    TicketStats,
    PagedTickets,
    TicketStatus,
} from "@/types/support";

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    message?: string;
}

function unwrap<T>(response: { data: ApiSuccess<T> }): T {
    return response.data.data;
}

export async function listTickets(
    status?: TicketStatus,
    page = 0,
    size = 20,
): Promise<PagedTickets> {
    const response = await apiClient.get<ApiSuccess<PagedTickets>>("/support/tickets", {
        params: { status, page, size },
    });
    return unwrap(response);
}

export async function createTicket(request: TicketCreateRequest): Promise<SupportTicket> {
    const response = await apiClient.post<ApiSuccess<SupportTicket>>("/support/tickets", request);
    return unwrap(response);
}

export async function getTicket(ticketId: string): Promise<SupportTicket> {
    const response = await apiClient.get<ApiSuccess<SupportTicket>>(`/support/tickets/${ticketId}`);
    return unwrap(response);
}

export async function addTicketMessage(
    ticketId: string,
    message: string,
): Promise<SupportTicket> {
    const response = await apiClient.post<ApiSuccess<SupportTicket>>(
        `/support/tickets/${ticketId}/messages`,
        { message },
    );
    return unwrap(response);
}

export async function closeTicket(ticketId: string): Promise<SupportTicket> {
    const response = await apiClient.post<ApiSuccess<SupportTicket>>(
        `/support/tickets/${ticketId}/close`,
    );
    return unwrap(response);
}

export async function reopenTicket(
    ticketId: string,
    reason?: string,
): Promise<SupportTicket> {
    const response = await apiClient.post<ApiSuccess<SupportTicket>>(
        `/support/tickets/${ticketId}/reopen`,
        null,
        { params: { reason } },
    );
    return unwrap(response);
}
