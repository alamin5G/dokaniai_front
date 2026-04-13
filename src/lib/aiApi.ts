import apiClient from "@/lib/api";
import type {
    AIChatRequest,
    AIResponse,
    AIUsageStats,
    AIParseRequest,
    ParsedAction,
    ConversationSummary,
    ConversationDetail,
    VoiceSessionCreateRequest,
    VoiceSessionResponse,
    VoiceDraftUpdateRequest,
    VoiceParsePreviewRequest,
    VoiceParsePreviewResponse,
    VoiceExecuteRequest,
    VoiceExecuteResponse,
    PagedConversations,
    ParseAndExecuteResponse,
} from "@/types/ai";

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    message?: string;
}

interface ApiError {
    success: false;
    errorCode: string;
    message: string;
    data?: unknown;
}

type ApiResponse<T> = { data: ApiSuccess<T> };

function unwrap<T>(response: ApiResponse<T>): T {
    return response.data.data;
}

// ─── AI Chat Endpoints ───────────────────────────────────

export async function sendChatMessage(request: AIChatRequest): Promise<AIResponse> {
    const response = await apiClient.post<ApiSuccess<AIResponse>>("/ai/chat", request);
    return unwrap(response);
}

export async function sendVoiceQuery(
    audioBlob: Blob,
    businessId: string,
    conversationId?: string,
): Promise<AIResponse> {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    formData.append("businessId", businessId);
    if (conversationId) {
        formData.append("conversationId", conversationId);
    }

    const response = await apiClient.post<ApiSuccess<AIResponse>>("/ai/voice", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap(response);
}

export async function getConversations(
    page = 0,
    size = 20,
): Promise<PagedConversations> {
    const response = await apiClient.get<ApiSuccess<PagedConversations>>("/ai/conversations", {
        params: { page, size },
    });
    return unwrap(response);
}

export async function getConversation(conversationId: string): Promise<ConversationDetail> {
    const response = await apiClient.get<ApiSuccess<ConversationDetail>>(
        `/ai/conversations/${conversationId}`,
    );
    return unwrap(response);
}

export async function deleteConversation(conversationId: string): Promise<void> {
    await apiClient.delete(`/ai/conversations/${conversationId}`);
}

// ─── AI Parse & Execute Endpoints ────────────────────────

export async function parseText(request: AIParseRequest): Promise<ParsedAction> {
    const response = await apiClient.post<ApiSuccess<ParsedAction>>("/ai/parse", request);
    return unwrap(response);
}

export async function parseAndExecute(
    request: AIParseRequest,
): Promise<ParseAndExecuteResponse> {
    const response = await apiClient.post<ApiSuccess<ParseAndExecuteResponse>>(
        "/ai/parse/execute",
        request,
    );
    return unwrap(response);
}

// ─── Voice Session Endpoints ─────────────────────────────

export async function createVoiceSession(
    request: VoiceSessionCreateRequest,
): Promise<VoiceSessionResponse> {
    const response = await apiClient.post<ApiSuccess<VoiceSessionResponse>>(
        "/voice/sessions",
        request,
    );
    return unwrap(response);
}

export async function transcribeVoiceSession(
    sessionId: string,
    audioBlob: Blob,
): Promise<VoiceSessionResponse> {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    const response = await apiClient.post<ApiSuccess<VoiceSessionResponse>>(
        `/voice/sessions/${sessionId}/transcribe`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
    );
    return unwrap(response);
}

export async function updateVoiceDraft(
    sessionId: string,
    request: VoiceDraftUpdateRequest,
): Promise<VoiceSessionResponse> {
    const response = await apiClient.patch<ApiSuccess<VoiceSessionResponse>>(
        `/voice/sessions/${sessionId}/draft`,
        request,
    );
    return unwrap(response);
}

export async function confirmVoiceDraft(sessionId: string): Promise<VoiceSessionResponse> {
    const response = await apiClient.post<ApiSuccess<VoiceSessionResponse>>(
        `/voice/sessions/${sessionId}/confirm`,
    );
    return unwrap(response);
}

export async function getVoiceSession(sessionId: string): Promise<VoiceSessionResponse> {
    const response = await apiClient.get<ApiSuccess<VoiceSessionResponse>>(
        `/voice/sessions/${sessionId}`,
    );
    return unwrap(response);
}

export async function parseVoicePreview(
    sessionId: string,
    request: VoiceParsePreviewRequest,
): Promise<VoiceParsePreviewResponse> {
    const response = await apiClient.post<ApiSuccess<VoiceParsePreviewResponse>>(
        `/voice/sessions/${sessionId}/parse-preview`,
        request,
    );
    return unwrap(response);
}

export async function executeVoiceLowRisk(
    sessionId: string,
    request: VoiceExecuteRequest,
): Promise<VoiceExecuteResponse> {
    const response = await apiClient.post<ApiSuccess<VoiceExecuteResponse>>(
        `/voice/sessions/${sessionId}/execute-low-risk`,
        request,
    );
    return unwrap(response);
}

// ─── AI Usage Stats ──────────────────────────────────────

export async function getAIUsageStats(): Promise<AIUsageStats> {
    const response = await apiClient.get<ApiSuccess<AIUsageStats>>("/ai/usage");
    return unwrap(response);
}
